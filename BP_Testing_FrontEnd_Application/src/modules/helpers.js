import CONFIG from '../config.js';

/** Extracts product details from a result-table row. */
export function extractRowProductDetails(row) {
    const tierCheckbox = row.querySelector('input[name="tier"]');
    const discountCheckbox = row.querySelector('input[name="is-discount-required"]');
    const tieredDetails = Array.from(row.querySelectorAll('.tiered-detail-row')).map(detailRow => ({
        upperBand: detailRow.querySelector('input[name="upper-band"]').value,
        price: detailRow.querySelector('input[name="tier-price"]').value
    }));
    tieredDetails.forEach((detail, index) => {
        detail.lowerBand = index === 0
            ? '0'
            : (parseFloat(tieredDetails[index - 1]?.upperBand || '0') + 0.0000000001).toString();
    });
    tieredDetails.forEach(detail => { if (!detail.upperBand) detail.upperBand = '-1'; });
    return {
        ProdID: row.cells[1].textContent,
        ProductName: row.cells[2].textContent,
        Price: row.querySelector('input[name="price"]')?.value || '0',
        Tier: tierCheckbox ? tierCheckbox.checked : false,
        TieredDetails: tieredDetails,
        Discount: discountCheckbox && discountCheckbox.checked ? discountCheckbox.value : null
    };
}

/** Fetches the nrBillingIdentifier for a given account. */
export async function fetchBillingIdentifier(sessionId, accountId) {
    const response = await fetch(
        `${CONFIG.HOSTNAME}//rest/2.0/query?sql=select nrBillingIdentifier from ACCOUNT_PRODUCT where accountid = '${accountId}' and name='BillingIdentifier'`,
        { method: 'GET', headers: { 'Content-Type': 'application/json; charset=utf-8', sessionId } }
    );
    const { queryResponse } = await response.json();
    if (queryResponse?.length > 0) {
        console.log('Billing Identifier found:', queryResponse[0].nrBillingIdentifier);
        return queryResponse[0].nrBillingIdentifier;
    }
    return '';
}

/** Filters contract products for CCID-level account products (Users only, no usage/commitment). */
export function filterCCIdProducts(products) {
    return products.filter(item => {
        const label = item['ContractRateLabel'];
        return !label.includes('Usage Quantity') &&
               !label.includes('Prepaid Commitment') &&
               !label.includes('Commitment Credits') &&
               !label.includes('Drawdown') &&
               !label.includes('Discount') &&
               !label.includes('New Relic Reseller Fee') &&
               label.includes('Users');
    });
}

/** Filters contract products for CCID-level usage (Users Usage Quantity). */
export function filterCCIdUsageProducts(products) {
    return products.filter(item =>
        item['ContractRateLabel'].includes('Usage Quantity') &&
        item['ContractRateLabel'].includes('Users')
    );
}

/** Builds all product-query combinations recursively. */
export function combineArrays(arrays, index, current, queries) {
    if (index === arrays.length) { queries.push(current); return; }
    for (const value of arrays[index]) {
        combineArrays(arrays, index + 1, [...current, value], queries);
    }
}

/** Searches productsList by a set of query terms. */
export function sequentialSearch(queries, list) {
    const modifiedQueries = queries.map(q => q.replace(/FPU/g, 'Full Platform Users'));
    return list.filter(item =>
        modifiedQueries.every(q => !q || item['Product Name'].includes(q))
    );
}

/** Copies Ids from contractProdIds into matching orgProdIds entries. */
export function copyIdsFromContractToOrgProducts(contractProdIds, orgProdIds) {
    const contractMap = new Map();
    contractProdIds.forEach(p => { if (p.ContractRateLabel) contractMap.set(p.ContractRateLabel, p.Id); });
    orgProdIds.forEach(orgProd => {
        const matchingId = contractMap.get(orgProd.ProductName);
        if (matchingId) {
            orgProd.Id = matchingId;
            console.log(`Copied Id ${matchingId} from '${orgProd.ProductName}'`);
        }
    });
    return orgProdIds;
}

/** Reads a CSV file via fetch and returns an array of row objects. */
export async function readCSV(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();
    const rows = data.split('\n');
    const headers = rows[0].split(',');
    return rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

/** Loads all CSV usage templates (kept for side-effect compatibility). */
export async function showCSVResults() {
    await readCSV('/csv/Users_usage_template.csv');
    await readCSV('/csv/NonUser_usage_template.csv');
    await readCSV('/csv/usageMapping_Users.csv');
    await readCSV('/csv/usageMapping_NonUsers.csv');
}
