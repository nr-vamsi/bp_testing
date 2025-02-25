export async function createBillingIdentifier(sessionId, accountId, billingIdentifier, contractStartDateValue) {
    const response = await fetch(
        `https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/ACCOUNT_PRODUCT`,
        {
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
                    Status: 'ACTIVE',
                    AccountId: accountId,
                    Name: 'BillingIdentifier',
                    nrBillingIdentifier: billingIdentifier
                }
            })
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
    return data.createResponse[0].Id;
}
