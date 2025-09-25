import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import CONFIG from './config.js';

const productsList = [];

const csvFile = CONFIG.HOSTNAME === 'https://sandbox.billingplatform.com/newrelic_dev' 
    ? 'productList_QA.csv'
    : CONFIG.HOSTNAME === 'https://sandbox.billingplatform.com/newrelic2_dev'
    ? 'productList_DEV.csv'
    : 'productList_QA.csv'; // default

const csvFilePath = path.join(__dirname, csvFile);

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    productsList.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

export { productsList };
