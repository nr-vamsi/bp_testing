export async function createContractCurrency(sessionId, contractId) {
    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/CONTRACT_CURRENCY', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: '',
                ContractId: contractId,
                CurrencyCode: "USD"
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract currency');
    }
    return data.createResponse[0].Id;
}
