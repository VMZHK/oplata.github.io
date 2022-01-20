var App = {
    msg: {},
    token: false,
    msgLoc: {},
    isTokenize: false,
    withoutLoader: true,
    knownTabs: ['card','p24','lqpt','btc','delay','finid','qrapp','bot','master','visa','cash','evreg','nocost','parts','ppmono','pprivat','pabank', 'iabank', 'pialfa', 'ipglobus','instgrp', 'pposchad', 'ionus'],
    processingSpinner: '<span class="icon-spinner glyphicon glyphicon-refresh"></span>',
    serverDate: {
        month: null,
        year: null
    },
    disableInactiveTabs: function () {
        $('.pay-form .nav-tabs li:not(.active)').map(function () {
            $(this).addClass('disabled');
        });
    },
    enableInactiveTabs: function () {
        $('.pay-form .nav-tabs li').map(function () {
            $(this).removeClass('disabled');
        });
    }
};

window.onerror = function (message, file, line) {
    Utils.sendError(message, file, line);
};

/* card form
 ---------------------------------------------------------------------------------------------- */
function FormCard() {
    var that = this;

    this.form = $('#cardpay');
    if (this.form.length <= 0) {
        return;
    }

    this.block             = $('#cardpay-block');
    this.fieldCard         = $('#cardpay-cardnumber').iil();
    this.fieldHolder       = $('#cardpay-cardholder').iil();
    this.fieldName         = $('#cardpay-clientname').iil();
    this.fieldCVV          = $('#cardpay-cardsecure').iil();
    this.fieldEmail        = $('#cardpay-clientemail').iil();
    this.fieldPhone        = $('#cardpay-clientphone').iil();
    this.fieldMonth        = $('#cardpay-expmonth').iil();
    this.fieldMonthList    = $('#cardpay-expmonth-list');
    this.fieldYear         = $('#cardpay-expyear').iil();
    this.fieldValidity     = $('#cardpay-validity').iil();
    this.fieldTokenId      = $('#cardpay-tokenid').iil();
    this.fieldAmount       = $('#cardpay-clientamount').iil();
    this.fieldCurrency     = $('#cardpay-clientcurrency').iil();
    this.fieldComment      = $('#cardpay-clientcomment').iil();
    this.fieldRemember     = $('#cardpay-remember').iil();
    this.btnUntokenize     = $('#cardpay-untoken');
    this.fieldAgree        = $('#cardpay-agree').iil();
    this.fieldQuantity     = $('#cardpay-quantity').iil();
    this.btnSubmit         = $('#cardpay-submit');
    this.secureKbd         = $('#secure-keyboard');
    this.fieldExtra        = $('#cardpay-extra');
    this.fieldDelivery     = $('#cardpay-delivery');
    this.fieldPhoneCodes   = $('#cardpay-clientphone-codes');
    this.fieldPhonePrefix  = $('#cardpay-clientphone-prefix');
    this.fieldPhoneCaption = $('#cardpay-clientphone-caption');
    this.dropdownTokens    = $('#cardpay-tokens-dropdown');

    this.btnDelay = $('#do-delay-pay');

    this.fieldOtpCode        = $('#otpform-code');
    this.btnVerifyCodeSubmit = $('#otpform-submit');
    this.btnVerifyCodeRepeat = $('#otpform-repeat');
    this.btnVerifyCodeCancel = $('#otpform-cancel');

    App.isTokenize = this.form.hasClass('tokenize');

    this.additionalValidityCheck = false;
    this.afterRevalidate = false;

    new EvaluateInputTime(this.fieldCard, $('#cardpay-iptcc'));
    new EvaluateInputTime(this.fieldHolder, $('#cardpay-iptch'));

    this.init = function () {
        this.initHandlers();
        if (App.isTokenize) {
            this.setTokenize();
        }
    };

    this.setTokenize = function (tid) {
        var s = Utils.urlParam('vkh');
        Utils.showOverlay(true);
        $.ajax({
            url: Utils.safeUrl('/card/token' + (tid ? '/' + tid : ''))
        }).done(function (response) {
            Utils.removeOverlay();
            var data = $.parseJSON(response);
            if (data) {
                that.fieldTokenId.val(data.id);
                if(that.fieldCard.prev().hasClass('with-name')) {
                    that.fieldCard.prev().html(data.card+'<small>'+data.holder+'</small>').removeClass('hidden');
                } else {
                    that.fieldCard.prev().html(data.card).removeClass('hidden');
                }
                that.fieldCard.val('').addClass('hidden');
                that.fieldHolder.prev().html(data.holder).removeClass('hidden');
                that.fieldHolder.val('').addClass('hidden');
                if (that.fieldValidity.length > 0) {
                    that.fieldValidity.prev().html(data.month + ' / ' + data.year).removeClass('hidden');
                    that.fieldValidity.val('').addClass('hidden');
                } else {
                    that.fieldMonth.prev().html(data.month).removeClass('hidden');
                    that.fieldMonth.val('').addClass('hidden');
                    that.fieldYear.prev().html(data.year).removeClass('hidden');
                    that.fieldYear.val('').addClass('hidden');
                }
                that.fieldCVV.checkRequired(App.msgLoc.cvvIsRequired);
                that.fieldCVV.focus();
                that.fieldCVV.popover('show');
                if (data.type) {
                    that.fieldCard.closest('.card-number-wrapper').removeClass('visa').removeClass('master').addClass(data.type);
                }
            }
        });
    };

    this.unsetTokenize = function () {
        if (App.isTokenize) {
            this.form.removeClass('tokenize');
            App.isTokenize = false;

            this.fieldTokenId.val('');

            this.fieldCard.prev().remove();
            this.fieldCard.removeClass('hidden');

            this.fieldHolder.prev().remove();
            this.fieldHolder.removeClass('hidden');

            if (that.fieldValidity.length > 0) {
                this.fieldValidity.prev().remove();
                this.fieldValidity.removeClass('hidden');
            } else {
                this.fieldMonth.prev().remove();
                this.fieldMonth.removeClass('hidden');
                this.fieldYear.prev().remove();
                this.fieldYear.removeClass('hidden');
            }

            this.btnUntokenize.parent().parent().removeClass('input-group');
            this.btnUntokenize.parent().remove();
        }
    };

    this.initHandlers = function () {

        this.fieldCard.addClass($.payment.cardType(this.fieldCard.val()));

        this.fieldCard.on('input', function () {
            if (that.btnUntokenize.length > 0) {
                if (that.fieldCard.val().length >= 14) {
                    that.btnUntokenize.addClass('hidden');
                    that.fieldCard.addClass('standalone');
                } else {
                    that.btnUntokenize.removeClass('hidden');
                    that.fieldCard.removeClass('standalone');
                }
            }
        });

        this.fieldCard.payment('formatCardNumber');
        this.fieldMonth.payment('restrictNumeric');
        this.fieldYear.payment('restrictNumeric');
        this.fieldValidity.payment('formatCardExpiry');
        this.fieldCVV.payment('formatCardCVC');

        this.fieldCard.blur(function () {
            that.checkCard();
            //that.fieldCard.il();
        });

        this.fieldValidity.blur(function () {
            that.checkValidity();
            //that.fieldValidity.il();
        });

        this.fieldMonth.blur(function () {
            if (that.fieldYear.val()) {
                that.checkMonthYear();
            }
            //that.fieldMonth.il();
        });

        this.fieldYear.blur(function () {
            that.checkMonthYear();
            //that.fieldYear.il();
        });

        if (this.fieldMonth.length > 0 && this.fieldMonth.isSelect()) {
            this.fieldMonth.change(function () {
                if (that.fieldYear.val()) {
                    that.checkMonthYear();
                }
                //that.fieldMonth.il();
            });
        }

        if (this.fieldYear.length > 0 && this.fieldYear.isSelect()) {
            this.fieldYear.change(function () {
                that.checkMonthYear();
                //that.fieldYear.il();
            });
        }

        /* CVV */
        this.fieldCVV.blur(function () {
            that.checkCVV();
            //that.fieldCVV.il();
        });

        if (this.secureKbd.length > 0) {
            this.fieldCVV.popover({
                html : true,
                content: function() {
                    return that.secureKbd.html();
                }
                //template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>'
            }).on('click', function (e) {
                that.fieldCVV.popover('toggle');
            });

            this.fieldCVV.on('inserted.bs.popover', function () {
                $('.popover-content .secure-kb-num').on('click', function (e) {
                    if(that.fieldCVV.val().length < 3) {
                        that.fieldCVV.val(that.fieldCVV.val()+ e.target.innerText);
                    }
                    if (that.fieldCVV.val().length === 3) {
                        that.fieldCVV.popover('toggle');
                    }
                    that.checkCVV();
                });
                $('.popover-content .secure-kb-clear').on('click', function (e) {
                    that.fieldCVV.val('');
                    that.checkCVV();
                });
            });
        }

        /* HOLDER */
        this.fieldHolder.blur(function (event) {
            that.fieldHolder.checkRequired(App.msgLoc.cardOwnerNameIsRequired);
            that.fieldHolder.isCyrillicOnly();
            //that.fieldHolder.il();
        });

        /* EMAIL */
        if (this.fieldEmail.length > 0) {
            this.fieldEmail.on('blur', function () {
                that.fieldEmail.checkRequired(App.msgLoc.emailIsRequired);
                that.fieldEmail.isEmailValid(true);
                //that.fieldEmail.il();
            });
        }

        /* PHONE */
        if (this.fieldPhone.length > 0) {
            this.fieldPhone.on('blur', function () {
                that.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
                if (!that.fieldPhone.hasError()) {
                    that.fieldPhone.isPhoneValid();
                }
            });

            if (this.fieldPhoneCodes.length > 0) {
                this.fieldPhoneCodes.parent().on("shown.bs.dropdown", function() {
                    $(this).find("li.active a").focus();
                });
                this.fieldPhoneCodes.find('li a').click(function(event) {
                    var iso = $(this).data('iso'),
                        code = $(this).find('.code').text();

                    that.fieldPhoneCodes.find('li').removeClass('active');
                    if (iso) {
                        that.fieldPhoneCaption.find('.code').html('<span class="flag-icon flag-icon-' + iso + '"></span>' + code);
                    } else {
                        that.fieldPhoneCaption.find('.code').html(code);
                    }
                    that.fieldPhonePrefix.val(code);
                    $(this).parent().addClass('active');
                    event.preventDefault();
                    event.stopPropagation();
                    that.fieldPhoneCodes.dropdown('toggle');
                });
            }
        }

        this.form.on('submit', function (event) {
            var caption = that.btnSubmit.text();
            that.fieldCVV.popover('hide');
            Utils.showOverlay(App.withoutLoader);
            if (App.withoutLoader) {
                that.btnSubmit.addClass('disabled');
                that.btnSubmit.html(App.processingSpinner + ' ' + App.msgLoc.inProcessing);
            }
            that.revalidateTotal();
            if (!that.form.isAllowedSend()) {
                if (App.withoutLoader) {
                    that.btnSubmit.removeClass('disabled');
                    that.btnSubmit.text(caption);
                }
                Utils.removeOverlay();
                Utils.stopEvent(event);
                that.form.trigger('payment.cardValidate', false);
                return false;
            } else {
                that.form.trigger('payment.cardValidate', true);
                that.btnSubmit.prop('type', 'button');
            }
        });

        if (this.btnDelay.length > 0) {
            this.btnDelay.on('click', function (event) {
                $('#nav-delay-button').tab('show');
                return false;
            });
        }

        if (this.fieldAgree.length > 0) {
            this.fieldAgree.on('change', function (event) {
                if(event.target.checked) {
                    that.btnSubmit.prop("disabled", false);
                } else {
                    that.btnSubmit.prop("disabled", true);
                }
            }).trigger('change');
        }

        $('.token-choose-item').map(function () {
            $(this).on('click', function (event) {
                that.setTokenize($(this).attr('data-id'));
                that.dropdownTokens.find('li').removeClass();
                $(this).parent().addClass('active');
            });
        });

        $('.month-choose-item').map(function () {
            $(this).on('click', function (event) {
                var m = $(this).attr('data-val'),
                    t = $(this).text();
                $('#cardpay-expmonth-value').val(m);
                $('#cardpay-expmonth').val(m).find('.month').text(t).removeClass('placeholder')
                Utils.stopEvent(event);
                that.fieldMonthList.dropdown('toggle');
            });
        });


        $('.token-clear-input').map(function () {
            $(this).on('click', function (event) {
                that.unsetTokenize();
            });
        });

        $('.token-show-doubt').map(function () {
            $(this).on('click', function (event) {
                that.requestVerifyCode(true);
            });
        });

        this.btnVerifyCodeRepeat.on('click', function () {
            $(this).hide();
            that.requestVerifyCode(false);
        });

        this.btnVerifyCodeCancel.on('click', function () {
            location.reload();
        });

        this.btnVerifyCodeSubmit.on('click', function () {
            if (that.fieldOtpCode.val().length != that.fieldOtpCode.attr('maxlength')) {
                that.fieldOtpCode.toggleInputError(true, App.msgLoc.wrongCode);
                return false;
            }

            $(this).attr('disabled', 'disabled');
            Utils.showOverlay(App.withoutLoader);
            $.ajax({
                type: 'POST',
                url: Utils.safeUrl('/card/doubt'),
                data: $('#otpform').serialize()
            }).done(function (response) {
                var data, allow_re_entry = false;
                if (response) {
                    data = $.parseJSON(response);
                    if (data && data.failed) {
                        allow_re_entry = true;
                    }
                }
                if (allow_re_entry) {
                    that.fieldOtpCode.val('');
                    that.fieldOtpCode.showError(App.msgLoc.wrongCode);
                    setTimeout(function () {
                        that.fieldOtpCode.hideError();
                    }, 2000);
                    $(that.btnVerifyCodeSubmit).removeAttr('disabled');
                    Utils.removeOverlay();
                } else {
                    location.hash = '#card';
                    location.reload();
                }
            });
        });

    };

    this.requestVerifyCode = function () {
        Utils.showOverlay(true);
        $.ajax({
            type: 'GET',
            url: Utils.safeUrl('/card/doubt')
        }).done(function (response) {
            Utils.removeOverlay();
            if (response) {
                var data = $.parseJSON(response);
                if (data) {
                    if (data.expired || data.failed) {
                        location.hash = '#card';
                        location.reload();
                    } else if (data.complete) {
                        setTimeout(function () {
                            that.btnVerifyCodeRepeat.show();
                        }, 30000);
                        that.btnVerifyCodeRepeat.hide();
                        $('.field-otp-code').map(function () {
                            $(this).val('');
                        });
                        $('#nav-doubt-button').tab('show');
                        if (App.freeAmount) {
                            App.freeAmount.toggleControls(true);
                        }
                    }
                }
            }
        });
    };

    this.checkCard = function () {
        var isValidNumber = $.payment.validateCardNumber(this.fieldCard.val());
        this.fieldCard.toggleInputError(
            !isValidNumber,
            App.msgLoc.cardNotValid
        );
        if (isValidNumber) {
            this.fieldCard.toggleInputError(
                !this.fieldCard.hasClass('visa')
                && !this.fieldCard.hasClass('visaelectron')
                && !this.fieldCard.hasClass('maestro')
                && !this.fieldCard.hasClass('mastercard')
                && !this.fieldCard.hasClass('prostir'),
                App.msgLoc.cardVisaMcOnly
            );
        }
    };

    this.checkValidity = function () {
        if (!App.isTokenize) {
            this.fieldValidity.toggleInputError(
                !$.payment.validateCardExpiry(this.fieldValidity.payment('cardExpiryVal')),
                App.msgLoc.cardDateNotValid
            );
            if (this.additionalValidityCheck) {
                this.additionalValidityCheck(this.fieldValidity.payment('cardExpiryVal'));
            }
        }
    };

    this.checkMonthYear = function () {
        if (!App.isTokenize) {
            this.fieldMonth.toggleInputError(
                !$.payment.validateCardExpiry(
                    this.fieldMonth.val() ? this.fieldMonth.val() : '',
                    this.fieldYear.val() ? this.fieldYear.val() : ''
                ),
                App.msgLoc.cardDateNotValid
            );
            if (this.additionalValidityCheck) {
                this.additionalValidityCheck(
                    this.fieldMonth.val() ? this.fieldMonth.val() : '',
                    this.fieldYear.val() ? this.fieldYear.val() : ''
                );
            }
        }
    };

    this.checkCVV = function () {
        var cardType = $.payment.cardType(this.fieldCard.val());
        if(!this.fieldCVV.val()) {
            this.fieldCVV.toggleInputError(true, App.msgLoc.cvvIsRequired);
        } else {
            this.fieldCVV.toggleInputError(
                !$.payment.validateCardCVC(this.fieldCVV.val(), cardType),
                App.msgLoc.cvvNotValid
            );
        }
    };

    this.revalidate = function () {
        if (!App.isTokenize) {
            this.checkCard();

            this.fieldHolder.checkRequired(App.msgLoc.cardOwnerNameIsRequired);
            this.fieldHolder.isCyrillicOnly();

            if (this.fieldValidity.length > 0) {
                this.checkValidity();
            }
            if (this.fieldMonth.length > 0) {
                this.checkMonthYear();
            }
        }
        this.checkCVV();

        if (this.fieldEmail.length > 0) {
            this.fieldEmail.checkRequired(App.msgLoc.emailIsRequired);
            this.fieldEmail.isEmailValid();
        }

        if (this.fieldPhone.length > 0) {
            this.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
            if (!this.fieldPhone.hasError()) {
                this.fieldPhone.isPhoneValid();
            }
        }

        if (App.extraFields) {
            this.fieldExtra.val(App.extraFields.form.serialize());
        }

        if (App.formDelivery) {
            this.fieldDelivery.val(App.formDelivery.form.serialize());
        }

        if (App.freeAmount.amount.length > 0 || App.freeAmount.comment.length > 0) {
            App.freeAmount.revalidate();
            if(App.freeAmount.amount.length > 0 && this.fieldAmount.length > 0) {
                this.fieldAmount.val(App.freeAmount.amount.val());
                this.fieldCurrency.val(App.freeAmount.getCurrency());
            }
            if(App.freeAmount.comment.length > 0 && this.fieldComment.length > 0) {
                this.fieldComment.val(App.freeAmount.comment.val());
            }
            if(App.freeAmount.clientname.length > 0 && this.fieldName.length > 0) {
                this.fieldName .val(App.freeAmount.clientname.val());
            }
            if (App.freeAmount.isSaleUnits() && this.fieldQuantity.length > 0) {
                this.fieldQuantity.val(App.freeAmount.quantity.val());
            }
        }
    };

    this.revalidateTotal = function () {
        this.revalidate();

        if (App.regular) {
            App.regular.revalidate();
        }

        if (this.afterRevalidate) {
            this.afterRevalidate();
        }

        if(App.extraFields) {
            App.extraFields.revalidate();
        }

        if(App.formDelivery) {
            App.formDelivery.revalidate();
        }
    };

    this.init();
}


