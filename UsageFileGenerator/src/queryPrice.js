import CONFIG from './config.js';
let pricingId = '';

export async function queryPrice(sessionId, contractRateId) {
    const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select LOWER_BAND,UPPER_BAND,RATE_SOURCE from PRICING where ContractRateId =${contractRateId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        }
    });

    const data = await response.json();
    //console.log("Query Response: ", data);
    if (!response.ok) {
        throw new Error('Error creating contract');
    }

    pricingId = data.queryResponse[0].Id;
    return pricingId;
}
