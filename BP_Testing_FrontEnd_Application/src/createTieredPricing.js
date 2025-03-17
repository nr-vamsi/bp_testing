
export async function createTieredPricing(sessionId, contractId, contractRateId, tieredDetails, contractStartDateValue, contractEndDateValue) {
    const brmObjects = tieredDetails.map((tieredDetail, index) => ({
        ContractId: contractId,
        Id: "",
        Rate: `${tieredDetail.price}`,
        RerateFlag: '0',
        UpperBand: `${tieredDetail.upperBand}`,
        LowerBand: `${tieredDetail.lowerBand}`,
        ContractRateId: contractRateId,
        EffectiveDate: contractStartDateValue,
        EndDate: contractEndDateValue,
        RateOrder: `${index + 1}`,
        CurrencyCode: 'USD'
    }));

    const payload = { brmObjects };

    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
        `https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/PRICING`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                sessionId: `${sessionId}`
            },
            body: JSON.stringify(payload)
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating tiered pricing');
    }
    return data.createResponse[0].Id;
}