/* free amount subform
 ---------------------------------------------------------------------------------------------- */
function FreeAmount() {
    var that = this;

    this.amount     = $('#freepay-amount').iil();
    this.currency   = $('#freepay-currency').iil();
    this.currencies = $('#freepay-currencies');
    this.comment    = $('#freepay-comment').iil();
    this.quantity   = $('#freepay-quantity').iil();
    this.amountBuff = $('#freepay-amount-buffer');
    this.clientfee  = $('#freepay-clientfee');
    this.discount   = $('#freepay-discount');

    this.discountCalc = this.amount.attr('data-discount-start');
    if (isNaN(this.discountCalc)) {
        this.discountCalc = 0;
    }
    //console.log('START CALC=' + this.discountCalc);

    this.clientname  = $('#freepay-clientname').iil();
    this.clientphone = $('#freepay-clientphone').iil();
    this.clientemail = $('#freepay-clientemail').iil();

    this.getCurrency = function () {
        var c = this.currency.children().first().text();
        return (c === '') ? this.currency.text() : c;
    };

    this.getAmount = function () {
        if(this.amount.prop("tagName") === 'INPUT') {
            return this.amount.val();
        } else {
            return this.amount.text().replace(' ', '');
        }
    };

    this.updateAmount = function (a) {
        if(this.amount.prop("tagName") === 'INPUT') {
            this.amount.val(a);
        } else {
            this.amount.text(a);
        }
    };

    this.setCurrency = function (c) {
        that.currency.children().first().html(c);
    };

    this.init = function () {
        if(this.amount.length > 0) {
            this.amount.payment('restrictAmount');
        }

        if(this.quantity.length > 0) {
            this.quantity.payment('restrictAmount');
        }

        if (this.amount.length > 0) {
            this.amount.on('input', function () {
                if (that.amount.val().length >= 6) {
                    that.amount.addClass('long');
                } else {
                    that.amount.removeClass('long');
                }
                that.rebuildClientFee();
                that.triggerChangeAmount();
            });
            this.amount.on('blur', function () {
                that.revalidateAmount();
            });
        }

        if(this.currency.length > 0) {
            this.initAmountLimits(this.getCurrency());
        }

        if(this.currency.length > 0 && this.currencies.length) {
            this.currencies.on('click', 'li a', function () {
                var c = $(this).text();
                that.setCurrency(c);
                that.initAmountLimits(c);
                that.revalidateAmount();
                that.rebuildClientFee();
                that.triggerChangeAmount();
            });
        }

        if(this.quantity.length > 0) {
            this.quantity.on('change', function () {
                var a = that.quantity.val() * that.quantity.attr('data-unit-cost');
                if(isNaN(a)) {
                    a = 0;
                }
                that.amount.text(Number(a.toFixed(2)));
                that.rebuildClientFee();
                that.triggerChangeAmount();
                that.rebuildDiscount();
            });
            this.quantity.on('keyup', function () {
                var a = that.quantity.val() * that.quantity.attr('data-unit-cost');
                that.revalidateQuantity();
                that.amount.text(Number(a.toFixed(2)));
                that.rebuildClientFee();
                that.triggerChangeAmount();
                that.rebuildDiscount();
            });
            this.quantity.trigger('change');
        }
    };

    this.isSaleUnits = function (c) {
        return (this.quantity.length > 0);
    };

    this.rebuildClientFee = function () {
        var rate = that.amount.attr('data-client-fee-rate');
        if (that.amount.attr('data-client-fee-const')) {
            return;
        }
        if (rate > 0) {
            that.clientfee.text((that.getAmount() * rate / 100).toFixed(2) + ' ' + that.getCurrency());
        }
    };

    this.rebuildDiscount = function (total) {
        var rate     = 1.0 * that.amount.attr('data-discount-rate'),
            min      = 1.0 * that.amount.attr('data-discount-min'),
            fixed    = 1.0 * that.amount.attr('data-discount-fixed'),
            amount   = total ? 1.0 * total : 1.0 * that.getAmount(),
            discount = 0,
            total    = 0;

        if (isNaN(rate))  { rate = 0;  }
        if (isNaN(min))   { min = 0;   }
        if (isNaN(fixed)) { fixed = 0; }

        //console.log('rate='+rate+' min='+min + ' fixed=' + fixed + ' amount=' + amount + (total ? ' EXTERNAL SUM' : ''));
        that.discountCalc = 0;

        if (rate > 0) {
            discount = (amount * rate / 100).toFixed(2);
        } else if (fixed > 0) {
            discount = fixed;
        }

        if (min > 0  && amount < min) {
            that.discount.text('').closest('.discount').hide();
        } else if (discount > 0) {
            //console.log('rate='+rate+' amount='+amount + ' discount=' + discount + (total ? ' EXTERNAL SUM' : ''));
            that.discount.text(discount + ' ' + that.getCurrency()).closest('.discount').show();
            total = amount - discount;
            that.updateAmount(total.toFixed(2));
            that.discountCalc = discount;
        } else {
            that.discount.text('').closest('.discount').hide();
        }

        this.rebuildDiscount2();
    };

    this.rebuildDiscount2 = function (total) {
        var rate2    = 1.0 * that.amount.attr('data-d2-rate'),
            min2     = 1.0 * that.amount.attr('data-d2-min'),
            fixed2   = 1.0 * that.amount.attr('data-d2-fixed'),
            amount   = total ? 1.0 * total : 1.0 * that.getAmount(),
            discount = 0,
            total    = 0;

        if (isNaN(rate2))  { rate2 = 0;  }
        if (isNaN(min2))   { min2 = 0;   }
        if (isNaN(fixed2)) { fixed2 = 0; }

        if (rate2 > 0) {
            discount = (amount * rate2 / 100).toFixed(2);
        } else if (fixed2 > 0) {
            discount = fixed2;
        }

        if (min2 > 0  && amount < min2) {
            //
        } else if (discount > 0) {
            //console.log('discountCalc=' + that.discountCalc);
            //console.log('rate2='+rate2+' fixed='+fixed2 + ' amount=' + amount + ' discount=' + discount + (total ? 'EXTERNAL SUM' : ''));
            total = amount - discount;
            that.updateAmount(total.toFixed(2));
            that.discountCalc = 1.0 * that.discountCalc + 1.0 * discount;
            //console.log('discountCalc=' + that.discountCalc);
            that.discount.text(that.discountCalc + ' ' + that.getCurrency()).closest('.discount').show();
        }
    };

    this.triggerChangeAmount = function () {
        $(document).trigger('checkoutAmountChanged', {
            amount:   this.getAmount(),
            currency: this.getCurrency()
        });
    };

    this.initAmountLimits = function (c) {
        var cm = that.amount.attr('data-min-' + c);
        if('UAH' == c) {
            that.amount.attr('data-min', cm ? cm : 5);
        } else if('RUB' == c) {
            that.amount.attr('data-min', cm ? cm : 5);
        } else {
            that.amount.attr('data-min', cm ? cm : 1);
        }
    };

    this.revalidateAmount = function () {
        $('.free-amount-mirror').text(this.amount.val());
        $('.free-currency-mirror').text(this.getCurrency());
        return this.amount.isAmountValid(this.getCurrency());
    };

    this.revalidateQuantity = function () {
        return this.quantity.isQuantityValid();
    };

    this.toggleControls = function (hide) {
        if (this.amount.length > 0) {
            this.amount.prop('disabled', (hide ? true : false));
        }
        if (this.comment.length > 0) {
            this.comment.prop('disabled', (hide ? true : false));
        }
        if (this.clientname.length > 0) {
            this.clientname.prop('disabled', (hide ? true : false));
        }
    };

    this.revalidate = function () {
        if (this.amount.length > 0 && this.revalidateAmount()) {
            this.amount.toggleInputError(!this.amount.payment('restrictAmount'), App.msgLoc.amountIsRequired);
        }

        this.comment.checkRequired(this.comment.attr('data-error'));
        this.clientname.checkRequired(this.clientname.attr('data-error'));

        if (this.clientemail.length > 0) {
            this.clientemail.checkRequired(App.msgLoc.emailIsRequired);
            this.clientemail.isEmailValid();
        }
        if (this.clientphone.length > 0) {
            this.clientphone.checkRequired(App.msgLoc.phoneIsRequired);
            if (!this.clientphone.hasError()) {
                this.clientphone.isPhoneValid();
            }
        }

        if(this.quantity.length > 0 && this.revalidateQuantity()) {
            //this.quantity.toggleInputError(!this.quantity.payment('restrictAmount'), App.msgLoc.amountIsRequired);
        }
    };

    this.disableFields = function () {
        if (this.amount.length > 0) {
            this.amount.prop('disabled', true);
        }
        if (this.comment.length > 0) {
            this.comment.prop('disabled', true);
        }
        if (this.currency.length > 0) {
            this.currency.prop('disabled', true);
        }
        if (this.quantity.length > 0) {
            this.quantity.prop('disabled', true);
        }
    };

    this.init();
    this.rebuildClientFee();
    this.triggerChangeAmount();
}

