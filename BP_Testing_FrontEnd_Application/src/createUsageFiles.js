// No need to import 'file-saver' as it is included in the HTML file

async function readCSV(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();
    const rows = data.split('\n');
    const headers = rows[0].split(',');
    return rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((object, header, index) => {
            object[header] = values[index];
            return object;
        }, {});
    });
}

function getDateRange(start, end) {
    const dates = [];
    let current = new Date(start);
    end = new Date(end);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

async function createUserUsageFile(billingIdentifier, contractStartDate, usageProducts, selectedTcId, accountLevel) {
    const usageMappingUsers = await readCSV('/csv/usageMapping_Users.csv');
    const data = [['BillingIdentifier', 'ActivityDate', 'Quantity', 'UnitOfMeasure', 'FullPlatformUserEdition', 'Started', 'Ended', 'SFContractLineId']]; // Header row
    const startDate = new Date(contractStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of the month

    const dateRange = getDateRange(startDate, endDate);

    dateRange.forEach(dateStr => {
        usageProducts.forEach(product => {
            const mapping = usageMappingUsers.find(item => item.Product === product.ContractRateLabel);
            if (mapping) {

                const quantity = Math.floor(Math.random() * 10);
                data.push({
                    BillingIdentifier: billingIdentifier,
                    UsageDate: dateStr,
                    Quantity: quantity,
                    UnitOfMeasure: mapping.nrUnitOfMeasure,
                    FPUEdition: mapping.nrFpuEdition,
                    StartDate: dateStr,
                    EndDate: dateStr,
                    SFContractLineId: ''
                });

            }
        });
    });

    saveCSV(accountLevel + '_' + selectedTcId + '_' + 'Users.csv', data);
}

async function createNonUserUsageFile(billingIdentifier, contractStartDate, usageProducts, selectedTcId, accountLevel) {
    const usageNonMappingUsers = await readCSV('/csv/usageMapping_NonUsers.csv');
    const data = [['BillingIdentifier', 'ActivityDate', 'Quantity', 'UnitOfMeasure', 'FullPlatformUserEdition']]; // Header row
    const startDate = new Date(contractStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of the month

    const dateRange = getDateRange(startDate, endDate);

    dateRange.forEach(dateStr => {
        usageProducts.forEach(product => {
            const mapping = usageNonMappingUsers.find(item => item.Product === product.ContractRateLabel);
            if (mapping) {

                const quantity = Math.floor(Math.random() * 100);
                data.push({
                    BillingIdentifier: billingIdentifier,
                    START_TIME: dateStr,
                    QUANTITY: quantity,
                    UOM: mapping.nrUnitOfMeasure,
                    FPUEdition: ''
                });

            }
        });
    });

    saveCSV(accountLevel + '_' + selectedTcId + '_' + 'NonUsers.csv', data);
}

function saveCSV(filePath, data) {
    const csvData = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    window.saveAs(blob, filePath);
}

export { createUserUsageFile, createNonUserUsageFile };
