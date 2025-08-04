import CONFIG from './config.js';
let contractProdIds = [];

export async function queryProductsFromContract(sessionId, contractId) {
    const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select id,productid,contractratelabel from contract_rate where contractid=${contractId}`, {
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

    contractProdIds = data.queryResponse;
    return contractProdIds;
}