/* extra fields
 ---------------------------------------------------------------------------------------------- */
function ExtraFields () {
    this.form = $('#form-extra');
    this.form.find('.extra-field').each(function() {
        $(this).iil();
    });

    this.revalidate = function () {
        this.form.find('.extra-field').each(function() {
            $(this).val($(this).val().trim());
            $(this).checkRequired();
        });
    };

    this.disableFields = function () {
        this.form.find('.extra-field').each(function() {
            $(this).prop('disabled', true);
        });
    };
}


/* regular subform
 ---------------------------------------------------------------------------------------------- */
function Regular() {
    var that = this;

    this.fieldCheck  = $('#regular-check').iil();
    this.box         = $('#regular-box');
    this.fieldAmount = $('#regular-amount').iil();
    this.fieldMode   = $('#regular-mode').iil();
    this.fieldBack   = $('#regular-back').iil();

    this.blockOnce     = $('#regular-once').iil();
    this.fieldDateOnce = $('#regular-date-once').iil();

    this.blockMonthly = $('#regular-period').iil();
    this.fieldDateBeg = $('#regular-date-beg').iil();
    this.fieldDateEnd = $('#regular-date-end').iil();

    this.boxCard = $('#cardpay-fields');

    if (this.fieldCheck.length <= 0) {
        return;
    }

    this.fieldAmount.payment('restrictAmount');

    if ('switch' == this.fieldCheck.attr('data-mode')) {
        this.fieldCheck.bootstrapSwitch('onColor', 'primary');
        this.fieldCheck.on('switchChange.bootstrapSwitch', function (event, state) {
            if (state) {
                App.formCard.revalidate();
                if (App.formCard.form.isAllowedSend()) {
                    that.box.slideDown();
                    that.boxCard.slideUp();
                    //that.revalidate();
                } else {
                    that.fieldCheck.bootstrapSwitch('state', false);
                    that.boxCard.removeClass('hidden');
                }
            } else {
                that.box.slideUp();
                that.boxCard.slideDown();
                that.clearErrors();
            }
        });

        this.fieldBack.on('click', function () {
            that.box.slideUp();
            that.boxCard.slideDown();
            that.clearErrors();
            that.fieldCheck.bootstrapSwitch('state', false);
        });
    } else if ('v3' === this.fieldCheck.attr('data-mode')) {
        this.fieldCheck.on('change', function (event) {
            if (that.fieldCheck.is(':checked')) {
                App.formCard.revalidate();
                if (App.formCard.form.isAllowedSend()) {
                    //that.box.slideDown();
                    that.boxCard.slideUp();
                } else {
                    //that.fieldCheck.bootstrapSwitch('state', false);
                    //that.boxCard.removeClass('hidden');
                    //that.fieldCheck.prop("checked", false);
                }
                that.box.slideDown();
            } else {
                that.box.slideUp();
                that.boxCard.slideDown();
                that.clearErrors();
            }
        });

        this.fieldBack.on('click', function () {
            that.box.slideUp();
            that.boxCard.slideDown();
            that.clearErrors();
            that.fieldCheck.bootstrapSwitch('state', false);
        });
    } else if ('slide' === this.fieldCheck.attr('data-mode')) {
        this.fieldCheck.on('change', function (event) {
            if (that.fieldCheck.is(':checked')) {
                App.formCard.revalidate();
                if (App.formCard.form.isAllowedSend()) {
                    that.box.slideDown();
                    that.boxCard.slideUp();
                } else {
                    that.fieldCheck.prop("checked", false);
                }
            } else {
                that.box.slideUp();
                that.boxCard.slideDown();
                that.clearErrors();
            }
        });

        this.fieldBack.on('click', function () {
            that.box.slideUp();
            that.boxCard.slideDown();
            that.clearErrors();
            that.fieldCheck.bootstrapSwitch('state', false);
        });
    } else {
        this.fieldCheck.on('change', function (event) {
            that.fieldCheck.parent().removeClass('label-bold');
            if (that.fieldCheck.is(':checked')) {
                that.box.slideDown();
                that.fieldCheck.parent().addClass('label-bold');
            } else {
                that.box.slideUp();
                //$('#regular-box .date').hideError();
                that.clearErrors();
            }
            if (!that.fieldMode.val()) {
                that.blockOnce.hide();
                that.blockMonthly.hide();
            }
        });

        this.fieldBack.on('click', function () {
            that.box.slideUp();
            that.clearErrors();
        });
    }

    this.clearErrors = function (exclude_amount) {
        if (!exclude_amount) {
            that.fieldAmount.hideError();
        }
        that.fieldMode.hideError();
        that.fieldDateOnce.hideError();
        that.fieldDateBeg.hideError();
        that.fieldDateEnd.hideError();
    };

    this.formatDate = function (t) {
        var d = t.getDate();
        var m = t.getMonth() + 1;
        var y = t.getFullYear();
        return (d < 10 ? '0' : '') + d + '-' + (m < 10 ? '0' : '') + m + '-' + y;
    };

    this.fieldMode.on('change', function (event) {
        var now = new Date();
        var dateBeg,
            dateEnd;

        that.clearErrors(true);

        if ('' == event.target.value) {
            that.blockOnce.fadeOut();
            that.blockMonthly.fadeOut();
        } else if ('once' == event.target.value) {
            dateBeg = new Date(now);
            dateBeg.setDate(dateBeg.getDate() + 1);
            that.fieldDateOnce.val(that.formatDate(dateBeg));

            that.blockMonthly.hide();
            that.blockOnce.fadeIn();
        } else {
            if ('daily' == event.target.value) {
                dateBeg = new Date(now);
                dateBeg.setDate(dateBeg.getDate() + 1);
                that.fieldDateBeg.val(that.formatDate(dateBeg));

                dateEnd = new Date(now);
                dateEnd.setDate(now.getDate() + 6);
                that.fieldDateEnd.val(that.formatDate(dateEnd));
            } else if ('weekly' == event.target.value) {
                dateBeg = new Date(now);
                dateBeg.setDate(dateBeg.getDate() + 7);
                that.fieldDateBeg.val(that.formatDate(dateBeg));

                dateEnd = new Date(dateBeg);
                dateEnd.setDate(dateBeg.getDate() + 7);
                that.fieldDateEnd.val(that.formatDate(dateEnd));
            } else if ('monthly' == event.target.value) {
                dateBeg = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                that.fieldDateBeg.val(that.formatDate(dateBeg));

                dateEnd = new Date(now.getFullYear(), now.getMonth() + that.box.data('monthcount') * 1, now.getDate());
                that.fieldDateEnd.val(that.formatDate(dateEnd));
            } else if ('halfyearly' == event.target.value) {
                dateBeg = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
                that.fieldDateBeg.val(that.formatDate(dateBeg));

                dateEnd = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());
                that.fieldDateEnd.val(that.formatDate(dateEnd));
            } else if ('yearly' == event.target.value) {
                dateBeg = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());
                that.fieldDateBeg.val(that.formatDate(dateBeg));

                dateEnd = new Date(now.getFullYear(), now.getMonth() + 24, now.getDate());
                that.fieldDateEnd.val(that.formatDate(dateEnd));
            } else if ('yearly3' == event.target.value) {
                dateBeg = new Date(now.getFullYear(), now.getMonth() + 36, now.getDate());
                that.fieldDateBeg.val(that.formatDate(dateBeg));

                dateEnd = new Date(now.getFullYear(), now.getMonth() + 72, now.getDate());
                that.fieldDateEnd.val(that.formatDate(dateEnd));
            }

            that.blockOnce.hide();
            that.blockMonthly.fadeIn();
        }
    });
    //this.fieldMode.trigger('change');

    this.isEnabled = function () {
        if ('checkbox' == this.fieldCheck.prop('type')) {
            return this.fieldCheck.is(':checked');
        } else {
            return this.fieldCheck.hasClass('down');
        }
    };

    this.revalidate = function () {

        if (!this.isEnabled()) {
            this.clearErrors();
            return;
        }

        if (this.fieldAmount.isAmountValid()) {
            this.fieldAmount.toggleInputError(!this.fieldAmount.payment('restrictAmount'), App.msgLoc.amountIsRequired);
        }

        this.fieldMode.checkRequired(App.msgLoc.repeatModeIsRequired);

        if ('' == this.fieldMode.val()) {
            //
        } else if ('once' == this.fieldMode.val()) {
            this.fieldDateOnce.checkRequired(App.msgLoc.fieldIsEmpty);
        } else {
            this.fieldDateBeg.checkRequired(App.msgLoc.fieldIsEmpty);
            this.fieldDateEnd.checkRequired(App.msgLoc.fieldIsEmpty);
        }
    };

    if ('v3' !== this.fieldCheck.attr('data-mode')) {
        this.fieldCheck.trigger('change');
    }
    //this.fieldMode.trigger('change');
}


