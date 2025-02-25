export async function createContract(sessionId, accountId, accountName, contractStartDateValue) {
    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/CONTRACT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: '',
                StartDate: contractStartDateValue,
                AccountId: accountId,
                ContractNumber: `Contract_${accountName}`,
                ContractStatus: 'ACTIVE',
                OnEndDate: 'Terminate',
                nrBillingTerms: 'Monthly in Arrears (No Pre Pay)',
                nrSfContractId: `SF_Contract_${accountName}`
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
    return data.createResponse[0].Id;
}
