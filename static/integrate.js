$(document).ready(async () => {
    // ===============================
    // Setup Intent 
    // ===============================
    // Step 1: Render the Elements
    const stripe = Stripe('pk_test_E18wxaJ00YkcOqsOZMh1HGLM');
    var elements = stripe.elements({});
    var style = {
        base: {
            color: '#474747',
            lineHeight: '20px',
            fontFamily: '"SourceSansProLight", Arial, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '18px',
            '::placeholder': {
                color: '#A9A9A9'
            }
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        }
    };
    var cardElement = elements.create('card', {
        style: style
    });
    cardElement.mount('#card-element');
    cardElement.addEventListener('change', (event) => {
        $('#card-errors').text(event.error ? event.error.message : '');
        if (event.error) {
            $('#setup-btn').addClass('disabled');
        } else {
            $('#setup-btn').removeClass('disabled');
        }
    });

    // Step 2: Setup Card with card Information when submit button is clicked
    $('#setup-btn').on('click', async () => {
        // Step 2.1: Create SetupIntent at server side
        let {id: setupIntentId, client_secret: clientSecret} = await postData('/setup/setup_intent');
        $('#setup-intent-id').text(setupIntentId);
        
        // Step 2.2: Call handleCardSetup to complete the setup
        let {setupIntent, error} = await stripe.handleCardSetup(clientSecret, cardElement);
        log({setupIntent, error});

        // Step 2.3: Save the setup with payment_method
        let customer = await postData('/setup/save_pm', {
            customer: $('#customer-email').val(),
            pm: setupIntent.payment_method,
        });
        log(customer);
        $('#currentCustomer').val(`${customer.email}`);
    });

    // ===============================
    // Billings 
    // ===============================
    $('#load-plans-btn').on('click', async () => {
        let plans = await getData('/billing/plans');
        $('#plans').find('option')
            .remove()
            .end()
            .append(new Option('Select plan to subscribe to', ''));

        plans.forEach(p => {
            $("#plans").append(new Option(`${p.product} - ${p.nickname}`, p.id));
        });
    });

    $('#subscribe-to-plan-btn').on('click', async () => {
        let plan = $( "select#plans" ).val();
        if (!plan) {
            return alert('Please select a plan to continue!');
        }
        
        let customer = $('#currentCustomer').val();
        if (!customer) {
            return alert('Please enter customer email to continue!');
        }

        let subscription = await postData('/billing/subscribe', {
            plan, customer
        });

        // Handle Subscription Status
        $('#subscription-id').text(subscription.id);
        $('#subscription-status').text(subscription.status);
        handleSubscriptionStatus(subscription);
    });

    const handleSubscriptionStatus = async (sub) => {
        if (sub.status === 'incomplete') {
            // Check the latest_invoice.payment_intent status
            $('#invoice-pi-status').text(sub.latest_invoice.payment_intent.status);
            switch (sub.latest_invoice.payment_intent.status) {
                case 'requires_action':
                    await stripe.handleCardPayment(sub.latest_invoice.payment_intent.client_secret);
                    break;
                case 'requires_payment_method':
                    break;
            }

            // Refresh the subscription status
            sub = await getData(`/billing/subscription/${sub.id}`);
            $('#subscription-status').text(sub.status);
            $('#invoice-pi-status').text(sub.latest_invoice.payment_intent.status);
        } else {
            alert('Subscription created!!');
        }
    };


});





//     if (queries.payment_intent && queries.payment_intent_client_secret) {
//         log('============ Payment_inetnt exists in query string, meaning it might be a call back from manual confirmation ========')
//         let {
//             paymentIntent: pi
//         } = await stripe.retrievePaymentIntent(queries.payment_intent_client_secret)
//         log(pi);
//         let saveToCustomer = $('#saveToCustomer').is(':checked');
//         switch (pi.status) {
//             case 'requires_confirmation':
//                 // Do a server side confirmation
//                 $.post(`/sca/payment_intent/confirm/${pi.id}?save2cust=true`)
//                     .done(function (data) {
//                         log(data);
//                     })
//                     .fail(function (err) {
//                         log(err);
//                     });
//                 break;

