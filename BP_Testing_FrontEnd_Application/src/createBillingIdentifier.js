
import CONFIG from './config.js';
export async function createBillingIdentifier(sessionId, accountId, contractId, billingIdentifier, contractStartDateValue, contractEndDateValue) {
    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/ACCOUNT_PRODUCT`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                ProductId: 13985,
                Id: '',
                Quantity: '1',
                StartDate: contractStartDateValue,
                EndDate: contractEndDateValue,
                Status: 'ACTIVE',
                AccountId: accountId,
                ContractId: contractId,
                Name: 'BillingIdentifier',
                nrBillingIdentifier: billingIdentifier
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
    return data.createResponse[0].Id;
}
