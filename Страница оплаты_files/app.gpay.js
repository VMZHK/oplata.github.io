/**
 * Define the version of the Google Pay API referenced when creating your
 * configuration
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/object#PaymentDataRequest|apiVersion in PaymentDataRequest}
 */
var baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
};

/**
 * Card networks supported by your site and your gateway
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
 * @todo confirm card networks supported by your site and gateway
 */
var allowedCardNetworks = [/*"AMEX", "DISCOVER", "JCB",*/ "MASTERCARD", "VISA"];

/**
 * Card authentication methods supported by your site and your gateway
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
 * @todo confirm your processor supports Android device tokens for your
 * supported card networks
 */
var allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

/**
 * Identify your gateway and your site's gateway merchant identifier
 *
 * The Google Pay API response will return an encrypted payment method capable
 * of being charged by a supported gateway after payer authorization
 *
 * @todo check with your gateway on the parameters to pass
 * @see {@link https://developers.google.com/pay/api/web/reference/object#Gateway|PaymentMethodTokenizationSpecification}
 */
var tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        'gateway': 'wayforpay',
        'gatewayMerchantId': WayforpayInitParams.merchant //'wayforpayMerchantId'
    }
};

/**
 * Describe your site's support for the CARD payment method and its required
 * fields
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
 */
var baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks,
        billingAddressRequired: true,
        billingAddressParameters: {
            format: "FULL",
            phoneNumberRequired: true
        }
    }
};

/**
 * Describe your site's support for the CARD payment method including optional
 * fields
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
 */
var cardPaymentMethod = Object.assign(
    {},
    baseCardPaymentMethod,
    {
        tokenizationSpecification: tokenizationSpecification
    }
);

/**
 * An initialized google.payments.api.PaymentsClient object or null if not yet set
 *
 * @see {@link getGooglePaymentsClient}
 */
var paymentsClient = null;

/**
 * Configure your site's support for payment methods supported by the Google Pay
 * API.
 *
 * Each member of allowedPaymentMethods should contain only the required fields,
 * allowing reuse of this base request when determining a viewer's ability
 * to pay and later requesting a supported payment method
 *
 * @returns {object} Google Pay API version, payment methods supported by the site
 */
function getGoogleIsReadyToPayRequest() {
    return Object.assign(
        {},
        baseRequest,
        {
            allowedPaymentMethods: [baseCardPaymentMethod]
        }
    );
}

/**
 * Configure support for the Google Pay API
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/object#PaymentDataRequest|PaymentDataRequest}
 * @returns {object} PaymentDataRequest fields
 */
function getGooglePaymentDataRequest() {
    var paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.emailRequired = true;
    paymentDataRequest.merchantInfo = {
        // @todo a merchant ID is available for a production environment after approval by Google
        // See {@link https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist|Integration checklist}
        merchantId: '10407696085025166822',
        merchantName: WayforpayInitParams.domain,
        merchantOrigin: WayforpayInitParams.domain
    };
    return paymentDataRequest;
}

/**
 * Return an active PaymentsClient or initialize
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient|PaymentsClient constructor}
 * @returns {google.payments.api.PaymentsClient} Google Pay API client
 */
function getGooglePaymentsClient() {
    if ( paymentsClient === null ) {
        paymentsClient = new google.payments.api.PaymentsClient({environment: 'PRODUCTION'});
    }
    return paymentsClient;
}

/**
 * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
 *
 * Display a Google Pay payment button after confirmation of the viewer's
 * ability to pay.
 */
function onGooglePayLoaded() {
    var paymentsClient = getGooglePaymentsClient();
    paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
        .then(function(response) {
            if (response.result) {
                var btn = $('#gpay-button');
                if (btn.attr('data-mode') == 'container') {
                    document.getElementById('gpay-button').appendChild(paymentsClient.createButton({
                        buttonColor:    'black',
                        buttonType:     'buy',
                        buttonSizeMode: 'fill',
                        buttonLocale:   WayforpayInitParams.locale ? WayforpayInitParams.locale : 'uk',
                        onClick:        onGooglePaymentButtonClicked
                    }));
                    btn.show();
                } else {
                    btn.click(onGooglePaymentButtonClicked);//.show().attr('disabled', false);
                    Utils.enablePayButton(btn, 'g');
                }
                //$(document).trigger('showPayButton', 'g');
                Utils.sendLog('googlePay', 'show button');
            }
        })
        .catch(function(err) {
            // show error in developer console for debugging
            Utils.sendLog('googlePayError', err);
            console.error(err);
        });
}

/**
 * Provide Google Pay API with a payment amount, currency, and amount status
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/object#TransactionInfo|TransactionInfo}
 * @returns {object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
 */
function getGoogleTransactionInfo() {
    var currency = WayforpayInitParams.currency;
    var amount   = WayforpayInitParams.amount;
    if (App.freeAmount.amount.length > 0) {
        amount   = App.freeAmount.getAmount();
        currency = App.freeAmount.getCurrency();
    }
    return {
        currencyCode: currency,
        totalPriceStatus: 'FINAL',
        countryCode: 'UA',
        // set to cart total
        totalPrice: amount + ''
    };
}

/**
 * Show Google Pay payment sheet when Google Pay payment button is clicked
 */
function onGooglePaymentButtonClicked() {
    App.formGpay.revalidate();
    if (!App.formGpay.form.isAllowedSend()) {
        Utils.stopEvent(event);
        return;
    }

    var paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();

    var paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest)
        .then(function(paymentData) {
            $('#gpay-payment').val(JSON.stringify(paymentData));
            Utils.showOverlay();
            var s = Utils && Utils.urlParam('vkh');
            $.ajax({
                type: "post",
                url: App.formGpay.form.attr('action'),
                data: App.formGpay.form.serialize()
            }).done(function (response) {
                $('#gpay-payment').val('');
                if (response) {
                    var data = $.parseJSON(response);
                    if (data.status === 'reload') {
                        location.href = data.url;
                    } else if (data.status === 'error') {
                        // error
                        Utils.removeOverlay();
                    }
                }
            }).fail(function () {
                $('#gpay-payment').val('');
            });
        })
        .catch(function(err) {
            Utils.sendError(err);
        });
}




var resource = document.createElement('script');
resource.async = "true";
resource.src = "https://pay.google.com/gp/p/js/pay.js";
resource.onload = onGooglePayLoaded;
var script = document.getElementsByTagName('script')[0];
script.parentNode.insertBefore(resource, script);