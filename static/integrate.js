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

    
    // Checkout Button creating subscriptions
    $('#checkout-btn').on('click', () => {
        stripe.redirectToCheckout({
            items: [{plan: 'plan_Fu2ftJ29CQ6OxR', quantity: 1}],
            successUrl: 'http://localhost:5003/',
            cancelUrl: 'http://localhost:5003/',
          });
    });

});


