//Code worked till shared pool

import { fetchProducts } from './fetchProducts.js';
import { createContract } from './createContract.js';
import { createContract1 } from './createContract.js';
import { createContractCurrency } from './createContractCurrency.js';
import { createContractRate } from './createContractRate.js';
import { createPricing } from './createPricing.js';
import { queryPrice } from './queryPrice.js';
import { createTieredPricing } from './createTieredPricing.js';
import { createAccountProduct } from './createAccountProduct.js';
import { createBillingIdentifier } from './createBillingIdentifier.js';
import { appendResultRow, displayResultContainer } from './handleResults.js';
import { createUserUsageFile } from './createUsageFiles.js';
import { createNonUserUsageFile } from './createUsageFiles.js';
import { createAccounts } from './createAccounts.js';
import { queryProductsFromContract } from './queryProductsFromContract.js';
import { createExcel } from './createExcel.js';
import CONFIG from './config.js';
import { updatePricing } from './updatePricing.js';

let productsList = [];
let accountName = '';
let contractId = '';
let pricingId = '';
let contractCurrencyId = '';
let contractRateId = '';
let accountProductId = '';
let BIaccountProductId = '';
let contractStartDateValue = '';
let contractEndDateValue = '';
let selectedProductsDetails = [];
let billingIdentifier = '';
let contractName = '';
let sfAccId = '';
let results = '';
let contractProdIds = [];
let orgProdIds = [];
let orgGrpusageProducts = [];
let ccIdusageProducts = [];
let contractAccProd = [];
let ccidArray = [];
let orgGrpArray = [];
let TCId = '';
let ccidCount = 2; // or get from user input/config
let orgGrpPerCcid = 2; // or get from user input/config
let selectedBuyingProgram = '';

ccidArray = ['All', ...generateCCIDArray(ccidCount)];
orgGrpArray = generateOrgGrpArray(ccidCount, orgGrpPerCcid);

fetchProducts('/csv/productList.csv').then(data => {
    productsList = data;
}).catch(error => console.error('Error fetching products:', error));

const productCheckboxes = document.querySelectorAll('input[name="product"]');
const regionCheckboxes = document.querySelectorAll('input[name="region"]');
const userCheckbox = document.getElementById('user-checkbox');
const computeCheckbox = document.getElementById('compute-checkbox');
const userOptionsFieldset = document.getElementById('user-options');
const computeOptionsFieldset = document.getElementById('compute-options');
const buyingProgramCheckboxes = document.querySelectorAll('input[name="buying-program"]');
const contractStartDate = document.getElementById('contract-start-date');
const contractEndDate = document.getElementById('contract-end-date');
const subscriptionType = document.getElementById('subscription-type');
const tcId = document.getElementById('tcid');
const resultSection = document.getElementById('result');
const resultTableBody = document.querySelector('#result-table tbody');
const accountNameElement = document.getElementById('account-name');
const resultContainer = document.getElementById('result-container');
const resultValuesTableBody = document.querySelector('#result-values-table tbody');
const resultContainer1 = document.getElementById('result-container1');
const resultValuesTableBody1 = document.querySelector('#result-values-table1 tbody');
const resultContainer2 = document.getElementById('result-container2');
const resultValuesTableBody2 = document.querySelector('#result-values-table2 tbody');
const resultContainer3 = document.getElementById('result-container3');
const resultValuesTableBody3 = document.querySelector('#result-values-table3 tbody');
const resultContainer4 = document.getElementById('result-container4');
const resultValuesTableBody4 = document.querySelector('#result-values-table4 tbody');
const sameAsBillToCheckbox = document.getElementById('same-as-bill-to');
const savingsPlanFieldSet = document.getElementById('savings-plan-fields');

const buyingProgramDropdown = document.getElementById('buying-program');

/* function handleBuyingProgramChange() {
    if (buyingProgramDropdown.value === 'SAVINGS') {
        savingsPlanFieldSet.style.display = 'block';
    } else {
        savingsPlanFieldSet.style.display = 'none';
    }
} */

//buyingProgramDropdown.addEventListener('change', handleBuyingProgramChange);

function handleUserCheckboxChange() {
    if (userCheckbox.checked) {
        userOptionsFieldset.style.display = 'block';
    } else {
        userOptionsFieldset.style.display = 'none';
        // Clear user options
        const userOptions = document.querySelectorAll('input[name="user-option"]');
        userOptions.forEach(option => option.checked = false);
    }
}

function handleComputeCheckboxChange() {
    if (computeCheckbox.checked) {
        computeOptionsFieldset.style.display = 'block';
    } else {
        computeOptionsFieldset.style.display = 'none';
        // Clear compute options
        const computeOptions = document.querySelectorAll('input[name="compute-option"]');
        computeOptions.forEach(option => option.checked = false);
    }
}

function sequentialSearch(queries, list) {
    const modifiedQueries = queries.map(query => query.replace(/FPU/g, 'Full Platform Users'));
    return list.filter(item => {
        return modifiedQueries.every(query => !query || item['Product Name'].includes(query));
    });
}


function handleSameAsBillToChange() {
    const billToFields = {
        address1: document.getElementById('bill-to-address1'),
        city: document.getElementById('bill-to-city'),
        state: document.getElementById('bill-to-state'),
        country: document.getElementById('bill-to-country'),
        zip: document.getElementById('bill-to-zip'),
        email: document.getElementById('bill-to-email')
    };

    const shipToFields = {
        address1: document.getElementById('ship-to-address1'),
        city: document.getElementById('ship-to-city'),
        state: document.getElementById('ship-to-state'),
        country: document.getElementById('ship-to-country'),
        zip: document.getElementById('ship-to-zip'),
        email: document.getElementById('ship-to-email')
    };

    if (sameAsBillToCheckbox.checked) {
        for (const key in billToFields) {
            shipToFields[key].value = billToFields[key].value;
            shipToFields[key].disabled = true;
        }
    } else {
        for (const key in shipToFields) {
            shipToFields[key].disabled = false;
        }
    }
}

sameAsBillToCheckbox.addEventListener('change', handleSameAsBillToChange);

