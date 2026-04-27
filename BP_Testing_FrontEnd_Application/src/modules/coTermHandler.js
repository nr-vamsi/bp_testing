/**
 * Co-Term amendment handler.
 *
 * Responsibilities:
 *  - Show/hide the Co-Term section when the amendment type changes
 *  - Load Contract: GET contract details + all contract rates + all pricing in one call
 *  - Render Section 1 (existing product prices) and Section 2 (add new products)
 *  - Generate Plan: filter products from CSV using contract's buying program
 *  - Create: update pricing for changed rows, create contract rates + pricing for new rows
 */

import CONFIG from '../config.js';
import { state } from './state.js';
import { queryProductsFromContract } from '../api/queryProductsFromContract.js';
import { updatePricingEndDate } from '../api/updatePricingEndDate.js';
import { updateContract } from '../api/updateContract.js';
import { updateInvoicesForBackdate } from '../api/updateInvoice.js';
import { createContractRate } from '../api/createContractRate.js';
import { createPricing } from '../api/createPricing.js';
import { createTieredPricing } from '../api/createTieredPricing.js';
import { combineArrays, sequentialSearch, extractRowProductDetails } from './helpers.js';
import { addTieredDetailRow } from './tableUtils.js';

// ── Module-level state ────────────────────────────────────────────────────────
const _ct = {
    sessionId:        '',
    contractId:       '',
    accountId:        '',
    buyingProgram:    '',   // raw value from contract (e.g. 'SAVINGS')
    startDate:        '',
    endDate:          '',
    existingProducts: []    // [{contractRateId, pricingId, productName, currentPrice}]
};

const EXCLUDED_LABELS = [
    'Usage Quantity', 'Drawdown', 'Forfeiture', 'Commitment Fee', 'Overage Frequency Subscription'
];

const ADDON_KEYWORDS = [
    'Vulnerability Management', 'Extended Data Retention', 'Stream Data Export',
    'Historical Data Export', 'FedRamp', 'Code Stream', 'HIPPA',
    'Increase Mobile API Limit', 'Increase Query Limits'
];

const BUYING_PROGRAM_LABELS = { SAVINGS: 'Savings Plan', VOLUME: 'Volume Plan', APOF: 'APoF' };

// ── Private helpers ───────────────────────────────────────────────────────────

/** Returns the date one day before dateStr (YYYY-MM-DD). */
function _subtractOneDay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ── Private API helpers ───────────────────────────────────────────────────────

