//Code worked till shared pool

import { fetchProducts } from './fetchProducts.js';
import { createUserUsageFile } from './createUsageFiles.js';
import { createNonUserUsageFile } from './createUsageFiles.js';
import { queryProductsFromContract } from './queryProductsFromContract.js';
import { queryAccIdFromContract } from './queryAccIdFromContract.js';
import { queryChildAccId } from './queryChildAccId.js';
import { queryAccountProducts } from './queryAccountProducts.js';
import { queryPrice } from './queryPrice.js';
import CONFIG from './config.js';

let productsList = [];
let contractStartDateValue = '';
let contractEndDateValue = '';
let userBillingIdentifierValue = '';
let nonUserBillingIdentifierValue = '';
let orgGrpusageProducts = [];
let orgGrpusageProducts1 = []; // First group of org products
let orgGrpusageProducts2 = []; // Second group of org products
let orgGrpBillingIdentifiers = []; // To store the org billing identifiers
let ccIdusageProducts = [];
let ccIdusageProducts1 = []; // First group of products
let ccIdusageProducts2 = []; // Second group of products
let billingIdentifiers = []; // To store the billing identifiers
let contractProdIds = [];
let ccIdcontractProdIds = [];
let orgGrpcontractProdIds = [];
let contractDetails = [];
let bPAccId = '';
let orgGrpAccId = '';
let cCidAccId = '';

// Replace the existing fetchProducts call around line 52 with:
const hostname = CONFIG.HOSTNAME;
let csvFile = '';

if (hostname === 'https://sandbox.billingplatform.com/newrelic_dev') {
    csvFile = 'productList_QA.csv';
} else if (hostname === 'https://sandbox.billingplatform.com/newrelic2_dev') {
    csvFile = 'productList_DEV.csv';
}