async function handleSubmit() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;



    const selectedProducts = Array.from(productCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    console.log('Selected Products:', selectedProducts);
    const selectedRegions = Array.from(regionCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    //console.log('Selected Regions:', selectedRegions);
    const selectedUserOptions = Array.from(document.querySelectorAll('input[name="user-option"]'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    //console.log('Selected User Options:', selectedUserOptions);
    const selectedComputeOptions = Array.from(document.querySelectorAll('input[name="compute-option"]'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    //console.log('Selected Compute Options:', selectedComputeOptions);
    let selectedBuyingPrograms = [buyingProgramDropdown.value];
    selectedBuyingProgram = buyingProgramDropdown.value;
    console.log('Selected Buying Programs:', selectedBuyingPrograms);
    console.log('Selected Buying Program:', selectedBuyingProgram);

    if (selectedBuyingPrograms[0] === 'SAVINGS') {
        selectedBuyingPrograms[0] = 'Savings Plan';
    }
    if (selectedBuyingPrograms[0] === 'VOLUME') {
        selectedBuyingPrograms[0] = 'Volume Plan';
    }

    contractStartDateValue = contractStartDate.value;
    contractEndDateValue = contractEndDate.value;
    const selectedSubscriptionType = subscriptionType.value;
    const selectedTcId = tcId.value;
    TCId = selectedTcId;

    //const currentDateTime = new Date().toISOString().replace('T', '_').replace('Z', '');
    const currentDateTime = new Date().toISOString().replace('Z', '');
    accountName = `${selectedTcId}_${selectedSubscriptionType}_${selectedBuyingPrograms[0]}_${selectedProducts.join('+')}_${currentDateTime.replace(/[+_\-:.]/g, '')}`;
    contractName = `Contract_${currentDateTime.replace(/[+_\-:.Z]/g, '')}`;
    sfAccId = `SF_${currentDateTime.replace(/[+_\-:.Z]/g, '')}`;
    //billingIdentifier = `${selectedProducts.join('+')}_${currentDateTime}`.replace(/[+_\-:.Z]/g, '');

    let queries = [];

    if (selectedProducts.includes('Users')) {
        const arraysListUsers = [
            selectedBuyingPrograms,
            ['Users'],
            selectedUserOptions
        ].filter(array => array.length > 0); // Exclude arrays of length 0

        combineArrays(arraysListUsers, 0, []);
    }

    if (selectedProducts.includes('Compute')) {
        const arraysListCompute = [
            selectedBuyingPrograms,
            ['Compute'],
            selectedComputeOptions,
            selectedRegions
        ].filter(array => array.length > 0); // Exclude arrays of length 0

        combineArrays(arraysListCompute, 0, []);
    }

    if (selectedProducts.includes('Data')) {
        const arraysListData = [
            selectedBuyingPrograms,
            ['Data'],
            selectedRegions
        ].filter(array => array.length > 0); // Exclude arrays of length 0

        combineArrays(arraysListData, 0, []);
    }

    if (selectedProducts.includes('Synthetics')) {
        const arraysListSynthetics = [
            selectedBuyingPrograms,
            ['Synthetics']
        ].filter(array => array.length > 0); // Exclude arrays of length 0

        combineArrays(arraysListSynthetics, 0, []);
    }

    if (selectedProducts.includes('Live')) {
        const arraysListLive = [
            selectedBuyingPrograms,
            ['Live']
        ].filter(array => array.length > 0); // Exclude arrays of length 0

        combineArrays(arraysListLive, 0, []);
    }

    if (selectedProducts.includes('Discount')) {
        const arraysListDiscount = [
            selectedBuyingPrograms,
            ['Discount']
        ].filter(array => array.length > 0); // Exclude arrays of length 0

        combineArrays(arraysListDiscount, 0, []);
    }

    function combineArrays(arrays, index, current) {
        if (index === arrays.length) {
            queries.push(current);
            return;
        }
        for (let value of arrays[index]) {
            combineArrays(arrays, index + 1, [...current, value]);
        }
    }

    //console.log('Queries:', queries); // Debugging information

    let filteredProducts = [];

    for (let query of queries) {
        //console.log('Query Array: ', query); // Debugging information
        results = sequentialSearch(query, productsList);
        if (query.includes('Data')) {
            results = results.filter(item => !item['Product Name'].includes('Live') && !item['Product Name'].includes('Compute'));
        }
        //console.log('Results:', results); // Debugging information
        results = results.filter(item => !item['Product Name'].includes('Usage Quantity'));
        filteredProducts = [...filteredProducts, ...results];

    }


    filteredProducts = [...new Set(filteredProducts.map(item => item))]; // Remove duplicates
    //console.log('Filtered Products:', filteredProducts); // Debugging information

    // Sort and group products by Usage first and then their corresponding Formula products
    const usageProducts = filteredProducts.filter(item => item['Rating Method'] === 'Usage');
    const formulaProducts = filteredProducts.filter(item => item['Rating Method'] === 'Formula');
    const otherProducts = filteredProducts.filter(item => item['Rating Method'] !== 'Usage' && item['Rating Method'] !== 'Formula');
    const sortedProducts = [...formulaProducts, ...usageProducts, ...otherProducts];

    // Clear previous results
    resultTableBody.innerHTML = '';

    // Populate table with sorted results
    // In handleSubmit() function, update the row innerHTML:
    // In handleSubmit() function, update the row innerHTML:
    sortedProducts.forEach(item => {
        const row = document.createElement('tr');
        if (accountStructure === 'multi-ccid-separate-pool') {
            ccidArray = ['All', ...generateCCIDArray(ccidCount).map(ccid => ccid + 'A'), ...generateCCIDArray(ccidCount).map(ccid => ccid + 'B')];
        }
        row.innerHTML = `
    <td><input type="checkbox" name="select-product" value="${item['ProdID']}"></td>
    <td>${item['ProdID']}</td>
    <td>${item['Product Name']}</td>
    <td>${item['Rating Method']}</td>
    <td><input type="text" name="price" value="" ${item['Rating Method'] === 'Formula' || item['Rating Method'] === 'Discount' || item['Rating Method'] === 'Subscription' || item['Rating Method'] === 'One Time Charge' ? '' : 'disabled'}></td>
    <td>${item['Rating Method'] === 'Usage' || item['Rating Method'] === 'Discount' || item['Rating Method'] === 'Subscription' || item['Rating Method'] === 'One Time Charge' ? '' : '<input type="checkbox" name="tier" class="tier-checkbox">'}</td>
    <td class="tiered-details" style="display: none;"></td>
    ${accountStructure === 'multi-ccid-shared-pool' ? `<td>${generateDropdown(ccidArray, 'ccid', 'updateOrgGrpCheckboxes()')}</td>` : ''}
    ${accountStructure === 'multi-ccid-shared-pool' ? `<td>${generateOrgGrpCheckboxes()}</td>` : ''}
    ${accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateBillingProfileDropdown()}</td>` : ''}
    ${accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateDropdown(ccidArray, 'ccid', 'updateOrgGrpCheckboxes()')}</td>` : ''}
    ${accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateOrgGrpCheckboxes()}</td>` : ''}
`;
        resultTableBody.appendChild(row);
    });

    // Add event listeners for tier checkboxes
    document.querySelectorAll('.tier-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const row = this.closest('tr');
            const priceInput = row.querySelector('input[name="price"]');
            const tieredDetailsCell = row.querySelector('.tiered-details');
            const tieredDetailsHeader = document.getElementById('tiered-details-header');

            if (this.checked) {
                priceInput.readOnly = true;
                priceInput.display = 'none';
                priceInput.value = '';
                tieredDetailsCell.style.display = 'block';
                addTieredDetailRow(tieredDetailsCell);
                tieredDetailsHeader.style.display = 'block';
            } else {
                priceInput.readOnly = false;
                tieredDetailsCell.innerHTML = '';
                tieredDetailsCell.style.display = 'none';
                const anyTierChecked = Array.from(document.querySelectorAll('.tier-checkbox')).some(cb => cb.checked);
                if (!anyTierChecked) {
                    tieredDetailsHeader.style.display = 'none';
                }
            }
        });
    });

    // Display the account name
    accountNameElement.textContent = `Account Name: ${accountName}`;

    // Display the result section
    resultSection.style.display = 'block';
}

function generateBillingProfileCheckboxes() {
    const billingProfileOptions = ['BillingPortfolioA', 'BillingPortfolioB'];
    return generateCheckboxes(billingProfileOptions, 'billingProfile');
}

function generateBillingProfileDropdown() {
    const billingProfileOptions = ['All', 'BillingPortfolioA', 'BillingPortfolioB'];
    return generateDropdown(billingProfileOptions, 'billingProfile', 'updateCCIDDropdown()');
}

function generateOrgGrpCheckboxes() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
    const ccidSelect = document.querySelector('select[name="ccid"]');
    const selectedCcid = ccidSelect ? ccidSelect.value : 'All';
    let orgGrpOptions = [];

    if (selectedCcid === 'All') {
        if (accountStructure === 'multi-ccid-separate-pool') {
            orgGrpOptions = [
                ...generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'A'),
                ...generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'B')
            ];
        } else {
            orgGrpOptions = generateOrgGrpArray(ccidCount, orgGrpPerCcid);
        }
    } else if (selectedCcid.startsWith('CCID')) {
        if (accountStructure === 'multi-ccid-separate-pool') {
            const pool = selectedCcid.slice(-1); // Gets 'A' or 'B'
            const ccidNum = selectedCcid.replace('CCID', '').replace(pool, ''); // Gets the number
            orgGrpOptions = [];
            for (let j = 1; j <= orgGrpPerCcid; j++) {
                orgGrpOptions.push(`OrgGrp${ccidNum}${j}${pool}`);
            }
        } else {
            const ccidNum = selectedCcid.replace('CCID', '');
            orgGrpOptions = [];
            for (let j = 1; j <= orgGrpPerCcid; j++) {
                orgGrpOptions.push(`OrgGrp${ccidNum}${j}`);
            }
        }
    }

    return generateCheckboxes(orgGrpOptions, 'orgGrp');
}

/*function generateDropdown(options, name) {
    let dropdown = `<select name="${name}" onchange="updateOrgGrpCheckboxes()">`;
    options.forEach(option => {
        dropdown += `<option value="${option}">${option}</option>`;
    });
    dropdown += '</select>';
    return dropdown;
} */
function generateDropdown(options, name, onChangeFunction = '') {
    const onChangeAttr = onChangeFunction ? `onchange="${onChangeFunction}"` : '';
    let dropdown = `<select name="${name}" ${onChangeAttr}>`;
    options.forEach(option => {
        dropdown += `<option value="${option}">${option}</option>`;
    });
    dropdown += '</select>';
    return dropdown;
}

function generateCheckboxes(options, name) {
    let checkboxes = '';
    options.forEach(option => {
        checkboxes += `<label><input type="checkbox" name="${name}" value="${option}">${option}</label>`;
    });
    return checkboxes;
}

function updateCCIDDropdown() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
    if (accountStructure !== 'multi-ccid-separate-pool') return;

    const rows = document.querySelectorAll('#result-table tbody tr');
    rows.forEach(row => {
        const billingProfileSelect = row.querySelector('select[name="billingProfile"]');
        const ccidSelect = row.querySelector('select[name="ccid"]');

        if (billingProfileSelect && ccidSelect) {
            const selectedBillingProfile = billingProfileSelect.value;
            let ccidOptions = [];

            if (selectedBillingProfile === 'All') {
                ccidOptions = ['All', ...generateCCIDArray(ccidCount).map(ccid => ccid + 'A'), ...generateCCIDArray(ccidCount).map(ccid => ccid + 'B')];
            } else if (selectedBillingProfile === 'BillingPortfolioA') {
                ccidOptions = ['All', ...generateCCIDArray(ccidCount).map(ccid => ccid + 'A')];
            } else if (selectedBillingProfile === 'BillingPortfolioB') {
                ccidOptions = ['All', ...generateCCIDArray(ccidCount).map(ccid => ccid + 'B')];
            }

            // Save current selection
            const currentSelection = ccidSelect.value;

            // Update CCID dropdown
            ccidSelect.innerHTML = '';
            ccidOptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                ccidSelect.appendChild(optionElement);
            });

            // Restore selection if still valid
            if (ccidOptions.includes(currentSelection)) {
                ccidSelect.value = currentSelection;
            }

            // Update OrgGrp checkboxes
            updateOrgGrpCheckboxes();
        }
    });
}

function updateOrgGrpCheckboxes() {
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
    const rows = document.querySelectorAll('#result-table tbody tr');

    rows.forEach(row => {
        let ccidSelect, orgGrpCell;

        if (accountStructure === 'multi-ccid-shared-pool') {
            ccidSelect = row.querySelector('select[name="ccid"]');
            orgGrpCell = row.querySelector('td:nth-child(9)');
        } else if (accountStructure === 'multi-ccid-separate-pool') {
            ccidSelect = row.querySelector('select[name="ccid"]');
            orgGrpCell = row.querySelector('td:nth-child(10)'); // Adjusted for billing profile column
        }

        if (ccidSelect && orgGrpCell) {
            const selectedCcid = ccidSelect.value;
            let orgGrpOptions = [];

            if (selectedCcid === 'All') {
                if (accountStructure === 'multi-ccid-separate-pool') {
                    const billingProfileSelect = row.querySelector('select[name="billingProfile"]');
                    const selectedBillingProfile = billingProfileSelect ? billingProfileSelect.value : 'All';

                    if (selectedBillingProfile === 'All') {
                        orgGrpOptions = [
                            ...generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'A'),
                            ...generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'B')
                        ];
                    } else if (selectedBillingProfile === 'BillingPortfolioA') {
                        orgGrpOptions = generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'A');
                    } else if (selectedBillingProfile === 'BillingPortfolioB') {
                        orgGrpOptions = generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'B');
                    }
                } else {
                    orgGrpOptions = generateOrgGrpArray(ccidCount, orgGrpPerCcid);
                }
            } else if (selectedCcid.startsWith('CCID')) {
                if (accountStructure === 'multi-ccid-separate-pool') {
                    const pool = selectedCcid.slice(-1); // Gets 'A' or 'B'
                    const ccidNum = selectedCcid.replace('CCID', '').replace(pool, ''); // Gets the number
                    orgGrpOptions = [];
                    for (let j = 1; j <= orgGrpPerCcid; j++) {
                        orgGrpOptions.push(`OrgGrp${ccidNum}${j}${pool}`);
                    }
                } else {
                    const ccidNum = selectedCcid.replace('CCID', '');
                    orgGrpOptions = [];
                    for (let j = 1; j <= orgGrpPerCcid; j++) {
                        orgGrpOptions.push(`OrgGrp${ccidNum}${j}`);
                    }
                }
            }

            const existingSelections = Array.from(orgGrpCell.querySelectorAll('input[name="orgGrp"]:checked')).map(checkbox => checkbox.value);
            orgGrpCell.innerHTML = generateCheckboxes(orgGrpOptions, 'orgGrp');
            existingSelections.forEach(value => {
                const checkbox = orgGrpCell.querySelector(`input[name="orgGrp"][value="${value}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    });
}

function addTieredDetailRow(tieredDetailsCell) {
    const tieredDetailRow = document.createElement('div');
    tieredDetailRow.classList.add('tiered-detail-row');
    tieredDetailRow.innerHTML = `
        <button type="button" class="remove-tier-row" style="display:none;">-</button>
        <input type="text" name="upper-band" placeholder="Upper Band">
        <input type="text" name="tier-price" placeholder="Price">
        <button type="button" class="add-tier-row" style="display:none;">+</button>
    `;
    tieredDetailsCell.appendChild(tieredDetailRow);

    // Add event for remove button
    tieredDetailRow.querySelector('.remove-tier-row').addEventListener('click', function () {
        tieredDetailRow.remove();
        updateTierRowButtons(tieredDetailsCell);
    });

    // Add event for add button
    tieredDetailRow.querySelector('.add-tier-row').addEventListener('click', function () {
        addTieredDetailRow(tieredDetailsCell);
        updateTierRowButtons(tieredDetailsCell);
    });

    updateTierRowButtons(tieredDetailsCell);
}

function updateTierRowButtons(tieredDetailsCell) {
    const rows = tieredDetailsCell.querySelectorAll('.tiered-detail-row');
    rows.forEach((row, idx) => {
        const addBtn = row.querySelector('.add-tier-row');
        const removeBtn = row.querySelector('.remove-tier-row');
        if (idx === rows.length - 1) {
            // Only last row gets both buttons
            addBtn.style.display = '';
            removeBtn.style.display = '';
        } else {
            addBtn.style.display = 'none';
            removeBtn.style.display = 'none';
        }
    });
}


async function readCSV(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();
    const rows = data.split('\n');
    const headers = rows[0].split(',');
    return rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((object, header, index) => {
            object[header] = values[index];
            return object;
        }, {});
    });
}

async function showCSVResults() {
    const usersUsageTemplate = await readCSV('/csv/Users_usage_template.csv');
    const nonUsersUsageTemplate = await readCSV('/csv/NonUser_usage_template.csv');
    const usageMappingUsers = await readCSV('/csv/usageMapping_Users.csv');
    const usageMappingNonUsers = await readCSV('/csv/usageMapping_NonUsers.csv');
}

document.addEventListener('DOMContentLoaded', () => {
    const userCheckbox = document.getElementById('user-checkbox');
    const computeCheckbox = document.getElementById('compute-checkbox');
    const submitButton = document.getElementById('submit');
    const startButton = document.getElementById('startButton');
    const generatePlanButton = document.getElementById('generatePlanButton');
    const accountStructureFieldset = document.getElementById('account-structure');

    let selectedProductsDetailsByCCID = {};
    let selectedProductsDetailsByOrgGrp = {};

    if (userCheckbox) {
        userCheckbox.addEventListener('change', handleUserCheckboxChange);
    } else {
        console.error('User checkbox not found');
    }

    if (computeCheckbox) {
        computeCheckbox.addEventListener('change', handleComputeCheckboxChange);
    } else {
        console.error('Compute checkbox not found');
    }

    if (submitButton) {
        submitButton.addEventListener('click', handleSubmit);
    } else {
        console.error('Submit button not found');
    }

    if (startButton) {
        startButton.addEventListener('click', async () => {
            const sessionId = document.getElementById('session-id').value;
            const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
            // Collect selected products details
            selectedProductsDetails = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
                const discountCheckbox = row.querySelector('input[name="is-discount-required"]');
                const tieredDetails = Array.from(row.querySelectorAll('.tiered-detail-row')).map(detailRow => ({
                    upperBand: detailRow.querySelector('input[name="upper-band"]').value,
                    price: detailRow.querySelector('input[name="tier-price"]').value
                }));

                // Add lowerBand values
                tieredDetails.forEach((detail, index) => {
                    if (index === 0) {
                        detail.lowerBand = '0';
                    } else {
                        const previousUpperBand = parseFloat(tieredDetails[index - 1]?.upperBand || '0');
                        detail.lowerBand = (previousUpperBand + 0.0000000001).toString();
                    }
                });

                // Handle the last element's upperBand
                tieredDetails.forEach(detail => {
                    if (!detail.upperBand) {
                        detail.upperBand = '-1';
                    }
                });

                return {
                    ProdID: row.cells[1].textContent,
                    ProductName: row.cells[2].textContent,
                    Price: row.querySelector('input[name="price"]').value || '0',
                    Tier: tierCheckbox ? tierCheckbox.checked : false,
                    TieredDetails: tieredDetails
                };
            });

            //console.log('Selected Products Details:', selectedProductsDetails);
            // Collect selected products details by BillingProfile
            // In the startButton event listener, update the BillingProfile collection logic:
            let selectedProductsDetailsByBillingProfile = {};
            if (accountStructure === 'multi-ccid-separate-pool') {
                const billingProfileOptions = ['BillingPortfolioA', 'BillingPortfolioB'];
                for (const billingProfile of billingProfileOptions) {
                    selectedProductsDetailsByBillingProfile[billingProfile] = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                        const row = checkbox.closest('tr');
                        const billingProfileSelect = row.querySelector('select[name="billingProfile"]');
                        return billingProfileSelect && (billingProfileSelect.value === billingProfile || billingProfileSelect.value === 'All');
                    }).map(checkbox => {
                        const row = checkbox.closest('tr');
                        const tierCheckbox = row.querySelector('input[name="tier"]');
                        const discountCheckbox = row.querySelector('input[name="is-discount-required"]');
                        const tieredDetails = Array.from(row.querySelectorAll('.tiered-detail-row')).map(detailRow => ({
                            upperBand: detailRow.querySelector('input[name="upper-band"]').value,
                            price: detailRow.querySelector('input[name="tier-price"]').value
                        }));

                        tieredDetails.forEach((detail, index) => {
                            if (index === 0) {
                                detail.lowerBand = '0';
                            } else {
                                const previousUpperBand = parseFloat(tieredDetails[index - 1]?.upperBand || '0');
                                detail.lowerBand = (previousUpperBand + 0.0000000001).toString();
                            }
                        });

                        tieredDetails.forEach(detail => {
                            if (!detail.upperBand) {
                                detail.upperBand = '-1';
                            }
                        });

                        return {
                            ProdID: row.cells[1].textContent,
                            ProductName: row.cells[2].textContent,
                            Price: row.querySelector('input[name="price"]').value || '0',
                            Tier: tierCheckbox ? tierCheckbox.checked : false,
                            TieredDetails: tieredDetails,
                            Discount: discountCheckbox && discountCheckbox.checked ? discountCheckbox.value : null
                        };
                    });

                }
                console.log('Selected Products Details by BillingProfile:', selectedProductsDetailsByBillingProfile);
            }

            // Collect selected products details for CCID1
            selectedProductsDetailsByCCID = {};
            for (const ccid of ccidArray) {
                if (ccid === 'All') continue; // skip 'All' option
                selectedProductsDetailsByCCID[ccid] = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                    const row = checkbox.closest('tr');
                    const ccidSelect = row.querySelector('select[name="ccid"]');
                    return ccidSelect && (ccidSelect.value === ccid || ccidSelect.value === 'All');
                }).map(checkbox => {
                    const row = checkbox.closest('tr');
                    const tierCheckbox = row.querySelector('input[name="tier"]');
                    const discountCheckbox = row.querySelector('input[name="is-discount-required"]');
                    const tieredDetails = Array.from(row.querySelectorAll('.tiered-detail-row')).map(detailRow => ({
                        upperBand: detailRow.querySelector('input[name="upper-band"]').value,
                        price: detailRow.querySelector('input[name="tier-price"]').value
                    }));

                    // Add lowerBand values
                    tieredDetails.forEach((detail, index) => {
                        if (index === 0) {
                            detail.lowerBand = '0';
                        } else {
                            const previousUpperBand = parseFloat(tieredDetails[index - 1]?.upperBand || '0');
                            detail.lowerBand = (previousUpperBand + 0.0000000001).toString();
                        }
                    });

                    // Handle the last element's upperBand
                    tieredDetails.forEach(detail => {
                        if (!detail.upperBand) {
                            detail.upperBand = '-1';
                        }
                    });

                    return {
                        ProdID: row.cells[1].textContent,
                        ProductName: row.cells[2].textContent,
                        Price: row.querySelector('input[name="price"]').value || '0',
                        Tier: tierCheckbox ? tierCheckbox.checked : false,
                        TieredDetails: tieredDetails
                    };
                });
            }
            //console.log('Selected Products Details for CCID2:', selectedProductsDetailsCCID2);
            // Collect selected products details for OrgGrp11
            selectedProductsDetailsByOrgGrp = {};
            for (const orgGrp of orgGrpArray) {
                selectedProductsDetailsByOrgGrp[orgGrp] = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                    const row = checkbox.closest('tr');
                    const orgGrpCheckbox = row.querySelector(`input[name="orgGrp"][value="${orgGrp}"]`);
                    return orgGrpCheckbox && orgGrpCheckbox.checked;
                }).map(checkbox => {
                    const row = checkbox.closest('tr');
                    const tierCheckbox = row.querySelector('input[name="tier"]');
                    const discountCheckbox = row.querySelector('input[name="is-discount-required"]');
                    const tieredDetails = Array.from(row.querySelectorAll('.tiered-detail-row')).map(detailRow => ({
                        upperBand: detailRow.querySelector('input[name="upper-band"]').value,
                        price: detailRow.querySelector('input[name="tier-price"]').value
                    }));

                    // Add lowerBand values
                    tieredDetails.forEach((detail, index) => {
                        if (index === 0) {
                            detail.lowerBand = '0';
                        } else {
                            const previousUpperBand = parseFloat(tieredDetails[index - 1]?.upperBand || '0');
                            detail.lowerBand = (previousUpperBand + 0.0000000001).toString();
                        }
                    });

                    // Handle the last element's upperBand
                    tieredDetails.forEach(detail => {
                        if (!detail.upperBand) {
                            detail.upperBand = '-1';
                        }
                    });

                    return {
                        ProdID: row.cells[1].textContent,
                        ProductName: row.cells[2].textContent,
                        Price: row.querySelector('input[name="price"]').value || '0',
                        Tier: tierCheckbox ? tierCheckbox.checked : false,
                        TieredDetails: tieredDetails
                    };
                });

            }
            //console.log('Selected Products Details for OrgGrp22:', selectedProductsDetailsOrgGrp22);
            //console.log('Selected Products Details:', selectedProductsDetails);
            console.log('Selected Products Details by CCID:', selectedProductsDetailsByCCID);
            console.log('Selected Products Details by OrgGrp:', selectedProductsDetailsByOrgGrp);

            try {
                //const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
                let accountHierarchy = [];
                if (accountStructure === 'single-ccid') {
                    accountHierarchy = generateAccountHierarchy(accountStructure);
                    ccidArray = ['CCID'];
                    orgGrpArray = ['OrgGrp'];
                } else if (accountStructure === 'multi-ccid-shared-pool') {
                    accountHierarchy = generateAccountHierarchy(accountStructure, ccidCount, orgGrpPerCcid);
                    ccidArray = generateCCIDArray(ccidCount);
                    orgGrpArray = generateOrgGrpArray(ccidCount, orgGrpPerCcid);
                } else if (accountStructure === 'multi-ccid-separate-pool') {
                    accountHierarchy = generateAccountHierarchy(accountStructure, ccidCount, orgGrpPerCcid);
                    ccidArray = ['All', ...generateCCIDArray(ccidCount).map(ccid => ccid + 'A'), ...generateCCIDArray(ccidCount).map(ccid => ccid + 'B')];

                    orgGrpArray = [
                        ...generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'A'),
                        ...generateOrgGrpArray(ccidCount, orgGrpPerCcid).map(orgGrp => orgGrp + 'B')
                    ];
                }
                //displayHierarchyTree(accountHierarchy);
                displayResultContainer(resultContainer);
                const accountIds = await createAccounts(sessionId, accountName, sfAccId, accountHierarchy);
                //console.log('AccountIds:', accountIds);
                const savingsPlanData = {
                    billingTerms: document.getElementById('billing-terms').value,
                    lastAmendmentNumber: document.getElementById('last-amendment-number').value,
                    totalContractValue: document.getElementById('total-contract-value').value,
                    initialCommitment: document.getElementById('initial-commitment').value,
                    initialCommitmentCredit: document.getElementById('initial-commitment-credit').value,
                    initialPrepaidCommitment: document.getElementById('initial-prepaid-commitment').value,
                    initialFlexiPrepaidCommitment: document.getElementById('initial-flexi-prepaid-commitment').value,
                    initialFlexiCredit: document.getElementById('initial-flexi-credit').value,
                    rolloverFunds: document.getElementById('rollover-funds').value,
                    rolloverCredits: document.getElementById('rollover-credits').value,
                    resellerFeeRenewalRate: document.getElementById('reseller-fee-renewal-rate').value,
                    resellerFeeNewRate: document.getElementById('reseller-fee-new-rate').value,
                    resellerFeeBlendedRate: document.getElementById('reseller-fee-blended-rate').value,
                    marketplacePlatformName: document.getElementById('marketplace-platform-name').value,
                    partnerCompensationMethod: document.getElementById('partner-compensation-method').value,
                    buyingProgram: document.getElementById('buying-program').value
                };
                //
                if (savingsPlanData.initialPrepaidCommitment !== '') {
                    let commitmentPrice = 0;
                    //console.log('Initial Prepaid Commitment Value Exists:', savingsPlanData.initialPrepaidCommitment);
                    if (savingsPlanData.initialFlexiPrepaidCommitment || savingsPlanData.initialFlexiPrepaidCommitment !== '') {
                        commitmentPrice = savingsPlanData.initialFlexiPrepaidCommitment;

                    } else {
                        commitmentPrice = savingsPlanData.initialCommitment;
                    }
                    // Add the specified product details
                    console.log('*****Selected Buying Program*****:', selectedBuyingProgram);
                    if (selectedBuyingProgram === 'SAVINGS') {
                        console.log('Savings Plan Selected Buying Program:');
                        selectedProductsDetails.push({
                            ProdID: '14176',
                            ProductName: 'SP1.0 - Prepaid Commitment',
                            Price: commitmentPrice,
                            Tier: false,
                            TieredDetails: []
                        });
                        console.log('Savings Plan Selected Product Details:', selectedProductsDetails);
                    }
                    if (selectedBuyingProgram === 'VOLUME') {
                        console.log('Volume Plan Selected Buying Program:');
                        selectedProductsDetails.push({
                            ProdID: '14825',
                            ProductName: 'VP1.1 - Prepaid Commitment',
                            Price: commitmentPrice,
                            Tier: false,
                            TieredDetails: []
                        });
                        console.log('Volume Plan Selected Product Details:', selectedProductsDetails);
                    }
                }
                //
                if (savingsPlanData.initialCommitmentCredit !== '' && savingsPlanData.billingTerms !== "Monthly In Arrears (No Pre Pay)") {
                    let commitmentCreditPrice = 0;

                    if (savingsPlanData.initialFlexiCredit || savingsPlanData.initialFlexiCredit !== '') {
                        commitmentCreditPrice = savingsPlanData.initialFlexiCredit;

                    } else {
                        commitmentCreditPrice = savingsPlanData.initialCommitmentCredit;
                    }
                    // Add the specified product details
                    if (selectedBuyingProgram === 'SAVINGS') {
                        selectedProductsDetails.push({
                            ProdID: '14120',
                            ProductName: 'SP1.0 - Commitment Credits',
                            Price: commitmentCreditPrice,
                            Tier: false,
                            TieredDetails: []
                        });
                    }
                    if (selectedBuyingProgram === 'VOLUME') {
                        //This will be handled later once Volume commitment credit product available
                    }
                }
                //
                /*if (savingsPlanData.resellerFeeBlendedRate !== '') {
                    console.log('Reseller Fee Blended Rate Value Exists:', savingsPlanData.resellerFeeBlendedRate);

                    // Add the specified product details
                    selectedProductsDetails.push({
                        ProdID: '14178',
                        ProductName: 'New Relic Reseller Fee',
                        Price: '',
                        Tier: false,
                        TieredDetails: []
                    });
                }*/
                console.log('Savings Plan Data:', savingsPlanData);
                const contractIds = [];
                for (const account of accountIds) {
                    appendResultRow(account.level, account.accId, resultValuesTableBody);
                    ///////////////////////////////////////////////////////////////////////////////////////////////////
                    if (accountStructure === 'single-ccid') {
                        if (account.level === 'BillingPortfolio') {
                            ccidCount = 1;
                            displayResultContainer(resultContainer1);   // Display the result section
                            const contractType = 'Commitment';
                            contractId = await createContract(sessionId, account.accId, accountName, contractStartDateValue, contractEndDateValue, contractName, contractType, savingsPlanData, ccidCount);
                            appendResultRow('ContractId', contractId, resultValuesTableBody1);
                            //contractCurrencyId = await createContractCurrency(sessionId, contractId);
                            //appendResultRow('ContractCurrencyId', contractCurrencyId, resultValuesTableBody1);
                            displayResultContainer(resultContainer2);   // Display the result section
                            displayResultContainer(resultContainer4);
                            displayResultContainer(resultContainer3);   // Display the result section
                            console.log('Selected Products Details:', selectedProductsDetails);
                            for (const product of selectedProductsDetails) {
                                //console.log(`ProdID: ${product.ProdID}, ProductName: ${product.ProductName}, Price: ${product.Price}, TieredDetails: ${JSON.stringify(product.TieredDetails)}`);
                                contractRateId = await createContractRate(sessionId, contractId, product, contractStartDateValue, contractEndDateValue);
                                //console.log('ContractRateId:', contractRateId);
                                appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4);
                                appendResultRow(`ContractRateId (${product.ProdID})`, contractRateId, resultValuesTableBody2);


                                if (product.TieredDetails.length > 0) {
                                    pricingId = await createTieredPricing(sessionId, contractId, contractRateId, product.TieredDetails, contractStartDateValue, contractEndDateValue);
                                    //console.log('PricingId:', pricingId);
                                    //appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);

                                } else {
                                    console.log(`ProdID: ${product.ProdID}, ProductName: ${product.ProductName}, Price: ${product.Price}, TieredDetails: ${JSON.stringify(product.TieredDetails)}`);
                                    pricingId = await createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue);
                                    if (pricingId.createResponse[0].ErrorCode !== '0' && `${product.ProductName}` === 'SP1.0 - Commitment Credits') {
                                        pricingId = await queryPrice(sessionId, contractRateId);
                                        if (pricingId && pricingId.length > 0) {
                                            pricingId = await updatePricing(sessionId, pricingId, product);
                                            console.log('Updated PricingId:', pricingId);
                                        }

                                    }
                                    //appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);
                                }

                            }
                            contractProdIds = await queryProductsFromContract(sessionId, contractId);
                            contractAccProd = contractProdIds.filter(
                                item => item['ContractRateLabel'].includes('SP1.0 - Prepaid Commitment') ||
                                    item['ContractRateLabel'].includes('VP1.1 - Prepaid Commitment') ||
                                    item['ContractRateLabel'].includes('New Relic Volume Plan - Discount'));
                            //contractAccProd = contractProdIds.filter(item => item['ContractRateLabel'].includes('SP1.0 - Commitment Credits'));
                            //contractAccProd = contractProdIds.filter(item => item['ContractRateLabel'].includes('New Relic Reseller Fee'));
                            console.log('ContractProdIds:', contractProdIds);
                            console.log('ContractAccProd:', contractAccProd);
                            for (const product of contractAccProd) {
                                // --- Custom logic for SP1.0 - Prepaid Commitment ---
                                let productName = product.ContractRateLabel ? product.ContractRateLabel : product.ProductName;
                                //console.log('Product Name:///////////////', productName);
                                if (
                                    productName === "SP1.0 - Prepaid Commitment" || productName === "VP1.1 - Prepaid Commitment" &&
                                    (savingsPlanData.initialFlexiPrepaidCommitment || savingsPlanData.initialFlexiPrepaidCommitment !== '')
                                ) {
                                    await createAccountProductWithBillingTerms(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue, savingsPlanData.billingTerms);
                                } else {
                                    await createAccountProduct(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue);
                                }


                            }
                            const tieredProducts = selectedProductsDetails.filter(product => product.Tier && product.TieredDetails.length > 0);
                            for (const product of tieredProducts) {
                                // Get first tier values
                                const firstTier = product.TieredDetails[0];
                                const firstTierQuantity = parseFloat(firstTier.upperBand) || 0;
                                const firstTierPrice = parseFloat(firstTier.price) || 0;
                                const nrMonthlyMinCommitment = Math.round((firstTierQuantity * firstTierPrice) * 100) / 100;

                                console.log(`Processing tiered product: ${product.ProductName}`);
                                console.log(`First Tier Quantity: ${firstTierQuantity}`);
                                console.log(`First Tier Price: ${firstTierPrice}`);
                                console.log(`Monthly Min Commitment: ${nrMonthlyMinCommitment}`);

                                // Find the corresponding contract product
                                const contractProduct = contractProdIds.find(item =>
                                    item.ContractRateLabel === product.ProductName ||
                                    item.ProductName === product.ProductName
                                );

                                if (contractProduct) {
                                    // Create account product with tier values
                                    await createAccountProductWithTierValues(
                                        sessionId,
                                        account.accId,
                                        contractId,
                                        product,
                                        contractStartDateValue,
                                        contractEndDateValue,
                                        firstTierQuantity,
                                        nrMonthlyMinCommitment
                                    );
                                }
                            }

                        }
                        if (account.level === 'CCID') {
                            let ccIdcontractProdIds = contractProdIds;

                            ccIdusageProducts = contractProdIds;
                            ccIdusageProducts = ccIdusageProducts.filter(item => item['ContractRateLabel'].includes('Usage Quantity') && item['ContractRateLabel'].includes('Users'));
                            ccIdcontractProdIds = ccIdcontractProdIds.filter(item => !item['ContractRateLabel'].includes('Usage Quantity'));
                            ccIdcontractProdIds = ccIdcontractProdIds.filter(item => !item['ContractRateLabel'].includes('SP1.0'));
                            ccIdcontractProdIds = ccIdcontractProdIds.filter(item => !item['ContractRateLabel'].includes('SP 1.0'));
                            ccIdcontractProdIds = ccIdcontractProdIds.filter(item => !item['ContractRateLabel'].includes('VP1.1'));
                            ccIdcontractProdIds = ccIdcontractProdIds.filter(item => !item['ContractRateLabel'].includes('Discount'));
                            ccIdcontractProdIds = ccIdcontractProdIds.filter(item => !item['ContractRateLabel'].includes('New Relic Reseller Fee'));
                            ccIdcontractProdIds = ccIdcontractProdIds.filter(item => item['ContractRateLabel'].includes('Users'));

                            console.log('CCId ContractProdIds:', ccIdcontractProdIds);
                            for (const product of ccIdcontractProdIds) {
                                accountProductId = await createAccountProduct(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue);
                                //console.log('AccountProductId:', accountProductId);
                                appendResultRow(`OrgGrp AccountProductId (${product.Id})`, accountProductId, resultValuesTableBody3);
                            }
                            //billingIdentifier = account.accId;
                            const ccidGrpAccId = account.accId;
                            console.log('OrgGrp Account Id:', ccidGrpAccId);
                            //BIaccountProductId = await createBillingIdentifier(sessionId, account.accId, contractId, billingIdentifier, contractStartDateValue, contractEndDateValue);
                            //console.log('BIaccountProductId:', BIaccountProductId);
                            //appendResultRow('BIaccountProductId', BIaccountProductId, resultValuesTableBody3);
                            const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select nrBillingIdentifier from ACCOUNT_PRODUCT where accountid = '${ccidGrpAccId}' and name='BillingIdentifier'`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json; charset=utf-8',
                                    sessionId: `${sessionId}`
                                }
                            });
                            const data = await response.json();
                            const biData = data.queryResponse;
                            let billingIdentifier = '';
                            if (biData && biData.length > 0) {
                                console.log('Billing Identifier found:', biData[0].nrBillingIdentifier);
                                billingIdentifier = biData[0].nrBillingIdentifier;
                            }


                            await showCSVResults();
                            //Create usage files
                            console.log('Creating user usage file...');
                            console.log('Billing Identifier:', billingIdentifier);
                            console.log('Contract Start Date:', contractStartDateValue);
                            console.log('CCID Usage Products:', ccIdusageProducts);
                            console.log('TCID:', TCId);
                            console.log('Account Level:', account.level);
                            await createUserUsageFile(billingIdentifier, contractStartDateValue, ccIdusageProducts, TCId, account.level);
                        }


                        if (account.level === 'OrgGrp') {
                            let orgGrpcontractProdIds = contractProdIds;
                            orgGrpusageProducts = contractProdIds;
                            orgGrpusageProducts = orgGrpusageProducts.filter(item => item['ContractRateLabel'].includes('Usage Quantity') && !item['ContractRateLabel'].includes('Users'));
                            orgGrpcontractProdIds = orgGrpcontractProdIds.filter(item => !item['ContractRateLabel'].includes('Usage Quantity'));
                            orgGrpcontractProdIds = orgGrpcontractProdIds.filter(item => !item['ContractRateLabel'].includes('SP1.0'));
                            orgGrpcontractProdIds = orgGrpcontractProdIds.filter(item => !item['ContractRateLabel'].includes('SP 1.0'));
                            orgGrpcontractProdIds = orgGrpcontractProdIds.filter(item => !item['ContractRateLabel'].includes('VP1.1'));
                            orgGrpcontractProdIds = orgGrpcontractProdIds.filter(item => !item['ContractRateLabel'].includes('Discount'));
                            orgGrpcontractProdIds = orgGrpcontractProdIds.filter(item => !item['ContractRateLabel'].includes('New Relic Reseller Fee'));
                            orgGrpcontractProdIds = orgGrpcontractProdIds.filter(item => !item['ContractRateLabel'].includes('Users'));

                            console.log('OrgGrp ContractProdIds:', orgGrpcontractProdIds);
                            for (const product of orgGrpcontractProdIds) {
                                accountProductId = await createAccountProduct(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue);
                                //console.log('AccountProductId:', accountProductId);
                                appendResultRow(`OrgGrp AccountProductId (${product.Id})`, accountProductId, resultValuesTableBody3);
                            }
                            //billingIdentifier = account.accId;
                            const orgGrpAccId = account.accId;
                            console.log('OrgGrp Account Id:', orgGrpAccId);
                            //BIaccountProductId = await createBillingIdentifier(sessionId, account.accId, contractId, billingIdentifier, contractStartDateValue, contractEndDateValue);
                            //console.log('BIaccountProductId:', BIaccountProductId);
                            //appendResultRow('BIaccountProductId', BIaccountProductId, resultValuesTableBody3);
                            const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select nrBillingIdentifier from ACCOUNT_PRODUCT where accountid = '${orgGrpAccId}' and name='BillingIdentifier'`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json; charset=utf-8',
                                    sessionId: `${sessionId}`
                                }
                            });
                            const data = await response.json();
                            const biData = data.queryResponse;
                            let billingIdentifier = '';
                            if (biData && biData.length > 0) {
                                console.log('Billing Identifier found:', biData[0].nrBillingIdentifier);
                                billingIdentifier = biData[0].nrBillingIdentifier;
                            }


                            await showCSVResults();
                            //Create usage files
                            console.log('Creating non-user usage file...');
                            console.log('Billing Identifier:', billingIdentifier);
                            console.log('Contract Start Date:', contractStartDateValue);
                            console.log('OrgGrp Usage Products:', orgGrpusageProducts);
                            console.log('TCID:', TCId);
                            console.log('Account Level:', account.level);
                            await createNonUserUsageFile(billingIdentifier, contractStartDateValue, orgGrpusageProducts, TCId, account.level);
                        }



                    }
                    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    if (accountStructure === 'multi-ccid-shared-pool') {
                        ccidCount = 2;

                        if (account.level === 'BillingPortfolio') {
                            contractId = await processBillingPortfolio(
                                sessionId,
                                account,
                                accountName,
                                contractStartDateValue,
                                contractEndDateValue,
                                contractName,
                                savingsPlanData,
                                ccidCount,
                                selectedProductsDetails
                            );
                        }
                        if (account.level.startsWith('CCID')) {
                            //displayResultContainer(resultContainer1);

                            const contractType = 'Rate Plan';
                            const billingTerms = savingsPlanData.billingTerms;
                            contractId = await createContract1(sessionId, account.accId, accountName, contractStartDateValue, contractEndDateValue, contractName, contractType, savingsPlanData, ccidCount);
                            //contractCurrencyId = await createContractCurrency(sessionId, contractId);
                            if (ccidArray.includes(account.level)) {
                                selectedProductsDetails = selectedProductsDetailsByCCID[account.level] || [];
                            }
                            appendResultRow(`${account.level} ContractId`, contractId, resultValuesTableBody1);
                            for (const product of selectedProductsDetails) {
                                // console.log(`ProdID: ${product.ProdID}, ProductName: ${product.ProductName}, Price: ${product.Price}, TieredDetails: ${JSON.stringify(product.TieredDetails)}`);
                                contractRateId = await createContractRate(sessionId, contractId, product, contractStartDateValue, contractEndDateValue);
                                // console.log('ContractRateId:', contractRateId);
                                // appendResultRow(`Contract: ${contractId} ContractRateId)`, contractRateId, resultValuesTableBody2);
                                appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4);
                                appendResultRow(`ContractRateId (${product.ProdID})`, contractRateId, resultValuesTableBody2);
                                if (product.TieredDetails.length > 0) {
                                    pricingId = await createTieredPricing(sessionId, contractId, contractRateId, product.TieredDetails, contractStartDateValue, contractEndDateValue);
                                    // console.log('PricingId:', pricingId);
                                    // appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);
                                } else {
                                    pricingId = await createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue);
                                    // console.log('PricingId:', pricingId);
                                    //  appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);
                                }

                            }
                            console.log('CCID Array:', ccidArray);
                            const ccidIndex = ccidArray.indexOf(account.level) + 1;
                            console.log('CCID Account Level:', account.level, 'CCID Index:', ccidIndex);
                            if (ccidIndex > 0) { // skip 'All'
                                const ccidNum = ccidIndex; // CCID1 is index 1, CCID2 is index 2, etc.
                                orgGrpArray = [];
                                for (let j = 1; j <= orgGrpPerCcid; j++) {
                                    orgGrpArray.push(`OrgGrp${ccidNum}${j}`);
                                }
                            }
                            console.log('OrgGrpArray:', orgGrpArray);
                            contractProdIds = await queryProductsFromContract(sessionId, contractId);
                            console.log('*************>>>>ContractProdIds:', contractProdIds);
                            usageProducts = contractProdIds;
                            contractProdIds = contractProdIds.filter(item => !item['ContractRateLabel'].includes('Usage Quantity'));
                            //contractProdIds = contractProdIds.filter(item => !item['ContractRateLabel'].includes('SP1.0'));
                            usageProducts = usageProducts.filter(item => item['ContractRateLabel'].includes('Usage Quantity'));
                            //console.log('CCID ContractProdIds:', contractProdIds);
                            for (const orgGrp of orgGrpArray) {
                                orgProdIds = selectedProductsDetailsByOrgGrp[orgGrp] || [];
                                orgProdIds = copyIdsFromContractToOrgProducts(contractProdIds, orgProdIds);
                                console.log(`${orgGrp} ContractProdIds:`, orgProdIds);
                                const orgGrpEntry = accountIds.find(entry => entry.level === orgGrp);
                                const orgGrpAccId = orgGrpEntry ? orgGrpEntry.accId : null;
                                const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select nrBillingIdentifier from ACCOUNT_PRODUCT where accountid = '${orgGrpAccId}' and name='BillingIdentifier'`, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json; charset=utf-8',
                                        sessionId: `${sessionId}`
                                    }
                                });
                                const data = await response.json();
                                const biData = data.queryResponse;
                                let billingIdentifier = '';
                                if (biData && biData.length > 0) {
                                    console.log('Billing Identifier found:', biData[0].nrBillingIdentifier);
                                    billingIdentifier = biData[0].nrBillingIdentifier;
                                }

                                if (orgProdIds.length > 0) {
                                    for (const product of orgProdIds) {
                                        accountProductId = await createAccountProduct(sessionId, orgGrpAccId, contractId, product, contractStartDateValue, contractEndDateValue);
                                        //console.log('AccountProductId:', accountProductId);
                                        //appendResultRow(`${orgGrp} AccountProductId (${product.ProdID})`, accountProductId, resultValuesTableBody3);
                                        appendResultRow(`${orgGrp} AccountProductId (${product.Id})`, accountProductId, resultValuesTableBody3);

                                    }
                                    //billingIdentifier = orgGrpAccId;
                                    //BIaccountProductId = await createBillingIdentifier(sessionId, orgGrpAccId, contractId, billingIdentifier, contractStartDateValue, contractEndDateValue);
                                    //console.log('BIaccountProductId:', BIaccountProductId);
                                    //appendResultRow(`${orgGrp} BIaccountProductId`, BIaccountProductId, resultValuesTableBody3);

                                    await showCSVResults();
                                    //Create usage files

                                    await createUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId, orgGrp);
                                    await createNonUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId, orgGrp);
                                }
                            }



                        }

                    }

                    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    if (accountStructure === 'multi-ccid-separate-pool') {
                        ccidCount = 2;

                        if (account.level === 'BillingPortfolioA' || account.level === 'BillingPortfolioB') {
                            contractId = await processBillingPortfolio(
                                sessionId,
                                account,
                                accountName,
                                contractStartDateValue,
                                contractEndDateValue,
                                contractName,
                                savingsPlanData,
                                ccidCount,
                                selectedProductsDetails
                            );
                        }

                        if (account.level.startsWith('CCID') && (account.level.endsWith('A') || account.level.endsWith('B'))) {
                            const contractType = 'Rate Plan';
                            const billingTerms = savingsPlanData.billingTerms;
                            contractId = await createContract1(sessionId, account.accId, accountName, contractStartDateValue, contractEndDateValue, contractName, contractType, savingsPlanData, ccidCount);

                            // Extract pool (A or B) and CCID number from account level (e.g., CCID1A -> pool='A', ccidNum='1')
                            const pool = account.level.slice(-1); // Gets 'A' or 'B'
                            const ccidBase = account.level.slice(0, -1); // Gets 'CCID1' or 'CCID2'

                            if (ccidArray.includes(ccidBase)) {
                                selectedProductsDetails = selectedProductsDetailsByCCID[ccidBase] || [];
                            }

                            appendResultRow(`${account.level} ContractId`, contractId, resultValuesTableBody1);

                            for (const product of selectedProductsDetails) {
                                contractRateId = await createContractRate(sessionId, contractId, product, contractStartDateValue, contractEndDateValue);
                                appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4);
                                appendResultRow(`ContractRateId (${product.ProdID})`, contractRateId, resultValuesTableBody2);

                                if (product.TieredDetails.length > 0) {
                                    pricingId = await createTieredPricing(sessionId, contractId, contractRateId, product.TieredDetails, contractStartDateValue, contractEndDateValue);
                                } else {
                                    pricingId = await createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue);
                                }
                            }

                            console.log('CCID Array:', ccidArray);
                            // Extract CCID number from account level
                            const ccidNum = ccidBase.replace('CCID', ''); // Gets '1' or '2'

                            orgGrpArray = [];
                            for (let j = 1; j <= orgGrpPerCcid; j++) {
                                orgGrpArray.push(`OrgGrp${ccidNum}${j}${pool}`);
                            }

                            console.log('OrgGrpArray for', account.level, ':', orgGrpArray);
                            contractProdIds = await queryProductsFromContract(sessionId, contractId);
                            usageProducts = contractProdIds;
                            contractProdIds = contractProdIds.filter(item => !item['ContractRateLabel'].includes('Usage Quantity'));
                            usageProducts = usageProducts.filter(item => item['ContractRateLabel'].includes('Usage Quantity'));

                            for (const orgGrp of orgGrpArray) {
                                contractProdIds = selectedProductsDetailsByOrgGrp[orgGrp] || [];
                                console.log(`${orgGrp} ContractProdIds:`, contractProdIds);
                                const orgGrpEntry = accountIds.find(entry => entry.level === orgGrp);
                                const orgGrpAccId = orgGrpEntry ? orgGrpEntry.accId : null;

                                const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select nrBillingIdentifier from ACCOUNT_PRODUCT where accountid = '${orgGrpAccId}' and name='BillingIdentifier'`, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json; charset=utf-8',
                                        sessionId: `${sessionId}`
                                    }
                                });
                                const data = await response.json();
                                const biData = data.queryResponse;
                                let billingIdentifier = '';
                                if (biData && biData.length > 0) {
                                    console.log('Billing Identifier found:', biData[0].nrBillingIdentifier);
                                    billingIdentifier = biData[0].nrBillingIdentifier;
                                }

                                if (contractProdIds.length > 0) {
                                    for (const product of contractProdIds) {
                                        accountProductId = await createAccountProduct(sessionId, orgGrpAccId, contractId, product, contractStartDateValue, contractEndDateValue);
                                        appendResultRow(`${orgGrp} AccountProductId (${product.Id})`, accountProductId, resultValuesTableBody3);
                                    }

                                    await showCSVResults();
                                    await createUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId, orgGrp);
                                    await createNonUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId, orgGrp);
                                }
                            }
                        }
                    }
                    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                }
                // Create Excel file with all results
                // Convert table data to arrays
                const accountDetailsArray = Array.from(resultValuesTableBody.querySelectorAll('tr')).map(row => {
                    const cells = row.querySelectorAll('td');
                    return { name: cells[0].textContent, value: cells[1].textContent };
                });

                const contractDetailsArray = Array.from(resultValuesTableBody1.querySelectorAll('tr')).map(row => {
                    const cells = row.querySelectorAll('td');
                    return { name: cells[0].textContent, value: cells[1].textContent };
                });

                const contractRateDetailsArray = Array.from(resultValuesTableBody2.querySelectorAll('tr')).map(row => {
                    const cells = row.querySelectorAll('td');
                    return { name: cells[0].textContent, value: cells[1].textContent };
                });

                const accountProductDetailsArray = Array.from(resultValuesTableBody3.querySelectorAll('tr')).map(row => {
                    const cells = row.querySelectorAll('td');
                    return { name: cells[0].textContent, value: cells[1].textContent };
                });

                // Create Excel file with all results
                console.log('Excel file creation started');
                await createExcel(accountDetailsArray, contractDetailsArray, contractRateDetailsArray, accountProductDetailsArray, TCId);
            } catch (error) {
                console.error('Error during API calls:', error);
            }
        });
    } else {
        console.error('Start button not found');
    }
});

