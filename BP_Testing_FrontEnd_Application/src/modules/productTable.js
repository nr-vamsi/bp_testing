/**
 * Handles the "Generate Plan" button (handleSubmit).
 * Filters products from the CSV, renders the result table, and wires up
 * the per-row checkbox + tier-pricing event listeners.
 */
import { state } from './state.js';
import { combineArrays, sequentialSearch } from './helpers.js';
import { generateCCIDArray } from './hierarchyUtils.js';
import {
    generateDropdown,
    generateBillingProfileDropdown,
    generateOrgGrpCheckboxes,
    addTieredDetailRow
} from './tableUtils.js';
import { recalculateVolumeCommitment } from './contractFields.js';

export async function handleSubmit() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;

    const selectedProducts = Array.from(document.querySelectorAll('input[name="product"]:checked'))
        .map(cb => cb.value);
    console.log('Selected Products:', selectedProducts);

    const selectedRegions       = Array.from(document.querySelectorAll('input[name="region"]:checked')).map(cb => cb.value);
    const selectedUserOptions   = Array.from(document.querySelectorAll('input[name="user-option"]:checked')).map(cb => cb.value);
    const selectedComputeOptions= Array.from(document.querySelectorAll('input[name="compute-option"]:checked')).map(cb => cb.value);
    const selectedQueriesOptions= Array.from(document.querySelectorAll('input[name="queries-option"]:checked')).map(cb => cb.value);

    const buyingProgramDropdown  = document.getElementById('buying-program');
    let selectedBuyingPrograms   = [buyingProgramDropdown.value];
    state.selectedBuyingProgram  = buyingProgramDropdown.value;

    state.savingsPlanData = {
        billingTerms:                document.getElementById('billing-terms').value,
        lastAmendmentNumber:         document.getElementById('last-amendment-number').value,
        totalContractValue:          document.getElementById('total-contract-value').value,
        initialCommitment:           document.getElementById('initial-commitment').value,
        initialCommitmentCredit:     document.getElementById('initial-commitment-credit').value,
        initialPrepaidCommitment:    document.getElementById('initial-prepaid-commitment').value,
        initialFlexiPrepaidCommitment: document.getElementById('initial-flexi-prepaid-commitment').value,
        initialFlexiCredit:          document.getElementById('initial-flexi-credit').value,
        rolloverFunds:               document.getElementById('rollover-funds').value,
        rolloverCredits:             document.getElementById('rollover-credits').value,
        prepaidCredits:              document.getElementById('prepaid-credits').value,
        resellerFeeRenewalRate:      document.getElementById('reseller-fee-renewal-rate').value,
        resellerFeeNewRate:          document.getElementById('reseller-fee-new-rate').value,
        resellerFeeBlendedRate:      document.getElementById('reseller-fee-blended-rate').value,
        marketplacePlatformName:     document.getElementById('marketplace-platform-name').value,
        marketplaceFeeRate:          document.getElementById('marketplace-fee-rate').value,
        partnerCompensationMethod:   document.getElementById('partner-compensation-method').value,
        buyingProgram:               buyingProgramDropdown.value
    };
    console.log('Contract Data:', state.savingsPlanData);

    const BUYING_PROGRAM_LABELS = { SAVINGS: 'Savings Plan', VOLUME: 'Volume Plan', APOF: 'APoF' };
    selectedBuyingPrograms[0] = BUYING_PROGRAM_LABELS[selectedBuyingPrograms[0]] ?? selectedBuyingPrograms[0];

    state.contractStartDateValue = document.getElementById('contract-start-date').value;
    state.contractEndDateValue   = document.getElementById('contract-end-date').value;

    const isRipReplace =
        document.querySelector('input[name="contract-type"]:checked')?.value === 'amendment' &&
        document.getElementById('type-of-amendment')?.value === 'Rip & Replace';

    if (!isRipReplace) {
        const selectedSubscriptionType = document.getElementById('subscription-type')?.value ?? '';
        const selectedTcId = document.getElementById('tcid').value;
        state.TCId = selectedTcId;

        const currentDateTime = new Date().toISOString().replace('Z', '');
        state.accountName  = `${selectedTcId}_${selectedSubscriptionType}_${selectedBuyingPrograms[0]}_${selectedProducts.join('+')}_${currentDateTime.replace(/[+_\-:.]/g, '')}`;
        state.contractName = `Contract_${currentDateTime.replace(/[+_\-:.Z]/g, '')}`;
        state.sfAccId      = `SF_${currentDateTime.replace(/[+_\-:.Z]/g, '')}`;
    }

    // Build product search queries
    const queries = [];
    const ADDON_KEYWORDS = [
        'Vulnerability Management',
        'Extended Data Retention',
        'Stream Data Export',
        'Historical Data Export',
        'FedRamp',
        'Code Stream',
        'HIPPA',
        'Increase Mobile API Limit',
        'Increase Query Limits'
    ];

    const productQueryConfig = {
        Users:     [selectedBuyingPrograms, ['Users'],     selectedUserOptions],
        Compute:   [selectedBuyingPrograms, ['Compute'],   selectedComputeOptions, selectedRegions],
        Queries:   [selectedBuyingPrograms, ['Queries'],   selectedQueriesOptions],
        Data:      [selectedBuyingPrograms, ['Data'],      selectedRegions],
        Synthetics:[selectedBuyingPrograms, ['Synthetics']],
        Live:      [selectedBuyingPrograms, ['Live']],
        Discount:  [selectedBuyingPrograms, ['Discount']],
        AddOn:     [selectedBuyingPrograms, ADDON_KEYWORDS, selectedRegions]
    };
    for (const product of selectedProducts) {
        if (productQueryConfig[product])
            combineArrays(productQueryConfig[product].filter(a => a.length > 0), 0, [], queries);
    }

    // Filter products list
    let filteredProducts = [];
    for (const query of queries) {
        let results = sequentialSearch(query, state.productsList);
        if (query.includes('Data'))
            results = results.filter(item =>
                !item['Product Name'].includes('Live') &&
                !item['Product Name'].includes('Compute') &&
                !item['Product Name'].includes('Queries')
            );
        results = results.filter(item => !item['Product Name'].includes('Usage Quantity'));
        filteredProducts = [...filteredProducts, ...results];
    }
    filteredProducts = [...new Set(filteredProducts)];

    // Exclude AddOn-keyword products unless AddOn checkbox is explicitly checked
    if (!selectedProducts.includes('AddOn')) {
        filteredProducts = filteredProducts.filter(item =>
            !ADDON_KEYWORDS.some(keyword => item['Product Name'].includes(keyword))
        );
    }

    // Sort: Formula first, then Usage, then others
    const formulaProducts = filteredProducts.filter(i => i['Rating Method'] === 'Formula');
    const usageProducts   = filteredProducts.filter(i => i['Rating Method'] === 'Usage');
    const otherProducts   = filteredProducts.filter(i => i['Rating Method'] !== 'Formula' && i['Rating Method'] !== 'Usage');
    const sortedProducts  = [...formulaProducts, ...usageProducts, ...otherProducts];

    // Render table
    const resultTableBody = document.querySelector('#result-table tbody');
    resultTableBody.innerHTML = '';

    sortedProducts.forEach(item => {
        const row = document.createElement('tr');
        if (accountStructure === 'multi-ccid-separate-pool') {
            state.ccidArray = ['All',
                ...generateCCIDArray(state.ccidCount).map(c => c + 'A'),
                ...generateCCIDArray(state.ccidCount).map(c => c + 'B')
            ];
        }
        row.innerHTML = `
    <td><input type="checkbox" name="select-product" value="${item['ProdID']}"></td>
    <td>${item['ProdID']}</td>
    <td>${item['Product Name']}</td>
    <td>${item['Rating Method']}</td>
    <td><input type="text" name="price" value="" disabled style="cursor:not-allowed;" placeholder="Select the Product To Enter the Price"
        ${item['Rating Method'] === 'Formula' || item['Rating Method'] === 'Discount' || item['Rating Method'] === 'Subscription' || item['Rating Method'] === 'One Time Charge' ? '' : 'disabled'}></td>
    <td>${item['Rating Method'] === 'Usage' || item['Rating Method'] === 'Discount' || item['Rating Method'] === 'Subscription' || item['Rating Method'] === 'One Time Charge' ? '' : '<input type="checkbox" name="tier" disabled class="tier-checkbox">'}</td>
    <td class="tiered-details" style="display:none;"></td>
    ${accountStructure === 'multi-ccid-shared-pool' ? `<td>${generateDropdown(state.ccidArray, 'ccid', 'updateOrgGrpCheckboxes()')}</td>` : ''}
    ${accountStructure === 'multi-ccid-shared-pool' ? `<td>${generateOrgGrpCheckboxes()}</td>` : ''}
    ${accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateBillingProfileDropdown()}</td>` : ''}
    ${accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateDropdown(state.ccidArray, 'ccid', 'updateOrgGrpCheckboxes()')}</td>` : ''}
    ${accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateOrgGrpCheckboxes()}</td>` : ''}
