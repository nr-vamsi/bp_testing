/**
 * Shared mutable state.
 * All modules import this object and read/write its properties directly.
 */
export const state = {
    productsList: [],
    accountName: '',
    contractId: '',
    pricingId: '',
    contractRateId: '',
    accountProductId: '',
    contractStartDateValue: '',
    contractEndDateValue: '',
    selectedProductsDetails: [],
    contractName: '',
    sfAccId: '',
    contractProdIds: [],
    orgProdIds: [],
    orgGrpusageProducts: [],
    ccIdusageProducts: [],
    contractAccProd: [],
    ccidArray: [],
    orgGrpArray: [],
    TCId: '',
    ccidCount: 2,
    orgGrpPerCcid: 2,
    selectedBuyingProgram: '',
    savingsPlanData: {},
    csvFile: '',
    ripReplaceAccountIds: [],
    rippedContractId: '',
    isBackdated: false
};