/* alternate payment form
 ---------------------------------------------------------------------------------------------- */
function FormAlternate(id) {
    var that = this;

    this.id               = id;
    this.form             = $(id);
    this.fieldName        = $(id + '-name').iil();
    this.fieldEmail       = $(id + '-email').iil();
    this.fieldPhone       = $(id + '-phone').iil();
    this.fieldAmount      = $(id + '-amount').iil();
    this.fieldCurrency    = $(id + '-currency').iil();
    this.fieldComment     = $(id + '-comment').iil();
    this.fieldQuantity    = $(id + '-quantity').iil();
    this.fieldParts       = $(id + '-parts').iil();
    this.fieldAgree       = $(id + '-agree').iil();
    this.btnSubmit        = $(id + '-submit');
    this.fieldExtra       = $(id + '-extra');
    this.fieldDelivery    = $(id + '-delivery');
    this.fieldPhoneCodes  = $(id + '-phone-codes');
    this.fieldPhonePrefix = $(id + '-phone-prefix');
    this.listToken        = $(id + '-list');
    this.fieldSecure      = $(id + '-secure');
    this.isAjaxValidation = (1 == this.form.attr('data-ajax'));
    this.blockInfo        = $(id + '-info');
    //this.submitTrigger    = $(id).attr('data-submit-trigger');

    this.init = function () {
        /* NAME */
        if (this.fieldName.length > 0) {
            this.fieldName.on('blur', function (event) {
                $(this).checkRequired(App.msgLoc.cardPayerNameIsRequired);
            });
        }

        /* EMAIL */
        if (this.fieldEmail.length > 0) {
            this.fieldEmail.on('blur', function () {
                that.fieldEmail.checkRequired(App.msgLoc.emailIsRequired);
                that.fieldEmail.isEmailValid(true);
            });
        }

        /* PHONE */
        if (this.fieldPhone.length > 0) {
            this.fieldPhone.on('blur', function () {
                that.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
                if (!that.fieldPhone.hasError()) {
                    that.fieldPhone.isPhoneValid();
                }
            });

            if (this.fieldPhoneCodes.length > 0) {
                this.fieldPhoneCodes.parent().on("shown.bs.dropdown", function() {
                    $(this).find("li.active a").focus();
                });
                this.fieldPhoneCodes.find('li a').click(function(event) {
                    var iso = $(this).data('iso'),
                        code = $(this).find('.code').text();

                    that.fieldPhoneCodes.find('li').removeClass('active');
                    if (iso) {
                        that.fieldPhoneCodes.prev().find('.code').html('<span class="flag-icon flag-icon-' + iso + '"></span>' + code);
                    } else {
                        that.fieldPhoneCodes.prev().find('.code').html(code);
                    }
                    that.fieldPhonePrefix.val(code);
                    $(this).parent().addClass('active');
                    event.preventDefault();
                    event.stopPropagation();
                    that.fieldPhoneCodes.dropdown('toggle');
                });
            }
        }

        /* PARTS */
        if (this.fieldParts.length > 0) {
            this.fieldParts.on('blur', function () {
                that.fieldParts.checkRequired(App.msgLoc.quantityIsRequired);
            }).on('change', function () {
                that.fieldParts.checkRequired(App.msgLoc.quantityIsRequired);
                that.calcParts();
            });
            that.calcParts();
        }

        if (this.fieldAgree.length > 0) {
            this.fieldAgree.on('change', function (event) {
                if(event.target.checked) {
                    that.btnSubmit.prop("disabled", false);
                } else {
                    that.btnSubmit.prop("disabled", true);
                }
            }).trigger('change');
        }

        /* SUBMIT */
        this.form.on('submit', function (event) {
            var caption = that.btnSubmit.html();
            Utils.showOverlay(App.withoutLoader);
            if (App.withoutLoader) {
                that.btnSubmit.addClass('disabled');
                that.btnSubmit.html(App.processingSpinner + ' ' + App.msgLoc.inProcessing);
            }
            that.revalidate();
            if (!that.form.isAllowedSend()) {
                if (App.withoutLoader) {
                    that.btnSubmit.removeClass('disabled');
                    that.btnSubmit.html(caption);
                }
                Utils.removeOverlay();
                Utils.stopEvent(event);
                return false;
            } else {
                that.btnSubmit.prop('type', 'button');
                $(document).trigger('submitAlterForm:' + id.replace('#', ''), event);
            }
        });

        /* TOKENS */
        if (this.listToken.length > 0) {
            this.listToken.find('input[type="radio"]').on('click', function () {
                that.listToken.find('.radio .secure').remove();
                $(this).closest('.radio').append($('#tokenpay-secure-tmpl').html()).find('.secure').fadeIn();
                that.fieldSecure = that.listToken.find('.radio .secure .field-cvv');
            });
        }
    };

    this.calcParts = function () {
        var data;
        if (App.freeAmount) {
            data = {
                parts: that.fieldParts.val(),
                amount: App.freeAmount.getAmount(),
                currency: App.freeAmount.getCurrency()
            };
        } else {
            data = { parts: that.fieldParts.val() };
        }

        $.ajax({
            method: 'post',
            url: Utils.safeUrl(that.fieldParts.attr('data-calc')),
            data: data
        }).done(function (data) {
            if (data && data.month && data.total) {
                that.blockInfo.show();
                that.blockInfo.find('.month').text(data.month);
                that.blockInfo.find('.total').text(data.total);
                if (data.currency) {
                    that.blockInfo.find('.currency').text(data.currency);
                }
            } else {
                that.blockInfo.hide();
            }
        });
    };

    this.revalidate = function () {
        if (this.fieldName.length > 0) {
            this.fieldName.checkRequired(App.msgLoc.cardPayerNameIsRequired);
        }
        if (this.fieldEmail.length > 0) {
            this.fieldEmail.checkRequired(App.msgLoc.emailIsRequired);
            this.fieldEmail.isEmailValid();
        }
        if (this.fieldPhone.length > 0) {
            this.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
            if (!this.fieldPhone.hasError()) {
                this.fieldPhone.isPhoneValid();
            }
        }

        if (this.listToken.length > 0) {
            if (!this.listToken.find('input[type="radio"]').is(':checked')) {
                this.listToken.showError(App.msgLoc.fieldIsRequired);
            } else {
                this.listToken.hideError();
            }
        }

        if (this.fieldSecure.length > 0) {
            if(!this.fieldSecure.val()) {
                this.fieldSecure.toggleInputError(true, App.msgLoc.cvvIsRequired);
            }
        }

        if (this.fieldParts.length > 0) {
            that.fieldParts.checkRequired(App.msgLoc.quantityIsRequired);
        }

        if (App.extraFields) {
            this.fieldExtra.val(App.extraFields.form.serialize());
        }

        if (App.formDelivery) {
            this.fieldDelivery.val(App.formDelivery.form.serialize());
        }

        if (App.freeAmount.amount.length > 0 || App.freeAmount.comment.length > 0 || App.freeAmount.quantity.length > 0) {
            App.freeAmount.revalidate();
            if (App.freeAmount.amount.length > 0 && this.fieldAmount.length > 0) {
                this.fieldAmount.val(App.freeAmount.amount.val());
                this.fieldCurrency.val(App.freeAmount.currency.children().first().text());
            }
            if (App.freeAmount.comment.length > 0 && this.fieldComment.length > 0) {
                this.fieldComment.val(App.freeAmount.comment.val());
            }
            if (App.freeAmount.isSaleUnits() && this.fieldQuantity.length > 0) {
                this.fieldQuantity.val(App.freeAmount.quantity.val());
            }
        }

        if(App.extraFields) {
            App.extraFields.revalidate();
        }

        if(App.formDelivery) {
            App.formDelivery.revalidate();
        }
    };

    this.init();
}