//             case 'requires_payment_method':
//                 // create payment_method
//                 alert('click manual confirmation to continue');
//                 let {
//                     paymentMethod: newpm
//                 } = await stripe.createPaymentMethod('card', cardElement);
//                 $.ajax({
//                     url: `/sca/payment_intent/update/${pi.id}`,
//                     data: JSON.stringify({
//                         payment_method: newpm.id,
//                         metadata: {
//                             serverNumber: "41",
//                             totalAttempts: "2",
//                             totalCardsAttempted: "2",
//                             clientIP: "127.0.0.1",
//                             siteId: "1",
//                             roomName: "nick di giovanni",
//                             sourceCode: "LEXYLSUPP1459593",
//                             cardsAttempted: "tYHWBxFOKWRf0QPc,u7pPH6JhbGBYzlRJ",
//                             cartId: "7513E12D-0176-9DCD-47ABB43E41AA0430"
//                         },
//                         currency: "sgd",
//                         description: "INDIVIDUAL :: Agoda Rate",
//                         amount: "199",
//                         statement_descriptor: "Breakers Hote"
//                     }),
//                     contentType: "application/json",
//                     type: 'POST',
//                     success: function (data) {
//                         log(data)
//                     },
//                     fail: (err) => {
//                         log(err)
//                     }
//                 });
//                 break;
//         }
//     }

//     $('#payment-manual-confirm-btn').on('click', async (event) => {
//         let saveToCustomer = $('#saveToCustomer').is(':checked');
//         if (queries.payment_intent && queries.payment_intent_client_secret) {
//             let {
//                 paymentIntent: pi
//             } = await stripe.retrievePaymentIntent(queries.payment_intent_client_secret)
//             log(pi);

//             switch (pi.status) {
//                 case 'requires_confirmation':
//                     // Do a server side confirmation
//                     $.post(
//                             `/sca/payment_intent/confirm/${pi.id}?save2cust=${saveToCustomer}`
//                         )
//                         .done(function (data) {
//                             log(data);
//                         })
//                         .fail(function (err) {
//                             log(err);
//                         });
//                     break;

//                 case 'requires_action':
//                     // Maynot needed as in the server side manual confirmation.
//                     // Just set confirm=true
//                     break;

//                 case 'requires_payment_method':
//                     // create payment_method
//                     let {
//                         paymentMethod: newpm
//                     } = await stripe.createPaymentMethod('card', cardElement);

//                     $.ajax({
//                         url: `/sca/payment_intent/update/${pi.id}`,
//                         data: JSON.stringify({
//                             payment_method: newpm.id,
//                             metadata: {
//                                 serverNumber: "41",
//                                 totalAttempts: "2",
//                                 totalCardsAttempted: "2",
//                                 clientIP: "127.0.0.1",
//                                 siteId: "1",
//                                 roomName: "nick di giovanni",
//                                 sourceCode: "LEXYLSUPP1459593",
//                                 cardsAttempted: "tYHWBxFOKWRf0QPc,u7pPH6JhbGBYzlRJ",
//                                 cartId: "7513E12D-0176-9DCD-47ABB43E41AA0430"
//                             },
//                             currency: "sgd",
//                             description: "INDIVIDUAL :: Agoda Rate",
//                             amount: "199",
//                             statement_descriptor: "Breakers Hote"
//                         }),
//                         contentType: "application/json",
//                         type: 'POST',
//                         success: function (data) {
//                             log(data)
//                         },
//                         fail: (err) => {
//                             log(err)
//                         }
//                     });

//                     break;
//             }


//             return;
//         }
//         // Create a payment_method
//         let {
//             paymentMethod: manualPm
//         } = await stripe.createPaymentMethod('card', cardElement);
//         console.log(manualPm);
//         return;

//         $.post(`/sca/payment_intent?manual=1&pm=${manualPm.id}&save2cust=${saveToCustomer}`)
//             .done(function (data) {
//                 log('=========== Manual ===========')
//                 log(data);
//                 const {
//                     status,
//                     next_action: action,
//                     client_secret
//                 } = data;

//                 if (status === 'requires_action') {
//                     log('=> requires_action: ')
//                     log(action);

//                     switch (action.type) {
//                         case 'redirect_to_url':
//                             window.location = action.redirect_to_url.url;
//                             break;
//                         default:
//                             log(
//                                 '=> Handle card action in the frontend using Stripe SDK'
//                             );
//                             stripe.handleCardAction(client_secret).then(result => {
//                                 console.log(result);

//                                 log(result);
//                                 log('=> Handle card action in the frontend');
//                                 // POST the data back and let server confirm it
//                                 $.post(
//                                         `/sca/payment_intent/confirm/${result.paymentIntent.id}?save2cust=${saveToCustomer}`
//                                     )
//                                     .done(function (data) {
//                                         log(data);
//                                     })
//                                     .fail(function (err) {
//                                         log(err);
//                                     });
//                             });
//                             break;
//                     }
//                 }
//             })
//             .fail(function (err) {
//                 log(err);
//                 $('#payment-manual-confirm-btn').prop('disabled', true);
//             })
//     });

