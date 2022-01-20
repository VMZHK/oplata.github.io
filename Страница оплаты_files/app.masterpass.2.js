var MasterPass = {
    rsc: new RSAKey,
    payForm: null,
    authForm: null,
    registerForm: null,
    otpForm: null,
    vkh: Utils.urlParam('vkh'),
    showBlock: function(name, message, title) {
        $('.mp-block').hide();
        $('#mp-block-' + name).fadeIn();
        if (title) {
            $('#mp-block-' + name).find('.title').text(title);
        }
        if (message) {
            $('#mp-block-' + name).find('.description').text(message);
        }
    },
    updateList: function () {
        $.ajax({
            url: '/master/list'
        }).done(function(response) {
            MasterPass.payForm.list.html(response);
            MasterPass.payForm.initListTriggers();
        });
    }
};

/* auth form
 ------------------------- */
function MPFormAuth() {
    var that = this;

    this.form = $('#mpauth');
    if (this.form.length <= 0) {
        return;
    }

    this.fieldPhone = $('#mpauth-phone').iil();
    this.fieldPwd   = $('#mpauth-pwd');

    this.fieldPwd.keyup(function () {
        if ($(this).val()) {
            $('#mpauth-enc-pwd').val(MasterPass.rsc.encrypt($(this).val()));
        } else {
            $('#mpauth-enc-pwd').val('');
        }
    });

    this.form.on('submit', function (event) {
        Utils.stopEvent(event);
        that.validate();
        if (!that.form.isAllowedSend()) {
            return false;
        } else {
            Utils.showOverlay();
            $.ajax({
                type: 'POST',
                url: that.form.prop('action'),
                data: that.form.serialize()
            }).done(function(response) {
                that.fieldPwd.val('');
                Utils.removeOverlay();
                var data = $.parseJSON(response);
                if (data && data.status) {
                    if (data.status === 'ok') {
                        MasterPass.showBlock('main', data.message);
                        MasterPass.updateList();
                    } else if (data.status === 'otp') {
                        MasterPass.showBlock('otp', data.message);
                    } else if (data.status === 'lock') {
                        MasterPass.showBlock('auth-lock');
                    } else {
                        MasterPass.showBlock('auth-broken', data.message);
                    }
                }
            });
        }
    });

    this.validate = function () {
        that.fieldPhone.checkRequired(App.msgLoc.phoneIsRequired);
        that.fieldPwd.checkRequired(App.msgLoc.passIsRequired);
    };
}

/* register form
 ------------------------- */
function MPFormRegister() {
    var that = this;

    this.form = $('#mpreg');
    if (this.form.length <= 0) {
        return;
    }

    this.fieldCard     = $('#mpreg-cardnumber').iil();
    this.fieldHolder   = $('#mpreg-cardholder').iil();
    this.fieldName     = $('#mpreg-clientname').iil();
    this.fieldCVV      = $('#mpreg-cardsecure').iil();
    this.fieldValidity = $('#mpreg-validity').iil();
    this.btnSubmit     = $('#mpreg-submit');

    this.fieldCard.payment('formatCardNumber');
    this.fieldValidity.payment('formatCardExpiry');
    this.fieldCVV.payment('formatCardCVC');

    this.fieldCard.blur(function () {
        that.checkCard();
        var c = $(this).val().replace(/\s/g, '');
        $('#mpreg-enc-num').val(MasterPass.rsc.encrypt(c));
    });

    this.fieldValidity.blur(function () {
        that.checkValidity();
    });

    this.fieldCVV.blur(function () {
        that.checkCVV();
        $('#mpreg-enc-cvv').val(MasterPass.rsc.encrypt($(this).val()));
    });

    this.fieldHolder.blur(function () {
        that.checkHolder();
    });

    this.form.on('submit', function (event) {
        Utils.stopEvent(event);
        that.checkHolder();
        that.checkCard();
        that.checkValidity();
        that.checkCVV();
        if (!that.form.isAllowedSend()) {
            that.form.trigger('payment.cardValidate', false);
            return false;
        } else {
            that.form.trigger('payment.cardValidate', true);
            Utils.showOverlay();
            $.ajax({
                type: 'POST',
                url: that.form.prop('action'),
                data: that.form.serialize()
            }).done(function(response) {
                that.clear();
                Utils.removeOverlay();
                var data = $.parseJSON(response);
                if (data && data.status) {
                    if (data.status === 'ok') {
                        MasterPass.showBlock('main', data.message);
                        MasterPass.updateList();
                    } else if (data.status === 'otp') {
                        MasterPass.showBlock('otp', data.message);
                    } else {
                        MasterPass.showBlock('broken', data.message);
                    }
                }
            });
        }
    });

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
        this.fieldValidity.toggleInputError(
            !$.payment.validateCardExpiry(this.fieldValidity.payment('cardExpiryVal')),
            App.msgLoc.cardDateNotValid
        );
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

    this.checkHolder = function () {
        that.fieldHolder.checkRequired('Enter card name');
    };

    this.clear = function () {
        this.form.find('.form-control').map(function () {
            $(this).hideError().val('');
        });
    };
}

/* otp form
 ------------------------- */
