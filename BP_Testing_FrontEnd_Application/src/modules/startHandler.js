/**
 * Handler for the "Create" button.
 * Orchestrates account creation, contract/rate/pricing setup,
 * account product assignment, and Excel export.
 */
import { state } from './state.js';
import { extractRowProductDetails, fetchBillingIdentifier, filterCCIdProducts, filterCCIdUsageProducts, showCSVResults } from './helpers.js';
import { generateAccountHierarchy, generateCCIDArray, generateOrgGrpArray } from './hierarchyUtils.js';
import { validateFieldValues } from './formHandlers.js';
import {
    processBillingPortfolio,
    createAccountProductWithTierValues,
    createAccountProductWithBillingTerms
} from './contractProcessing.js';

import { createAccounts } from '../api/createAccounts.js';
import { createContract, createContract1 } from '../api/createContract.js';
import { createContractRate } from '../api/createContractRate.js';
import { createPricing } from '../api/createPricing.js';
import { createTieredPricing } from '../api/createTieredPricing.js';
import { createAccountProduct } from '../api/createAccountProduct.js';
import { queryProductsFromContract } from '../api/queryProductsFromContract.js';
import { queryPrice } from '../api/queryPrice.js';
import { updatePricing } from '../api/updatePricing.js';
import { createUserUsageFile, createNonUserUsageFile } from '../api/createUsageFiles.js';
import { appendResultRow, displayResultContainer } from '../handleResults.js';
import { createExcel } from '../createExcel.js';

