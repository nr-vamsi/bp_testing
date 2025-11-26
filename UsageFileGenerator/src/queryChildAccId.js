import CONFIG from './config.js';
let contractProdIds = [];

export async function queryChildAccId(sessionId, parentAccId) {
    const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select id,AccountTypeId from account where ParentAccountId=${parentAccId}`, {
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
