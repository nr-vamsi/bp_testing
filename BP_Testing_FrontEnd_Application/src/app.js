import { fetchProducts } from './fetchProducts.js';
import { createContract } from './createContract.js';
import { createContract1 } from './createContract.js';
import { createContractCurrency } from './createContractCurrency.js';
import { createContractRate } from './createContractRate.js';
import { createPricing } from './createPricing.js';
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
//let orgGrpArray = [];
let usageProducts = [];
let contractAccProd = [];
let ccidArray = [];
let orgGrpArray = [];
let TCId = '';

ccidArray = ['All', 'CCID1', 'CCID2'];
orgGrpArray = ['OrgGrp11', 'OrgGrp12', 'OrgGrp21', 'OrgGrp22'];

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
const sameAsBillToCheckbox = document.getElementById('same-as-bill-to');
const savingsPlanFieldSet = document.getElementById('savings-plan-fields');

const buyingProgramDropdown = document.getElementById('buying-program');

function handleBuyingProgramChange() {
    if (buyingProgramDropdown.value === 'SAVINGS') {
        savingsPlanFieldSet.style.display = 'block';
    } else {
        savingsPlanFieldSet.style.display = 'none';
    }
}

buyingProgramDropdown.addEventListener('change', handleBuyingProgramChange);

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
    console.log('Selected Buying Programs:', selectedBuyingPrograms);
  
   if (selectedBuyingPrograms[0] === 'SAVINGS') {
        selectedBuyingPrograms[0] = 'Savings Plan';
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
        results = results.filter(item => !item['Product Name'].includes('UOM'));
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
    sortedProducts.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" name="select-product" value="${item['ProdID']}"></td>
            <td>${item['ProdID']}</td>
            <td>${item['Product Name']}</td>
            <td>${item['Rating Method']}</td>
            <td><input type="text" name="price" value="" ${item['Rating Method'] === 'Formula' || item['Rating Method'] === 'Discount' || item['Rating Method'] === 'Subscription' || item['Rating Method'] === 'One Time Charge' ? '' : 'disabled'}></td>
            <td>${item['Rating Method'] === 'Usage' || item['Rating Method'] === 'Discount' || item['Rating Method'] === 'Subscription' || item['Rating Method'] === 'One Time Charge' ? '' : '<input type="checkbox" name="tier" class="tier-checkbox">'}</td>
            <td class="tiered-details" style="display: none;"></td>
            ${accountStructure === 'multi-ccid-shared-pool' || accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateDropdown(ccidArray, 'ccid')}</td>` : ''}
            ${accountStructure === 'multi-ccid-shared-pool' || accountStructure === 'multi-ccid-separate-pool' ? `<td>${generateOrgGrpCheckboxes()}</td>` : ''}
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

function generateOrgGrpCheckboxes() {
    const ccidSelect = document.querySelector('select[name="ccid"]');
    const selectedCcid = ccidSelect ? ccidSelect.value : 'All';
    let orgGrpOptions = [];

    if (selectedCcid === 'All') {
        orgGrpOptions = ['OrgGrp11', 'OrgGrp12', 'OrgGrp21', 'OrgGrp22'];
    } else if (selectedCcid === 'CCID1') {
        orgGrpOptions = ['OrgGrp11', 'OrgGrp12'];
    } else if (selectedCcid === 'CCID2') {
        orgGrpOptions = ['OrgGrp21', 'OrgGrp22'];
    }

    return generateCheckboxes(orgGrpOptions, 'orgGrp');
}

function generateDropdown(options, name) {
    let dropdown = `<select name="${name}" onchange="updateOrgGrpCheckboxes()">`;
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

function updateOrgGrpCheckboxes() {
    const rows = document.querySelectorAll('#result-table tbody tr');
    rows.forEach(row => {
        const ccidSelect = row.querySelector('select[name="ccid"]');
        const orgGrpCell = row.querySelector('td:nth-child(9)');
        if (ccidSelect && orgGrpCell) {
            const selectedCcid = ccidSelect.value;
            let orgGrpOptions = [];

            if (selectedCcid === 'All') {
                orgGrpOptions = ['OrgGrp11', 'OrgGrp12', 'OrgGrp21', 'OrgGrp22'];
            } else if (selectedCcid === 'CCID1') {
                orgGrpOptions = ['OrgGrp11', 'OrgGrp12'];
            } else if (selectedCcid === 'CCID2') {
                orgGrpOptions = ['OrgGrp21', 'OrgGrp22'];
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
    // Remove existing '+' buttons
    const existingAddButtons = tieredDetailsCell.querySelectorAll('.add-tier-row');
    existingAddButtons.forEach(button => button.remove());

    const tieredDetailRow = document.createElement('div');
    tieredDetailRow.classList.add('tiered-detail-row');
    tieredDetailRow.innerHTML = `
        <input type="text" name="upper-band" placeholder="Upper Band">
        <input type="text" name="tier-price" placeholder="Price">
        <button type="button" class="add-tier-row">+</button>
    `;
    tieredDetailsCell.appendChild(tieredDetailRow);
    

    tieredDetailRow.querySelector('.add-tier-row').addEventListener('click', function () {
        addTieredDetailRow(tieredDetailsCell);
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

    let selectedProductsDetailsCCID1 = [];
    let selectedProductsDetailsCCID2 = [];
    let selectedProductsDetailsOrgGrp11 = [];
    let selectedProductsDetailsOrgGrp12 = [];
    let selectedProductsDetailsOrgGrp21 = [];
    let selectedProductsDetailsOrgGrp22 = [];

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
            // console.log('SessionId:', sessionId);
            // Collect selected products details
            selectedProductsDetails = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
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
            // Collect selected products details for CCID1
            selectedProductsDetailsCCID1 = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                const row = checkbox.closest('tr');
                const ccidSelect = row.querySelector('select[name="ccid"]');
                return ccidSelect && (ccidSelect.value === 'CCID1' || ccidSelect.value === 'All');
            }).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
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


            // console.log('Selected Products Details for CCID1:', selectedProductsDetailsCCID1); 

            // Collect selected products details for CCID2
            selectedProductsDetailsCCID2 = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                const row = checkbox.closest('tr');
                const ccidSelect = row.querySelector('select[name="ccid"]');
                return ccidSelect && (ccidSelect.value === 'CCID2' || ccidSelect.value === 'All');
            }).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
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
            //console.log('Selected Products Details for CCID2:', selectedProductsDetailsCCID2);
            // Collect selected products details for OrgGrp11
            selectedProductsDetailsOrgGrp11 = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                const row = checkbox.closest('tr');
                const orgGrpCheckbox = row.querySelector('input[name="orgGrp"][value="OrgGrp11"]');
                return orgGrpCheckbox && orgGrpCheckbox.checked;
            }).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
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
            //console.log('Selected Products Details for OrgGrp11:', selectedProductsDetailsOrgGrp11);
            // Collect selected products details for OrgGrp12
            selectedProductsDetailsOrgGrp12 = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                const row = checkbox.closest('tr');
                const orgGrpCheckbox = row.querySelector('input[name="orgGrp"][value="OrgGrp12"]');
                return orgGrpCheckbox && orgGrpCheckbox.checked;
            }).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
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
            //console.log('Selected Products Details for OrgGrp12:', selectedProductsDetailsOrgGrp12);
            // Collect selected products details for OrgGrp21
            selectedProductsDetailsOrgGrp21 = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                const row = checkbox.closest('tr');
                const orgGrpCheckbox = row.querySelector('input[name="orgGrp"][value="OrgGrp21"]');
                return orgGrpCheckbox && orgGrpCheckbox.checked;
            }).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
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
            //console.log('Selected Products Details for OrgGrp21:', selectedProductsDetailsOrgGrp21);
            // Collect selected products details for OrgGrp22
            selectedProductsDetailsOrgGrp22 = Array.from(document.querySelectorAll('input[name="select-product"]:checked')).filter(checkbox => {
                const row = checkbox.closest('tr');
                const orgGrpCheckbox = row.querySelector('input[name="orgGrp"][value="OrgGrp22"]');
                return orgGrpCheckbox && orgGrpCheckbox.checked;
            }).map(checkbox => {
                const row = checkbox.closest('tr');
                const tierCheckbox = row.querySelector('input[name="tier"]');
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
            //console.log('Selected Products Details for OrgGrp22:', selectedProductsDetailsOrgGrp22);
            //console.log('Selected Products Details:', selectedProductsDetails);

            try {
                const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;
                let accountHierarchy = [];
                if (accountStructure === 'single-ccid') {
                    accountHierarchy = ['UltimateParent', 'Parent', 'BillingPortfolio', 'CCID', 'OrgGrp'];
                } else if (accountStructure === 'multi-ccid-shared-pool') {
                    accountHierarchy = ['UltimateParent', 'Parent', 'BillingPortfolio', 'CCID1', 'OrgGrp11', 'OrgGrp12', 'CCID2', 'OrgGrp21', 'OrgGrp22'];
                    ccidArray = ['CCID1', 'CCID2'];
                    orgGrpArray = ['OrgGrp11', 'OrgGrp12', 'OrgGrp21', 'OrgGrp22'];
                } else if (accountStructure === 'multi-ccid-separate-pool') {
                    accountHierarchy = ['UltimateParent', 'ParentA', 'BillingPortfolioA', 'CCID1A', 'OrgGrp11A', 'OrgGrp12A', 'CCID2A', 'OrgGrp21A', 'OrgGrp22A', 'BillingPortfolioB', 'CCID1B', 'OrgGrp11B', 'OrgGrp12B', 'CCID2B', 'OrgGrp21B', 'OrgGrp22B'];
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
                    rolloverFunds: document.getElementById('rollover-funds').value,
                    rolloverCredits: document.getElementById('rollover-credits').value,
                    resellerFeeRenewalRate: document.getElementById('reseller-fee-renewal-rate').value,
                    resellerFeeNewRate: document.getElementById('reseller-fee-new-rate').value,
                    resellerFeeBlendedRate: document.getElementById('reseller-fee-blended-rate').value,
                    marketplacePlatformName: document.getElementById('marketplace-platform-name').value,
                    partnerCompensationMethod: document.getElementById('partner-compensation-method').value,
                    buyingProgram: document.getElementById('buying-program').value
                };
               /* if (savingsPlanData.initialPrepaidCommitment !== '') {
                    console.log('Initial Prepaid Commitment Value Exists:', savingsPlanData.initialPrepaidCommitment);
                               // Add the specified product details
            selectedProductsDetails.push({
                ProdID: '14176',
                ProductName: 'SP1.0 - Prepaid Commitment',
                Price: savingsPlanData.initialCommitment,
                Tier: false,
                TieredDetails: []
            });
                } */
                console.log('Savings Plan Data:', savingsPlanData);
                const contractIds = [];
                for (const account of accountIds) {
                    appendResultRow(account.level, account.accId, resultValuesTableBody);
                    ///////////////////////////////////////////////////////////////////////////////////////////////////
                    if (accountStructure === 'single-ccid') {
                        if (account.level === 'BillingPortfolio') {
                            displayResultContainer(resultContainer1);   // Display the result section
                            const contractType = 'Commitment';
                            contractId = await createContract(sessionId, account.accId, accountName, contractStartDateValue, contractEndDateValue, contractName, contractType, savingsPlanData);
                            appendResultRow('ContractId', contractId, resultValuesTableBody1);
                            //contractCurrencyId = await createContractCurrency(sessionId, contractId);
                            //appendResultRow('ContractCurrencyId', contractCurrencyId, resultValuesTableBody1);
                            displayResultContainer(resultContainer2);   // Display the result section
                            displayResultContainer(resultContainer3);   // Display the result section
                            console.log('Selected Products Details:', selectedProductsDetails);
                            for (const product of selectedProductsDetails) {
                                //console.log(`ProdID: ${product.ProdID}, ProductName: ${product.ProductName}, Price: ${product.Price}, TieredDetails: ${JSON.stringify(product.TieredDetails)}`);
                                contractRateId = await createContractRate(sessionId, contractId, product, contractStartDateValue, contractEndDateValue);
                                //console.log('ContractRateId:', contractRateId);
                                appendResultRow(`ContractRateId (${product.ProdID})`, contractRateId, resultValuesTableBody2);


                                if (product.TieredDetails.length > 0) {
                                    pricingId = await createTieredPricing(sessionId, contractId, contractRateId, product.TieredDetails, contractStartDateValue, contractEndDateValue);
                                    //console.log('PricingId:', pricingId);
                                    //appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);
                                } else {
                                    pricingId = await createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue);
                                    //console.log('PricingId:', pricingId);
                                    //appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);
                                }

                            }
                            contractProdIds = await queryProductsFromContract(sessionId, contractId);
                            contractAccProd = contractProdIds.filter(item => item['ContractRateLabel'].includes('SP1.0 - Prepaid Commitment'));
                            for (const product of contractAccProd) {
                            accountProductId = await createAccountProduct(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue);
                            }
                        }
                        if (account.level === 'OrgGrp') {
                            
                            usageProducts = contractProdIds;
                            usageProducts = usageProducts.filter(item => item['ContractRateLabel'].includes('UOM'));
                            contractProdIds = contractProdIds.filter(item => !item['ContractRateLabel'].includes('UOM'));
                            //contractProdIds = contractProdIds.filter(item => !item['ContractRateLabel'].includes('SP1.0'));
                            
                             console.log('ContractProdIds:', contractProdIds);
                            for (const product of contractProdIds) {
                                accountProductId = await createAccountProduct(sessionId, account.accId, contractId, product, contractStartDateValue, contractEndDateValue);
                                //console.log('AccountProductId:', accountProductId);
                                appendResultRow(`AccountProductId (${product.ProductId})`, accountProductId, resultValuesTableBody3);
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
                            
                            console.log('Billing Identifier found:', billingIdentifier);
                            await createUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId);
                            await createNonUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId);
                        }

                    }
                    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    if (accountStructure === 'multi-ccid-shared-pool') {
                        if (account.level === 'BillingPortfolio') {
                            displayResultContainer(resultContainer1);   // Display the result section
                            const contractType = 'Commitment';
                            contractId = await createContract(sessionId, account.accId, accountName, contractStartDateValue, contractEndDateValue, contractName, contractType, savingsPlanData);
                            appendResultRow(`Contract Id for Account: ${account.accId} `, contractId, resultValuesTableBody1);
                            //contractCurrencyId = await createContractCurrency(sessionId, contractId);
                            //appendResultRow('ContractCurrencyId', contractCurrencyId, resultValuesTableBody1);
                        }
                        if (account.level === 'CCID1' || account.level === 'CCID2') {
                            displayResultContainer(resultContainer1);
                            displayResultContainer(resultContainer2);   // Display the result section
                            displayResultContainer(resultContainer3);   // Display the result section
                            const contractType = 'Rate Plan';
                            const billingTerms = savingsPlanData.billingTerms;
                            contractId = await createContract1(sessionId, account.accId, accountName, contractStartDateValue, contractEndDateValue, contractName, contractType, billingTerms);
                            //contractCurrencyId = await createContractCurrency(sessionId, contractId);
                            if (account.level === 'CCID1') {
                                selectedProductsDetails = selectedProductsDetailsCCID1;
                            }
                            if (account.level === 'CCID2') {
                                selectedProductsDetails = selectedProductsDetailsCCID2;
                            }
                            appendResultRow(`${account.level} ContractId`, contractId, resultValuesTableBody1);
                            for (const product of selectedProductsDetails) {
                                // console.log(`ProdID: ${product.ProdID}, ProductName: ${product.ProductName}, Price: ${product.Price}, TieredDetails: ${JSON.stringify(product.TieredDetails)}`);
                                contractRateId = await createContractRate(sessionId, contractId, product, contractStartDateValue, contractEndDateValue);
                                // console.log('ContractRateId:', contractRateId);
                                appendResultRow(`Contract: ${contractId} ContractRateId)`, contractRateId, resultValuesTableBody2);

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
                            if (account.level.startsWith('CCID')) {
                                if (account.level === 'CCID1') {
                                    orgGrpArray = ['OrgGrp11', 'OrgGrp12'];
                                }
                                if (account.level === 'CCID2') {
                                    orgGrpArray = ['OrgGrp21', 'OrgGrp22'];
                                }
                                contractProdIds = await queryProductsFromContract(sessionId, contractId);
                                usageProducts = contractProdIds;
                                contractProdIds = contractProdIds.filter(item => !item['ContractRateLabel'].includes('UOM'));
                                //contractProdIds = contractProdIds.filter(item => !item['ContractRateLabel'].includes('SP1.0'));
                                usageProducts = usageProducts.filter(item => item['ContractRateLabel'].includes('UOM'));
                                //console.log('CCID ContractProdIds:', contractProdIds);
                                for (const orgGrp of orgGrpArray) {
                                    if (orgGrp === 'OrgGrp11') {
                                        contractProdIds = selectedProductsDetailsOrgGrp11;
                                        console.log('OrgGrp11 ContractProdIds:', contractProdIds);
                                    }
                                    if (orgGrp === 'OrgGrp12') {
                                        contractProdIds = selectedProductsDetailsOrgGrp12;
                                        console.log('OrgGrp12 ContractProdIds:', contractProdIds);
                                    }
                                    if (orgGrp === 'OrgGrp21') {
                                        contractProdIds = selectedProductsDetailsOrgGrp21;
                                        console.log('OrgGrp21 ContractProdIds:', contractProdIds);
                                    }
                                    if (orgGrp === 'OrgGrp22') {
                                        contractProdIds = selectedProductsDetailsOrgGrp22;
                                        console.log('OrgGrp22 ContractProdIds:', contractProdIds);
                                    }
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
                                            //console.log('AccountProductId:', accountProductId);
                                            appendResultRow(`${orgGrp} AccountProductId (${product.ProdID})`, accountProductId, resultValuesTableBody3);

                                        }
                                        //billingIdentifier = orgGrpAccId;
                                        //BIaccountProductId = await createBillingIdentifier(sessionId, orgGrpAccId, contractId, billingIdentifier, contractStartDateValue, contractEndDateValue);
                                        //console.log('BIaccountProductId:', BIaccountProductId);
                                        //appendResultRow(`${orgGrp} BIaccountProductId`, BIaccountProductId, resultValuesTableBody3);

                                        await showCSVResults();
                                        //Create usage files
                                        
                                        await createUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId);
                                        await createNonUserUsageFile(billingIdentifier, contractStartDateValue, usageProducts, TCId);
                                    }
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
                await createExcel(accountDetailsArray, contractDetailsArray, contractRateDetailsArray, accountProductDetailsArray, TCId);            } catch (error) {
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