export async function startButtonHandler() {
    if (!validateFieldValues()) return;

    const sessionId        = document.getElementById('session-id').value;
    const accountStructure = document.querySelector('input[name="account-structure"]:checked').value;

    // ── Collect selected products from the result table ──────────────────────
    state.selectedProductsDetails = Array.from(document.querySelectorAll('input[name="select-product"]:checked'))
        .map(cb => extractRowProductDetails(cb.closest('tr')));

    let selectedProductsDetailsByBillingProfile = {};
    if (accountStructure === 'multi-ccid-separate-pool') {
        for (const billingProfile of ['BillingPortfolioA', 'BillingPortfolioB']) {
            selectedProductsDetailsByBillingProfile[billingProfile] = Array.from(
                document.querySelectorAll('input[name="select-product"]:checked')
            ).filter(cb => {
                const sel = cb.closest('tr').querySelector('select[name="billingProfile"]');
                return sel && (sel.value === billingProfile || sel.value === 'All');
            }).map(cb => extractRowProductDetails(cb.closest('tr')));
        }
        console.log('Selected Products Details by BillingProfile:', selectedProductsDetailsByBillingProfile);
    }

    const selectedProductsDetailsByCCID = {};
    for (const ccid of state.ccidArray) {
        if (ccid === 'All') continue;
        selectedProductsDetailsByCCID[ccid] = Array.from(
            document.querySelectorAll('input[name="select-product"]:checked')
        ).filter(cb => {
            const sel = cb.closest('tr').querySelector('select[name="ccid"]');
            return sel && (sel.value === ccid || sel.value === 'All');
        }).map(cb => extractRowProductDetails(cb.closest('tr')));
    }

    const selectedProductsDetailsByOrgGrp = {};
    for (const orgGrp of state.orgGrpArray) {
        selectedProductsDetailsByOrgGrp[orgGrp] = Array.from(
            document.querySelectorAll('input[name="select-product"]:checked')
        ).filter(cb => {
            const orgGrpCb = cb.closest('tr').querySelector(`input[name="orgGrp"][value="${orgGrp}"]`);
            return orgGrpCb && orgGrpCb.checked;
        }).map(cb => extractRowProductDetails(cb.closest('tr')));
    }
    console.log('Selected Products Details by CCID:', selectedProductsDetailsByCCID);
    console.log('Selected Products Details by OrgGrp:', selectedProductsDetailsByOrgGrp);

    // DOM result containers (queried once)
    const resultContainer      = document.getElementById('result-container');
    const resultValuesTableBody  = document.querySelector('#result-values-table tbody');
    const resultContainer1     = document.getElementById('result-container1');
    const resultValuesTableBody1 = document.querySelector('#result-values-table1 tbody');
    const resultContainer2     = document.getElementById('result-container2');
    const resultValuesTableBody2 = document.querySelector('#result-values-table2 tbody');
    const resultContainer3     = document.getElementById('result-container3');
    const resultValuesTableBody3 = document.querySelector('#result-values-table3 tbody');
    const resultContainer4     = document.getElementById('result-container4');
    const resultValuesTableBody4 = document.querySelector('#result-values-table4 tbody');

    try {
        // ── Build account hierarchy ───────────────────────────────────────────
        let accountHierarchy = [];
        if (accountStructure === 'single-ccid') {
            accountHierarchy         = generateAccountHierarchy(accountStructure);
            state.ccidArray          = ['CCID'];
            state.orgGrpArray        = ['OrgGrp'];
        } else if (accountStructure === 'multi-ccid-shared-pool') {
            accountHierarchy         = generateAccountHierarchy(accountStructure, state.ccidCount, state.orgGrpPerCcid);
            state.ccidArray          = generateCCIDArray(state.ccidCount);
            state.orgGrpArray        = generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid);
        } else if (accountStructure === 'multi-ccid-separate-pool') {
            accountHierarchy         = generateAccountHierarchy(accountStructure, state.ccidCount, state.orgGrpPerCcid);
            state.ccidArray          = ['All', ...generateCCIDArray(state.ccidCount).map(c => c + 'A'), ...generateCCIDArray(state.ccidCount).map(c => c + 'B')];
            state.orgGrpArray        = [
                ...generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'A'),
                ...generateOrgGrpArray(state.ccidCount, state.orgGrpPerCcid).map(g => g + 'B')
            ];
        }

        const isRipReplace =
            document.querySelector('input[name="contract-type"]:checked')?.value === 'amendment' &&
            document.getElementById('type-of-amendment')?.value === 'Rip & Replace';

        let accountIds;
        if (isRipReplace) {
            console.log('Rip & Replace: bypassing createAccounts, using existing accounts');
            accountIds = state.ripReplaceAccountIds;
            state.contractName = `Contract_${new Date().toISOString().replace(/[^0-9]/g, '')}`;
            displayResultContainer(resultContainer);
        } else {
            displayResultContainer(resultContainer);
            accountIds = await createAccounts(sessionId, state.accountName, state.sfAccId, accountHierarchy);
            console.log('AccountIds:', accountIds);
        }
        

        // ── Re-sync computed/editable fields from DOM before use ─────────────
        // These may have been updated after Generate Plan (e.g. VOLUME auto-calc or manual edits).
        state.savingsPlanData.totalContractValue        = document.getElementById('total-contract-value').value;
        state.savingsPlanData.initialCommitment         = document.getElementById('initial-commitment').value;
        state.savingsPlanData.initialPrepaidCommitment  = document.getElementById('initial-prepaid-commitment').value;
        state.savingsPlanData.initialFlexiPrepaidCommitment = document.getElementById('initial-flexi-prepaid-commitment').value;
        state.savingsPlanData.initialFlexiCredit        = document.getElementById('initial-flexi-credit').value;

        // ── Append commitment products to selectedProductsDetails ─────────────
        const { savingsPlanData, selectedBuyingProgram, csvFile } = state;

        if (savingsPlanData.initialPrepaidCommitment !== '') {
            const commitmentPrice = savingsPlanData.initialFlexiPrepaidCommitment || savingsPlanData.initialCommitment;
            console.log('*****Selected Buying Program*****:', selectedBuyingProgram);

            if (selectedBuyingProgram === 'SAVINGS') {
                state.selectedProductsDetails.push({ ProdID: '14176', ProductName: 'New Relic Savings Plan - Commitment Fee', Price: commitmentPrice, Tier: false, TieredDetails: [] });
            }
            if (selectedBuyingProgram === 'VOLUME') {
                state.selectedProductsDetails.push({ ProdID: csvFile === 'productList_DEV.csv' ? '14704' : '14825', ProductName: 'New Relic Volume Plan - Commitment Fee', Price: commitmentPrice, Tier: false, TieredDetails: [] });
            }
            if (selectedBuyingProgram === 'APOF') {
                state.selectedProductsDetails.push({ ProdID: csvFile === 'productList_DEV.csv' ? '14635' : '15034', ProductName: 'New Relic APoF - Commitment Fee', Price: commitmentPrice, Tier: false, TieredDetails: [] });
            }
        }

        if (savingsPlanData.initialCommitmentCredit !== '' && savingsPlanData.billingTerms !== 'Monthly In Arrears (No Pre Pay)') {
            const commitmentCreditPrice = savingsPlanData.initialFlexiCredit || savingsPlanData.initialCommitmentCredit;
            if (selectedBuyingProgram === 'SAVINGS') {
                state.selectedProductsDetails.push({ ProdID: '14120', ProductName: 'New Relic Savings Plan - Commitment Credits', Price: commitmentCreditPrice, Tier: false, TieredDetails: [] });
            }
        }

        console.log('Savings Plan Data:', savingsPlanData);

        // ── Process each account in the hierarchy ─────────────────────────────
        for (const account of accountIds) {
            appendResultRow(account.level, account.accId, resultValuesTableBody);

            // ── SINGLE CCID ───────────────────────────────────────────────────
            if (accountStructure === 'single-ccid') {
                if (account.level === 'BillingPortfolio') {
                    state.ccidCount = 1;
                    displayResultContainer(resultContainer1);
                    displayResultContainer(resultContainer2);
                    displayResultContainer(resultContainer4);
                    displayResultContainer(resultContainer3);

                    state.contractId = await createContract(
                        sessionId, account.accId, state.accountName,
                        state.contractStartDateValue, state.contractEndDateValue,
                        state.contractName, 'Commitment', savingsPlanData, state.ccidCount
                    );
                    appendResultRow('ContractId', state.contractId, resultValuesTableBody1);

                    for (const product of state.selectedProductsDetails) {
                        state.contractRateId = await createContractRate(sessionId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                        appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4);
                        appendResultRow(`ContractRateId (${product.ProdID})`, state.contractRateId, resultValuesTableBody2);

                        if (product.TieredDetails.length > 0) {
                            state.pricingId = await createTieredPricing(sessionId, state.contractId, state.contractRateId, product.TieredDetails, state.contractStartDateValue, state.contractEndDateValue);
                        } else {
                            state.pricingId = await createPricing(sessionId, state.contractId, state.contractRateId, product, state.contractStartDateValue, state.contractEndDateValue);
                            if (state.pricingId.createResponse[0].ErrorCode !== '0' && product.ProductName === 'New Relic Savings Plan - Commitment Credits') {
                                state.pricingId = await queryPrice(sessionId, state.contractRateId);
                                if (state.pricingId?.length > 0)
                                    state.pricingId = await updatePricing(sessionId, state.pricingId, product);
                            }
                        }
                    }

                    state.contractProdIds = await queryProductsFromContract(sessionId, state.contractId);
                    state.contractAccProd = state.contractProdIds.filter(item =>
                        item['ContractRateLabel'].includes('Prepaid Commitment') ||
                        item['ContractRateLabel'].includes('New Relic Savings Plan - Commitment Credits') ||
                        item['ContractRateLabel'].includes('Discount') ||
                        item['ContractRateLabel'].includes('Commitment Fee')
                    );
console.log("Current values in state", state);
                    for (const product of state.contractAccProd) {
                        const productName = product.ContractRateLabel ?? product.ProductName;
                        const needsBillingTerms = [
                            'New Relic Savings Plan - Commitment Fee',
                            'New Relic Volume Plan - Commitment Fee',
                            'APoF - Commitment Fee',
                            'New Relic Volume Plan - Discount',
                            'New Relic Volume Plan - One-Time Discount'
                        ].includes(productName);

                        

                        if (needsBillingTerms && savingsPlanData.initialFlexiPrepaidCommitment) {
                            await createAccountProductWithBillingTerms(sessionId, account.accId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue, savingsPlanData.billingTerms);
                        } else {
                            await createAccountProduct(sessionId, account.accId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                        }
                    }

                    // Tiered products
                    for (const product of state.selectedProductsDetails.filter(p => p.Tier && p.TieredDetails.length > 0)) {
                        const firstTier              = product.TieredDetails[0];
                        const firstTierQuantity      = parseFloat(firstTier.upperBand) || 0;
                        const firstTierPrice         = parseFloat(firstTier.price) || 0;
                        const nrMonthlyMinCommitment = Math.round(firstTierQuantity * firstTierPrice * 100) / 100;
                        const contractProduct = state.contractProdIds.find(item =>
                            item.ContractRateLabel === product.ProductName || item.ProductName === product.ProductName
                        );
                        if (contractProduct) {
                            await createAccountProductWithTierValues(sessionId, account.accId, state.contractId, contractProduct, state.contractStartDateValue, state.contractEndDateValue, firstTierQuantity, nrMonthlyMinCommitment);
                        }
                    }
                }

                if (account.level === 'CCID') {
                    state.ccIdusageProducts = filterCCIdUsageProducts(state.contractProdIds);
                    const ccIdcontractProdIds = filterCCIdProducts(state.contractProdIds);
                    console.log('CCId ContractProdIds:', ccIdcontractProdIds);
                    for (const product of ccIdcontractProdIds) {
                        state.accountProductId = await createAccountProduct(sessionId, account.accId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                        appendResultRow(`CCID AccountProductId (${product.Id})`, state.accountProductId, resultValuesTableBody3);
                    }
                    const billingIdentifier = await fetchBillingIdentifier(sessionId, account.accId);
                    await showCSVResults();
                    await createUserUsageFile(billingIdentifier, state.contractStartDateValue, state.ccIdusageProducts, state.TCId, account.level);
                }

                if (account.level === 'OrgGrp') {
                    state.orgGrpusageProducts = state.contractProdIds.filter(item =>
                        item['ContractRateLabel'].includes('Usage Quantity') && !item['ContractRateLabel'].includes('Users')
                    );
                    const orgGrpcontractProdIds = state.contractProdIds.filter(item => {
                        const label = item['ContractRateLabel'];
                        return !label.includes('Usage Quantity') && !label.includes('Commitment') &&
                               !label.includes('Credit') && !label.includes('Drawdown') &&
                               !label.includes('Discount') && !label.includes('New Relic Reseller Fee') &&
                               !label.includes('Users') && !label.includes('SP 1.0') &&
                               !label.includes('Forfeiture Funds');
                    });
                    console.log('OrgGrp ContractProdIds:', orgGrpcontractProdIds);
                    for (const product of orgGrpcontractProdIds) {
                        state.accountProductId = await createAccountProduct(sessionId, account.accId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                        appendResultRow(`OrgGrp AccountProductId (${product.Id})`, state.accountProductId, resultValuesTableBody3);
                    }
                    const billingIdentifier = await fetchBillingIdentifier(sessionId, account.accId);
                    await showCSVResults();
                    await createNonUserUsageFile(billingIdentifier, state.contractStartDateValue, state.orgGrpusageProducts, state.TCId, account.level);
                }
            }

            // ── MULTI CCID SHARED POOL ────────────────────────────────────────
            if (accountStructure === 'multi-ccid-shared-pool') {
                state.ccidCount = 2;

                if (account.level === 'BillingPortfolio') {
                    state.contractId = await processBillingPortfolio(
                        sessionId, account, state.accountName, state.contractStartDateValue, state.contractEndDateValue,
                        state.contractName, savingsPlanData, state.ccidCount, state.selectedProductsDetails
                    );
                }

                if (account.level.startsWith('CCID')) {
                    state.contractId = await createContract1(sessionId, account.accId, state.accountName, state.contractStartDateValue, state.contractEndDateValue, state.contractName, 'Rate Plan', savingsPlanData, state.ccidCount);
                    if (state.ccidArray.includes(account.level)) {
                        state.selectedProductsDetails = selectedProductsDetailsByCCID[account.level] || [];
                    }
                    appendResultRow(`${account.level} ContractId`, state.contractId, resultValuesTableBody1);

                    for (const product of state.selectedProductsDetails) {
                        state.contractRateId = await createContractRate(sessionId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                        appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4);
                        appendResultRow(`ContractRateId (${product.ProdID})`, state.contractRateId, resultValuesTableBody2);
                        if (product.TieredDetails.length > 0) {
                            state.pricingId = await createTieredPricing(sessionId, state.contractId, state.contractRateId, product.TieredDetails, state.contractStartDateValue, state.contractEndDateValue);
                        } else {
                            state.pricingId = await createPricing(sessionId, state.contractId, state.contractRateId, product, state.contractStartDateValue, state.contractEndDateValue);
                        }
                    }

                    const ccidIndex = state.ccidArray.indexOf(account.level) + 1;
                    let ccidNum;
                    if (ccidIndex > 0) {
                        ccidNum = ccidIndex;
                        state.orgGrpArray = Array.from({ length: state.orgGrpPerCcid }, (_, j) => `OrgGrp${ccidNum}${j + 1}`);
                    }

                    state.contractProdIds = await queryProductsFromContract(sessionId, state.contractId);
                    state.ccIdusageProducts = filterCCIdUsageProducts(state.contractProdIds);
                    const ccIdcontractProdIds = filterCCIdProducts(state.contractProdIds);

                    const ccidGrpEntry = accountIds.find(e => e.level === account.level);
                    const ccidGrpAccId = ccidGrpEntry?.accId ?? null;
                    const billingIdentifier = await fetchBillingIdentifier(sessionId, ccidGrpAccId);

                    for (const product of ccIdcontractProdIds) {
                        state.accountProductId = await createAccountProduct(sessionId, account.accId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                        appendResultRow(`CCID AccountProductId (${product.Id})`, state.accountProductId, resultValuesTableBody3);
                    }
                    await createUserUsageFile(billingIdentifier, state.contractStartDateValue, state.ccIdusageProducts, state.TCId, account.level);

                    for (const orgGrp of state.orgGrpArray) {
                        state.orgProdIds = selectedProductsDetailsByOrgGrp[orgGrp] || [];
                        const orgProductNames = state.orgProdIds.map(p => p.ProductName);
                        const filteredContractProdIds = state.contractProdIds.filter(item =>
                            orgProductNames.some(name =>
                                item.ContractRateLabel === name || item.ContractRateLabel === `${name} Usage Quantity`
                            )
                        );
                        state.orgGrpusageProducts = filteredContractProdIds.filter(item =>
                            item['ContractRateLabel'].includes('Usage Quantity') && !item['ContractRateLabel'].includes('Users')
                        );
                        const orgGrpcontractProdIds = filteredContractProdIds.filter(item => {
                            const label = item['ContractRateLabel'];
                            return !label.includes('Usage Quantity') && !label.includes('Prepaid Commitment') &&
                                   !label.includes('Commitment Credits') && !label.includes('Drawdown') &&
                                   !label.includes('Discount') && !label.includes('New Relic Reseller Fee') &&
                                   !label.includes('Users') && !label.includes('New Relic Savings Plan - Commitment Fee') &&
                                   !label.includes('New Relic Savings Plan - Remaining Commitment Charge') &&
                                   !label.includes('SP 1.0 - Flex Billing Overage Credit') &&
                                   !label.includes('Forfeiture Funds');
                        });
                        console.log(`${orgGrp} ContractProdIds:`, orgGrpcontractProdIds);

                        const orgGrpEntry = accountIds.find(e => e.level === orgGrp);
                        const orgGrpAccId = orgGrpEntry?.accId ?? null;
                        const orgBillingIdentifier = await fetchBillingIdentifier(sessionId, orgGrpAccId);

                        if (orgGrpcontractProdIds.length > 0) {
                            for (const product of orgGrpcontractProdIds) {
                                state.accountProductId = await createAccountProduct(sessionId, orgGrpAccId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                                appendResultRow(`${orgGrp} AccountProductId (${product.Id})`, state.accountProductId, resultValuesTableBody3);
                            }
                            await showCSVResults();
                            await createNonUserUsageFile(orgBillingIdentifier, state.contractStartDateValue, state.orgGrpusageProducts, state.TCId, orgGrp);
                        }
                    }
                }
            }

            // ── MULTI CCID SEPARATE POOL ──────────────────────────────────────
            if (accountStructure === 'multi-ccid-separate-pool') {
                state.ccidCount = 2;

                if (account.level === 'BillingPortfolioA' || account.level === 'BillingPortfolioB') {
                    state.contractId = await processBillingPortfolio(
                        sessionId, account, state.accountName, state.contractStartDateValue, state.contractEndDateValue,
                        state.contractName, savingsPlanData, state.ccidCount, state.selectedProductsDetails
                    );
                }

                if (account.level.startsWith('CCID') && (account.level.endsWith('A') || account.level.endsWith('B'))) {
                    state.contractId = await createContract1(sessionId, account.accId, state.accountName, state.contractStartDateValue, state.contractEndDateValue, state.contractName, 'Rate Plan', savingsPlanData, state.ccidCount);

                    const pool    = account.level.slice(-1);
                    const ccidBase= account.level.slice(0, -1);
                    if (state.ccidArray.includes(ccidBase)) {
                        state.selectedProductsDetails = selectedProductsDetailsByCCID[ccidBase] || [];
                    }
                    appendResultRow(`${account.level} ContractId`, state.contractId, resultValuesTableBody1);

                    for (const product of state.selectedProductsDetails) {
                        state.contractRateId = await createContractRate(sessionId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                        appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4);
                        appendResultRow(`ContractRateId (${product.ProdID})`, state.contractRateId, resultValuesTableBody2);
                        if (product.TieredDetails.length > 0) {
                            state.pricingId = await createTieredPricing(sessionId, state.contractId, state.contractRateId, product.TieredDetails, state.contractStartDateValue, state.contractEndDateValue);
                        } else {
                            state.pricingId = await createPricing(sessionId, state.contractId, state.contractRateId, product, state.contractStartDateValue, state.contractEndDateValue);
                        }
                    }

                    const ccidNum = ccidBase.replace('CCID', '');
                    state.orgGrpArray = Array.from({ length: state.orgGrpPerCcid }, (_, j) => `OrgGrp${ccidNum}${j + 1}${pool}`);

                    state.contractProdIds = await queryProductsFromContract(sessionId, state.contractId);
                    const usageProducts      = state.contractProdIds.filter(item => item['ContractRateLabel'].includes('Usage Quantity'));
                    const nonUsageContractIds= state.contractProdIds.filter(item => !item['ContractRateLabel'].includes('Usage Quantity'));

                    for (const orgGrp of state.orgGrpArray) {
                        const orgContractProdIds = selectedProductsDetailsByOrgGrp[orgGrp] || [];
                        console.log(`${orgGrp} ContractProdIds:`, orgContractProdIds);
                        const orgGrpEntry = accountIds.find(e => e.level === orgGrp);
                        const orgGrpAccId = orgGrpEntry?.accId ?? null;
                        const billingIdentifier = await fetchBillingIdentifier(sessionId, orgGrpAccId);

                        if (orgContractProdIds.length > 0) {
                            for (const product of orgContractProdIds) {
                                state.accountProductId = await createAccountProduct(sessionId, orgGrpAccId, state.contractId, product, state.contractStartDateValue, state.contractEndDateValue);
                                appendResultRow(`${orgGrp} AccountProductId (${product.Id})`, state.accountProductId, resultValuesTableBody3);
                            }
                            await showCSVResults();
                            await createUserUsageFile(billingIdentifier, state.contractStartDateValue, usageProducts, state.TCId, orgGrp);
                            await createNonUserUsageFile(billingIdentifier, state.contractStartDateValue, usageProducts, state.TCId, orgGrp);
                        }
                    }
                }
            }
        }

        // ── Export Excel ──────────────────────────────────────────────────────
        const toArray = tbody => Array.from(tbody.querySelectorAll('tr')).map(row => {
            const cells = row.querySelectorAll('td');
            return { name: cells[0].textContent, value: cells[1].textContent };
        });

        console.log('Excel file creation started');
        await createExcel(
            toArray(resultValuesTableBody),
            toArray(resultValuesTableBody1),
            toArray(resultValuesTableBody2),
            toArray(resultValuesTableBody3),
            state.TCId
        );

    } catch (error) {
        console.error('Error during API calls:', error);
    }
}