// Read CSV file directly in the browser
fetch(`/csv/${csvFile}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(csvText => {
        // Parse CSV text
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');

        productsList = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                productsList.push(row);
            }
        }

        console.log(`CSV file ${csvFile} successfully processed`);
        console.log(`Loaded ${productsList.length} products`);
        console.log('Sample product:', productsList[0]); // Debug: show first product
    })
    .catch(error => {
        console.error('Error fetching or parsing CSV:', error);
        // Fallback: try to fetch from the original endpoint if available
        fetchProducts('/csv/productList_QA.csv').then(data => {
            productsList = data;
        }).catch(fallbackError => {
            console.error('Fallback also failed:', fallbackError);
        });
    });

const resultSection = document.getElementById('result');
const resultTableBody = document.querySelector('#result-table tbody');
const cId = document.getElementById('contract').value;
const sessionId = document.getElementById('session-id').value;

async function handleSubmit() {

const cId = document.getElementById('contract').value;
const sessionId = document.getElementById('session-id').value;

    console.log("ContractId:", cId)

    contractDetails = await queryAccIdFromContract(sessionId, cId);
    console.log("Contract Details:", contractDetails);
    bPAccId = contractDetails[0].AccountId;
    contractStartDateValue = contractDetails[0].StartDate;
    contractEndDateValue = contractDetails[0].EndDate;
    console.log("bPAccId:", bPAccId);
    console.log("Start Date:", contractStartDateValue);
    console.log("End Date:", contractEndDateValue);  

    cCidAccId = (await queryChildAccId(sessionId, bPAccId))[0].Id;
    console.log("cCidAccId:", cCidAccId);
    ccIdusageProducts = await queryAccountProducts(sessionId, cCidAccId);
    console.log("ccIdusageProducts:", ccIdusageProducts);

    // Slice ccIdusageProducts into two arrays based on BillingIdentifier positions
    if (ccIdusageProducts && ccIdusageProducts.length > 0) {
        // Find all BillingIdentifier positions
        const billingIdentifierIndices = [];
        billingIdentifiers = [];
        
        ccIdusageProducts.forEach((item, index) => {
            if (item.Name === 'BillingIdentifier' && item.nrBillingIdentifier) {
                billingIdentifierIndices.push(index);
                billingIdentifiers.push({
                    index: index,
                    id: item.Id,
                    billingIdentifier: item.nrBillingIdentifier
                });
            }
        });
        
        console.log('Found BillingIdentifier positions:', billingIdentifierIndices);
        console.log('BillingIdentifiers:', billingIdentifiers);
        
        if (billingIdentifierIndices.length >= 2) {
            // Split into two arrays based on BillingIdentifier positions
            const firstBillingIdentifierIndex = billingIdentifierIndices[0];
            const secondBillingIdentifierIndex = billingIdentifierIndices[1];
            
            // First group: from start to first BillingIdentifier (inclusive) to second BillingIdentifier (exclusive)
            ccIdusageProducts1 = ccIdusageProducts.slice(firstBillingIdentifierIndex, secondBillingIdentifierIndex);
            
            // Second group: from second BillingIdentifier to end
            ccIdusageProducts2 = ccIdusageProducts.slice(secondBillingIdentifierIndex);
            
            console.log('ccIdusageProducts1 (First Group):', ccIdusageProducts1);
            console.log('ccIdusageProducts2 (Second Group):', ccIdusageProducts2);
            
            // Extract billing identifiers for each group
            const billingIdentifier1 = ccIdusageProducts1.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
            const billingIdentifier2 = ccIdusageProducts2.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
            
            console.log('Billing Identifier 1:', billingIdentifier1);
            console.log('Billing Identifier 2:', billingIdentifier2);
            
            // Store billing identifiers for later use
            userBillingIdentifierValue = billingIdentifier1;
            
        } else if (billingIdentifierIndices.length === 1) {
            // Only one BillingIdentifier found, put everything in first array
            ccIdusageProducts1 = ccIdusageProducts.slice();
            ccIdusageProducts2 = [];
            console.log('Only one BillingIdentifier found, all products in first group');
            console.log('ccIdusageProducts1:', ccIdusageProducts1);
        } else {
            // No BillingIdentifier found, put everything in first array
            ccIdusageProducts1 = ccIdusageProducts.slice();
            ccIdusageProducts2 = [];
            console.log('No BillingIdentifier found, all products in first group');
            console.log('ccIdusageProducts1:', ccIdusageProducts1);
        }
    }

    orgGrpAccId = (await queryChildAccId(sessionId, cCidAccId))[0].Id;
    console.log("orgGrpAccId:", orgGrpAccId);
    orgGrpusageProducts = await queryAccountProducts(sessionId, orgGrpAccId);
    console.log("orgGrpusageProducts:", orgGrpusageProducts);

    // Slice orgGrpusageProducts into two arrays based on BillingIdentifier positions
    if (orgGrpusageProducts && orgGrpusageProducts.length > 0) {
        // Find all BillingIdentifier positions in orgGrpusageProducts
        const orgGrpBillingIdentifierIndices = [];
        orgGrpBillingIdentifiers = [];
        
        orgGrpusageProducts.forEach((item, index) => {
            if (item.Name === 'BillingIdentifier' && item.nrBillingIdentifier) {
                orgGrpBillingIdentifierIndices.push(index);
                orgGrpBillingIdentifiers.push({
                    index: index,
                    id: item.Id,
                    billingIdentifier: item.nrBillingIdentifier
                });
            }
        });
        
        console.log('Found OrgGrp BillingIdentifier positions:', orgGrpBillingIdentifierIndices);
        console.log('OrgGrp BillingIdentifiers:', orgGrpBillingIdentifiers);
        
        if (orgGrpBillingIdentifierIndices.length >= 2) {
            // Split into two arrays based on BillingIdentifier positions
            const firstOrgGrpBillingIdentifierIndex = orgGrpBillingIdentifierIndices[0];
            const secondOrgGrpBillingIdentifierIndex = orgGrpBillingIdentifierIndices[1];
            
            // First group: from start to first BillingIdentifier (inclusive) to second BillingIdentifier (exclusive)
            orgGrpusageProducts1 = orgGrpusageProducts.slice(firstOrgGrpBillingIdentifierIndex, secondOrgGrpBillingIdentifierIndex);
            
            // Second group: from second BillingIdentifier to end
            orgGrpusageProducts2 = orgGrpusageProducts.slice(secondOrgGrpBillingIdentifierIndex);
            
            console.log('orgGrpusageProducts1 (First Group):', orgGrpusageProducts1);
            console.log('orgGrpusageProducts2 (Second Group):', orgGrpusageProducts2);
            
            // Extract billing identifiers for each group
            const orgGrpBillingIdentifier1 = orgGrpusageProducts1.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
            const orgGrpBillingIdentifier2 = orgGrpusageProducts2.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
            
            console.log('OrgGrp Billing Identifier 1:', orgGrpBillingIdentifier1);
            console.log('OrgGrp Billing Identifier 2:', orgGrpBillingIdentifier2);
            
            // Store billing identifiers for later use
            nonUserBillingIdentifierValue = orgGrpBillingIdentifier1;
            
        } else if (orgGrpBillingIdentifierIndices.length === 1) {
            // Only one BillingIdentifier found, put everything in first array
            orgGrpusageProducts1 = orgGrpusageProducts.slice();
            orgGrpusageProducts2 = [];
            console.log('Only one OrgGrp BillingIdentifier found, all products in first group');
            console.log('orgGrpusageProducts1:', orgGrpusageProducts1);
            
            // Extract billing identifier
            const orgGrpBillingIdentifier1 = orgGrpusageProducts1.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
            nonUserBillingIdentifierValue = orgGrpBillingIdentifier1;
            
        } else {
            // No BillingIdentifier found, put everything in first array
            orgGrpusageProducts1 = orgGrpusageProducts.slice();
            orgGrpusageProducts2 = [];
            console.log('No OrgGrp BillingIdentifier found, all products in first group');
            console.log('orgGrpusageProducts1:', orgGrpusageProducts1);
        }
    }

    // NEW: Display results on UI after processing
    displayResultsOnUI();
}

// NEW FUNCTION: Display results on UI with separate sections for each BillingIdentifier group
function displayResultsOnUI() {
    // Clear previous results
    if (resultTableBody) {
        resultTableBody.innerHTML = '';
    }
    
    // Create or get the results container
    let resultsContainer = document.getElementById('billing-results-container');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'billing-results-container';
        resultsContainer.innerHTML = `
            <h2>Billing Identifier Groups</h2>
            <div id="billing-groups"></div>
            <div style="margin-top: 20px;">
                <button id="create-usage-files-btn" class="btn btn-primary">Create Usage Files</button>
            </div>
        `;
        
        // Insert after the existing result section or at the end of the body
        const existingResultSection = document.getElementById('result');
        if (existingResultSection) {
            existingResultSection.parentNode.insertBefore(resultsContainer, existingResultSection.nextSibling);
        } else {
            document.body.appendChild(resultsContainer);
        }
    }
    
    const billingGroupsContainer = document.getElementById('billing-groups');
    billingGroupsContainer.innerHTML = '';
    
    // Display CCID Groups (User Products)
    if (ccIdusageProducts1.length > 0) {
        const billingIdentifier1 = ccIdusageProducts1.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
        const usageProducts1 = ccIdusageProducts1.filter(item => item.Name !== 'BillingIdentifier');
        createBillingIdentifierSection(billingGroupsContainer, 'CCID Group 1', billingIdentifier1, usageProducts1, 'ccid-group-1', 'User Products');
    }
    
    if (ccIdusageProducts2.length > 0) {
        const billingIdentifier2 = ccIdusageProducts2.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
        const usageProducts2 = ccIdusageProducts2.filter(item => item.Name !== 'BillingIdentifier');
        createBillingIdentifierSection(billingGroupsContainer, 'CCID Group 2', billingIdentifier2, usageProducts2, 'ccid-group-2', 'User Products');
    }
    
    // Display OrgGrp Groups (Non-User Products)
    if (orgGrpusageProducts1.length > 0) {
        const orgGrpBillingIdentifier1 = orgGrpusageProducts1.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
        const orgGrpUsageProducts1 = orgGrpusageProducts1.filter(item => item.Name !== 'BillingIdentifier');
        createBillingIdentifierSection(billingGroupsContainer, 'OrgGrp Group 1', orgGrpBillingIdentifier1, orgGrpUsageProducts1, 'orggrp-group-1', 'Non-User Products');
    }
    
    if (orgGrpusageProducts2.length > 0) {
        const orgGrpBillingIdentifier2 = orgGrpusageProducts2.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
        const orgGrpUsageProducts2 = orgGrpusageProducts2.filter(item => item.Name !== 'BillingIdentifier');
        createBillingIdentifierSection(billingGroupsContainer, 'OrgGrp Group 2', orgGrpBillingIdentifier2, orgGrpUsageProducts2, 'orggrp-group-2', 'Non-User Products');
    }
    
    // Show the results container
    resultsContainer.style.display = 'block';
    
    // Add event listener for Create Usage Files button
    const createUsageFilesBtn = document.getElementById('create-usage-files-btn');
    if (createUsageFilesBtn) {
        createUsageFilesBtn.addEventListener('click', handleCreateUsageFiles);
    }
}

// NEW FUNCTION: Create a section for each BillingIdentifier group
function createBillingIdentifierSection(container, groupTitle, billingIdentifier, products, groupId, productType) {
    const section = document.createElement('div');
    section.className = 'billing-group-section';
    section.style.cssText = `
        border: 1px solid #ddd;
        margin: 10px 0;
        padding: 15px;
        border-radius: 5px;
        background-color: #f9f9f9;
    `;
    
    section.innerHTML = `
        <div class="billing-group-header" style="margin-bottom: 10px;">
            <label style="font-weight: bold; font-size: 16px;">
                <input type="checkbox" id="${groupId}-checkbox" name="billing-group" value="${groupId}" style="margin-right: 10px;">
                ${groupTitle} (${productType})
            </label>
            <div style="margin-left: 30px; color: #666; font-size: 14px;">
                <strong>Billing Identifier:</strong> ${billingIdentifier || 'Not Available'}
            </div>
            <div style="margin-left: 30px; color: #666; font-size: 14px;">
                <strong>Products Count:</strong> ${products.length}
            </div>
        </div>
        <div class="products-list" id="${groupId}-products" style="margin-left: 30px;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product ID</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
                        <!--th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Billing Identifier</th-->
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${product.Id || 'N/A'}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${product.Name || 'N/A'}</td>
                            <!--td style="border: 1px solid #ddd; padding: 8px;">${product.nrBillingIdentifier || 'N/A'}</td-->
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.appendChild(section);
}

