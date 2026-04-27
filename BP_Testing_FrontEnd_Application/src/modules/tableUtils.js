import { state } from './state.js';
import { generateCCIDArray, generateOrgGrpArray } from './hierarchyUtils.js';

// ── HTML generators ──────────────────────────────────────────────────────────

export function generateDropdown(options, name, onChangeFunction = '') {
    const onChangeAttr = onChangeFunction ? `onchange="${onChangeFunction}"` : '';
    return `<select name="${name}" ${onChangeAttr}>${
        options.map(o => `<option value="${o}">${o}</option>`).join('')
    }</select>`;
}

export function generateCheckboxes(options, name) {
    return options.map(o =>
        `<label><input type="checkbox" name="${name}" value="${o}">${o}</label>`
    ).join('');
}

export function generateBillingProfileCheckboxes() {
    return generateCheckboxes(['BillingPortfolioA', 'BillingPortfolioB'], 'billingProfile');
}

export function generateBillingProfileDropdown() {
    return generateDropdown(
        ['All', 'BillingPortfolioA', 'BillingPortfolioB'],
        'billingProfile',
        'updateCCIDDropdown()'
    );
}

export function generateOrgGrpCheckboxes() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
    const ccidSelect = document.querySelector('select[name="ccid"]');
    const selectedCcid = ccidSelect ? ccidSelect.value : 'All';
    let orgGrpOptions = [];

    if (selectedCcid === 'All') {
        if (accountStructure === 'multi-ccid-separate-pool') {
            orgGrpOptions = [
                ...generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'A'),
                ...generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'B')
            ];
        } else {
            orgGrpOptions = generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid);
        }
    } else if (selectedCcid.startsWith('CCID')) {
        if (accountStructure === 'multi-ccid-separate-pool') {
            const pool = selectedCcid.slice(-1);
            const ccidNum = selectedCcid.replace('CCID', '').replace(pool, '');
            for (let j = 1; j <= state.orgGrpPerCcid; j++) orgGrpOptions.push(`OrgGrp${ccidNum}${j}${pool}`);
        } else {
            const ccidNum = selectedCcid.replace('CCID', '');
            for (let j = 1; j <= state.orgGrpPerCcid; j++) orgGrpOptions.push(`OrgGrp${ccidNum}${j}`);
        }
    }
    return generateCheckboxes(orgGrpOptions, 'orgGrp');
}

// ── Dropdown / checkbox updaters ─────────────────────────────────────────────

export function updateCCIDDropdown() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
    if (accountStructure !== 'multi-ccid-separate-pool') return;

    document.querySelectorAll('#result-table tbody tr').forEach(row => {
        const billingProfileSelect = row.querySelector('select[name="billingProfile"]');
        const ccidSelect = row.querySelector('select[name="ccid"]');
        if (!billingProfileSelect || !ccidSelect) return;

        const selectedBillingProfile = billingProfileSelect.value;
        let ccidOptions = [];
        if (selectedBillingProfile === 'All') {
            ccidOptions = ['All',
                ...generateCCIDArray(state.ccidCount).map(c => c + 'A'),
                ...generateCCIDArray(state.ccidCount).map(c => c + 'B')];
        } else if (selectedBillingProfile === 'BillingPortfolioA') {
            ccidOptions = ['All', ...generateCCIDArray(state.ccidCount).map(c => c + 'A')];
        } else if (selectedBillingProfile === 'BillingPortfolioB') {
            ccidOptions = ['All', ...generateCCIDArray(state.ccidCount).map(c => c + 'B')];
        }

        const currentSelection = ccidSelect.value;
        ccidSelect.innerHTML = '';
        ccidOptions.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt; el.textContent = opt;
            ccidSelect.appendChild(el);
        });
        if (ccidOptions.includes(currentSelection)) ccidSelect.value = currentSelection;
        updateOrgGrpCheckboxes();
    });
}

