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

async function createUserUsageFile(billingIdentifier, contractStartDate, usageProducts, selectedTcId, accountLevel) {
    //const usersUsageTemplate = await readCSV('/csv/Users_usage_template.csv');
    const usageMappingUsers = await readCSV('/csv/usageMapping_Users.csv');
    const data = [['BillingIdentifier', 'UsageDate', 'Quantity', 'UnitOfMeasure','FPUEdition', 'StartDate', 'EndDate', 'SFContractLineId']]; // Header row
    const endDate = new Date(contractStartDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of the month

    usageProducts.forEach(product => {
        const mapping = usageMappingUsers.find(item => item.Product === product.ContractRateLabel);
        if (mapping) {
            const quantity = Math.floor(Math.random() * 10);
            data.push({
                BillingIdentifier: billingIdentifier,
                UsageDate: contractStartDate,
                Quantity: quantity,
                UnitOfMeasure : mapping.nrUnitOfMeasure,
                FPUEdition: mapping.nrFpuEdition,
                StartDate: contractStartDate,
                EndDate: endDate.toISOString().split('T')[0],
                SFContractLineId: ''
            });
        }
    });

    saveCSV(accountLevel+'_'+selectedTcId+'_'+'Users.csv', data);
}

async function createNonUserUsageFile(billingIdentifier, contractStartDate, usageProducts, selectedTcId, accountLevel) {
    //const usersNonUsageTemplate = await readCSV('/csv/NonUser_usage_template.csv');
    const usageNonMappingUsers = await readCSV('/csv/usageMapping_NonUsers.csv');
    const data = [['BillingIdentifier','START_TIME','QUANTITY','UOM','FPUEdition']]; // Header row
    const endDate = new Date(contractStartDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of the month

    usageProducts.forEach(product => {
        const mapping = usageNonMappingUsers.find(item => item.Product === product.ContractRateLabel);
        if (mapping) {
            const quantity = Math.floor(Math.random() * 10000);
            data.push({
                BillingIdentifier: billingIdentifier,
                START_TIME: contractStartDate,
                QUANTITY: quantity,
                UOM: mapping.nrUnitOfMeasure,
                FPUEdition: ''
            });
        }
    });

    saveCSV(accountLevel+'_'+selectedTcId+'_'+'NonUsers.csv', data);
}

function saveCSV(filePath, data) {
    const csvData = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    window.saveAs(blob, filePath);
}

export { createUserUsageFile, createNonUserUsageFile };
