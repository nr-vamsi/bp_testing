import CONFIG from '../config.js';
import { createContract } from '../api/createContract.js';
import { createContractRate } from '../api/createContractRate.js';
import { createPricing } from '../api/createPricing.js';
import { createTieredPricing } from '../api/createTieredPricing.js';
import { createAccountProduct } from '../api/createAccountProduct.js';
import { queryProductsFromContract } from '../api/queryProductsFromContract.js';
import { queryPrice } from '../api/queryPrice.js';
import { updatePricing } from '../api/updatePricing.js';
import { appendResultRow, displayResultContainer } from '../handleResults.js';

const resultContainer1      = () => document.getElementById('result-container1');
const resultContainer2      = () => document.getElementById('result-container2');
const resultContainer3      = () => document.getElementById('result-container3');
const resultContainer4      = () => document.getElementById('result-container4');
const resultValuesTableBody1= () => document.querySelector('#result-values-table1 tbody');
const resultValuesTableBody2= () => document.querySelector('#result-values-table2 tbody');
const resultValuesTableBody3= () => document.querySelector('#result-values-table3 tbody');
const resultValuesTableBody4= () => document.querySelector('#result-values-table4 tbody');

/**
 * Processes a BillingPortfolio account level:
 * creates the Commitment contract, contract rates, pricing, and account products.
 * Returns the created contractId.
 */
export async function processBillingPortfolio(
    sessionId, account, accountName, contractStartDateValue, contractEndDateValue,
    contractName, savingsPlanData, ccidCount, selectedProductsDetails,
    selectedProductsDetailsByBillingProfile = null
) {
    displayResultContainer(resultContainer1());
    displayResultContainer(resultContainer2());
    displayResultContainer(resultContainer4());
    displayResultContainer(resultContainer3());

    const contractId = await createContract(
        sessionId, account.accId, accountName,
        contractStartDateValue, contractEndDateValue,
        contractName, 'Commitment', savingsPlanData, ccidCount
    );
    appendResultRow(`${account.level} ContractId`, contractId, resultValuesTableBody1());

    const billingProfileProducts = selectedProductsDetailsByBillingProfile
        ? (selectedProductsDetailsByBillingProfile[account.level] || [])
        : selectedProductsDetails;

    for (const product of billingProfileProducts) {
        const isCommitmentProduct =
            product.ProductName === 'New Relic Savings Plan - Commitment Fee' ||
            product.ProductName === 'New Relic Volume Plan - Commitment Fee'  ||
            product.ProductName === 'New Relic Savings Plan - Commitment Credits';

        if (!isCommitmentProduct) continue;

        const contractRateId = await createContractRate(
            sessionId, contractId, product, contractStartDateValue, contractEndDateValue
        );
        appendResultRow(`${product.ProductName}`, `${product.ProdID}`, resultValuesTableBody4());
        appendResultRow(`ContractRateId (${product.ProdID})`, contractRateId, resultValuesTableBody2());

        let pricingId = await createPricing(
            sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue
        );
        if (pricingId.createResponse[0].ErrorCode !== '0' &&
            product.ProductName === 'New Relic Savings Plan - Commitment Credits') {
            pricingId = await queryPrice(sessionId, contractRateId);
            if (pricingId?.length > 0) {
                pricingId = await updatePricing(sessionId, pricingId, product);
                console.log('Updated PricingId:', pricingId);
            }
        }
    }

    const contractProdIds = await queryProductsFromContract(sessionId, contractId);
    const contractAccProd = contractProdIds.filter(item =>
        item['ContractRateLabel'].includes('New Relic Savings Plan - Commitment Fee') ||
        item['ContractRateLabel'].includes('New Relic Volume Plan - Commitment Fee')  ||
        item['ContractRateLabel'].includes('Commitment Credits') 
    );
    console.log('ContractProdIds:', contractProdIds);
    console.log('ContractAccProd:', contractAccProd);

    for (const product of contractAccProd) {
        const productName = product.ContractRateLabel ?? product.ProductName;
        const needsBillingTerms =
            productName === 'New Relic Savings Plan - Commitment Fee'   ||
            productName === 'New Relic Volume Plan - Commitment Fee';

        if (needsBillingTerms && savingsPlanData.initialFlexiPrepaidCommitment) {
            await createAccountProductWithBillingTerms(
                sessionId, account.accId, contractId, product,
                contractStartDateValue, contractEndDateValue, savingsPlanData.billingTerms
            );
        } else {
            await createAccountProduct(
                sessionId, account.accId, contractId, product,
                contractStartDateValue, contractEndDateValue
            );
        }
    }

    // Tiered products
    const tieredProducts = selectedProductsDetails.filter(p => p.Tier && p.TieredDetails.length > 0);
    for (const product of tieredProducts) {
        const firstTier             = product.TieredDetails[0];
        const firstTierQuantity     = parseFloat(firstTier.upperBand) || 0;
        const firstTierPrice        = parseFloat(firstTier.price) || 0;
        const nrMonthlyMinCommitment= firstTierQuantity * firstTierPrice;
        console.log(`Processing tiered product: ${product.ProductName}`, { firstTierQuantity, nrMonthlyMinCommitment });

        const contractProduct = contractProdIds.find(item =>
            item.ContractRateLabel === product.ProductName || item.ProductName === product.ProductName
        );
        if (contractProduct) {
            await createAccountProductWithTierValues(
                sessionId, account.accId, contractId, contractProduct,
                contractStartDateValue, contractEndDateValue,
                firstTierQuantity, nrMonthlyMinCommitment
            );
        }
    }

    return contractId;
}