async function _getContract(sessionId, contractId) {
    const res  = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/CONTRACT/${contractId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json; charset=utf-8', sessionId }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to load contract: ${res.statusText}`);
    return data.retrieveResponse?.[0] ?? {};
}

/** Fetch Id, Rate, ContractRateId for all PRICING rows matching the given contract rate IDs. */
async function _queryAllPricing(sessionId, contractRateIds) {
    if (!contractRateIds.length) return [];
    const inClause = contractRateIds.join(',');
    const res = await fetch(
        `${CONFIG.HOSTNAME}/rest/2.0/query?sql=select Id, Rate, ContractRateId from PRICING where ContractRateId IN (${inClause})`,
        { method: 'GET', headers: { 'Content-Type': 'application/json; charset=utf-8', sessionId } }
    );
    const data = await res.json();
    return data.queryResponse ?? [];
}

// ── Public setup ──────────────────────────────────────────────────────────────

export function setupCoTermHandler() {
    document.getElementById('type-of-amendment')
        ?.addEventListener('change', _onAmendmentTypeChange);

    document.getElementById('load-contract-coterm')
        ?.addEventListener('click', _onLoadContract);

    // Sub-option toggle pairs [checkboxId, fieldsetId, optionName]
    [
        ['ct-user-checkbox',    'ct-user-options',    'ct-user-option'],
        ['ct-compute-checkbox', 'ct-compute-options', 'ct-compute-option'],
        ['ct-queries-checkbox', 'ct-queries-options', 'ct-queries-option']
    ].forEach(([cbId, fsId, optName]) => {
        document.getElementById(cbId)?.addEventListener('change', function () {
            document.getElementById(fsId).style.display = this.checked ? 'block' : 'none';
            if (!this.checked)
                document.querySelectorAll(`input[name="${optName}"]`).forEach(o => o.checked = false);
        });
    });

    document.getElementById('coterm-generate-plan')
        ?.addEventListener('click', _onGeneratePlan);

    document.getElementById('coterm-create')
        ?.addEventListener('click', _onCreate);
}

// ── Handlers ─────────────────────────────────────────────────────────────────

function _onAmendmentTypeChange() {
    const isCoTerm = this.value === 'Co-Term';
    document.getElementById('co-term-section').style.display = isCoTerm ? 'block' : 'none';
    if (!isCoTerm) _reset();
}

async function _onLoadContract() {
    const sessionId  = document.getElementById('session-id-coterm').value.trim();
    const contractId = document.getElementById('contract-id-coterm').value.trim();

    if (!sessionId)  { alert('Please enter Session ID.');   return; }
    if (!contractId) { alert('Please enter Contract ID.');  return; }

    const loadingEl  = document.getElementById('coterm-loading');
    const loadingBar = document.getElementById('coterm-loading-bar');
    const loadingTxt = document.getElementById('coterm-loading-text');
    const btn        = document.getElementById('load-contract-coterm');

    // Reset previous results, then restore the current session/contract IDs
    _reset();
    _ct.sessionId  = sessionId;
    _ct.contractId = contractId;
    loadingBar.style.background = 'linear-gradient(90deg, #1ce783, #28a745)';
    loadingBar.style.width = '0%';
    loadingTxt.textContent = 'Loading contract…';
    loadingEl.style.display = 'block';
    btn.disabled = true;

    let prog = 0;
    const interval = setInterval(() => {
        if (prog < 80) { prog += 10 + Math.random() * 12; loadingBar.style.width = Math.min(prog, 80) + '%'; }
    }, 300);

    try {
        // 1. GET contract — extract buying program, dates, and account ID
        const contract     = await _getContract(_ct.sessionId, _ct.contractId);
        _ct.buyingProgram  = contract.nrBuyingProgram ?? '';
        _ct.startDate      = contract.StartDate ?? '';
        _ct.endDate        = contract.EndDate   ?? '';
        _ct.accountId      = contract.AccountId ?? '';

        // 2. GET all contract rates
        const rates        = await queryProductsFromContract(_ct.sessionId, _ct.contractId);

        // 3. GET all pricing in one call (keyed by ContractRateId) using the rate IDs from step 2
        const contractRateIds = rates.map(r => r.Id).filter(Boolean);
        const allPricing      = await _queryAllPricing(_ct.sessionId, contractRateIds);
        const pricingMap   = {};
        allPricing.forEach(p => { pricingMap[p.ContractRateId] = p; });

        // 4. Filter excluded labels and build existing-products list
        _ct.existingProducts = rates
            .filter(r => !EXCLUDED_LABELS.some(ex => r.ContractRateLabel?.includes(ex)))
            .map(r => {
                const p = pricingMap[r.Id] ?? {};
                return {
                    contractRateId: r.Id,
                    productName:    r.ContractRateLabel,
                    pricingId:      p.Id   ?? '',
                    currentPrice:   p.Rate ?? ''
                };
            });

        clearInterval(interval);
        loadingBar.style.width = '100%';
        loadingTxt.textContent = `✓ Loaded ${_ct.existingProducts.length} product(s).`;

        _renderExistingProductsTable();
        _prefillBuyingProgram();

        document.getElementById('coterm-existing-section').style.display = 'block';
        document.getElementById('coterm-new-section').style.display      = 'block';
        document.getElementById('coterm-create-section').style.display   = 'block';

    } catch (err) {
        clearInterval(interval);
        loadingBar.style.background = '#e74c3c';
        loadingBar.style.width      = '100%';
        loadingTxt.textContent      = `✗ ${err.message}`;
    } finally {
        btn.disabled = false;
    }
}

function _onGeneratePlan() {
    const selectedProducts = Array.from(document.querySelectorAll('input[name="ct-product"]:checked')).map(c => c.value);
    const selectedRegions  = Array.from(document.querySelectorAll('input[name="ct-region"]:checked')).map(c => c.value);
    const selectedUserOpts = Array.from(document.querySelectorAll('input[name="ct-user-option"]:checked')).map(c => c.value);
    const selectedCompOpts = Array.from(document.querySelectorAll('input[name="ct-compute-option"]:checked')).map(c => c.value);
    const selectedQryOpts  = Array.from(document.querySelectorAll('input[name="ct-queries-option"]:checked')).map(c => c.value);

    const bp = [BUYING_PROGRAM_LABELS[_ct.buyingProgram] ?? _ct.buyingProgram];

    const productQueryConfig = {
        Users:     [bp, ['Users'],     selectedUserOpts],
        Compute:   [bp, ['Compute'],   selectedCompOpts, selectedRegions],
        Queries:   [bp, ['Queries'],   selectedQryOpts],
        Data:      [bp, ['Data'],      selectedRegions],
        Synthetics:[bp, ['Synthetics']],
        Live:      [bp, ['Live']],
        Discount:  [bp, ['Discount']],
        AddOn:     [bp, ADDON_KEYWORDS, selectedRegions]
    };

    const queries = [];
    for (const product of selectedProducts) {
        if (productQueryConfig[product])
            combineArrays(productQueryConfig[product].filter(a => a.length > 0), 0, [], queries);
    }

    let filteredProducts = [];
    for (const query of queries) {
        let results = sequentialSearch(query, state.productsList);
        if (query.includes('Data'))
            results = results.filter(i =>
                !i['Product Name'].includes('Live') &&
                !i['Product Name'].includes('Compute') &&
                !i['Product Name'].includes('Queries')
            );
        results = results.filter(i => !i['Product Name'].includes('Usage Quantity'));
        filteredProducts = [...filteredProducts, ...results];
    }
    filteredProducts = [...new Set(filteredProducts)];

    if (!selectedProducts.includes('AddOn'))
        filteredProducts = filteredProducts.filter(i => !ADDON_KEYWORDS.some(kw => i['Product Name'].includes(kw)));

    const formula = filteredProducts.filter(i => i['Rating Method'] === 'Formula');
    const usage   = filteredProducts.filter(i => i['Rating Method'] === 'Usage');
    const other   = filteredProducts.filter(i => i['Rating Method'] !== 'Formula' && i['Rating Method'] !== 'Usage');

    _renderNewProductsTable([...formula, ...usage, ...other]);
}

async function _onCreate() {
    const btn    = document.getElementById('coterm-create');
    const status = document.getElementById('coterm-create-status');
    btn.disabled         = true;
    status.className     = '';
    status.textContent   = 'Processing…';

    try {
        const effectiveDate = document.getElementById('effective-date').value;
        if (!effectiveDate) { alert('Please enter Effective Date.'); btn.disabled = false; return; }
        const pricingEndDate = _subtractOneDay(effectiveDate);

        // ── 1. Update prices for selected existing products ──
        const selectedExisting = document.querySelectorAll('input[name="ct-existing-select"]:checked');
        for (const cb of selectedExisting) {
            const prod = _ct.existingProducts[parseInt(cb.dataset.idx, 10)];
            if (!prod?.pricingId) continue;
            const row       = cb.closest('tr');
            const tierInput = row.querySelector('.ct-existing-tier-checkbox');
            if (tierInput?.checked) {
                const tieredDetails = Array.from(row.querySelectorAll('.tiered-detail-row')).map((r, i, arr) => {
                    const upperBand = r.querySelector('input[name="upper-band"]').value || '-1';
                    const price     = r.querySelector('input[name="tier-price"]').value;
                    const lowerBand = i === 0
                        ? '0'
                        : (parseFloat(arr[i - 1].querySelector('input[name="upper-band"]').value || '0') + 0.0000000001).toString();
                    return { upperBand, price, lowerBand };
                });
                if (tieredDetails.length) {
                    await createTieredPricing(_ct.sessionId, _ct.contractId, prod.contractRateId, tieredDetails, effectiveDate, _ct.endDate);
                    console.log(`Updated tiered pricing for "${prod.productName}"`);
                }
            } else {
                const newPrice = row.querySelector('input[name="ct-new-price"]').value.trim();
                if (!newPrice) continue;
                // End-date the existing pricing record to effectiveDate - 1
                await updatePricingEndDate(_ct.sessionId, prod.pricingId, pricingEndDate);
                // Create a new pricing record from effectiveDate to contract end date
                await createPricing(_ct.sessionId, _ct.contractId, prod.contractRateId, { Price: newPrice }, effectiveDate, _ct.endDate);
                console.log(`Re-priced "${prod.productName}": closed ${pricingEndDate}, new from ${effectiveDate} → ${newPrice}`);
            }
        }

        // ── 2. Create contract rates + pricing for selected new products ───────
        const checkedNew = Array.from(document.querySelectorAll('input[name="ct-select-product"]:checked'));
        for (const cb of checkedNew) {
            const row            = cb.closest('tr');
            const details        = extractRowProductDetails(row);
            const contractRateId = await createContractRate(
                _ct.sessionId, _ct.contractId, details, _ct.startDate, _ct.endDate
            );
            if (details.TieredDetails.length > 0) {
                await createTieredPricing(_ct.sessionId, _ct.contractId, contractRateId, details.TieredDetails, _ct.startDate, _ct.endDate);
            } else {
                await createPricing(_ct.sessionId, _ct.contractId, contractRateId, details, _ct.startDate, _ct.endDate);
            }
            console.log(`Created new product "${details.ProductName}" contractRateId=${contractRateId}`);
        }

        // ── 3. Backdated actions (if "Is Backdated?" is checked) ─────────────
        const isBackdated = document.getElementById('is-backdated')?.checked;
        if (isBackdated) {
            await updateContract(_ct.sessionId, _ct.contractId, { nrBackdatedContract: '1' });
            console.log(`Marked contract ${_ct.contractId} as backdated`);
            if (_ct.accountId) {
                const invoiceCount = await updateInvoicesForBackdate(_ct.sessionId, _ct.accountId, effectiveDate);
                console.log(`Updated ${invoiceCount} invoice(s) with nrDeleteBackdatedUsage = '1'`);
            }
        }

        status.className   = 'termination-success';
        status.textContent = '✓ Co-Term completed successfully.';
    } catch (err) {
        status.className   = 'termination-error';
        status.textContent = `✗ Error: ${err.message}`;
    } finally {
        btn.disabled = false;
    }
}

// ── Render helpers ────────────────────────────────────────────────────────────

function _renderExistingProductsTable() {
    const tbody = document.getElementById('coterm-products-tbody');
    tbody.innerHTML = '';

    _ct.existingProducts.forEach((prod, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" name="ct-existing-select" data-idx="${idx}"></td>
            <td>${prod.productName}</td>
            <td>${prod.currentPrice}</td>
            <td><input type="text" name="ct-new-price" data-idx="${idx}" placeholder="Select product to enter price"
                disabled style="cursor:not-allowed; background-color:#f5f5f5; color:#999;"></td>
            <td><input type="checkbox" name="ct-existing-tier" disabled class="ct-existing-tier-checkbox"></td>
            <td class="ct-existing-tiered-details" style="display:none;"></td>
        `;
        tbody.appendChild(tr);
    });

    // Select-checkbox listeners
    tbody.querySelectorAll('input[name="ct-existing-select"]').forEach(cb => {
        cb.addEventListener('change', function () {
            const row        = this.closest('tr');
            const priceInput = row.querySelector('input[name="ct-new-price"]');
            const tierInput  = row.querySelector('.ct-existing-tier-checkbox');
            const tieredCell = row.querySelector('.ct-existing-tiered-details');
            const tieredHdr  = document.getElementById('ct-existing-tiered-details-header');
            if (this.checked) {
                if (!tierInput?.checked) {
                    priceInput.disabled = false;
                    priceInput.style.cssText = '';
                    priceInput.placeholder = '';
                }
                if (tierInput) tierInput.disabled = false;
            } else {
                priceInput.disabled = true;
                priceInput.placeholder = 'Select product to enter price';
                priceInput.style.backgroundColor = '#f5f5f5';
                priceInput.style.color  = '#999';
                priceInput.style.cursor = 'not-allowed';
                if (tierInput) { tierInput.disabled = true; tierInput.checked = false; }
                tieredCell.innerHTML = '';
                tieredCell.style.display = 'none';
                if (!Array.from(document.querySelectorAll('.ct-existing-tier-checkbox')).some(c => c.checked))
                    tieredHdr.style.display = 'none';
            }
        });
    });

    // Tier-checkbox listeners
    tbody.querySelectorAll('.ct-existing-tier-checkbox').forEach(cb => {
        cb.addEventListener('change', function () {
            const row        = this.closest('tr');
            const priceInput = row.querySelector('input[name="ct-new-price"]');
            const tieredCell = row.querySelector('.ct-existing-tiered-details');
            const tieredHdr  = document.getElementById('ct-existing-tiered-details-header');
            if (this.checked) {
                priceInput.disabled = true;
                priceInput.value = '';
                priceInput.placeholder = 'Disabled - Using Tier Pricing';
                priceInput.style.backgroundColor = '#f5f5f5';
                priceInput.style.color  = '#999';
                priceInput.style.cursor = 'not-allowed';
                tieredCell.style.display = 'block';
                addTieredDetailRow(tieredCell);
                tieredHdr.style.display = 'block';
            } else {
                priceInput.disabled = false;
                priceInput.placeholder = '';
                priceInput.style.cssText = '';
                tieredCell.innerHTML = '';
                tieredCell.style.display = 'none';
                if (!Array.from(document.querySelectorAll('.ct-existing-tier-checkbox')).some(c => c.checked))
                    tieredHdr.style.display = 'none';
            }
        });
    });
}

function _prefillBuyingProgram() {
    const label = BUYING_PROGRAM_LABELS[_ct.buyingProgram] ?? _ct.buyingProgram;
    document.getElementById('coterm-buying-program-display').textContent = label;
    document.getElementById('coterm-buying-program').value = label;
}

function _renderNewProductsTable(products) {
    const tbody = document.getElementById('coterm-new-products-tbody');
    tbody.innerHTML = '';

    products.forEach(item => {
        const isUsageOrDiscount = ['Usage', 'Discount', 'Subscription', 'One Time Charge'].includes(item['Rating Method']);
        const isFormula         = ['Formula', 'Discount', 'Subscription', 'One Time Charge'].includes(item['Rating Method']);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" name="ct-select-product" value="${item['ProdID']}"></td>
            <td>${item['ProdID']}</td>
            <td>${item['Product Name']}</td>
            <td>${item['Rating Method']}</td>
            <td><input type="text" name="price" disabled style="cursor:not-allowed;" placeholder="Select product to enter price"
                ${isFormula ? '' : 'disabled'}></td>
            <td>${isUsageOrDiscount ? '' : '<input type="checkbox" name="tier" disabled class="ct-tier-checkbox">'}</td>
            <td class="tiered-details" style="display:none;"></td>
        `;
        tbody.appendChild(row);
    });

    // Select-product checkbox listeners
    tbody.querySelectorAll('input[name="ct-select-product"]').forEach(cb => {
        cb.addEventListener('change', function () {
            const row        = this.closest('tr');
            const priceInput = row.querySelector('input[name="price"]');
            const tierInput  = row.querySelector('input[name="tier"]');
            const tieredCell = row.querySelector('.tiered-details');
            const tieredHdr  = document.getElementById('ct-tiered-details-header');
            if (this.checked) {
                if (!tierInput?.checked) { priceInput.disabled = false; priceInput.style.cssText = ''; priceInput.placeholder = ''; }
                if (tierInput) tierInput.disabled = false;
            } else {
                priceInput.disabled = true;
                priceInput.placeholder = 'Select product to enter price';
                priceInput.style.backgroundColor = '#f5f5f5';
                priceInput.style.color  = '#999';
                priceInput.style.cursor = 'not-allowed';
                if (tierInput) { tierInput.disabled = true; tierInput.checked = false; }
                tieredCell.innerHTML = '';
                tieredCell.style.display = 'none';
                if (!Array.from(document.querySelectorAll('.ct-tier-checkbox')).some(c => c.checked))
                    tieredHdr.style.display = 'none';
            }
        });
    });

    // Tier checkbox listeners
    tbody.querySelectorAll('.ct-tier-checkbox').forEach(cb => {
        cb.addEventListener('change', function () {
            const row        = this.closest('tr');
            const priceInput = row.querySelector('input[name="price"]');
            const tieredCell = row.querySelector('.tiered-details');
            const tieredHdr  = document.getElementById('ct-tiered-details-header');
            if (this.checked) {
                priceInput.disabled = true; priceInput.value = '';
                priceInput.placeholder = 'Disabled - Using Tier Pricing';
                priceInput.style.backgroundColor = '#f5f5f5'; priceInput.style.color = '#999'; priceInput.style.cursor = 'not-allowed';
                tieredCell.style.display = 'block';
                addTieredDetailRow(tieredCell);
                tieredHdr.style.display = 'block';
            } else {
                priceInput.disabled = false; priceInput.placeholder = ''; priceInput.style.cssText = '';
                tieredCell.innerHTML = ''; tieredCell.style.display = 'none';
                if (!Array.from(document.querySelectorAll('.ct-tier-checkbox')).some(c => c.checked))
                    tieredHdr.style.display = 'none';
            }
        });
    });

    document.getElementById('coterm-new-products-result').style.display = 'block';
}

// ── Reset ─────────────────────────────────────────────────────────────────────

function _reset() {
    ['coterm-existing-section', 'coterm-new-section',
     'coterm-create-section',   'coterm-new-products-result'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const tbody1 = document.getElementById('coterm-products-tbody');
    const tbody2 = document.getElementById('coterm-new-products-tbody');
    if (tbody1) tbody1.innerHTML = '';
    if (tbody2) tbody2.innerHTML = '';
    const bar = document.getElementById('coterm-loading-bar');
    if (bar) { bar.style.width = '0%'; bar.style.background = 'linear-gradient(90deg, #1ce783, #28a745)'; }
    const status = document.getElementById('coterm-create-status');
    if (status) status.textContent = '';
    const existingTieredHdr = document.getElementById('ct-existing-tiered-details-header');
    if (existingTieredHdr) existingTieredHdr.style.display = 'none';
    _ct.existingProducts = [];
    _ct.contractId = _ct.accountId = _ct.buyingProgram = _ct.startDate = _ct.endDate = '';
}