export { handleSubmit };

// Define the updateOrgGrpCheckboxes function
window.updateOrgGrpCheckboxes = updateOrgGrpCheckboxes;

function generateAccountHierarchy(accountStructure, ccidCount = 2, orgGrpPerCcid = 2) {
    let hierarchy = ['UltimateParent', 'Parent'];
    if (accountStructure === 'single-ccid') {
        hierarchy.push('BillingPortfolio', 'CCID', 'OrgGrp');
    } else if (accountStructure === 'multi-ccid-shared-pool') {
        hierarchy.push('BillingPortfolio');
        for (let i = 1; i <= ccidCount; i++) {
            hierarchy.push(`CCID${i}`);
            for (let j = 1; j <= orgGrpPerCcid; j++) {
                hierarchy.push(`OrgGrp${i}${j}`);
            }
        }
    } else if (accountStructure === 'multi-ccid-separate-pool') {
        for (let pool of ['A', 'B']) {
            hierarchy.push(`BillingPortfolio${pool}`);
            for (let i = 1; i <= ccidCount; i++) {
                hierarchy.push(`CCID${i}${pool}`);
                for (let j = 1; j <= orgGrpPerCcid; j++) {
                    hierarchy.push(`OrgGrp${i}${j}${pool}`);
                }
            }
        }
    }
    return hierarchy;
}

