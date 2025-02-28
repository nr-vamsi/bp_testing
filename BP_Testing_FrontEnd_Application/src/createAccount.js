export async function createAccount(sessionId, accountName, sfAccId) {
    const shipToAddress1 = document.getElementById('ship-to-address1').value;
    const shipToCity = document.getElementById('ship-to-city').value;
    const shipToState = document.getElementById('ship-to-state').value;
    const shipToCountry = document.getElementById('ship-to-country').value;
    const shipToZip = document.getElementById('ship-to-zip').value;
    const shipToEmail = document.getElementById('ship-to-email').value;

    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/ACCOUNT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                AccountTypeId: '1',
                Status: 'ACTIVE',
                Id: '',
                Name: accountName,
                ParentAccountId: '1',
                RateHierarchy: '0',
                InvoiceAtThisLevel: 1,
                BillableAccountId: '',
                nrAccountNote: '',
                nrResellerPartnership: '0',
                nrSalesforceAccountID: sfAccId,
                nrShipToAddress1: shipToAddress1,
                nrShipToCity: shipToCity,
                nrShipToCountry: shipToCountry,
                nrShipToState: shipToState,
                nrShipToZip: shipToZip,
                nrTaxId: '86'
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating account');
    }
    return data.createResponse[0].Id;
}
