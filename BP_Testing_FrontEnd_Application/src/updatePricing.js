
import CONFIG from './config.js';
export async function updatePricing(sessionId, pricingId, product) {
    const response = await fetch(
        `${CONFIG.HOSTNAME}/rest/2.0/PRICING`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                sessionId: `${sessionId}`
            },
            body: JSON.stringify({
                brmObjects: {
                    Id: `${pricingId}`,
                    Rate: `${product.Price}`
                }
            })
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
                                        // To get the Id from the response:

    return data;
}
