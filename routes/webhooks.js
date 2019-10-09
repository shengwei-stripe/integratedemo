const express = require('express');
const bodyParser = require('body-parser');

const webhookApp = express.Router();
const stripe = require("stripe")(process.env.SK);

webhookApp.use(bodyParser.raw({
    type: '*/*'
}));

webhookApp.use('/signature/check', (req, res) => {
    const endpointSecret = process.env.WHSK;
    const signature = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(req.body.toString('utf-8'), signature, endpointSecret);
    console.log('Construted events from signature ', event);

    res.status(200).send('OK');
});

module.exports = webhookApp;
