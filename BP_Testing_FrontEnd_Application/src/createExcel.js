export async function createExcel(accountDetailsArray, contractDetailsArray, contractRateDetailsArray, accountProductDetailsArray, TCId) {
    const workbook = new ExcelJS.Workbook();
    const accountSheet = workbook.addWorksheet('Account Details');
    const contractSheet = workbook.addWorksheet('Contract Details');
    const contractRateSheet = workbook.addWorksheet('ContractRate Details');
    const accountProductSheet = workbook.addWorksheet('AccountProduct Details');

    // Add headers
    accountSheet.columns = [
        { header: 'Name', key: 'name' },
        { header: 'Value', key: 'value' }
    ];
    contractSheet.columns = [
        { header: 'Name', key: 'name' },
        { header: 'Value', key: 'value' }
    ];
    contractRateSheet.columns = [
        { header: 'Name', key: 'name' },
        { header: 'Value', key: 'value' }
    ];
    accountProductSheet.columns = [
        { header: 'Name', key: 'name' },
        { header: 'Value', key: 'value' }
    ];

    // Add data to sheets
    accountDetailsArray.forEach(detail => {
        accountSheet.addRow({ name: detail.name, value: detail.value });
    });
    contractDetailsArray.forEach(detail => {
        contractSheet.addRow({ name: detail.name, value: detail.value });
    });
    contractRateDetailsArray.forEach(detail => {
        contractRateSheet.addRow({ name: detail.name, value: detail.value });
    });
    accountProductDetailsArray.forEach(detail => {
        accountProductSheet.addRow({ name: detail.name, value: detail.value });
    });

    // Save the workbook
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, TCId+'Results.xlsx');
}
