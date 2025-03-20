async function createContract(sessionId, accountId, accountName, contractStartDateValue, contractEndDateValue, contractName,contractType, savingsPlanData) {
console.log('Reseller percentage:', savingsPlanData.resellerFeeBlendedRate);
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
                EndDate: contractEndDateValue,
                AccountId: accountId,
                ContractNumber: accountId + contractName,
                ContractStatus: 'ACTIVE',
                OnEndDate: 'Terminate',
                nrSfContractId: `SF_${contractName}`,
                nrContractType: contractType,
                nrBillingTerms: savingsPlanData.billingTerms,
                nrLastAmendmentNo: savingsPlanData.lastAmendmentNumber,
                nrTotalContractValue: savingsPlanData.totalContractValue,
                nrInitialCommitment: savingsPlanData.initialCommitment,
                nrInitialCommitmentCredit: savingsPlanData.initialCommitmentCredit,
                nrInitialPrepaidCommitment: savingsPlanData.initialPrepaidCommitment,
                nrRolloverFunds: savingsPlanData.rolloverFunds,
                nrRolloverCredits: savingsPlanData.rolloverCredits,
                nrResellerRenewalRate: savingsPlanData.resellerFeeRenewalRate,
                nrResellerNewRate: savingsPlanData.resellerFeeNewRate,
                nrResellerBlendedRate: savingsPlanData.resellerFeeBlendedRate,
                nrPartnerCompensationMethod: 'Transaction Based (Method1)'

            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
    return data.createResponse[0].Id;
}

async function createContract1(sessionId, accountId, accountName, contractStartDateValue, contractEndDateValue, contractName,contractType, billingTerms) {

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
                EndDate: contractEndDateValue,
                AccountId: accountId,
                ContractNumber: accountId + contractName,
                ContractStatus: 'ACTIVE',
                OnEndDate: 'Terminate',
                nrContractType: contractType,
                nrSfContractId: `SF_${contractName}`,
                nrContractType: 'Rate Plan',
                nrBillingTerms: billingTerms

            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating contract');
    }
    return data.createResponse[0].Id;
}

export { createContract, createContract1 };

