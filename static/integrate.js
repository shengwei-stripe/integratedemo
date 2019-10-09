$(document).ready(async () => {

    // Step 1: Retrieve Setup Intent 
    let setupIntent = await postData('/setup/setup_intent');
    $('#setup-intent-id').text(setupIntent.id);

    // Step 2: Render the Elements
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

    // Step 3: Setup Card with card Information
    $('#setup-btn').on('click', async () => {
        const cardSetupResult = await stripe.handleCardSetup(setupIntent.client_secret, cardElement);
        log({cardSetupResult});
    });








});


// const log = (msg) => {
//     const date = new Date();
//     const timestamp = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}}`;

//     if (typeof msg === 'string') {
//         $('#logs').append(`<br/>//[${timestamp}] ${msg} ...<br/>`);
//     } else {
//         $('#logs').append(`//[${timestamp}] Result: <br/>`);
//         $('#logs').append(JSON.stringify(msg, null, 3));
//     }
//     $("#logs").animate({
//         scrollTop: $('#logs').prop("scrollHeight")
//     }, 400);
// };


// const stripe = Stripe('pk_test_E18wxaJ00YkcOqsOZMh1HGLM');

// var currentPI = null;
// $(document).ready(async () => {
//     const queries = window.location.search.replace('?', '').split('&').reduce((result, q) => {
//         const [name, value] = q.split('=');
//         result[name] = value;
//         return result;
//     }, {});

//     // Frontend Only integration
//     // Step 1; Create PaymentIntent
//     $.post('/sca/payment_intent')
//         .done(function (data) {
//             log(data);
//             $('#payment-submit-btn').attr('data-secret', data.client_secret);
//             $('#payment-submit-btn').prop('disabled', false);
//             currentPI = data.id;
//         })
//         .fail(function (err) {
//             log(err);
//             $('#payment-submit-btn').prop('disabled', true);
//         })



//     // Step 2: Collect PaymentInformation
//     var elements = stripe.elements({});
//     var style = {
//         base: {
//             color: '#474747',
//             lineHeight: '20px',
//             fontFamily: '"SourceSansProLight", Arial, sans-serif',
//             fontSmoothing: 'antialiased',
//             fontSize: '18px',
//             '::placeholder': {
//                 color: '#A9A9A9'
//             }
//         },
//         invalid: {
//             color: '#fa755a',
//             iconColor: '#fa755a'
//         }
//     };

//     // Create an instance of the card Element.
//     var cardElement = elements.create('card', {
//         style: style
//     });

//     // Add an instance of the card Element into the card-element <div>.
//     cardElement.mount('#card-element');

//     // Handle real-time validation errors from the card Element.
//     cardElement.addEventListener('change', function (event) {
//         console.log('Elements Change Event ', event);

//         var displayError = document.getElementById('card-errors');
//         var submitButton = document.getElementById('payment-submit-btn');
//         if (event.error) {
//             displayError.textContent = event.error.message;
//             submitButton.setAttribute("disabled", "disabled");
//         } else if (event.brand === 'amex') {
//             displayError.textContent = 'Amex is not supported';
//             // submitButton.setAttribute("disabled", "disabled");
//         } else {
//             displayError.textContent = '';
//             submitButton.removeAttribute("disabled");
//         }
//     });

//     var pendingSetupIntent = null;
//     const handleSetupResult = (result) => {
//         const {
//             error,
//             setup_intent
//         } = result;
//         if (error) {
//             log('======= Setup Failed ======');
//             pendingSetupIntent = result.error.setup_intent;
//             alert(`Setup failed due to ${result.error.message}. Please try another card`);
//             return false;
//         }

//         $.post(`/sca/customer/${result.setupIntent.payment_method}`)
//             .done(customer => {
//                 log(customer)
//             })
//             .fail(err => {
//                 log(err)
//             });
//         return true;
//     }

//     $('#setup-btn').on('click', async () => {
//         if (pendingSetupIntent) {
//             switch (pendingSetupIntent.status) {
//                 case 'requires_payment_method':
//                 case 'requires_action':
//                     const result = await stripe.handleCardSetup(pendingSetupIntent
//                         .client_secret, cardElement);
//                     log(result);
//                     handleSetupResult(result);
//                     break;
//                 default:
//                     log('Clearing the setup intent and create a new one');
//                     pendingSetupIntent = null;
//                     break;
//             }
//         }

//         $.post('/sca/setup_intent')
//             .done(async (data) => {
//                 log('Setup Intent Created');
//                 log(data);
//                 const result = await stripe.handleCardSetup(data.client_secret,
//                     cardElement);
//                 log(result);
//                 handleSetupResult(result);
//             })
//             .fail(function (err) {
//                 log(err);
//             })

//     });


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