//     $('#payment-submit-btn').on('click', async (event) => {
//         const clientSecret = $('#payment-submit-btn').attr('data-secret');
//         // Confirm the PaymentIntent
//         const requestData = {
//             payment_method_data: {
//                 billing_details: {
//                     email: 'shengwei@stripe.com',
//                     name: 'shengwei',
//                 }
//             },
//             shipping: {
//                 address: {
//                     line1: 'Address line 1', // Required
//                 },
//                 name: 'shengwei wu', // Required
//             },
//             receipt_email: 'Shengwei@stripe.com',
//             save_payment_method: false, // Customer ID is required if using this flag
//         };
//         log(requestData);

//         const result = await stripe.handleCardPayment(clientSecret, cardElement,
//             requestData);
//         // Or if you have a PaymentMethod, you could use the ID instead
//         // requestData.payment_method = 'pm_xxxx';
//         // const result = await stripe.handleCardPayment(clientSecret, requestData);

//         log(result);
//         if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
//             alert('Payment successful, kick start your order fullfilment now');
//             log('Payment Successful');
//         }
//     });

//     // =======================================
//     // SCA Billings
//     $('#sub-onsession').on('click', () => {
//         const createTrialSub = $('#createTrialSub').is(':checked');
//         let subData = createTrialSub ? {
//             trial_period_days: 3
//         } : {};
//         $.ajax({
//             url: '/sca/sub/create',
//             data: JSON.stringify({
//                 ...subData,
//             }),
//             contentType: "application/json",
//             type: 'POST',
//             success: function (data) {
//                 log(data);
//                 handleScaBilling(data.subscription);
//             },
//             fail: (err) => {
//                 log({
//                     err
//                 });
//             }
//         });
//     });

//     var currentSubscription = null;
//     const handleScaBilling = (subscription) => {
//         currentSubscription = subscription;
//         let {
//             latest_invoice: {
//                 payment_intent: pi
//             },
//             pending_setup_intent: psi
//         } = subscription;
//         switch (subscription.status) {
//             case 'incomplete':
//                 console.log('Payment failed, it might due to SCA requirements ');
//                 if (pi.status === 'requires_payment_method') {
//                     // Payment Failed: POST /v1/invoices/:id/pay ?
//                     alert('Subscription creation failed, please try using another card');

//                 } else if (pi.status === 'requires_action') {
//                     // Handling SCA 
//                     log('==== Require Action: Need to handle SCA now ====');
//                     stripe.handleCardPayment(pi.client_secret)
//                         // stripe.handleCardAction(pi.client_secret) // This is wrong and will create error
//                         .then(piResult => {
//                             log({
//                                 piResult
//                             });
//                         }).catch(err => {
//                             log({
//                                 piErr: err
//                             });
//                         });
//                 }
//                 break;
//             case 'incomplete_expired':
//                 break;
//             case 'active':
//                 // Payment Successful
//                 log('===== Payment Successful =====');
//                 break;
//             case 'trialing':
//                 log(
//                     '======== This is scenario 2: delayed payment. We could setup the pending setup ======'
//                 );

//                 stripe.handleCardSetup(psi.client_secret) // This is wrong and will create error
//                     .then(siResult => {
//                         log({
//                             siResult
//                         });
//                     }).catch(err => {
//                         log({
//                             siErr: err
//                         });
//                     });
//                 break;
//             default:
//                 break;
//         }
//     }

//     $('#sub-endtrial').on('click', async () => {
//         if (!currentSubscription) {
//             alert('create subscription first');
//         }
//         $.ajax({
//             url: `/sca/sub/${currentSubscription.id}/update`,
//             data: JSON.stringify({
//                 trial_end: 'now',
//             }),
//             contentType: "application/json",
//             type: 'POST',
//             success: function (data) {
//                 log(data);
//                 alert(
//                     'Done. Check the subscription should be active WITHOUT requiring additional action'
//                 );
//             },
//             fail: (err) => {
//                 log({
//                     err
//                 });
//             }
//         });
//     });

//     // Sub Payment Failed or Off-Session payment
//     var subElements = stripe.elements({});
//     var subCardElement = subElements.create('card', {
//         style: style
//     });
//     subCardElement.mount('#sub-card-element');
//     $('#subscribe-btn').on('click', async () => {
//         if (!currentSubscription) {
//             alert('create subscription first');
//         }
//         let pm = await stripe.createPaymentMethod('card', subCardElement, {});
//         // Pay the subscription with the new payment_method. 
//         $.ajax({
//             url: '/sca/sub/payinvoice',
//             data: JSON.stringify({
//                 pm,
//                 sid: currentSubscription.id,
//             }),
//             contentType: "application/json",
//             type: 'POST',
//             success: function (data) {
//                 log(data);
//                 alert('done');
//             },
//             fail: (err) => {
//                 log({
//                     err
//                 });
//             }
//         });
//     });

// })