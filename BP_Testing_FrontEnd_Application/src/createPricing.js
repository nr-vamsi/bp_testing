

export async function createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue) {
    const response = await fetch(
        `https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/PRICING`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                sessionId: `${sessionId}`
            },
            body: JSON.stringify({
                brmObjects: {
                    ContractId: contractId,
                    Id: "",
                    Rate: `${product.Price}`,
                    RerateFlag: '0',
                    UpperBand: '-1',
                    ContractRateId: contractRateId,
                    EffectiveDate: contractStartDateValue,
                    EndDate: contractEndDateValue,
                    RateOrder: '1',
                    CurrencyCode: 'USD'
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
