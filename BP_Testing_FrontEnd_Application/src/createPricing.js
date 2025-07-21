
import CONFIG from './config.js';
export async function createPricing(sessionId, contractId, contractRateId, product, contractStartDateValue, contractEndDateValue) {
    const response = await fetch(
        `${CONFIG.HOSTNAME}/rest/2.0/PRICING`,
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
                                        // To get the Id from the response:
    let pricingRecordId = null;
    if (data.createResponse[0].ErrorCode !== '0' && `${product.ProductName}` === 'SP1.0 - Commitment Credits') {
        console.log('Error creating pricing record:', data.createResponse[0].ErrorText);
    }

    return data;
}