// NEW FUNCTION: Append "Usage Quantity" to product names
function appendUsageQuantityToProducts(products) {
    return products.map(product => {
        // Create a copy of the product to avoid modifying original data
        const updatedProduct = { ...product };
        
        // Check if the product name already contains "Usage Quantity"
        if (updatedProduct.Name && !updatedProduct.Name.includes('Usage Quantity')) {
            updatedProduct.Name = `${updatedProduct.Name} Usage Quantity`;
        }
        
        return updatedProduct;
    });
}

// NEW FUNCTION: Generate date ranges for 10 months from contract start date
// NEW FUNCTION: Generate date ranges for 10 months from contract start date
function generateMonthlyDateRanges(contractStartDate, numberOfMonths = 12) {
    const dateRanges = [];
    
    // Parse the contract start date properly
    const startDate = new Date(contractStartDate + 'T00:00:00'); // Add time to avoid timezone issues
    console.log('Contract start date:', startDate);
    
    // Start from the actual contract start month, not from the 1st of that month
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    
    for (let i = 0; i < numberOfMonths; i++) {
        // Calculate the target year and month for this iteration
        const targetYear = startYear + Math.floor((startMonth + i) / 12);
        const targetMonth = (startMonth + i) % 12;
        
        // Create dates using UTC to avoid timezone issues
        const monthStartDate = new Date(Date.UTC(targetYear, targetMonth, 1));
        const monthEndDate = new Date(Date.UTC(targetYear, targetMonth + 1, 0)); // Last day of the target month
        
        dateRanges.push({
            startDate: monthStartDate.toISOString().split('T')[0],
            endDate: monthEndDate.toISOString().split('T')[0],
            monthYear: `${monthStartDate.toLocaleString('default', { month: 'long' })}_${monthStartDate.getFullYear()}`,
            monthNumber: i + 1
        });
    }
    
    console.log('Generated monthly date ranges:', dateRanges);
    return dateRanges;
}

