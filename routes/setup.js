const express = require('express');

const setupRoute = express.Router();
const stripe = require("stripe")(process.env.SK);


//Step 1: create setup_intent
setupRoute.post('/setup_intent', async (req, res) => {
    try {
        const setupIntent = await stripe.setupIntents.create({
            payment_method_types: ['card'],
            description: 'creating setupIntent SCA test',
            payment_method_options: {
                card: {
                    // request_three_d_secure: 'any',  // workaround for Radar. Force 3DS. 
                    // moto: true,
                }
            },

        });
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
            await stripe.paymentMethods.attach(pm, {
                customer: customer.data[0].id
            });
            customer = await stripe.customers.update(customer.data[0].id, {
                invoice_settings: {
                    default_payment_method: pm,
                }
            });
        } else {
            customer = await stripe.customers.create({
                email,
                payment_method: pm,
                invoice_settings: {
                    default_payment_method: pm,
                }
            })
        }
        res.status(200).json(customer);
    } catch (err) {
        res.status(400).json({
            err: `${err}`
        });
    }
});

module.exports = setupRoute;