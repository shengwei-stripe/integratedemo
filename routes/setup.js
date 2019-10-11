const express = require('express');

const setupRoute = express.Router();
const stripe = require("stripe")(process.env.SK);


//Step 1: create setup_intent
setupRoute.post('/setup_intent', async (req, res) => {
    try {
        const setupIntent = null;
        res.status(200).json(setupIntent);
    } catch (err) {
        res.status(400).json({
            err: `${err}`
        });
    }
});

//Step 2: Save card to customer
setupRoute.post('/save_pm', async (req, res) => {
    try {
        let {
            email,
            pm
        } = req.body;

        let customer = await stripe.customers.list({
            email
        });
        if (customer.data.length > 0) {
            // Attach the payment_method
        } else {
            // Create the customer with the payment_method
        }
        res.status(200).json(customer);
    } catch (err) {
        res.status(400).json({
            err: `${err}`
        });
    }
});

module.exports = setupRoute;