export function updateOrgGrpCheckboxes() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;

    document.querySelectorAll('#result-table tbody tr').forEach(row => {
        let ccidSelect, orgGrpCell;
        if (accountStructure === 'multi-ccid-shared-pool') {
            ccidSelect = row.querySelector('select[name="ccid"]');
            orgGrpCell = row.querySelector('td:nth-child(9)');
        } else if (accountStructure === 'multi-ccid-separate-pool') {
            ccidSelect = row.querySelector('select[name="ccid"]');
            orgGrpCell = row.querySelector('td:nth-child(10)');
        }
        if (!ccidSelect || !orgGrpCell) return;

        const selectedCcid = ccidSelect.value;
        let orgGrpOptions = [];

        if (selectedCcid === 'All') {
            if (accountStructure === 'multi-ccid-separate-pool') {
                const bp = row.querySelector('select[name="billingProfile"]');
                const selectedBP = bp ? bp.value : 'All';
                if (selectedBP === 'All') {
                    orgGrpOptions = [
                        ...generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'A'),
                        ...generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'B')
                    ];
                } else if (selectedBP === 'BillingPortfolioA') {
                    orgGrpOptions = generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'A');
                } else if (selectedBP === 'BillingPortfolioB') {
                    orgGrpOptions = generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'B');
                }
            } else {
                orgGrpOptions = generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid);
            }
        } else if (selectedCcid.startsWith('CCID')) {
            if (accountStructure === 'multi-ccid-separate-pool') {
                const pool = selectedCcid.slice(-1);
                const ccidNum = selectedCcid.replace('CCID', '').replace(pool, '');
                for (let j = 1; j <= state.orgGrpPerCcid; j++) orgGrpOptions.push(`OrgGrp${ccidNum}${j}${pool}`);
            } else {
                const ccidNum = selectedCcid.replace('CCID', '');
                for (let j = 1; j <= state.orgGrpPerCcid; j++) orgGrpOptions.push(`OrgGrp${ccidNum}${j}`);
            }
        }

        const existing = Array.from(orgGrpCell.querySelectorAll('input[name="orgGrp"]:checked')).map(c => c.value);
        orgGrpCell.innerHTML = generateCheckboxes(orgGrpOptions, 'orgGrp');
        existing.forEach(val => {
            const cb = orgGrpCell.querySelector(`input[name="orgGrp"][value="${val}"]`);
            if (cb) cb.checked = true;
        });
    });
}

// ── Tiered pricing row management ─────────────────────────────────────────────

export function addTieredDetailRow(tieredDetailsCell) {
    const tieredDetailRow = document.createElement('div');
    tieredDetailRow.classList.add('tiered-detail-row');
    tieredDetailRow.innerHTML = `
        <button type="button" class="remove-tier-row" style="display:none;">-</button>
        <input type="text" name="upper-band" placeholder="Upper Band">
        <input type="text" name="tier-price" placeholder="Price">
        <button type="button" class="add-tier-row" style="display:none;">+</button>
    `;
    tieredDetailsCell.appendChild(tieredDetailRow);
    tieredDetailRow.querySelector('.remove-tier-row').addEventListener('click', () => {
        tieredDetailRow.remove();
        updateTierRowButtons(tieredDetailsCell);
    });
    tieredDetailRow.querySelector('.add-tier-row').addEventListener('click', () => {
        addTieredDetailRow(tieredDetailsCell);
        updateTierRowButtons(tieredDetailsCell);
    });
    updateTierRowButtons(tieredDetailsCell);
}

export function updateTierRowButtons(tieredDetailsCell) {
    const rows = tieredDetailsCell.querySelectorAll('.tiered-detail-row');
    rows.forEach((row, idx) => {
        row.querySelector('.add-tier-row').style.display    = idx === rows.length - 1 ? '' : 'none';
        row.querySelector('.remove-tier-row').style.display = idx === rows.length - 1 ? '' : 'none';
    });
}