/** Creates an account product with NRUsageMonthlyMin and nrMonthlyMinCommitment fields. */
export async function createAccountProductWithTierValues(
    sessionId, accountId, contractId, product,
    contractStartDateValue, contractEndDateValue,
    firstTierQuantity, nrMonthlyMinCommitment
) {
    const productName = product.ContractRateLabel ?? product.ProductName;
    const productId   = product.ProductId ?? product.ProdID;
    console.log('Creating tier-based account product:', { productId, productName, firstTierQuantity, nrMonthlyMinCommitment });

    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/ACCOUNT_PRODUCT`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', sessionId },
        body: JSON.stringify({
            brmObjects: {
                ProductId: productId, Id: '', Quantity: '1',
                StartDate: contractStartDateValue, EndDate: contractEndDateValue,
                Status: 'ACTIVE', AccountId: accountId, ContractId: contractId,
                BillingCycleStartDate: contractStartDateValue, Name: productName,
                NRUsageMonthlyMin: firstTierQuantity.toString(),
                nrMonthlyMinCommitment: nrMonthlyMinCommitment.toString()
            }
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error('Error creating tier-based account product');
    console.log(`Created tier-based account product: ${data.createResponse[0].Id}`);
    appendResultRow(`Tier AccountProductId (${productName})`, data.createResponse[0].Id, resultValuesTableBody3());
    return data.createResponse[0].Id;
}

/**
 * Creates account product(s) split by billing term periods
 * (Quarterly → 4 slices, Semi-Annual → 2 slices, otherwise a single product).
 */
export async function createAccountProductWithBillingTerms(
    sessionId, accountId, contractId, product,
    contractStartDateValue, contractEndDateValue, billingTerms
) {
    const start = new Date(contractStartDateValue);
    const end   = new Date(contractEndDateValue);

    if (billingTerms === 'Quarterly') {
        let tempStart = new Date(start);
        for (let i = 0; i < 4; i++) {
            let tempEnd = new Date(tempStart);
            tempEnd.setMonth(tempEnd.getMonth() + 3);
            tempEnd.setDate(tempStart.getDate() - 1);
            if (i === 3 || tempEnd > end) tempEnd = new Date(end);
            await createAccountProduct(
                sessionId, accountId, contractId, product,
                tempStart.toISOString().slice(0, 10), tempEnd.toISOString().slice(0, 10)
            );
            tempStart = new Date(tempEnd);
            tempStart.setDate(tempStart.getDate() + 1);
        }
    } else if (billingTerms === 'Semi-Annual') {
        let tempStart = new Date(start);
        for (let i = 0; i < 2; i++) {
            let tempEnd = new Date(tempStart);
            tempEnd.setMonth(tempEnd.getMonth() + 6);
            tempEnd.setDate(tempStart.getDate() - 1);
            if (i === 1 || tempEnd > end) tempEnd = new Date(end);
            await createAccountProduct(
                sessionId, accountId, contractId, product,
                tempStart.toISOString().slice(0, 10), tempEnd.toISOString().slice(0, 10)
            );
            tempStart = new Date(tempEnd);
            tempStart.setDate(tempStart.getDate() + 1);
        }
    } else {
        await createAccountProduct(
            sessionId, accountId, contractId, product,
            contractStartDateValue, contractEndDateValue
        );
    }
}