/* delay form
 ---------------------------------------------------------------------------------------------- */
function FormDelay() {
    var that = this;

    this.form = $('#paydelay');
    this.fieldEmail = $('#paydelay-email').iil();
    this.btnSubmit = $('#paydelay-submit');

    this.init = function () {
        /* SUBMIT */
        this.form.on('submit', function (event) {
            var caption = that.btnSubmit.html();
            Utils.showOverlay(App.withoutLoader);
            if (App.withoutLoader) {
                that.btnSubmit.addClass('disabled');
                that.btnSubmit.html(App.processingSpinner + ' ' + App.msgLoc.inProcessing);
            }
            that.revalidate();
            if (!that.form.isAllowedSend()) {
                if (App.withoutLoader) {
                    that.btnSubmit.removeClass('disabled');
                    that.btnSubmit.html(caption);
                }
                Utils.removeOverlay();
                Utils.stopEvent(event);
                return false;
            } else {
                that.btnSubmit.prop('type', 'button');
            }
        });
    };

    this.revalidate = function () {
        this.fieldEmail.checkRequired(App.msgLoc.emailIsRequired);
        this.fieldEmail.isEmailValid();
    };

    this.init();
}

/* phone with otp auth form
 ---------------------------------------------------------------------------------------------- */
function FormOtpPhone(id, ctrl) {
    var that = this;
    var awaitingCode = false;

    this.form          = $(id);
    this.fieldPhone    = $(id + '-phone').iil();
    this.fieldCode     = $(id + '-code').iil();
    this.btnSubmit     = $(id + '-submit');
    this.btnComplete   = $(id + '-complete');
    this.btnCodeRepeat = $(id + '-repeat');

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
            Utils.showOverlay(true);

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
            Utils.showOverlay(true);
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
            url: Utils.safeUrl(ctrl + '/phone'),
            data: that.form.serialize()
        }).done(function (response) {
            var data;
            //console.log('submit phone response');
            if(response) {
                data = $.parseJSON(response);
                if(data) {
                    Utils.removeOverlay();
                    if(data.success) {
                        that.awaitingCode = true;
                        that.fieldPhone.attr('disabled', 'disabled');
                        that.btnSubmit.closest('.form-actions').hide();
                        that.btnComplete.closest('.form-actions').show();
                        that.fieldCode.closest('.form-group').slideDown();
                        that.fieldCode.focus();
                        setTimeout(function () {
                            that.btnCodeRepeat.parent().show();
                        }, 20000);
                    } else if(data.invalid) {
                        that.fieldPhone.toggleInputError(true, data.message);
                    } else {
                        location.reload();
                    }
                } else {
                    location.reload();
                }
            }
        });
    };

    this.submitCode = function () {
        $.ajax({
            type: 'POST',
            url: Utils.safeUrl(ctrl + '/confirm'),
            data: that.form.serialize()
        }).done(function (response) {
            var url, data = $.parseJSON(response);
            if (data && data.failed) {
                that.fieldCode.val('').showError(App.msgLoc.wrongCode).closest('.form-group').addClass('has-error');
                setTimeout(function () {
                    that.fieldCode.hideError();
                }, 5000);
                Utils.removeOverlay();
            } else {
                if(data && data.ticket) {
                    url = location.href;
                    url += ((url.indexOf('?') > -1) ? '&t=' : '?t=') + data.ticket;
                    location.href = url;
                } else {
                    location.reload();
                }
            }
        });
    };

    this.revalidate = function () {
        this.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
    };

    this.init();
}

