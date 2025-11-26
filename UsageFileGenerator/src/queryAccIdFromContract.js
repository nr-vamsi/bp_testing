import CONFIG from './config.js';
let contractProdIds = [];

export async function queryAccIdFromContract(sessionId, contractId) {
    const response = await fetch(`${CONFIG.HOSTNAME}//rest/2.0/query?sql=select id,accountid,startdate,enddate from contract where id=${contractId}`, {
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