function generateCCIDArray(ccidCount = 2) {
    let arr = [];
    for (let i = 1; i <= ccidCount; i++) {
        arr.push(`CCID${i}`);
    }
    return arr;
}

function generateOrgGrpArray(ccidCount = 2, orgGrpPerCcid = 2) {
    let arr = [];
    for (let i = 1; i <= ccidCount; i++) {
        for (let j = 1; j <= orgGrpPerCcid; j++) {
            arr.push(`OrgGrp${i}${j}`);
        }
    }
    return arr;
}

// Add this function to your app.js file
async function processBillingPortfolio(sessionId, account, accountName, contractStartDateValue, contractEndDateValue, contractName, savingsPlanData, ccidCount, selectedProductsDetails, selectedProductsDetailsByBillingProfile = null) {
    displayResultContainer(resultContainer1);
    displayResultContainer(resultContainer2);
    displayResultContainer(resultContainer4);
    displayResultContainer(resultContainer3);

    const contractType = 'Commitment';
    const contractId = await createContract(sessionId, account.accId, accountName, contractStartDateValue, contractEndDateValue, contractName, contractType, savingsPlanData, ccidCount);
    appendResultRow(`${account.level} ContractId`, contractId, resultValuesTableBody1);

    // Get products for this specific BillingProfile (for separate pool) or use general products
    const billingProfileProducts = selectedProductsDetailsByBillingProfile
        ? (selectedProductsDetailsByBillingProfile[account.level] || [])
        : selectedProductsDetails;

    // Create contract rates and pricing for SP1.0 products
    for (const product of billingProfileProducts) {
        if (`${product.ProductName}` === 'SP1.0 - Prepaid Commitment' || `${product.ProductName}` === 'VP1.1 - Prepaid Commitment' || `${product.ProductName}` === 'SP1.0 - Commitment Credits') {
            const contractRateId = await createContractRate(sessionId, contractId, product, contractStartDateValue, contractEndDateValue);
            appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4);
            appendResultRow(`ContractRateId (${product.ProdID})`, contractRateId, resultValuesTableBody2);

            let pricingId = await createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue);

            // Handle SP1.0 - Commitment Credits special case
            if (pricingId.createResponse[0].ErrorCode !== '0' && `${product.ProductName}` === 'SP1.0 - Commitment Credits') {
                pricingId = await queryPrice(sessionId, contractRateId);
                if (pricingId && pricingId.length > 0) {
                    pricingId = await updatePricing(sessionId, pricingId, product);
                    console.log('Updated PricingId:', pricingId);
                }
            }
        }
    }

    // Query products from contract and filter for SP1.0 - Prepaid Commitment
    const contractProdIds = await queryProductsFromContract(sessionId, contractId);
    const contractAccProd = contractProdIds.filter(item => item['ContractRateLabel'].includes('SP1.0 - Prepaid Commitment') || item['ContractRateLabel'].includes('VP1.1 - Prepaid Commitment'));

    console.log('ContractProdIds:', contractProdIds);
    console.log('ContractAccProd:', contractAccProd);

    // Create account products with special billing terms logic
    for (const product of contractAccProd) {
        const productName = product.ContractRateLabel ? product.ContractRateLabel : product.ProductName;

        if (
            productName === "SP1.0 - Prepaid Commitment" || productName === "VP1.1 - Prepaid Commitment" &&
            (savingsPlanData.initialFlexiPrepaidCommitment || savingsPlanData.initialFlexiPrepaidCommitment !== '')
        ) {
            await createAccountProductWithBillingTerms(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue, savingsPlanData.billingTerms);
        } else {
            await createAccountProduct(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue);
        }
    }
    const tieredProducts = selectedProductsDetails.filter(product => product.Tier && product.TieredDetails.length > 0);
    for (const product of tieredProducts) {
        // Get first tier values
        const firstTier = product.TieredDetails[0];
        const firstTierQuantity = parseFloat(firstTier.upperBand) || 0;
        const firstTierPrice = parseFloat(firstTier.price) || 0;
        const nrMonthlyMinCommitment = firstTierQuantity * firstTierPrice;

        console.log(`Processing tiered product: ${product.ProductName}`);
        console.log(`First Tier Quantity: ${firstTierQuantity}`);
        console.log(`First Tier Price: ${firstTierPrice}`);
        console.log(`Monthly Min Commitment: ${nrMonthlyMinCommitment}`);

        // Find the corresponding contract product
        const contractProduct = contractProdIds.find(item =>
            item.ContractRateLabel === product.ProductName ||
            item.ProductName === product.ProductName
        );

        if (contractProduct) {
            // Create account product with tier values
            await createAccountProductWithTierValues(
                sessionId,
                account.accId,
                contractId,
                contractProduct,
                contractStartDateValue,
                contractEndDateValue,
                firstTierQuantity,
                nrMonthlyMinCommitment
            );
        }
    }

    return contractId;
}