/*
 ---------------------------------------------------------------------------------------------- */
function FormCardOtp() {
    var that = this;
    var awaitingCode = false;

    this.block         = $('#cardotp-block');
    this.form          = $('#cardotp');
    this.fieldPhone    = $('#cardotp-phone').iil();
    this.fieldCode     = $('#cardotp-code').iil();
    this.btnStart      = $('#cardotp-start');
    this.btnSubmit     = $('#cardotp-submit');
    this.btnCancel     = $('#cardotp-cancel');
    this.btnComplete   = $('#cardotp-complete');
    this.btnCodeRepeat = $('#cardotp-repeat');
    this.blockPhone    = $('#cardotp-block-phone');
    this.blockCode     = $('#cardotp-block-code');
    this.blockActions  = $('#cardotp-block-actions');
    this.blockNone     = $('#cardotp-block-none');

    this.init = function () {
        /* PHONE */
        if (this.fieldPhone.length > 0) {
            this.fieldPhone.on('blur', function () {
                that.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
            });
        }

        /* START */
        this.btnStart.on('click', function (event) {
            App.formCard.block.hide();
            that.block.fadeIn();
            if (App.freeAmount) {
                App.freeAmount.toggleControls(true);
            }
        });

        /* CANCEL */
        $('.cardotp-cancel').on('click', function (event) {
            that.block.hide();
            that.btnStart.parent().hide();
            App.formCard.block.fadeIn();
            if (App.freeAmount) {
                App.freeAmount.toggleControls(false);
            }
        });

        /* SUBMIT */
        this.btnSubmit.on('click', function (event) {
            Utils.stopEvent(event);
            if(that.awaitingCode) {
                return;
            }
            Utils.showOverlay();
            that.revalidate();
            if (!that.form.isAllowedSend()) {
                Utils.removeOverlay();
            } else {
                that.submitPhone();
            }
        });

        /* REPEAT */
        this.btnCodeRepeat.on('click', function (event) {
            Utils.stopEvent(event);
            Utils.showOverlay();
            that.fieldPhone.removeAttr('disabled');
            that.btnCodeRepeat.parent().hide();
            that.submitPhone(true);
        });

        /* COMPLETE */
        this.btnComplete.on('click', function () {
            that.btnCodeRepeat.parent().hide();
            if(!that.awaitingCode) {
                return;
            }
            if (that.fieldCode.val().length != that.fieldCode.attr('maxlength')) {
                that.fieldCode.toggleInputError(true, App.msgLoc.wrongCode);
                return false;
            }
            Utils.showOverlay();
            that.submitCode();
        });
    };

    this.submitPhone = function (is_repeat) {
        $.ajax({
            type: 'POST',
            url: Utils.safeUrl('/finidc/phone'),
            data: that.form.serialize()
        }).done(function (response) {
            var data;
            if(response) {
                Utils.removeOverlay();
                if(response.status === 'success') {
                    that.awaitingCode = true;
                    that.fieldPhone.attr('disabled', 'disabled');
                    that.btnSubmit.hide();
                    that.btnComplete.fadeIn();
                    //that.fieldCode.slideDown();
                    that.blockCode.fadeIn();
                    that.fieldCode.focus();
                    if (!is_repeat) {
                        setTimeout(function () {
                            that.btnCodeRepeat.parent().fadeIn();
                        }, 20000);
                    }
                } else if(response.status === 'error') {
                    that.fieldPhone.toggleInputError(true, response.message);
                } else {
                    location.reload();
                }
            } else {
                location.reload();
            }
        });
    };

    this.submitCode = function () {
        that.fieldCode.hideError();
        $.ajax({
            type: 'POST',
            url: Utils.safeUrl('/finidc/confirm'),
            data: that.form.serialize()
        }).done(function (response) {
            if (response.status === 'failed') {
                that.fieldCode.val('');
                that.fieldCode.showError(App.msgLoc.wrongCode);
                setTimeout(function () {
                    that.fieldCode.hideError();
                }, 2000);
                Utils.removeOverlay();
            } else if(response.status === 'empty') {
                that.blockCode.hide();
                that.blockActions.hide();
                that.blockNone.fadeIn();
                Utils.removeOverlay();
            } else if(response.status === 'success') {
                /*var url = location.href;
                url += ((url.indexOf('?') > -1) ? '&t=' : '?t=') + data.ticket;
                location.href = url;*/
                location.reload();
            } else if(response.status === 'error') {
                Utils.removeOverlay();
                that.fieldCode.showError(response.message);
            } else {
                location.reload();
            }
        });
    };

    this.revalidate = function () {
        this.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
    };

    this.init();
}


