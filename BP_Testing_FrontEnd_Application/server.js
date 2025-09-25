const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

const corsOptions = {
    origin: 'http://127.0.0.1:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

/*/let productsList = [];

const csvFilePath = path.join(__dirname, 'csv', 'productList_QA.csv');

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    productsList.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });
  
*/
app.use(express.static(path.join(__dirname, 'src')));
app.use('/csv', express.static(path.join(__dirname, 'csv')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

/*
app.get('/products', (req, res) => {
    res.json(productsList);
});
*/

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
