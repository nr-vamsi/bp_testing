export async function createAccount(sessionId, accountName) {
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
                nrSalesforceAccountID: `SF_${accountName}`,
                nrShipToAddress1: '596 Carson Street',
                nrShipToCity: 'Lexington',
                nrShipToCountry: 'United States',
                nrShipToState: 'Kentucky',
                nrShipToZip: '40509',
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
