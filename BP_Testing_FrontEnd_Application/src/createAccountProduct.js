export async function createAccountProduct(sessionId, accountId, contractId, product, contractStartDateValue) {
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
                    ProductId: `${product.ProdID}`,
                    Id: '',
                    Quantity: '1',
                    StartDate: contractStartDateValue,
                    Status: 'ACTIVE',
                    AccountId: accountId,
                    ContractId: contractId,
                    BillingCycleStartDate: contractStartDateValue,
                    Name: `${product.ProductName}`
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
