import CONFIG from '../config.js';

export async function updateContract(sessionId, contractId, fields) {
    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/CONTRACT`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: { Id: contractId, ...fields }
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error updating contract');
    }
    return data;
}
