if (window.ApplePaySession) {
    var merchantIdentifier = 'merchant.wayforpay.com';
    if (ApplePaySession.canMakePayments(merchantIdentifier)) {
        //$('#apple-pay').show().attr('disabled', false).closest('.pay-buttons').addClass('show-a');
        Utils.enablePayButton($('#apple-pay'), 'a');
        Utils.sendLog('applePay', 'show button');
        //$(document).trigger('showPayButton', 'a');
    }
}

$('#apple-pay').click(function () {
    App.formApay.revalidate();
    if (!App.formApay.form.isAllowedSend()) {
        Utils.stopEvent(event);
        return;
    }

    var currency = WayforpayInitParams.currency;
    var amount   = WayforpayInitParams.amount;
    if (App.freeAmount.amount.length > 0) {
        amount   = App.freeAmount.getAmount();
        currency = App.freeAmount.getCurrency();
    }

    var request = {
        countryCode: 'UA',
        currencyCode: currency,
        supportedNetworks: ['visa', 'masterCard'/*, 'amex', 'discover'*/],
        merchantCapabilities: ['supports3DS'],
        total: { label: 'wayforpay.com', amount: amount + '' },
        requiredShippingContactFields: ['email', 'phone']
    };
    var session = new ApplePaySession(3, request);

    session.onvalidatemerchant = function (event) {

        var data = {
            validationUrl: event.validationURL
        };

        $.post(Utils.safeUrl('/applepay/start'), data).then(function (result) {
            session.completeMerchantValidation(result);
        });
    };

    session.onpaymentauthorized = function (event) {
        $('#apay-cryptogram').val(JSON.stringify(event.payment.token));
        $('#apay-aemail').val(event.payment.shippingContact.emailAddress);
        $('#apay-aphone').val(event.payment.shippingContact.phoneNumber);

        Utils.showOverlay();
        //$.post(Utils.safeUrl('/applepay/process'), data).then(function (result) {
        $.post(
            Utils.safeUrl('/applepay/process'),
            App.formApay.form.serialize()
        ).then(function (result) {
            var status;
            if (
                result.status === 'Approved' ||
                result.status === 'InProcessing' ||
                result.status === 'Pending' ||
                result.status === 'WaitingAuthComplete'
            ) {
                status = ApplePaySession.STATUS_SUCCESS;
            } else {
                status = ApplePaySession.STATUS_FAILURE;
            }
            Utils.removeOverlay();
            session.completePayment({ status: status, errors: [] });
            if (result.url) {
                if (result.delay) {
                    setTimeout(function () { location.href = result.url; }, result.delay);
                } else {
                    location.href = result.url;
                }
            }
        });
    };

    session.begin();
});

$('#apple-test').click(function () {
    App.formApay.revalidate();
    if (!App.formApay.form.isAllowedSend()) {
        Utils.stopEvent(event);
        return;
    }
    $('#apay-cryptogram').val('test-crypto');
    $('#apay-aemail').val('test-email');
    $('#apay-aphone').val('test-phone');
    Utils.showOverlay();
    $.post(
        Utils.safeUrl('/applepay/process'),
        App.formApay.form.serialize()
    ).then(function (result) {
        Utils.removeOverlay();
        console.log('Status: ' + result.status);
        if (result.url) {
            location.href = result.url;
        }
    });
});
