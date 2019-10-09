const express = require('express');
const path = require('path');

const billingRoute = express.Router();
const stripe = require("stripe")(process.env.SK);

// billingRoute.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, "../views/index.htm"));
// });


// Radar does not work with SetupIntent yet
billingRoute.post('/setup_intent', async (req, res) => {
    try {
        const setupIntent = await stripe.setupIntents.create({
            payment_method_types: ['card'],
            description: 'creating setupIntent SCA test',
            // usage: 'off_session',
            // confirm: true,
            payment_method_options: {
                card: {
                    // request_three_d_secure: 'any',  // workaround for Radar. Force 3DS. 
                    // moto: true,
                }
            },

        });
        res.status(200).json(setupIntent);
    } catch (err) {
        res.status(403).json({
            err
        });
    }
});

billingRoute.post('/customer/:pm', async (req, res) => {
    try {
        const customer = await stripe.customers.create({
            email: 'shengwei+setupIntent@stripe.com',
            payment_method: req.params.pm,
        });

        // Create an off-session PI and confirm it
        const offSessionPi = await stripe.paymentIntents.create({
            amount: 98765,
            currency: 'sgd',
            capture_method: 'automatic',
            confirm: true,
            customer: customer.id,
            off_session: true,
            payment_method: req.params.pm,
        });

        // Create an off-session invoice 
        const invoiceItem = await stripe.invoiceItems.create({
            customer: customer.id,
            amount: 2500,
            currency: "hkd",
            description: "One-time Off Session Invoice"
          }
        );
        let offSessionInvoice = await stripe.invoices.create({
            customer: customer.id,
            default_payment_method: req.params.pm,
            description: 'Off-Session Invoice',
            auto_advance: true,
        });

        await stripe.invoices.finalizeInvoice(offSessionInvoice.id);
        await stripe.invoices.pay(offSessionInvoice.id);

        offSessionInvoice = await stripe.invoices.retrieve(offSessionInvoice.id);

        res.status(200).json({customer, offSessionPi, offSessionInvoice});
    } catch (err) {
        res.status(403).json({
            err: `${err}`,
        });
    }
});


billingRoute.post('/payment_intent', async (req, res) => {
    try {
        const {manual, pm, save2cust} = req.query;
        console.log(req.query, req.params);

        const paymentIntent = manual ? (await stripe.paymentIntents.create({
            amount: 199,
            currency: 'sgd',
            confirm: true,
            return_url: 'https://shengwei.ngrok.io/sca',
            confirmation_method: 'manual',
            payment_method: pm,
            setup_future_usage: 'off_session',
            payment_method_options: {
                card: {
                    // request_three_d_secure: 'any'
                    mit_exemption: {
                        claim_without_transaction_id: true  // Requires confirm: true
                    },
                }
            },
        })) 
        : 
        (await stripe.paymentIntents.create({
            amount: 199,
            currency: 'sgd',
            // off_session: true, // Requires confirm: true
            payment_method_options: {
                card: {
                    request_three_d_secure: 'any'
                }
            },
            setup_future_usage: 'off_session',
        }));
        res.status(200).json(paymentIntent);
    } catch (err) {
        res.status(403).json({
            err
        });
    }
});

billingRoute.post('/payment_intent/confirm/:id', async (req, res) => {
    try {
        console.log(req.query, req.params);
        let {save2cust, pm} = req.query;
        let customer = null;
        let pi = await stripe.paymentIntents.confirm(req.params.id, {
            // off_session: false,
        });
        console.log(pi);
        
        if (save2cust) {
            customer = await stripe.customers.create({
                email: 'shengwei+savepmtocust@stripe.com',
                payment_method: pi.payment_method,
                // off_session: true,
            });
            console.log(customer);
        }

        res.status(200).json({pi, query: req.query, params: req.params, customer});
    } catch (err) {
        console.error(err);
        res.status(403).json({
            err: `${err}`,
        });
    }
});

