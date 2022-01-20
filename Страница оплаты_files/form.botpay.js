
function FormBotPay() {
    var that = this,
        awaitingCode = false,
        container = $('#tab-bot');

    this.form          = $('#paybot');
    this.fieldPhone    = $('#paybot-phone').iil();
    this.fieldCode     = $('#paybot-code').iil();
    this.btnSubmit     = $('#paybot-submit');
    this.btnComplete   = $('#paybot-complete');
    this.btnCodeRepeat = $('#paybot-repeat');

    this.blockOff      = $('#bot-block-payoff');
    this.blockAuth     = $('#bot-block-auth');
    this.blockError    = $('#bot-block-error');
    this.blockNotAllow = $('#bot-block-notallowed');
    this.blockSent     = $('#bot-block-sent');

    this.init = function () {
        /* PHONE */
        if (this.fieldPhone.length > 0) {
            this.fieldPhone.on('blur', function () {
                that.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
            });
        }

        /* SUBMIT */
        this.btnSubmit.on('click', function (event) {
            if(that.awaitingCode) {
                return;
            }
            Utils.showOverlay();

            that.revalidate();
            if (!that.form.isAllowedSend()) {
                Utils.removeOverlay();
                Utils.stopEvent(event);
            } else {
                that.submitPhone();
                Utils.stopEvent(event);
            }
        });

        /* REPEAT */
        this.btnCodeRepeat.on('click', function () {
            Utils.showOverlay();
            that.fieldPhone.removeAttr('disabled');
            that.btnCodeRepeat.hide();
            that.submitPhone();
        });

        /* COMPLETE */
        this.btnComplete.on('click', function () {
            if(!that.awaitingCode) {
                return;
            }
            if (that.fieldCode.val().length != that.fieldCode.attr('maxlength')) {
                that.fieldCode.toggleInputError(true, App.msgLoc.wrongCode);
                return false;
            }
            Utils.showOverlay(App.withoutLoader);
            that.submitCode();
        });
    };

    this.submitPhone = function () {
        $.ajax({
            type: 'POST',
            url: Utils.safeUrl('/bot/phone'),
            data: that.form.serialize()
        }).done(function (response) {
            if(response) {
                Utils.removeOverlay();
                if(response.success) {
                    that.awaitingCode = true;
                    that.fieldPhone.attr('disabled', 'disabled');
                    that.btnSubmit.prop('type', 'button').closest('.form-actions').hide();
                    that.btnComplete.prop('type', 'submit').closest('.form-actions').show();
                    that.fieldCode.closest('.form-group').slideDown();
                    that.fieldCode.focus();
                    setTimeout(function () {
                        that.btnCodeRepeat.parent().show();
                    }, 20000);
                } else if(response.invalid) {
                    that.fieldPhone.toggleInputError(true, response.message);
                } else {
                    that.showError(response.message);
                }
            } else {
                location.reload();
            }
        });
    };

    this.submitCode = function () {
        $.ajax({
            type: 'POST',
            url: Utils.safeUrl('/bot/confirm'),
            data: that.form.serialize()
        }).done(function (response) {
            if (response.failed) {
                that.fieldCode.val('').showError(App.msgLoc.wrongCode).closest('.form-group').addClass('has-error');
                setTimeout(function () {
                    that.fieldCode.hideError();
                }, 5000);
                Utils.removeOverlay();
            } else if(response.ticket) {
                var url = location.href;
                url += ((url.indexOf('?') > -1) ? '&t=' : '?t=') + response.ticket;
                location.href = url;
            } else if (response.not_allowed) {
                Utils.removeOverlay();
                that.blockOff.hide();
                that.blockError.hide();
                that.blockAuth.hide();
                that.blockNotAllow.show().find('.message').html(response.message);
                if (!response.can_reset) {
                    that.blockNotAllow.find('.btn-reset').parent().hide();
                }
            } else {
                location.reload();
            }
        });
    };

    this.revalidate = function () {
        this.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
    };

    this.resetAuth = function  () {
        Utils.showOverlay();
        $.ajax({
            type: 'GET',
            url: Utils.safeUrl('/bot/reset')
        }).done(function (response) {
            if (response.status) {
                that.blockOff.hide();
                that.blockError.hide();
                that.blockNotAllow.hide();

                if (that.blockAuth.length > 0) {
                    Utils.removeOverlay();
                    that.awaitingCode = false;
                    that.fieldPhone.attr('disabled', false);
                    that.btnSubmit.prop('type', 'submit').closest('.form-actions').show();
                    that.btnComplete.prop('type', 'button').closest('.form-actions').hide();
                    that.fieldCode.val('');
                    that.fieldCode.closest('.form-group').hide();
                    that.fieldPhone.focus();
                    that.blockAuth.show();
                } else {
                    location.reload();
                }
            } else {
                Utils.removeOverlay();
                that.showError(response.message);
            }
        });
    };

    this.resendPay = function  () {
        Utils.showOverlay();
        $.ajax({
            type: 'GET',
            url: Utils.safeUrl('/bot/repay')
        }).done(function (response) {
            if(response.ticket) {
                var url = location.href;
                url += ((url.indexOf('?') > -1) ? '&t=' : '?t=') + response.ticket;
                location.href = url;
            } else {
                location.reload();
            }
        });
    };

    this.showError = function (message) {
        that.blockOff.hide();
        that.blockAuth.hide();
        that.blockNotAllow.hide();
        that.blockSent.hide();
        that.blockError.show().find('.message').html(message);
    };

    this.init();
}
