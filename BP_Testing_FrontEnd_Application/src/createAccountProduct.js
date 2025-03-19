

export async function createAccountProduct(sessionId, accountId, contractId, product, contractStartDateValue, contractEndDateValue) {
    let productName = product.ContractRateLabel ? product.ContractRateLabel : product.ProductName;
    let productId = product.ProductId ? product.ProductId : product.ProdID;
    console.log("Prod Id: ", productId);
    console.log("Product Name: ", productName);

    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/ACCOUNT_PRODUCT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                ProductId: productId,
                Id: '',
                Quantity: '1',
                StartDate: contractStartDateValue,
                EndDate: contractEndDateValue,
                Status: 'ACTIVE',
                AccountId: accountId,
                ContractId: contractId,
                BillingCycleStartDate: contractStartDateValue,
                Name: productName
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
    return data.createResponse[0].Id;
}
