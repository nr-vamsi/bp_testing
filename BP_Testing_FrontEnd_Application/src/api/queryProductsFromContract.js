import CONFIG from '../config.js';

export async function queryProductsFromContract(sessionId, contractId) {
    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/query?sql=select id,productid,contractratelabel from contract_rate where contractid=${contractId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error querying products from contract');
    }

    return data.queryResponse;
}
