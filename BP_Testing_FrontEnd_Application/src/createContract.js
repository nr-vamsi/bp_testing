export async function createContract(sessionId, accountId, accountName, contractStartDateValue, contractName) {
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
                ContractNumber: contractName,
                ContractStatus: 'ACTIVE',
                OnEndDate: 'Terminate',
                nrBillingTerms: 'Monthly in Arrears (No Pre Pay)',
                nrSfContractId: `SF_${contractName}`
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
    return data.createResponse[0].Id;
}