billingRoute.post('/payment_intent/update/:id', async (req, res) => {
    try {
        const {id} = req.params;
        let paymentIntent = await stripe.paymentIntents.update(id, {
            ...req.body
        });
        
        paymentIntent = await stripe.paymentIntents.confirm(id, {
            off_session: false,
        })

        res.status(200).json(paymentIntent);
    } catch (err) {
        res.status(403).json({
            err
        });
    }
});


billingRoute.post('/payment_intent/', async (req, res) => {
    try {
        
    } catch (err) {
        res.status(403).json({err});
    }
})

// SCA subscriptions
billingRoute.post('/sub/create', async (req, res) => {
    let options = req.body || {};
    console.log(options);
    try {
        let customer = await stripe.customers.create({
            email: 'shengwei+sca@stripe.com',
            description: 'test sca billing',
        });

        let defaultpm = await stripe.paymentMethods.attach('pm_card_visa', {customer: customer.id});
        customer = await stripe.customers.update(customer.id, {
            invoice_settings: {
                default_payment_method: defaultpm.id,
            }
        });
        
        let pm = await stripe.paymentMethods.attach('pm_card_authenticationRequiredChargeDeclinedInsufficientFunds', {customer: customer.id});

        let subscription = await stripe.subscriptions.create({
            customer: customer.id,
            default_payment_method: pm.id, 
            items: [
                {
                    plan: options.plan || 'plan_Ep2FW6DsIJyiOK',
                    // tax_rates: options.tax || 'txr_1DwOUjAMaLRkBfSZOi6o8ag5',
                }
            ],
            payment_behavior: 'allow_incomplete', // This is the default, another option: error_if_incomplete
                                                  // Required for API version older > 2019-03-14
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],   
            ...options,
            // trial_period_days: 3,   // This will not immediately goes to require action as there is no payment happens
                                    // This will however has a pending_setup_intent created.
        });

        // const invoice = await stripe.invoices.create({
        //     customer: customer.id,
        // })
        // console.log(invoice);

        let pi = subscription.latest_invoice.payment_intent;
        switch (subscription.status) {
            case 'incomplete':
                console.log('Payment failed, it might due to SCA requirements ');
                if (pi.status === 'requires_payment_method') {
                    // Payment Failed: POST /v1/invoices/:id/pay ?
                    
                } else if (pi.status === 'requires_action') {
                    // Handling SCA 
                    console.log('Need to handle SCA now');
                }
                break;
            case 'incomplete_expired':
                break;
            case 'active':
                // Payment Successful
                break;
            case 'trialing':
                // This will need to check the setup intent
                break;
            default:
                break;
        }

        res.status(200).json({
            subscription,
            // customer,
        })
    } catch (err) {
        res.status(403).json({
            msg: 'Create Susbscription failed',
            err: `${err}`,
        })
    }
});

billingRoute.post('/sub/:id/update', async (req, res) => {
    console.log('Try end trial of the current user ');
    try {
        const sid = req.params.id;
        // let subscription = await stripe.subscriptions.retrieve(sid);
        let subscription = await stripe.subscriptions.update(sid, {
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
            ...req.body,
            off_session: true,  // This is requried!!! by default, subscription udpate is considered on-session,
                                // You will need to explictly asking to skip this steps. else the status will be require action.
        });
        res.status(200).json(subscription);
    } catch (err) {
        res.status(403).json({
            msg: 'Update Susbscription failed',
            err: `${err}`,
        })
    }

});

billingRoute.post('/sub/payinvoice', async (req, res) => {
    const {sid, pm} = req.body; 
    try {
        const subscription = await stripe.subscriptions.retrieve(sid);
        // attach the payment_method
        await stripe.paymentMethods.attach(pm, {customer: subscription.customer});
        
        const invoice = await stripe.invoices.pay(subscription.latest_invoice.id, {
            paymet_method: pm,
        });

        res.status(200).json({invoice})
    } catch (err) {
        res.status(402).json({
            msg: 'Invoice payment failed',
            err: `${err}`,
        })
    }
});

module.exports = billingRoute;
