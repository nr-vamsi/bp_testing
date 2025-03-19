import { createBillingProfile } from './createBillingProfile.js';

async function createAccounts(sessionId, accountName, sfAccId, hierarchy) {
    const parentIds = [];

    const currentDateTime = new Date().toISOString().replace('T', '_').replace('Z', '').replace(/[+_\-:.]/g, '');

    for (let i = 0; i < hierarchy.length; i++) {
        const level = hierarchy[i];
        let accId;
        let parentAccId = 1; // Default parentAccId for UltimateParent

        if (level === 'UltimateParent') {
            accId = await createAccount(sessionId, `UP_${accountName}`, `UP_${sfAccId}`, parentAccId, 721);
            console.log(`Created UP Account: ${accId}`);
        } else if (level.startsWith('Parent')) {
            parentAccId = parentIds.find(id => id.level === 'UltimateParent').accId;
            accId = await createAccount(sessionId, `${level}_${accountName}`, `${level}_${sfAccId}`, parentAccId, 721);
            console.log(`Created Parent Account: ${accId}`);
        } else if (level.startsWith('BillingPortfolio')) {
            parentAccId = parentIds.filter(id => id.level.startsWith('Parent')).slice(-1)[0].accId;
            accId = await createBPAccount(sessionId, `${level}_${accountName}`, `${level}_${sfAccId}`, parentAccId, 701);
            console.log(`Created BillingPortfolio Account: ${accId}`);
            const bProfileId = await createBillingProfile(sessionId, accId, `${level}_${accountName}`, `${level}_${sfAccId}`);
            console.log(`Created Billing Profile: ${bProfileId}`);
        } else if (level.startsWith('CCID')) {
            parentAccId = parentIds.filter(id => id.level.startsWith('BillingPortfolio')).slice(-1)[0].accId;
            accId = await createAccount(sessionId, `${level}_${accountName}`, `${level}_${sfAccId}`, parentAccId, 682, level+currentDateTime, null);
            console.log(`Created CCID Account: ${accId}`);
        } else if (level.startsWith('OrgGrp')) {
            const latestCCID = parentIds.filter(id => id.level.startsWith('CCID')).slice(-1)[0].level;
            parentAccId = parentIds.filter(id => id.level.startsWith('CCID')).slice(-1)[0].accId;
            accId = await createAccount(sessionId, `${level}_${accountName}`, `${level}_${sfAccId}`, parentAccId, 681, latestCCID, level+currentDateTime);
            console.log(`Created OrgGrp Account: ${accId}`);
        }

        parentIds.push({ level, accId });
    }
    console.log('Parent Ids: ', parentIds);
    return parentIds;
}

async function createAccount(sessionId, accountName, sfAccId, parentAccId, accountTypeId, customerContractId = '', orgGroupId = '') {
    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/ACCOUNT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                AccountTypeId: `${accountTypeId}`,
                Status: 'ACTIVE',
                Id: '',
                Name: `${accountName}`,
                ParentAccountId: `${parentAccId}`,
                RateHierarchy: '0',
                InvoiceAtThisLevel: 0,
                BillableAccountId: '',
                nrAccountNote: '',
                nrResellerPartnership: '0',
                nrSalesforceAccountID: `${sfAccId}`,
                nrCustomerContractId: `${customerContractId}`,
                nrOrgGroupId: `${orgGroupId}`,
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating account');
    }

    const parentAccountId = data.createResponse[0].Id;
    return parentAccountId;
}

async function createBPAccount(sessionId, accountName, sfAccId, parentAccountId, accountTypeId) {

    const shipToAddress1 = document.getElementById('ship-to-address1').value;
    const shipToCity = document.getElementById('ship-to-city').value;
    const shipToState = document.getElementById('ship-to-state').value;
    const shipToCountry = document.getElementById('ship-to-country').value;
    const shipToZip = document.getElementById('ship-to-zip').value;
    

    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/ACCOUNT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                AccountTypeId: `${accountTypeId}`,
                Status: 'ACTIVE',
                Id: '',
                Name: `${accountName}`,
                ParentAccountId: `${parentAccountId}`,
                RateHierarchy: '0',
                InvoiceAtThisLevel: 1,
                BillableAccountId: '',
                nrAccountNote: '',
                nrResellerPartnership: '0',
                nrSalesforceAccountID: `${sfAccId}`,
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

    const newParentAccountId = data.createResponse[0].Id;
    return newParentAccountId;
}

export { createAccounts };