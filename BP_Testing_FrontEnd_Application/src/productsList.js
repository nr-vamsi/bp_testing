import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const productsList = [];

const csvFilePath = path.join(__dirname, 'productList.csv');

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    productsList.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

export { productsList };