`;
        resultTableBody.appendChild(row);
    });

    const isVolume = () => document.getElementById('buying-program').value === 'VOLUME';

    // Product select-checkbox listeners
    document.querySelectorAll('input[name="select-product"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const row              = this.closest('tr');
            const priceInput       = row.querySelector('input[name="price"]');
            const tierInput        = row.querySelector('input[name="tier"]');
            const tieredDetailsCell= row.querySelector('.tiered-details');
            const tieredHeader     = document.getElementById('tiered-details-header');
            if (this.checked) {
                // In VOLUME mode only the Tier column is enabled; price stays locked
                if (!isVolume() && (!tierInput || !tierInput.checked)) {
                    priceInput.disabled = false;
                    priceInput.style.cssText = '';
                    priceInput.placeholder = '';
                }
                if (tierInput) tierInput.disabled = false;
            } else {
                priceInput.disabled = true;
                priceInput.placeholder = 'Select the Product To Enter the Price';
                priceInput.style.backgroundColor = '#f5f5f5';
                priceInput.style.color = '#999';
                priceInput.style.cursor = 'not-allowed';
                if (tierInput) { tierInput.disabled = true; tierInput.checked = false; }
                tieredDetailsCell.innerHTML = '';
                tieredDetailsCell.style.display = 'none';
                if (!Array.from(document.querySelectorAll('.tier-checkbox')).some(cb => cb.checked))
                    tieredHeader.style.display = 'none';
                recalculateVolumeCommitment();
            }
        });
    });

    // Tier-checkbox listeners
    document.querySelectorAll('.tier-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const row               = this.closest('tr');
            const priceInput        = row.querySelector('input[name="price"]');
            const tieredDetailsCell = row.querySelector('.tiered-details');
            const tieredHeader      = document.getElementById('tiered-details-header');
            if (this.checked) {
                priceInput.disabled = true;
                priceInput.value = '';
                priceInput.placeholder = 'Disabled - Using Tier Pricing';
                priceInput.style.backgroundColor = '#f5f5f5';
                priceInput.style.color = '#999';
                priceInput.style.cursor = 'not-allowed';
                tieredDetailsCell.style.display = 'block';
                addTieredDetailRow(tieredDetailsCell);
                tieredHeader.style.display = 'block';
                recalculateVolumeCommitment();
            } else {
                if (!isVolume()) {
                    priceInput.disabled = false;
                    priceInput.placeholder = '';
                    priceInput.style.cssText = '';
                }
                tieredDetailsCell.innerHTML = '';
                tieredDetailsCell.style.display = 'none';
                if (!Array.from(document.querySelectorAll('.tier-checkbox')).some(cb => cb.checked))
                    tieredHeader.style.display = 'none';
                recalculateVolumeCommitment();
            }
        });
    });

    // Recalculate VOLUME commitment whenever a tier value is edited
    document.getElementById('result-table')?.addEventListener('input', e => {
        if (e.target.name === 'upper-band' || e.target.name === 'tier-price')
            recalculateVolumeCommitment();
    });

    const accountNameEl = document.getElementById('account-name');
    if (isRipReplace) {
        accountNameEl.style.display = 'none';
    } else {
        accountNameEl.style.display = '';
        accountNameEl.textContent = `Account Name: ${state.accountName}`;
    }
    document.getElementById('result').style.display = 'block';
}
