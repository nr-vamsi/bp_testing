import CONFIG from '../config.js';

export async function queryPrice(sessionId, contractRateId) {
    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/query?sql=select Id from PRICING where ContractRateId =${contractRateId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error querying price');
    }

    return data.queryResponse[0].Id;
}