// Add this helper function for creating account products with tier values
async function createAccountProductWithTierValues(sessionId, accountId, contractId, product, contractStartDateValue, contractEndDateValue, firstTierQuantity, nrMonthlyMinCommitment) {
    let productName = product.ContractRateLabel ? product.ContractRateLabel : product.ProductName;
    let productId = product.ProductId ? product.ProductId : product.ProdID;

    console.log("Creating tier-based account product:");
    console.log("Prod Id: ", productId);
    console.log("Product Name: ", productName);
    console.log("NRUsageMonthlyMin: ", firstTierQuantity);
    console.log("nrMonthlyMinCommitment: ", nrMonthlyMinCommitment);

    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/ACCOUNT_PRODUCT`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                ProductId: productId,
                Id: '',
                Quantity: '1',
                StartDate: contractStartDateValue,
                EndDate: contractEndDateValue,
                Status: 'ACTIVE',
                AccountId: accountId,
                ContractId: contractId,
                BillingCycleStartDate: contractStartDateValue,
                Name: productName,
                NRUsageMonthlyMin: firstTierQuantity.toString(),
                nrMonthlyMinCommitment: nrMonthlyMinCommitment.toString()
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating tier-based account product');
    }

    console.log(`Created tier-based account product with ID: ${data.createResponse[0].Id}`);
    appendResultRow(`Tier AccountProductId (${productName})`, data.createResponse[0].Id, resultValuesTableBody3);

    return data.createResponse[0].Id;
}

// Add this helper function for the billing terms logic
async function createAccountProductWithBillingTerms(sessionId, accountId, contractId, product, contractStartDateValue, contractEndDateValue, billingTerms) {
    const start = new Date(contractStartDateValue);
    const end = new Date(contractEndDateValue);

    if (billingTerms === "Quarterly") {
        let tempStart = new Date(start);
        for (let i = 0; i < 4; i++) {
            let tempEnd = new Date(tempStart);
            tempEnd.setMonth(tempEnd.getMonth() + 3);
            tempEnd.setDate(0); // Set to last day of previous month (end of quarter)

            // For the last quarter, ensure we don't exceed the contract end date
            if (i === 3 || tempEnd > end) {
                tempEnd = new Date(end);
            }

            await createAccountProduct(
                sessionId,
                accountId,
                contractId,
                product,
                tempStart.toISOString().slice(0, 10),
                tempEnd.toISOString().slice(0, 10)
            );

            // Set next quarter start date
            tempStart = new Date(tempEnd);
            tempStart.setDate(tempStart.getDate() + 1); // Next day after quarter end
        }
    } else if (billingTerms === "Semi-Annual") {
        let tempStart = new Date(start);
        for (let i = 0; i < 2; i++) {
            let tempEnd = new Date(tempStart);
            tempEnd.setMonth(tempEnd.getMonth() + 6);
            tempEnd.setDate(0); // Set to last day of previous month

            // For the last semi-annual period, ensure we don't exceed the contract end date
            if (i === 1 || tempEnd > end) {
                tempEnd = new Date(end);
            }

            await createAccountProduct(
                sessionId,
                accountId,
                contractId,
                product,
                tempStart.toISOString().slice(0, 10),
                tempEnd.toISOString().slice(0, 10)
            );

            // Set next period start date
            tempStart = new Date(tempEnd);
            tempStart.setDate(tempStart.getDate() + 1); // Next day after period end
        }
    } else {
        await createAccountProduct(sessionId, accountId, contractId, product, contractStartDateValue, contractEndDateValue);
    }
}

// JavaScript function to copy Ids from contractProdIds to orgProdIds
function copyIdsFromContractToOrgProducts(contractProdIds, orgProdIds) {
    // Create a map for faster lookup: ContractRateLabel -> Id
    const contractMap = new Map();

    contractProdIds.forEach(contractProd => {
        if (contractProd.ContractRateLabel) {
            contractMap.set(contractProd.ContractRateLabel, contractProd.Id);
        }
    });

    // Update orgProdIds with matching Ids
    orgProdIds.forEach(orgProd => {
        const matchingId = contractMap.get(orgProd.ProductName);
        if (matchingId) {
            orgProd.Id = matchingId;
            console.log(`Copied Id ${matchingId} from contract product with label '${orgProd.ProductName}' to org product '${orgProd.ProductName}'`);
        }
    });

    return orgProdIds;
}

// Add this line after you populate both arrays
orgProdIds = copyIdsFromContractToOrgProducts(contractProdIds, orgProdIds);

window.updateCCIDDropdown = updateCCIDDropdown;