/* credit form
 ---------------------------------------------------------------------------------------------- */
function FormCredit() {
    var that = this;

    this.form = $('#paycredit');
    this.btnSubmit = $('#paycredit-submit');
    this.fieldPass = $('#paycredit-passport').iil();
    this.fieldEmail = $('#paycredit-email').iil();
    this.fieldPhone = $('#paycredit-phone').iil();
    $('#paycredit-name').iil();
    $('#paycredit-birthdate').iil();
    $('#paycredit-birthdate').iil().next().iil().next().iil();
    $('#paycredit-itn').iil();
    $('#paycredit-passport').iil();
    $('#paycredit-passdate').iil().next().iil().next().iil();
    this.fieldExtra = $('#paycredit-extra');
    this.fieldDelivery = $('#paycredit-delivery');

    this.init = function () {
        /* PASSPORT UA*/
        if(this.fieldPass.length > 0) {
            this.fieldPass.mask('ZZ 999999', {translation: {'Z': {pattern: /[а-яА-ЯїЇєЄ]/}}});
        }

        /* EMAIL */
        if (this.fieldEmail.length > 0) {
            this.fieldEmail.on('blur', function () {
                that.fieldEmail.checkRequired(App.msgLoc.emailIsRequired);
                that.fieldEmail.isEmailValid(true);
            });
        }

        /* PHONE */
        if (this.fieldPhone.length > 0) {
            this.fieldPhone.on('blur', function () {
                that.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
                if (!that.fieldPhone.hasError()) {
                    that.fieldPhone.isPhoneValid();
                }
            });
        }

        /* SUBMIT */
        this.btnSubmit.on('click', function (event) {
            var caption = that.btnSubmit.html();
            Utils.showOverlay(App.withoutLoader);
            if (App.withoutLoader) {
                that.btnSubmit.addClass('disabled');
                that.btnSubmit.html(App.processingSpinner + ' ' + App.msgLoc.inProcessing);
            }
            that.revalidate();
            if (!that.form.isAllowedSend()) {
                if (App.withoutLoader) {
                    that.btnSubmit.removeClass('disabled');
                    that.btnSubmit.html(caption);
                }
                Utils.removeOverlay();
                Utils.stopEvent(event);
            }
        });
    };

    this.revalidate = function () {
        $('#' + this.form.attr('id') + ' .form-control').map(function () {
            $(this).checkRequired(App.msgLoc.fieldIsEmpty);
        });

        if (this.fieldEmail.length > 0) {
            this.fieldEmail.isEmailValid();
        }
    };

    this.init();
}

/* finid auth form
 ---------------------------------------------------------------------------------------------- */
function FormMasterPass() {
    var that = this;
    this.form          = $('#mppay');
    this.radioToken    = $('#mppay input.masterpass-token');
    this.fieldToken    = $('#mppay-token');
    this.fieldExtra    = $('#mppay-extra');
    this.fieldDelivery = $('#mppay-delivery');
    this.btnSubmit     = $('#mppay-submit');
    this.fieldAmount   = $('#mppay-amount').iil();
    this.fieldCurrency = $('#mppay-currency').iil();
    this.fieldComment  = $('#mppay-comment').iil();
    this.fieldQuantity = $('#mppay-quantity').iil();

    this.init = function () {

        this.form.on('submit', function (event) {
            var caption = that.btnSubmit.text();
            that.radioToken = $('#mppay input.masterpass-token');

            if (!that.isValid()) {
                Utils.stopEvent(event);
                return;
            }

            Utils.showOverlay(App.withoutLoader);
            if (App.withoutLoader) {
                that.btnSubmit.addClass('disabled');
                that.btnSubmit.html(App.processingSpinner + ' ' + App.msgLoc.inProcessing);
            }
            if (!that.form.isAllowedSend()) {
                if (App.withoutLoader) {
                    that.btnSubmit.removeClass('disabled');
                    that.btnSubmit.text(caption);
                }
                Utils.removeOverlay();
                Utils.stopEvent(event);
                return false;
            } else {
                that.btnSubmit.prop('type', 'button');
            }
        });
    };

    this.isValid = function () {
        if (that.radioToken.length > 0 && !that.radioToken.is(':checked')) {
            //console.log('token is not select');
            return false;
        }
        if (that.fieldToken.length > 0 && !that.fieldToken.val()) {
            //console.log('token is not chosen');
            return false;
        }

        if (App.freeAmount.amount.length > 0 || App.freeAmount.comment.length > 0) {
            App.freeAmount.revalidate();
            if (App.freeAmount.amount.length > 0 && this.fieldAmount.length > 0) {
                this.fieldAmount.val(App.freeAmount.amount.val());
                this.fieldCurrency.val(App.freeAmount.currency.children().first().text());
            }
            if (App.freeAmount.comment.length > 0 && this.fieldComment.length > 0) {
                this.fieldComment.val(App.freeAmount.comment.val());
            }
            if (App.freeAmount.isSaleUnits() && this.fieldQuantity.length > 0) {
                this.fieldQuantity.val(App.freeAmount.quantity.val());
            }
        }

        if (App.extraFields) {
            this.fieldExtra.val(App.extraFields.form.serialize());
            App.extraFields.revalidate();
        }

        if (App.formDelivery) {
            this.fieldDelivery.val(App.formDelivery.form.serialize());
            App.formDelivery.revalidate();
        }

        return true;
    };

    this.init();
}

/* visa secure
 ---------------------------------------------------------------------------------------------- */
function FormOnlySecure(id) {
    var that           = this;
    this.form          = $(id);
    this.fieldCVV      = $(id + '-cardsecure');
    this.buttonSubmit  = $(id + '-submit');
    this.fieldAmount   = $(id + '-clientamount').iil();
    this.fieldCurrency = $(id + '-clientcurrency').iil();
    this.fieldComment  = $(id + '-clientcomment').iil();
    this.fieldQuantity = $(id + '-quantity').iil();
    this.fieldExtra    = $(id + '-extra');
    this.fieldDelivery = $(id + '-delivery');

    this.init = function () {
        this.fieldCVV.payment('formatCardCVC');
        this.checkCVV();

        this.fieldCVV.blur(function () {
            that.checkCVV();
        });

        this.fieldCVV.focus();

        this.form.on('submit', function () {
            var caption = that.buttonSubmit.text();

            Utils.showOverlay(App.withoutLoader);
            if(App.withoutLoader) {
                that.buttonSubmit.addClass('disabled');
                that.buttonSubmit.html(App.processingSpinner + ' ' + App.msgLoc.inProcessing);
            }

            that.revalidate();

            if (!that.form.isAllowedSend()) {
                if(App.withoutLoader) {
                    that.buttonSubmit.removeClass('disabled');
                    that.buttonSubmit.text(caption);
                }
                Utils.removeOverlay();
                Utils.stopEvent(event);
            }
        });
    };

    this.checkCVV = function () {
        if(!this.fieldCVV.val()) {
            this.fieldCVV.toggleInputError(true, App.msgLoc.cvvIsRequired);
        } else {
            this.fieldCVV.toggleInputError(
                !$.payment.validateCardCVC(this.fieldCVV.val()),
                App.msgLoc.cvvNotValid
            );
        }
    };

    this.revalidate = function () {
        that.checkCVV();

        if (App.extraFields) {
            this.fieldExtra.val(App.extraFields.form.serialize());
        }

        if (App.formDelivery) {
            this.fieldDelivery.val(App.formDelivery.form.serialize());
        }

        if (App.freeAmount.amount.length > 0 || App.freeAmount.comment.length > 0) {
            App.freeAmount.revalidate();
            if(App.freeAmount.amount.length > 0 && this.fieldAmount.length > 0) {
                this.fieldAmount.val(App.freeAmount.amount.val());
                this.fieldCurrency.val(App.freeAmount.currency.children().first().text());
            }
            if(App.freeAmount.comment.length > 0 && this.fieldComment.length > 0) {
                this.fieldComment.val(App.freeAmount.comment.val());
            }
            if(App.freeAmount.clientname.length > 0 && this.fieldName.length > 0) {
                this.fieldName .val(App.freeAmount.clientname.val());
            }
            if (App.freeAmount.isSaleUnits() && this.fieldQuantity.length > 0) {
                this.fieldQuantity.val(App.freeAmount.quantity.val());
            }
        }
    };

    this.init();
}

