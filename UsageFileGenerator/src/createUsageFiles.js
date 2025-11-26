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

async function createUserUsageFile(billingIdentifier, contractStartDate, usageProducts, fileName, folderName, contractId, contractEndDate) {
    const usageMappingUsers = await readCSV('/csv/usageMapping_Users.csv');
    const data = [['BillingIdentifier', 'ActivityDate', 'Quantity', 'UnitOfMeasure', 'FullPlatformUserEdition', 'Started', 'Ended', 'SFContractLineId']];
    
    const startDate = new Date(contractStartDate);
    const endDate = contractEndDate ? new Date(contractEndDate) : new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const dateRange = getDateRange(startDate, endDate);

    dateRange.forEach(dateStr => {
        usageProducts.forEach(product => {
            const mapping = usageMappingUsers.find(item => item.Product === product.Name);
            if (mapping) {
                const quantity = Math.floor(Math.random() * 10) + 1; // Random quantity 1-10
                data.push([
                    billingIdentifier,
                    dateStr,
                    quantity,
                    mapping.nrUnitOfMeasure,
                    mapping.nrFpuEdition,
                    dateStr,
                    dateStr,
                    ''
                ]);
            }
        });
    });

    console.log(`Generated ${data.length - 1} usage records for ${fileName}`);
    
    // Create folder name with contract ID
    const fullFolderName = `${folderName}_${contractId}`;
    saveCSV(`${fullFolderName}/${fileName}.csv`, data);
}

async function createNonUserUsageFile(billingIdentifier, contractStartDate, usageProducts, fileName, folderName, contractId, contractEndDate) {
    const usageNonMappingUsers = await readCSV('/csv/usageMapping_NonUsers.csv');
    const data = [['BillingIdentifier', 'ActivityDate', 'Quantity', 'UnitOfMeasure', 'FullPlatformUserEdition']];
    
    const startDate = new Date(contractStartDate);
    const endDate = contractEndDate ? new Date(contractEndDate) : new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const dateRange = getDateRange(startDate, endDate);

    dateRange.forEach(dateStr => {
        usageProducts.forEach(product => {
            const mapping = usageNonMappingUsers.find(item => item.Product === product.Name);
            if (mapping) {
                const quantity = Math.floor(Math.random() * 1000) + 100; // Random quantity 100-1100
                data.push([
                    billingIdentifier,
                    dateStr,
                    quantity,
                    mapping.nrUnitOfMeasure,
                    ''
                ]);
            }
        });
    });

    console.log(`Generated ${data.length - 1} usage records for ${fileName}`);
    
    // Create folder name with contract ID
    const fullFolderName = `${folderName}_${contractId}`;
    saveCSV(`${fullFolderName}/${fileName}.csv`, data);
}

function saveCSV(filePath, data) {
    const csvData = data.map(row => {
        if (Array.isArray(row)) {
            return row.join(',');
        } else {
            return Object.values(row).join(',');
        }
    }).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    // Extract folder name from file path
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderName = pathParts.length > 1 ? pathParts[0] : '';
    
    // Create a filename that includes folder information
    const downloadFileName = folderName ? `${folderName}_${fileName}` : fileName;
    
    window.saveAs(blob, downloadFileName);
}

export { createUserUsageFile, createNonUserUsageFile };
