import CONFIG from '../config.js';

export async function updatePricingEndDate(sessionId, pricingId, endDate) {
    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/PRICING`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: `${pricingId}`,
                EndDate: `${endDate}`
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error updating pricing end date');
    }
    return data;
}