function MPFormOtp() {
    var that = this;

    this.form = $('#mpotp');
    if (this.form.length <= 0) {
        return;
    }

    this.fieldCode = $('#mpotp-code').iil();
    this.btnSubmit = $('#mpotp-submit');

    this.form.on('submit', function (event) {
        Utils.stopEvent(event);
        that.validate();
        if (!that.form.isAllowedSend()) {
            return false;
        } else {
            Utils.showOverlay();
            $.ajax({
                type: 'POST',
                url: that.form.prop('action'),
                data: that.form.serialize()
            }).done(function(response) {
                that.clear();
                Utils.removeOverlay();
                var data = $.parseJSON(response);
                if (data && data.status) {
                    if (data.status === 'ok') {
                        MasterPass.showBlock('main', data.message);
                        MasterPass.updateList();
                    } else if (data.status === 'otp') {
                        MasterPass.showBlock('otp', data.message);
                    } else if (data.status === 'wrong') {
                        that.fieldCode.showError(data.message);
                    } else {
                        MasterPass.showBlock('broken', data.message);
                    }
                }
            });
        }
    });

    this.validate = function () {
        var len = that.fieldCode.val().length,
            max = that.fieldCode.attr('maxlength');
        if (len != max) {
            that.fieldCode.toggleInputError(true, App.msgLoc.wrongCode);
            return false;
        } else {
            that.fieldCode.hideError();
            return true;
        }
    };

    this.clear = function () {
        this.fieldCode.hideError().val('');
    }
}

/* pay form (additional to form from app.payment)
 ------------------------- */
function MPFormPay() {
    var that = this;

    this.dropdown  = $('#mppay-dropdown');
    this.list      = $('#mppay-list');
    this.token     = $('#mppay-token');

    this.initListTriggers = function () {
        if (this.dropdown.length > 0 && this.list.length > 0) {
            this.list.find('li a.info').on('click', function () {
                var a = $(this), html;
                html = '<span class="'+a.find('.icon').attr('class')+'"></span>';
                html += '<div class="number">'+a.find('.number').text()+'</div>';
                html += '<div class="name">'+a.find('.name').text()+'</div>';
                that.dropdown.html(html);
                that.token.val(a.attr('data-id'));
            });
            this.list.find('li.register a').on('click', function (event) {
                event.preventDefault();
                MasterPass.showBlock('register');
                MasterPass.registerForm.clear();
            });
        }
    };

    this.initListTriggers();
}

/* init
 ------------------------- */
$(function () {
    MasterPass.rsc.setPublic("F619C53A37BAB059C583DA9AC4E2920FFC9D57E00885E82F7A0863DEAC43CE06374E45A1417DAC907C6CAC0AF1DDF1D7152192FED7A1D9255C97BC27E420E0742B95ED3C53C62995F42CB6EEDB7B1FBDD3E4F4A4AA935650DA81E763CA7074690032F6A6AF72802CC50394C2AFA5C9450A990E6F969A38571C8BC9E381125D2BEEC348AF919D7374FF10DC3E0B4367566CE929AD6EA323A475A677EB41C20B42D44E82E8A53DD52334D927394FCADF09","03");

    if ($('#mppay').length > 0) {
        MasterPass.payForm = new MPFormPay();
    }
    if ($('#mpauth').length > 0) {
        MasterPass.authForm = new MPFormAuth();
    }
    if ($('#mpreg').length > 0) {
        MasterPass.registerForm = new MPFormRegister();
    }
    if ($('#mpotp').length > 0) {
        MasterPass.otpForm = new MPFormOtp();
    }

    $('#tab-master .btn-cancel').map(function () {
        var target_block = $(this).attr('data-target-block');
        $(this).on('click', function (event) {
            event.preventDefault();
            if (MasterPass.registerForm) {
                MasterPass.registerForm.clear();
            }
            if (MasterPass.otpForm) {
                MasterPass.otpForm.clear();
            }
            MasterPass.showBlock(target_block? target_block : 'main');
        });
    });

    $('#mppay-btn-register').on('click', function (event) {
        event.preventDefault();
        MasterPass.showBlock('register');
        MasterPass.registerForm.clear();
    });

    $('#tab-master .btn-register').map(function () {
        $(this).on('click', function (event) {
            event.preventDefault();
            MasterPass.showBlock('register');
            MasterPass.registerForm.clear();
        });
    });

    $('#tab-master .btn-card').map(function () {
        $(this).on('click', function (event) {
            //$('.pay-methods .btn-tab-card').tab('show');
            $('#nav-card-button').tab('show');
        });
    });

    $('#tab-master .btn-reload').map(function () {
        $(this).on('click', function (event) {
            location.reload();
        });
    });

    $('#masterpass-modal-delete').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var modal = $(this);
        modal.find('.mask').text(button.data('mask'));
        modal.find('.btn-primary').data('action', '/master/delete?id=' + button.data('id') + (MasterPass.vkh ? '&vkh=' + MasterPass.vkh : ''))
    });

    $('#masterpass-modal-delete').find('.btn-primary').on('click', function (event) {
        $('#masterpass-modal-delete').modal('hide');
        Utils.stopEvent(event);
        Utils.showOverlay();
        $.ajax({
            type: 'GET',
            url: $(this).data('action')
        }).done(function (response) {
            MasterPass.updateList();
            Utils.removeOverlay();
        });
    });

    $('#mppay-btn-link').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        Utils.showOverlay();
        $.ajax({
            type: 'GET',
            url: '/master/link' + (MasterPass.vkh ? '?vkh=' + MasterPass.vkh : '')
        }).done(function(response) {
            Utils.removeOverlay();
            var data = $.parseJSON(response);
            if (data && data.status) {
                if (data.status === 'ok') {
                    MasterPass.showBlock('main', data.message, data.title);
                    MasterPass.updateList();
                } else if (data.status === 'otp') {
                    MasterPass.showBlock('otp', data.message, data.title);
                } else {
                    MasterPass.showBlock('broken', data.message, data.title);
                }
            }
        });
    });
});
