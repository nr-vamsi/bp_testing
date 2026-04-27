import CONFIG from '../config.js';

/**
 * Queries INVOICE records whose billing period contains backdatedDate for the given account,
 * then PUTs each matching invoice with nrDeleteBackdatedUsage = '1'.
 * Returns the number of invoices updated.
 */
export async function updateInvoicesForBackdate(sessionId, accountId, backdatedDate) {
    const res = await fetch(
        `${CONFIG.HOSTNAME}/rest/2.0/query?sql=select Id from INVOICE where AccountId = '${accountId}' AND StartDate <= '${backdatedDate}' AND EndDate >= '${backdatedDate}'`,
        {
            method: 'GET',
            headers: { 'Content-Type': 'application/json; charset=utf-8', sessionId }
        }
    );
    const data = await res.json();
    if (!res.ok) throw new Error('Error querying invoices for backdated update');

    const invoices = data.queryResponse ?? [];
    for (const inv of invoices) {
        const putRes = await fetch(`${CONFIG.HOSTNAME}/rest/2.0/INVOICE`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json; charset=utf-8', sessionId },
            body: JSON.stringify({ brmObjects: { Id: inv.Id, nrDeleteBackdatedUsage: '1' } })
        });
        if (!putRes.ok) throw new Error(`Error updating invoice ${inv.Id}`);
        console.log(`Updated invoice ${inv.Id} with nrDeleteBackdatedUsage = '1'`);
    }
    return invoices.length;
}
