import CONFIG from '../config.js';
import { state } from '../modules/state.js';

/** GET /rest/2.0/CONTRACT/:id — returns full contract details */
async function getContract(sessionId, contractId) {
    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/CONTRACT/${contractId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Failed to fetch contract ${contractId}: ${response.statusText}`);
    }
    return data;
}

/** GET /rest/2.0/ACCOUNT_PRODUCT?queryAnsiSql=accountid=:accountId — returns account products */
async function getAccountProducts(sessionId, accountId) {
    const response = await fetch(
        `${CONFIG.HOSTNAME}/rest/2.0/ACCOUNT_PRODUCT?queryAnsiSql=accountid=${accountId}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                sessionId: `${sessionId}`
            }
        }
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Failed to fetch account products for account ${accountId}: ${response.statusText}`);
    }
    return data;
}

/** PUT /rest/2.0/ACCOUNT_PRODUCT — sets EndDate on a single account product */
async function terminateAccountProduct(sessionId, accountProductId, effectiveDate) {
    const response = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/ACCOUNT_PRODUCT`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: accountProductId,
                EndDate: effectiveDate
            }
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Failed to terminate account product ${accountProductId}: ${response.statusText}`);
    }
    return data;
}

/**
 * Full Rip & Replace termination flow:
 *  1. GET contract  → read EndDate (→ nrOriginalContractEndDate) and account IDs
 *  2. PUT contract  → terminate it
 *  3. For each account: GET account products, then PUT each product to set EndDate
 */
export async function terminateContract(sessionId, contractId, effectiveDate) {

    // ── Step 1: fetch contract ─────────────────────────────────────────────────
    const contractData  = await getContract(sessionId, contractId);
    const record        = contractData.retrieveResponse[0];
    const originalEndDate = record.EndDate ?? effectiveDate;
    console.log(`Contract ${contractId} original EndDate: ${originalEndDate}`);

    // nrBillingIdentifierJSON may arrive as a JSON string — parse defensively
    const rawBI = record.nrBillingIdentifierJSON;
    const biList = Array.isArray(rawBI)
        ? rawBI
        : (() => { try { return JSON.parse(rawBI); } catch { return []; } })();

    // Build structured account IDs for the replacement contract flow
    const billingPortfolioId = record.AccountId;
    const ccidId             = biList[0]?.ACCOUNT?.Id;
    const orgGrpId           = biList[1]?.ACCOUNT?.Id;

    state.ripReplaceAccountIds = [
        billingPortfolioId && { level: 'BillingPortfolio', accId: billingPortfolioId },
        ccidId             && { level: 'CCID',             accId: ccidId             },
        orgGrpId           && { level: 'OrgGrp',           accId: orgGrpId           }
    ].filter(Boolean);
    console.log('Rip & Replace account IDs:', state.ripReplaceAccountIds);

    // Flat list of IDs for terminating account products (CCID + OrgGrp only)
    const accountIds = [ccidId, orgGrpId].filter(Boolean);
    console.log('Account IDs to terminate products for:', accountIds);

    // ── Step 2: terminate the contract ────────────────────────────────────────
    const putResponse = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/CONTRACT`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: contractId,
                nrContractTerminationReasonCode: 'Terminated-Rip & Replace',
                nrInvoiceVisibility: 'Yes',
                nrLastAmendmentType: 'Rip & Replace',
                nrOriginalContractEndDate: originalEndDate,
                nrSFContractStatus: 'Terminated',
                nrTerminationDate: effectiveDate,
                nrChargedThroughDate: effectiveDate
            }
        })
    });
    const contractResult = await putResponse.json();
    if (!putResponse.ok) {
        throw new Error(`Contract termination failed: ${putResponse.statusText}`);
    }
    console.log('Contract terminated:', contractResult);

    // ── Step 3: terminate account products for each account ───────────────────
    for (const accountId of accountIds) {
        console.log(`Fetching account products for account: ${accountId}`);
        const apData     = await getAccountProducts(sessionId, accountId);
        const apList     = apData.retrieveResponse ?? [];
        console.log(`  Found ${apList.length} account product(s) for account ${accountId}`);

        for (const ap of apList) {
            const apId = ap.Id;
            console.log(`  Terminating account product: ${apId}`);
            await terminateAccountProduct(sessionId, apId, effectiveDate);
        }
    }

    return contractResult;
}
