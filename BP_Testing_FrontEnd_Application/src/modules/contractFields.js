/**
 * Handles auto-calculation of commitment/credit fields based on billing terms.
 * Call setupContractFieldListeners() once from app.js after DOMContentLoaded.
 */

export function setupContractFieldListeners() {
    const billingTermsSelect               = document.getElementById('billing-terms');
    const totalContractValueInput          = document.getElementById('total-contract-value');
    const initialCommitmentCreditInput     = document.getElementById('initial-commitment-credit');

    if (!billingTermsSelect) return;

    billingTermsSelect.addEventListener('change', function () {
        if (billingTermsSelect.value === 'Annual Upfront' || billingTermsSelect.value === 'Custom') {
            alert('Billing Term: Annual Upfront OR Custom are not supported by this tool');
            billingTermsSelect.value = '';
            _clearFlexFields();
            return;
        }
        _updateCommitmentAndCreditFields();
    });

    totalContractValueInput?.addEventListener('input', _updateCommitmentAndCreditFields);
    initialCommitmentCreditInput?.addEventListener('input', _updateCommitmentAndCreditFields);

    // VOLUME buying program: lock TCV + Initial Commitment and keep them auto-calculated
    document.getElementById('buying-program')?.addEventListener('change', function () {
        _applyVolumeLock(this.value === 'VOLUME');
    });
}

// ── VOLUME locking ────────────────────────────────────────────────────────────

function _applyVolumeLock(lock) {
    const tcvInput = document.getElementById('total-contract-value');
    const icInput  = document.getElementById('initial-commitment');
    [tcvInput, icInput].forEach(el => {
        if (!el) return;
        el.readOnly              = lock;
        el.style.backgroundColor = lock ? '#f5f5f5' : '';
        el.style.cursor          = lock ? 'not-allowed' : '';
        el.style.color           = lock ? '#555' : '';
    });
    if (!lock) {
        if (tcvInput) tcvInput.value = '';
        if (icInput)  icInput.value  = '';
    }
}

/**
 * Recalculates Total Contract Value and Initial Commitment for VOLUME buying program.
 * TCV = sum of (firstTier.upperBand × firstTier.price) across all checked + tiered products.
 * No-op when the buying program is not VOLUME.
 */
export function recalculateVolumeCommitment() {
    if (document.getElementById('buying-program')?.value !== 'VOLUME') return;

    let total = 0;
    document.querySelectorAll('input[name="select-product"]:checked').forEach(cb => {
        const row     = cb.closest('tr');
        const tierCb  = row.querySelector('.tier-checkbox');
        if (!tierCb?.checked) return;
        const firstRow = row.querySelector('.tiered-details .tiered-detail-row');
        if (!firstRow) return;
        const qty   = parseFloat(firstRow.querySelector('input[name="upper-band"]').value) || 0;
        const price = parseFloat(firstRow.querySelector('input[name="tier-price"]').value) || 0;
        total += qty * price * 12;
    });

    const tcv      = total.toFixed(2);
    const tcvInput = document.getElementById('total-contract-value');
    const icInput  = document.getElementById('initial-commitment');
    if (tcvInput) tcvInput.value = tcv;
    if (icInput)  icInput.value  = tcv;
    _updateCommitmentAndCreditFields();
}

// ── Flex-field helpers ────────────────────────────────────────────────────────

function _clearFlexFields() {
    const get = id => document.getElementById(id);
    get('initial-flexi-prepaid-commitment').value = '';
    get('initial-flexi-credit').value             = '';
    get('initial-prepaid-commitment').value       = '';
}

function _updateCommitmentAndCreditFields() {
    const billingTerm  = document.getElementById('billing-terms').value;
    const totalValue   = parseFloat(document.getElementById('total-contract-value').value);
    const creditValue  = parseFloat(document.getElementById('initial-commitment-credit').value);
    const flexCommit   = document.getElementById('initial-flexi-prepaid-commitment');
    const flexCredit   = document.getElementById('initial-flexi-credit');
    const prepaidCommit= document.getElementById('initial-prepaid-commitment');

    if (billingTerm === 'Annual Upfront' || billingTerm === 'Custom') {
        alert('Billing Term: Annual Upfront OR Custom are not supported by this tool');
        document.getElementById('billing-terms').value = '';
        _clearFlexFields();
        return;
    }

    function clearAll() {
        flexCommit.value   = '';
        flexCredit.value   = '';
        prepaidCommit.value = '';
    }

    if (billingTerm === 'Quarterly' || billingTerm === 'Semi-Annual') {
        const divisor = billingTerm === 'Quarterly' ? 4 : 2;
        if (!isNaN(totalValue)) {
            flexCommit.value    = (totalValue / divisor).toFixed(2);
            prepaidCommit.value = flexCommit.value;
            if (!isNaN(creditValue)) {
                flexCredit.value    = (creditValue / divisor).toFixed(2);
                prepaidCommit.value = (parseFloat(flexCommit.value) - parseFloat(flexCredit.value)).toString();
            } else {
                flexCredit.value = '';
            }
        } else {
            clearAll();
        }
    } else if (billingTerm === 'Upfront (Full Pre Pay)') {
        clearAll();
        if (!isNaN(totalValue)) {
            prepaidCommit.value = document.getElementById('total-contract-value').value;
            if (!isNaN(creditValue)) {
                prepaidCommit.value = (
                    parseFloat(document.getElementById('total-contract-value').value) - creditValue
                ).toString();
            }
        }
    } else {
        clearAll();
    }
}