/* on ready
 ---------------------------------------------------------------------------------------------- */
$(function () {
    var activeTab = location.hash.substring(1);
    if (App.knownTabs.indexOf(activeTab) !== -1) {
        $('a[aria-controls="tab-' + activeTab + '"]').tab('show').button('toggle');
    }
    $('#pay-form-block').show().trigger('afterShow');
    $('.pay-form').show();
    $('.pay-form').each(function () {
        $(this).show();
    });
    $(document).trigger('shownTabMethods');

    //var s = Utils.urlParam('vkh');
    $.ajax({url: Utils.safeUrl('/pay/time/' + Date.now())});

    //
    // timezone
    //
    var x = new Date();
    var tz = -1 * x.getTimezoneOffset();
    $('.field-timezone').each(function () {
        $(this).val(tz);
    });

    //
    // countdown timer
    //
    var timer = $('#countdown-timer');
    if(timer.length > 0) {
        Utils.startCountdown('countdown-timer', timer.attr('data-start'), function () {
            top.postMessage('WfpWidgetEventExpired', '*');
            //location.reload();
            location.href = Utils.safeUrl('/return');
        });
    }

    //
    // machine id
    //
    /*$('.field-machine').each(function () {
        fp($(this));
    });*/
    fpone('.field-machine');

    //
    // widget close controls
    //
    /*$('.wfp-widget-close-btn').map(function () {
     $(this).on('click', function (event) {
     top.postMessage('WfpWidgetEventClose', '*');
     })
     });*/

    //
    // widget is loaded
    //
    top.postMessage('WfpWidgetEventLoaded', '*');

    //
    // auto focus to next control on fill
    //
    $('.form-control[data-next]').map(function () {
        $(this).on('input', function (event) {
            $(this).focusNextOnFill();
        });
    });

    App.freeAmount = new FreeAmount();

    if ($('#cardpay').length > 0) {
        App.formCard = new FormCard();
        if ($('#regular-check').length > 0) {
            App.regular = new Regular();
        }
    }
    if ($('#payp24').length > 0) {
        App.formP24 = new FormAlternate('#payp24');
    }
    if ($('#paylqpt').length > 0) {
        App.formLqpt = new FormAlternate('#paylqpt');
    }
    if ($('#paybtc').length > 0) {
        App.formBtc = new FormAlternate('#paybtc');
    }
    if ($('#payaw').length > 0) {
        App.formYW = new FormAlternate('#payaw');
    }
    if ($('#payat').length > 0) {
        App.formYT = new FormAlternate('#payat');
    }
    if ($('#paydelay').length > 0) {
        App.formDelay = new FormDelay();
    }
    if ($('#paycredit').length > 0) {
        App.formCredit = new FormCredit();
    }
    if ($('#finid').length > 0) {
        App.formOtpPhone = new FormOtpPhone('#finid', '/finidm');
    }
    if ($('#payparts').length > 0) {
        App.formParts = new FormAlternate('#payparts');
    }
    if ($('#mppay').length > 0) {
        App.formMasterPass = new FormMasterPass('#masterpass');
    }
    if ($('#paybot').length > 0) {
        //App.formBot = new FormOtpPhone('#paybot', '/bot');
        App.formBot = new FormBotPay();
    }
    if ($('#form-extra').length > 0) {
        App.extraFields = new ExtraFields();
    }
    if ($('#delivery-form').length > 0) {
        App.formDelivery = new Delivery();
    }
    if ($('#eventreg').length > 0) {
        App.formEventReg = new FormAlternate('#eventreg');
    }
    if ($('#vcpay').length > 0) {
        App.formVcPay = new FormAlternate('#vcpay');
    }
    if ($('#vcsec').length > 0) {
        App.formVcSec = new FormOnlySecure('#vcsec');
    }
    if ($('#paycash').length > 0) {
        App.formCash = new FormAlternate('#paycash');
    }
    if ($('#gpay').length > 0) {
        App.formGpay = new FormAlternate('#gpay');
    }
    if ($('#apay').length > 0) {
        App.formApay = new FormAlternate('#apay');
    }
    if ($('#cardotp').length > 0) {
        App.formCardOtp = new FormCardOtp();
    }
    if ($('#tokenpay').length > 0) {
        App.formCardToken = new FormAlternate('#tokenpay');
    }
    if ($('#paynocost').length > 0) {
        App.formNoCost = new FormAlternate('#paynocost');
    }
    if ($('#paypmono').length > 0) {
        App.formMono = new FormAlternate('#paypmono');
    }
    if ($('#paypprivat').length > 0) {
        App.formPPrivat = new FormAlternate('#paypprivat');
    }
    if ($('#paypialfa').length > 0) {
        App.formPIAlfa = new FormAlternate('#paypialfa');
    }

    //
    // payment tabs changing
    //
    $('.pay-form a[data-toggle="tab"], .pay-methods a[data-toggle="tab"], .payments a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var tab = e.target.getAttribute('aria-controls');
        if ('tab-doubt' == tab) {
            App.formCard.fieldOtpCode.focus();
        }
        location.hash = '#' + tab.substring(4);
        $(document).trigger('payTabChanged', tab.substring(4));
    });

    $('[data-toggle="popover"]').popover({trigger: 'hover', html: true, delay: {show: 10, hide: 400}});

    if ($('body').hasClass('loader')) {
        App.withoutLoader = false;
    }

    $('.field-user-name').on('blur', function() {
        var current = $(this).val();
        $('.field-user-name:not(.src)').val(current);
    });

    $('.field-user-email:not(.src)').on('blur', function() {
        var current = $(this).val();
        $('.field-user-email:not(.src)').val(current);
    });

    $('.field-user-phone').on('blur', function() {
        var current = $(this).val();
        $('.field-user-phone:not(.src)').val(current);
    });

    $('.field-user-comment').on('blur', function() {
        var current = $(this).val();
        $('.field-user-comment').val(current);
    });

    $('#promo-intro').click(function () {
        $('#promo-intro').hide();
        $('#promo-input-block').fadeIn();
    });

    $('#promo-code').iil();
    $('#promo-apply').click(function (event) {
        var promoCode = $('#promo-code').val();
        if (!promoCode) {
            return;
        }

        $('#promo-code').hideError();
        Utils.showOverlay();
        $.ajax({
            type: "post",
            url: Utils.safeUrl('/promo'),
            data: {
                code: promoCode,
                quantity: App.freeAmount.quantity.val()
            }
        }).done(function(response) {
            Utils.removeOverlay();
            var event,
                h = $('#promo-input-block .help-block'),
                data = $.parseJSON(response);
            if (data) {
                if (data.status) {
                    $('#promo-input-block').hide();
                    $('#after-promo-discount').text(data.discount);
                    $('#after-promo-total').text(data.total);
                    $('#after-promo-code').text(data.code);
                    $('#after-promo-block').fadeIn();
                    h.text('');
                    $(document).trigger('updateSubmitAmount', data.total);
                    if (data.reload) {
                        Utils.showOverlay();
                        location.reload();
                    }
                    if (data.update) {
                        App.freeAmount.discount.text(data.discount + ' ' + App.freeAmount.getCurrency()).closest('.discount').show();
                        App.freeAmount.updateAmount(data.total);
                        if (data.base && $('#freepay-base').length) {
                            $('#freepay-base').text(data.base);
                        }
                    }
                    App.freeAmount.amount.attr('data-d2-rate', data.rate);
                    App.freeAmount.amount.attr('data-d2-min', data.min)
                    App.freeAmount.amount.attr('data-d2-fixed', data.fixed)
                    if (data.rebuild) {
                        App.freeAmount.rebuildDiscount2();
                        App.freeAmount.triggerChangeAmount();
                        if (data.units) {
                            App.freeAmount.quantity.trigger('change');
                        }
                    }
                } else if (data.expired) {
                    $('#promo-input-block').hide();
                    $('#after-promo-block').hide();
                    if (data.reload) {
                        Utils.showOverlay();
                        location.reload();
                    }
                } else {
                    h.text(data.message);
                    $('#promo-code').showError(data.message);
                }
            }
        });
    });

    window.postMessage('WfpWidgetEventForms', '*');
});