// NEW FUNCTION: Create usage files for multiple months with delays
async function createMonthlyUsageFiles(billingIdentifier, contractStartDate, products, groupName, contractId, isUserProducts = true) {
    const monthlyRanges = generateMonthlyDateRanges(contractStartDate, 12);
    const folderName = isUserProducts ? 'users' : 'nonusers';
    
    console.log(`Creating ${monthlyRanges.length} monthly usage files for ${groupName} in ${folderName} folder`);
    
    for (const monthRange of monthlyRanges) {
        const fileName = `${groupName}_${monthRange.monthYear}`;
        
        console.log(`Creating usage file for ${monthRange.monthYear}:`, {
            fileName: fileName,
            dateRange: `${monthRange.startDate} to ${monthRange.endDate}`,
            billingIdentifier: billingIdentifier,
            productsCount: products.length
        });
        
        try {
            if (isUserProducts) {
                await createUserUsageFile(
                    billingIdentifier, 
                    monthRange.startDate, 
                    products, 
                    fileName, 
                    folderName,
                    contractId,
                    monthRange.endDate
                );
            } else {
                await createNonUserUsageFile(
                    billingIdentifier, 
                    monthRange.startDate, 
                    products, 
                    fileName, 
                    folderName,
                    contractId,
                    monthRange.endDate
                );
            }
            
            console.log(`✓ Created ${fileName} for ${monthRange.monthYear}`);
            
            // Add a 1-second delay between each file creation to prevent browser download issues
            console.log(`Waiting 1 second before creating next file...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`Error creating usage file for ${monthRange.monthYear}:`, error);
        }
    }
    
    console.log(`✓ Completed all ${monthlyRanges.length} files for ${groupName}`);
}

// UPDATED FUNCTION: Handle Create Usage Files button click with monthly generation
async function handleCreateUsageFiles() {
    const selectedGroups = Array.from(document.querySelectorAll('input[name="billing-group"]:checked'));
    
    if (selectedGroups.length === 0) {
        alert('Please select at least one billing identifier group to create usage files.');
        return;
    }
    
    // Get contract ID from the input field
    const contractId = document.getElementById('contract').value;
    
    if (!contractId) {
        alert('Contract ID is required to create usage files.');
        return;
    }
    
    // Disable the button to prevent multiple clicks
    const createUsageFilesBtn = document.getElementById('create-usage-files-btn');
    if (createUsageFilesBtn) {
        createUsageFilesBtn.disabled = true;
        createUsageFilesBtn.textContent = 'Creating Files... Please Wait';
    }
    
    try {
        let totalFilesCreated = 0;
        
        for (const checkbox of selectedGroups) {
            const groupId = checkbox.value;
            console.log(`Creating monthly usage files for group: ${groupId}`);
            
            if (groupId === 'ccid-group-1' && ccIdusageProducts1.length > 0) {
                const billingIdentifier1 = ccIdusageProducts1.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
                const usageProducts1 = ccIdusageProducts1.filter(item => item.Name !== 'BillingIdentifier');
                
                console.log('CCID Group 1 - billingIdentifier:', billingIdentifier1);
                console.log('CCID Group 1 - products count:', usageProducts1.length);
                console.log('CCID Group 1 - sample products:', usageProducts1.slice(0, 3));
                
                if (billingIdentifier1 && usageProducts1.length > 0) {
                    const updatedUsageProducts1 = appendUsageQuantityToProducts(usageProducts1);
                    console.log('Creating 12 monthly files for CCID Group 1');
                    console.log('CCID Group 1 - updated products sample:', updatedUsageProducts1.slice(0, 3));
                    
                    await createMonthlyUsageFiles(
                        billingIdentifier1, 
                        contractStartDateValue, 
                        updatedUsageProducts1, 
                        'CCID_Group1', 
                        contractId,
                        true // isUserProducts
                    );
                    
                    totalFilesCreated += 12;
                    console.log('✓ Created 12 monthly usage files for CCID Group 1');
                    
                    // Add delay between groups
                    console.log('Waiting 2 seconds before next group...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            if (groupId === 'ccid-group-2' && ccIdusageProducts2.length > 0) {
                const billingIdentifier2 = ccIdusageProducts2.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
                const usageProducts2 = ccIdusageProducts2.filter(item => item.Name !== 'BillingIdentifier');
                
                console.log('CCID Group 2 - billingIdentifier:', billingIdentifier2);
                console.log('CCID Group 2 - products count:', usageProducts2.length);
                
                if (billingIdentifier2 && usageProducts2.length > 0) {
                    const updatedUsageProducts2 = appendUsageQuantityToProducts(usageProducts2);
                    console.log('Creating 12 monthly files for CCID Group 2');
                    
                    await createMonthlyUsageFiles(
                        billingIdentifier2, 
                        contractStartDateValue, 
                        updatedUsageProducts2, 
                        'CCID_Group2', 
                        contractId,
                        true // isUserProducts
                    );
                    
                    totalFilesCreated += 12;
                    console.log('✓ Created 12 monthly usage files for CCID Group 2');
                    
                    // Add delay between groups
                    console.log('Waiting 2 seconds before next group...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            if (groupId === 'orggrp-group-1' && orgGrpusageProducts1.length > 0) {
                const orgGrpBillingIdentifier1 = orgGrpusageProducts1.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
                const orgGrpUsageProducts1 = orgGrpusageProducts1.filter(item => item.Name !== 'BillingIdentifier');
                
                console.log('=== OrgGrp Group 1 DEBUG ===');
                console.log('OrgGrp Group 1 - billingIdentifier:', orgGrpBillingIdentifier1);
                console.log('OrgGrp Group 1 - products count:', orgGrpUsageProducts1.length);
                console.log('OrgGrp Group 1 - all products:', orgGrpUsageProducts1);
                console.log('OrgGrp Group 1 - sample products:', orgGrpUsageProducts1.slice(0, 3));
                
                if (orgGrpBillingIdentifier1 && orgGrpUsageProducts1.length > 0) {
                    const updatedOrgGrpUsageProducts1 = appendUsageQuantityToProducts(orgGrpUsageProducts1);
                    console.log('Creating 12 monthly files for OrgGrp Group 1');
                    console.log('OrgGrp Group 1 - updated products sample:', updatedOrgGrpUsageProducts1.slice(0, 3));
                    console.log('OrgGrp Group 1 - isUserProducts: false (NON-USER FILES)');
                    
                    await createMonthlyUsageFiles(
                        orgGrpBillingIdentifier1, 
                        contractStartDateValue, 
                        updatedOrgGrpUsageProducts1, 
                        'OrgGrp_Group1', 
                        contractId,
                        false // isUserProducts (NON-USERS)
                    );
                    
                    totalFilesCreated += 12;
                    console.log('✓ Created 12 monthly NON-USER usage files for OrgGrp Group 1');
                    
                    // Add delay between groups
                    console.log('Waiting 2 seconds before next group...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.error('OrgGrp Group 1 - Failed to create files. Billing ID or products missing.');
                }
            }
            
            if (groupId === 'orggrp-group-2' && orgGrpusageProducts2.length > 0) {
                const orgGrpBillingIdentifier2 = orgGrpusageProducts2.find(item => item.Name === 'BillingIdentifier')?.nrBillingIdentifier;
                const orgGrpUsageProducts2 = orgGrpusageProducts2.filter(item => item.Name !== 'BillingIdentifier');
                
                console.log('=== OrgGrp Group 2 DEBUG ===');
                console.log('OrgGrp Group 2 - billingIdentifier:', orgGrpBillingIdentifier2);
                console.log('OrgGrp Group 2 - products count:', orgGrpUsageProducts2.length);
                console.log('OrgGrp Group 2 - sample products:', orgGrpUsageProducts2.slice(0, 3));
                
                if (orgGrpBillingIdentifier2 && orgGrpUsageProducts2.length > 0) {
                    const updatedOrgGrpUsageProducts2 = appendUsageQuantityToProducts(orgGrpUsageProducts2);
                    console.log('Creating 12 monthly files for OrgGrp Group 2');
                    console.log('OrgGrp Group 2 - isUserProducts: false (NON-USER FILES)');
                    
                    await createMonthlyUsageFiles(
                        orgGrpBillingIdentifier2, 
                        contractStartDateValue, 
                        updatedOrgGrpUsageProducts2, 
                        'OrgGrp_Group2', 
                        contractId,
                        false // isUserProducts (NON-USERS)
                    );

                    totalFilesCreated += 12;
                    console.log('✓ Created 12 monthly NON-USER usage files for OrgGrp Group 2');
                } else {
                    console.error('OrgGrp Group 2 - Failed to create files. Billing ID or products missing.');
                }
            }
        }
        
        alert(`Successfully created ${totalFilesCreated} usage files for ${selectedGroups.length} selected group(s)!\n\nFiles are organized in separate folders:\n- users_${contractId}/\n- nonusers_${contractId}/\n\nEach file covers one month with naming format: GroupName_MonthName_Year.csv\n\nPlease check your Downloads folder.`);
        
    } catch (error) {
        console.error('Error creating usage files:', error);
        alert('Error creating usage files. Please check the console for details.');
    } finally {
        // Re-enable the button
        if (createUsageFilesBtn) {
            createUsageFilesBtn.disabled = false;
            createUsageFilesBtn.textContent = 'Create Usage Files';
        }
    }
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

// Update the event listeners
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit');
    const startButton = document.getElementById('startButton');
    if (submitButton) {
        submitButton.addEventListener('click', handleSubmit);
    } else {
        console.error('Submit button not found');
    }

    // Keep the original startButton functionality but make it optional
    if (startButton) {
        startButton.addEventListener('click', async () => {
            // This will now be handled by the new Create Usage Files button
            console.log('Start button clicked - usage file creation is now handled by the UI selections');
        });
    }
});

export { handleSubmit };