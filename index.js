const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser')
const ejs = require('ejs');

// Routes
const webhookRoute = require('./routes/webhooks');
const billingRoute = require('./routes/billing');
const setupRoute = require('./routes/setup');


app.use(express.static('static'))
app.engine('htm', ejs.renderFile)
app.set('view engine', 'htm');
app.set('views', path.join(__dirname, './views'))

// This has to be put before bodyParser.json() middleware
// Webhook Signature checking requires the RAW body
app.use('/webhooks', webhookRoute); 

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

// SetupIntent Route
app.use('/setup', setupRoute);

// Billing and Invoices
app.use('/billing', billingRoute);

app.get('/*', (req, res) => {
  res.render('index.htm', {pk: process.env.PK});
});

app.listen(process.env.PORT || 5003, () => {
  console.log(`Server started at http://localhost:${process.env.PORT || 5003}`);
});


