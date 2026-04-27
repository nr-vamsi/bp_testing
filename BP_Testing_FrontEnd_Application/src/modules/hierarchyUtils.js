/** Builds the ordered account hierarchy array for a given structure. */
export function generateAccountHierarchy(accountStructure, ccidCount = 2, orgGrpPerCcid = 2) {
    const hierarchy = ['UltimateParent', 'Parent'];
    if (accountStructure === 'single-ccid') {
        hierarchy.push('BillingPortfolio', 'CCID', 'OrgGrp');
    } else if (accountStructure === 'multi-ccid-shared-pool') {
        hierarchy.push('BillingPortfolio');
        for (let i = 1; i <= ccidCount; i++) {
            hierarchy.push(`CCID${i}`);
            for (let j = 1; j <= orgGrpPerCcid; j++) hierarchy.push(`OrgGrp${i}${j}`);
        }
    } else if (accountStructure === 'multi-ccid-separate-pool') {
        for (const pool of ['A', 'B']) {
            hierarchy.push(`BillingPortfolio${pool}`);
            for (let i = 1; i <= ccidCount; i++) {
                hierarchy.push(`CCID${i}${pool}`);
                for (let j = 1; j <= orgGrpPerCcid; j++) hierarchy.push(`OrgGrp${i}${j}${pool}`);
            }
        }
    }
    return hierarchy;
}

export function generateCCIDArray(ccidCount = 2) {
    return Array.from({ length: ccidCount }, (_, i) => `CCID${i + 1}`);
}

export function generateOrgGrpArray(ccidCount = 2, orgGrpPerCcid = 2) {
    const arr = [];
    for (let i = 1; i <= ccidCount; i++)
        for (let j = 1; j <= orgGrpPerCcid; j++) arr.push(`OrgGrp${i}${j}`);
    return arr;
}
