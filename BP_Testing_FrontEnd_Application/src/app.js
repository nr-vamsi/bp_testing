import { fetchProducts } from './fetchProducts.js';
import { createAccount } from './createAccount.js';
import { createBillingProfile } from './createBillingProfile.js';
import { createContract } from './createContract.js';
import { createContractCurrency } from './createContractCurrency.js';
import { createContractRate } from './createContractRate.js';
import { createPricing } from './createPricing.js';
import { createTieredPricing } from './createTieredPricing.js';
import { createAccountProduct } from './createAccountProduct.js';
import { createBillingIdentifier } from './createBillingIdentifier.js';
import { appendResultRow, displayResultContainer } from './handleResults.js';

let productsList = [];
let accountName = '';
let accountId = '';
let bProfileId = '';
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
let randomAddress = '';
let contractName = '';
let sfAccId = '';

fetchProducts().then(data => {
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
//const stateSelect = document.getElementById('state');
const submitButton = document.getElementById('submit');
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

/* async function generateRandomAddress(state) {
    try {
        const response = await fetch(`https://random-data-api.com/api/address/random_address?country_code=us&state=${state}`);
        const data = await response.json();
        const address = data;
        console.log('Generated Address:', address);
        return `${address.street_address}, ${address.city}, ${state}, ${address.zip_code}`;
    } catch (error) {
        console.error('Error generating random address:', error);
        return '';
    }
} */

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
    const selectedProducts = Array.from(productCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    const selectedRegions = Array.from(regionCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    const selectedUserOptions = Array.from(document.querySelectorAll('input[name="user-option"]'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    const selectedComputeOptions = Array.from(document.querySelectorAll('input[name="compute-option"]'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    const selectedBuyingPrograms = Array.from(buyingProgramCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    contractStartDateValue = contractStartDate.value;
    contractEndDateValue = contractEndDate.value;
    const selectedSubscriptionType = subscriptionType.value;

    const currentDateTime = new Date().toISOString();
    accountName = `${selectedSubscriptionType}_${selectedBuyingPrograms.join(', ')}_${selectedProducts.join('+')}_${currentDateTime.replace(/[+_\-:.]/g, '')}`;
    contractName = `Contract_${currentDateTime.replace(/[+_\-:.]/g, '')}`;
    sfAccId = `SF_${currentDateTime.replace(/[+_\-:.]/g, '')}`;
    billingIdentifier = `${selectedProducts.join('+')}_${currentDateTime}`.replace(/[+_\-:.]/g, '');
    console.log('Selected Options:', {
        selectedSubscriptionType,
        selectedBuyingPrograms,
        selectedProducts,
        selectedUserOptions,
        selectedComputeOptions,
        selectedRegions,
        contractStartDateValue,
        contractEndDateValue,
        accountName
    }); // Debugging information

    //const selectedState = stateSelect.value;
    /* if (selectedState) {
        randomAddress = await generateRandomAddress(selectedState);
        console.log('Random Address:', randomAddress);
    } */

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

    function combineArrays(arrays, index, current) {
        if (index === arrays.length) {
            queries.push(current);
            return;
        }
        for (let value of arrays[index]) {
            combineArrays(arrays, index + 1, [...current, value]);
        }
    }

    console.log('Queries:', queries); // Debugging information

    let filteredProducts = [];

    for (let query of queries) {
        console.log('Query Array: ', query); // Debugging information
        let results = sequentialSearch(query, productsList);
        if (query.includes('Data')) {
            results = results.filter(item => !item['Product Name'].includes('Live') && !item['Product Name'].includes('Compute'));
        }
        filteredProducts = [...filteredProducts, ...results];
    }

    filteredProducts = [...new Set(filteredProducts.map(item => item))]; // Remove duplicates

    // Sort and group products by Usage first and then their corresponding Formula products
    const usageProducts = filteredProducts.filter(item => item['Rating Method'] === 'Usage');
    const formulaProducts = filteredProducts.filter(item => item['Rating Method'] === 'Formula');
    const sortedProducts = [...formulaProducts, ...usageProducts];

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
            <td><input type="text" name="price" value="" ${item['Rating Method'] === 'Formula' ? '' : 'disabled'}></td>
            <td>${item['Rating Method'] === 'Usage' ? '' : '<input type="checkbox" name="tier" class="tier-checkbox">'}</td>
            <td class="tiered-details" style="display: none;"></td>
        `;
        resultTableBody.appendChild(row);
    });

    // Add event listeners for tier checkboxes
    document.querySelectorAll('.tier-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
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

                // Check if any other tier checkboxes are still checked
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

    tieredDetailRow.querySelector('.add-tier-row').addEventListener('click', function() {
        addTieredDetailRow(tieredDetailsCell);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const userCheckbox = document.getElementById('user-checkbox');
    const computeCheckbox = document.getElementById('compute-checkbox');
    const submitButton = document.getElementById('submit');
    const startButton = document.getElementById('startButton');
    const generatePlanButton = document.getElementById('generatePlanButton');

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
            console.log('SessionId:', sessionId);
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

            console.log('Selected Products Details:', selectedProductsDetails);

            try {
                displayResultContainer(resultContainer);   // Display the result section
                accountId = await createAccount(sessionId, accountName, sfAccId);
                console.log('AccountId:', accountId);
                appendResultRow('AccountId', accountId, resultValuesTableBody);

                bProfileId = await createBillingProfile(sessionId, accountId, accountName, sfAccId);
                console.log('BillingProfileId:', bProfileId);
                appendResultRow('BillingProfileId', bProfileId, resultValuesTableBody);

                displayResultContainer(resultContainer1);   // Display the result section
                contractId = await createContract(sessionId, accountId, accountName, contractStartDateValue, contractName);
                console.log('ContractId:', contractId);
                appendResultRow('ContractId', contractId, resultValuesTableBody1);

                contractCurrencyId = await createContractCurrency(sessionId, contractId);
                console.log('ContractCurrencyId:', contractCurrencyId);
                appendResultRow('ContractCurrencyId', contractCurrencyId, resultValuesTableBody1);

                displayResultContainer(resultContainer2);   // Display the result section
                displayResultContainer(resultContainer3);   // Display the result section
                for (const product of selectedProductsDetails) {
                    console.log(`ProdID: ${product.ProdID}, ProductName: ${product.ProductName}, Price: ${product.Price}, TieredDetails: ${JSON.stringify(product.TieredDetails)}`);
                    contractRateId = await createContractRate(sessionId, contractId, product, contractStartDateValue);
                    console.log('ContractRateId:', contractRateId);
                    appendResultRow(`ContractRateId (${product.ProdID})`, contractRateId, resultValuesTableBody2);

                    if (product.TieredDetails.length > 0) {
                        pricingId = await createTieredPricing(sessionId, contractId, contractRateId, product.TieredDetails, contractStartDateValue);
                        console.log('PricingId:', pricingId);
                        appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);
                    } else {
                        pricingId = await createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue);
                        console.log('PricingId:', pricingId);
                        appendResultRow(`PricingId (${product.ProdID})`, pricingId, resultValuesTableBody2);
                    }

                    accountProductId = await createAccountProduct(sessionId, accountId, contractId, product, contractStartDateValue);
                    console.log('AccountProductId:', accountProductId);
                    appendResultRow(`AccountProductId (${product.ProdID})`, accountProductId, resultValuesTableBody3);
                }

                BIaccountProductId = await createBillingIdentifier(sessionId, accountId, billingIdentifier, contractStartDateValue);
                console.log('BIaccountProductId:', BIaccountProductId);
                appendResultRow('BIaccountProductId', BIaccountProductId, resultValuesTableBody3);
            } catch (error) {
                console.error('Error during API calls:', error);
            }
        });
    } else {
        console.error('Start button not found');
    }

});

export { handleSubmit };