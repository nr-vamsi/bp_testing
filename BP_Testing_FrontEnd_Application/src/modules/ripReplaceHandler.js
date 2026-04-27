import { terminateContract } from '../api/terminateContract.js';
import { updateInvoicesForBackdate } from '../api/updateInvoice.js';
import { state } from './state.js';

/**
 * Sets up all Rip & Replace amendment behaviour:
 *  - Show/hide the termination inputs when "Rip & Replace" is selected
 *  - Proceed button: call PUT /CONTRACT, animate progress bar, then reveal Net New form
 */
export function setupRipReplaceHandler() {
    const typeSelect = document.getElementById('type-of-amendment');
    typeSelect?.addEventListener('change', _onAmendmentTypeChange);

    document.getElementById('proceed-rip')?.addEventListener('click', _onProceedClick);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * After successful termination, pre-configure the Net New form:
 *  - Disable TC# and all address fields (they carry over from the ripped contract)
 *  - Default Contract Start Date to effectiveDate + 1 day
 */
function _prepareNetNewForRipReplace(effectiveDate) {
    // Disable TC#
    const tcid = document.getElementById('tcid');
    if (tcid) tcid.disabled = true;

    // Disable all Bill To / Ship To address fields
    const addressFieldIds = [
        'bill-to-address1', 'bill-to-city', 'bill-to-state', 'bill-to-country', 'bill-to-zip', 'bill-to-email',
        'ship-to-address1', 'ship-to-city', 'ship-to-state', 'ship-to-country', 'ship-to-zip', 'ship-to-email'
    ];
    addressFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });

    // Set Contract Start Date to effectiveDate + 1 day
    const startDateInput = document.getElementById('contract-start-date');
    if (startDateInput && effectiveDate) {
        const next = new Date(effectiveDate);
        next.setDate(next.getDate() + 1);
        startDateInput.value = next.toISOString().slice(0, 10);
    }
}

function _onAmendmentTypeChange() {
    // Always clear all previous results before showing the new section
    _clearAmendmentResults();

    const isRipReplace = this.value === 'Rip & Replace';
    document.getElementById('rip-replace-section').style.display = isRipReplace ? 'block' : 'none';
}

/** Clears every result section that may have been populated by any amendment type. */
function _clearAmendmentResults() {
    // ── Rip & Replace ─────────────────────────────────────────────────────────
    document.getElementById('rip-replace-progress').style.display = 'none';
    document.getElementById('termination-progress-bar').style.width = '0%';
    document.getElementById('termination-status').textContent = '';
    document.getElementById('net-new-page').style.display = 'none';

    // ── Net-new result containers (rendered outside #net-new-page in the DOM) ─
    ['result', 'result-container', 'result-container1',
     'result-container2', 'result-container3', 'result-container4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const resultTbody = document.querySelector('#result-table tbody');
    if (resultTbody) resultTbody.innerHTML = '';
    const tieredHdr = document.getElementById('tiered-details-header');
    if (tieredHdr) tieredHdr.style.display = 'none';
    const accountName = document.getElementById('account-name');
    if (accountName) { accountName.textContent = ''; accountName.style.display = ''; }
}

async function _onProceedClick() {
    const sessionId     = document.getElementById('session-id-rip').value.trim();
    const contractToRip = document.getElementById('contract-to-rip').value.trim();
    const effectiveDate = document.getElementById('effective-date').value;

    if (!sessionId) {
        alert('Please enter a Session ID.');
        document.getElementById('session-id-rip').focus();
        return;
    }
    if (!contractToRip) {
        alert('Please enter the Contract ID to be ripped.');
        document.getElementById('contract-to-rip').focus();
        return;
    }
    if (!effectiveDate) {
        alert('Please enter the Effective Date.');
        document.getElementById('effective-date').focus();
        return;
    }

    const progressContainer = document.getElementById('rip-replace-progress');
    const progressBar       = document.getElementById('termination-progress-bar');
    const statusText        = document.getElementById('termination-status');
    const proceedBtn        = document.getElementById('proceed-rip');

    // Reset + show progress bar
    progressBar.style.width      = '0%';
    progressBar.style.background = 'linear-gradient(90deg, #1ce783, #28a745)';
    statusText.textContent       = '';
    progressContainer.style.display = 'block';
    proceedBtn.disabled = true;

    // Animate to ~85% while waiting for the API
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 85) {
            progress += 5 + Math.random() * 8;
            progressBar.style.width = Math.min(progress, 85) + '%';
        }
    }, 350);

    try {
        state.rippedContractId = contractToRip;
        state.isBackdated      = document.getElementById('is-backdated')?.checked ?? false;
        await terminateContract(sessionId, contractToRip, effectiveDate);

        // If backdated, update invoices for the billing portfolio account
        if (state.isBackdated) {
            const bpAccount = state.ripReplaceAccountIds.find(a => a.level === 'BillingPortfolio');
            if (bpAccount) {
                const invoiceCount = await updateInvoicesForBackdate(sessionId, bpAccount.accId, effectiveDate);
                console.log(`Updated ${invoiceCount} invoice(s) with nrDeleteBackdatedUsage = '1'`);
            }
        }

        clearInterval(interval);
        progressBar.style.width = '100%';
        statusText.className    = 'termination-success';
        statusText.textContent  = '✓ Contract terminated successfully. Fill in the form below to create the new contract.';

        // Reveal Net New form below the progress bar to create the replacement contract
        document.getElementById('net-new-page').style.display = 'block';
        _prepareNetNewForRipReplace(effectiveDate);
        document.getElementById('net-new-page').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        clearInterval(interval);
        progressBar.style.background = '#e74c3c';
        progressBar.style.width      = '100%';
        statusText.className         = 'termination-error';
        statusText.textContent       = `✗ Error: ${error.message}`;
    } finally {
        proceedBtn.disabled = false;
    }
}
