export async function createContractRate(sessionId, contractId, product, contractStartDateValue, contractEndDateValue) {
    const response = await fetch(`https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/CONTRACT_RATE`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: '',
                ContractId: contractId,
                StartDate: contractStartDateValue,
                EndDate: contractEndDateValue,
                RatingMethodId: '',
                ProductId: `${product.ProdID}`,
                Name: '',
                EndDate: '',
                ContractRateLabel: `${product.ProductName}`
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract rate');
    }
    return data.createResponse[0].Id;
}

