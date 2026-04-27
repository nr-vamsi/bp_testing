import CONFIG from './config.js';
import { state } from './modules/state.js';
import { generateCCIDArray, generateOrgGrpArray } from './modules/hierarchyUtils.js';
import { setupContractFieldListeners } from './modules/contractFields.js';
import {
    handleUserCheckboxChange,
    handleComputeCheckboxChange,
    handleQueriesCheckboxChange,
    handleSameAsBillToChange
} from './modules/formHandlers.js';
import { handleSubmit } from './modules/productTable.js';
import { startButtonHandler } from './modules/startHandler.js';
import { updateCCIDDropdown, updateOrgGrpCheckboxes } from './modules/tableUtils.js';
import { setupRipReplaceHandler } from './modules/ripReplaceHandler.js';
import { setupCoTermHandler } from './modules/coTermHandler.js';

// ── Initialise shared state ────────────────────────────────────────────────────
state.ccidArray   = ['All', ...generateCCIDArray(state.ccidCount)];
state.orgGrpArray = generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid);

// ── Load product CSV ───────────────────────────────────────────────────────────
const hostname = CONFIG.HOSTNAME;
if (hostname === 'https://sandbox.billingplatform.com/newrelic_dev') {
    state.csvFile = 'productList_QA.csv';
} else if (hostname === 'https://sandbox.billingplatform.com/newrelic2_dev') {
    state.csvFile = 'productList_DEV.csv';
}

fetch(`/csv/${state.csvFile}`)
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
    })
    .then(csvText => {
        const lines   = csvText.split('\n');
        const headers = lines[0].split(',');
        state.productsList = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row    = {};
                headers.forEach((header, idx) => {
                    row[header.trim()] = values[idx] ? values[idx].trim() : '';
                });
                state.productsList.push(row);
            }
        }
        console.log(`Loaded ${state.productsList.length} products from ${state.csvFile}`);
    })
    .catch(error => {
        console.error('Error fetching or parsing CSV:', error);
    });

// ── Static event listeners (safe to attach before DOMContentLoaded for module scripts) ──
setupContractFieldListeners();
document.getElementById('same-as-bill-to')?.addEventListener('change', handleSameAsBillToChange);

// ── DOMContentLoaded listeners ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('user-checkbox')?.addEventListener('change', handleUserCheckboxChange);
    document.getElementById('compute-checkbox')?.addEventListener('change', handleComputeCheckboxChange);
    document.getElementById('queries-checkbox')?.addEventListener('change', handleQueriesCheckboxChange);
    document.getElementById('submit')?.addEventListener('click', handleSubmit);
    document.getElementById('startButton')?.addEventListener('click', startButtonHandler);
    setupRipReplaceHandler();
    setupCoTermHandler();
});

// ── Window exports for inline HTML onchange handlers ──────────────────────────
window.updateOrgGrpCheckboxes = updateOrgGrpCheckboxes;
window.updateCCIDDropdown     = updateCCIDDropdown;
