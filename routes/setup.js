const express = require('express');
const path = require('path');

const setupRoute = express.Router();
const stripe = require("stripe")(process.env.SK);


//Step 1: create setup_intent
setupRoute.post('/setup_intent', async (req, res) => {
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
});


module.exports = setupRoute;