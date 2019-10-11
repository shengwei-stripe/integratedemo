const express = require('express');
const path = require('path');

const billingRoute = express.Router();
const stripe = require("stripe")(process.env.SK);

billingRoute.get('/plans', async (req, res) => {
    try {
        const plans = (await stripe.plans.list({
                expand: ['data.product']
            }))
            .data.map(plan => {
                return {
                    id: plan.id,
                    nickname: plan.nickname,
                    product: plan.product.name
                }
            });
        res.status(200).json(plans);
    } catch (err) {
        res.status(400).json({
            err: `${err}`
        })
    }
});

billingRoute.get('/subscription/:id', async (req, res) => {
    try {
        const subscription = await stripe.subscriptions.retrieve(req.params.id, {
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        });
        res.status(200).json(subscription);
    } catch (err) {
        res.status(400).json({
            err: `${err}`
        })
    }
});


billingRoute.post('/subscribe', async (req, res) => {
    try {
        const {
            email,
            plan
        } = req.body;

        let customer = await stripe.customers.list({
            email
        });
        if (customer.data.length < 1) {
            throw new Error('Customer does not exists. Please setup a card first.');
        }

        const subscription = await stripe.subscriptions.create({
            customer: customer.data[0].id,
            items: [{
                plan
            }],
            off_session: true, // Try the differences on off_session and see how it goes
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        });

        res.status(200).json(subscription);
    } catch (err) {
        res.status(400).json({
            err: `${err}`
        })
    }
});

billingRoute.post('/pay', async (req, res) => {
    try {
        const {
            customer,
            pm,
            invoice,
        } = req.body;

        // Update customer with new Card 
        await stripe.paymentMethods.attach(pm, {
            customer
        });
        let updatedCustomer = await stripe.customers.update(customer, {
            invoice_settings: {
                default_payment_method: pm,
            }
        });

        // Pay the invoice 
        const paidInvoice = await stripe.invoices.pay(invoice, {
            off_session: true,
            expand: ['payment_intent']
        })

        res.status(200).json({updatedCustomer, paidInvoice});
    } catch (err) {
        res.status(400).json({
            err: `${err}`
        })
    }
});



module.exports = billingRoute;