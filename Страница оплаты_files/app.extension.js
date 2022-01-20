/* Utils
 ------------------------------------------------- */
var Utils = {
    cyrillic: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split(''),
    phoneCodesUa: [
        '050', '066', '095', '099', //vodafone
        '067', '068', '096', '097', '098', '039', //kyivstar
        '063', '093', '073', //lifecell
        '091', '092', '094', //trimob peoplenet intertelecom
        '070', '080', '090', //fraud
        '043', //Вінниця
        '056', //Дніпро
        '062', //Донецьк
        '041', //Житомир
        '061', //Запоріжжя
        '034', //Івано-Франківськ
        '044', //Київ
        '045', //Київ
        '052', //Кропивницький
        '064', //Луганськ
        '033', //Луцьк
        '032', //Львів
        '051', //Миколаїв
        '048', //Одеса
        '053', //Полтава
        '036', //Рівне
        '054', //Суми
        '035', //Тернопіль
        '031', //Ужгород
        '057', //Харків
        '055', //Херсон
        '038', //Хмельницький
        '047', //Черкаси
        '046', //Чернігів
        '037'  //Чернівці
    ]
};

Utils.showOverlay = function (without_loading) {
    var over = (without_loading)
        ? '<div id="overlay" class="overlay"></div>'
        : '<div id="overlay" class="loading">Loading&#8230;</div>';
    if ($('#overlay').length > 0) {
        return;
    }
    $(over).appendTo('body');
};

Utils.removeOverlay = function () {
    var over = $('#overlay');
    if (over.length > 0) {
        over.remove();
    }
};

Utils.stopEvent = function (event) {
    event.stopPropagation();
    event.preventDefault();
};

Utils.getMsg = function (msg) {
    return msg || 'ERROR';
};

Utils.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    }
    else {
        return results[1] || 0;
    }
};

Utils.safeUrl = function (url) {
    if (url.indexOf('vkh=') !== -1) {
        return url;
    }
    var s = Utils.urlParam('vkh');
    if (!s) {
        s = $('body').attr('data-vkh');
    }

    if (typeof s !== typeof undefined) {
        if (url.indexOf('?') === -1) {
            return url + (s ? '?vkh=' + s : '');
        } else {
            return url + (s ? '&vkh=' + s : '');
        }
    } else {
        return url;
    }
};

Utils.changeLang = function (l) {
    var u = window.location.href;
    c = new RegExp('[\?&]lang=([^&#]*)').exec(u);
    if (c == null) {
        u = u + ((u.indexOf('?') === -1) ? '?' : '&') + 'lang=' + l;
    } else {
        u = u.replace('lang=' + c[1], 'lang=' + l);
    }
    window.location.href = Utils.safeUrl(u);
};

Utils.sendError =  function (message, file, line) {
    $.ajax({
        method: 'POST',
        url: Utils.safeUrl('/site/js-error'),
        data: {
            'message': message,
            'file': file,
            'line': line
        }
    });
};

Utils.sendLog = function (name, s) {
    $.ajax({
        method: 'POST',
        url: Utils.safeUrl('/site/il'),
        data: {
            n: name,
            v: s
        }
    });
};

Utils.enablePayButton = function (btn, btn_type) {
    btn.fadeIn().attr('disabled', false).closest('.pay-buttons').addClass('show-' + btn_type);
    $('.pay-button-delimiter').fadeIn();
};

/**
 * @param v
 * @returns number (0-not_ua,1-valid,2-short,3-long)
 */
Utils.checkPhoneUA = function (v) {
    var phone = v;
    if (!v) {
        return 0;
    }

    var code_ua;
    if (phone.substr(0, 3) === '380' && phone.length >= 5) {
        code_ua = phone.substr(2, 3);
        if (-1 === Utils.phoneCodesUa.indexOf(code_ua)) {
            return 0;
        }
    } else if (phone.substr(0, 2) === '80' && phone.length >= 4) {
        code_ua = v.substr(1, 3);
        if (-1 === Utils.phoneCodesUa.indexOf(code_ua)) {
            return 0;
        } else {
            phone = '3' + phone;
        }
    } else if (phone.substr(0, 1) === '0' && phone.length >= 3) {
        code_ua = v.substr(0, 3);
        if (-1 === Utils.phoneCodesUa.indexOf(code_ua)) {
            return 0;
        } else {
            phone = '38' + phone;
        }
    }

    if (!code_ua) {
        return 0;
    }

    return (phone.length === 12) ? 1 : ((phone.length < 12) ? 2 : 3);
};

/* JQ extensions
 ------------------------------------------------- */
(function ($) {
    $.fn.isAllowedSend = function (without_extra) {
        var e1 = this.find('.has-error');
        var e2 = this.find('.has-error2');
        var e3,e4,e5,e6;

        if(without_extra) {
            return $(e1).length === 0 && $(e2).length === 0;
        } else {
            e3 = $('#payinfo').find('.has-error');
            e4 = $('#dlvinfo').find('.has-error');
            e5 = $('#form-extra').find('.has-error');
            e6 = $('#clntinfo').find('.has-error');
            return $(e1).length === 0 && $(e2).length === 0 && $(e3).length === 0 && $(e4).length === 0 && $(e5).length === 0 && $(e6).length === 0;
        }
    };

    $.fn.toggleInputError = function (erring, errtext) {
        this.closest('.form-group').toggleClass('has-error', erring);
        if (erring) {
            this.showError(Utils.getMsg(errtext));
        } else {
            this.hideError();
        }
        return this;
    };

    $.fn.hasError = function () {
        return this.closest('.form-group').hasClass('has-error');
    };

    $.fn.iil = function () {
        var that = this, sid = Utils.urlParam('vkh');
        this.prev_value = this.val();
        this.blur(function () {
            var v = that.val(), s, name = that.attr('name');
            if(typeof v !== typeof undefined && that.prev_value !== v) {
                that.prev_value = v;
                s = v;

                if (!name) {
                    name = 'unnamed';
                }

                if (name.indexOf('cardNumber') !== -1) {
                    s = v.replace(' ', '');
                    if(s.length <= 4) {
                        //
                    } else if(s.length <= 12) {
                        s = s.substr(0, 4) + Utils.repeat('*', s.length - 4);
                    } else if(s.length < 16) {
                        s = s.substr(0, 4) + Utils.repeat('*', 8) + s.substr(12);
                    } else {
                        s = s.substr(0, 4) + Utils.repeat('*', s.length - 8) + s.substr(-4);
                    }
                } else if (name.indexOf('cardSecure') !== -1) {
                    s = Utils.repeat('*', s.length);
                }

                Utils.sendLog(name, s);
            }
        });
        return this;
    };

    $.fn.showError = function (text, suffix) {
        var wrp = this.closest('.validation-wrapper'),
            help = 'help-block' + (suffix ? suffix : ''),
            name = this.attr('name'),
            s = Utils.urlParam('vkh');

        if (!wrp.length) {
            wrp = this.closest('.form-group');
        }

        wrp.find('.' + help).remove();

        var isAlready = wrp.find('.' + help).length > 0;

        if (!isAlready) {
            wrp.addClass('has-error' + (suffix ? suffix : ''))
                .append($('<small/>', {
                    'class': help,
                    'text': text
                }));

            $.ajax({
                url: Utils.safeUrl('/site/el'),
                method: 'POST',
                data: {n: name, v: text}
            });
        }
        return this;
    };

    $.fn.hideError = function (suffix) {
        var wrp = this.closest('.validation-wrapper');
        if (!wrp.length) {
            wrp = this.closest('.form-group');
        }
        wrp.removeClass('has-error' + (suffix ? suffix : '')).find('.help-block' + (suffix ? suffix : '')).remove();
        this.closest('.form-group').removeClass('has-error');
        return this;
    };

    /* *** VALIDATION *** */

    /* required checking */
    $.fn.checkRequired = function (errtext) {
        var attr = $(this).attr('required');
        this.toggleInputError(
            (typeof attr !== typeof undefined && attr !== false) && !this.val(),
            errtext || App.msgLoc.fieldIsRequired
        );
    };

    /* sum checking */
    $.fn.isSumValid = function () {
        var isValid = false;

        if (!this.val()) {
            this.showError(App.validator.getMsg(App.msgLoc.sumIsRequired));
        } else if (this.val() * 1 < 10) {
            this.showError(App.validator.getMsg(App.msgLoc.sumToSmall));
        } else {
            this.hideError();
            isValid = true;
        }

        return isValid;
    };

    $.fn.focusNextOnFill = function () {
        var next = this.attr('data-next');
        var maxl = this.attr('maxlength');

        if (this.hasClass('visa') || this.hasClass('mastercard')) {
            maxl = 19;
        }

        if (this.val().length != maxl) {
            return;
        }
        if (next) {
            $(next).focus();
        }
    };

    $.fn.isAmountValid = function (currency) {
        var v = parseFloat(this.val().replace(' ', '').replace(',', '.')),
            min_val = parseInt(this.attr('data-min')),
            max_val = parseInt(this.attr('data-max'));

        if (!min_val) {
            min_val = 0;
        }

        if (!this.val() || isNaN(v) || v == 0) {
            this.toggleInputError(true, App.msgLoc.amountIsRequired);
            return false;
        } else if (v < min_val) {
            this.toggleInputError(true, App.msgLoc.amountAtLeastThan + ' ' + min_val + ' ' + currency);
            return false;
        } else if (max_val && v > max_val) {
            this.toggleInputError(true, App.msgLoc.amountShouldNotExceed + ' ' + max_val + ' ' + currency);
            return false;
        } else {
            this.toggleInputError(false);
            return true;
        }
    };

    $.fn.isQuantityValid = function () {
        var v = parseInt(this.val().replace(' ', '').replace(',', '.')),
            min_val = parseInt(this.attr('data-min')),
            max_val = parseInt(this.attr('data-max')),
            limit_val = parseInt(this.attr('data-limit')),
            limit_msg = this.attr('data-limit-msg');

        if (!min_val) {
            min_val = 0;
        }

        if (!this.val() || isNaN(v) || v == 0) {
            this.toggleInputError(true, App.msgLoc.quantityIsRequired);
            return false;
        } else if (v < min_val) {
            this.toggleInputError(true, App.msgLoc.quantityAtLeastThan + ' ' + min_val);
            return false;
        } else if (max_val && v > max_val) {
            this.toggleInputError(true, App.msgLoc.quantityShouldNotExceed + ' ' + max_val);
            return false;
        } else if (limit_val && v > limit_val) {
            this.toggleInputError(true, limit_msg ? limit_msg : (App.msgLoc.quantityShouldNotExceed + ' ' + limit_val));
            return false;
        } else {
            this.toggleInputError(false);
            return true;
        }
    };

    $.fn.isPhoneValid = function () {
        var v   = this.val().replace('+', '');
        var min = this.attr('data-length-min');
        if(!min) {
            min = 9;
        }
        if (this.val()) {
            this.toggleInputError(v.length < min, App.msgLoc.phoneTooShort);
        }

        var check = Utils.checkPhoneUA(v);
        if (check === 2) {
            this.toggleInputError(true, App.msgLoc.phoneTooShort);
        } else if (check === 3) {
            this.toggleInputError(true, App.msgLoc.phoneNotValid);
        }

    };

    $.fn.isEmailValid = function () {
        if (this.val()) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!re.test($.trim(this.val()))) {
                this.toggleInputError(true, App.msgLoc.emailNotValid);
            }
        }
    };

    $.fn.isCyrillicOnly = function () {
        if (this.val() && this.hasClass('cyrillic-only')) {
            if(!this.val().match(/^[А-Яа-яёЁ ]+$/)) {
                this.toggleInputError(true, App.msgLoc.enterNameInCyrillic);
            }
        }
    };

    $.fn.doAnimate = function (x) {
        this.removeClass('animated').removeClass(x).addClass(x + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            $(this).removeClass('animated').removeClass(x);
        });
    };

    $.fn.isSelect = function () {
        return ('select' == this.prop("tagName").toLowerCase());
    };

    var proxy = $.fn.serializeArray;
    $.fn.serializeArray = function(){
        var inputs = this.find(':disabled');
        inputs.prop('disabled', false);
        var serialized = proxy.apply( this, arguments );
        inputs.prop('disabled', true);
        return serialized;
    };

})(jQuery);

/* Prevent some key pressing
 ------------------------------------------------- */
var nonPreventTagsRX = /INPUT|SELECT|TEXTAREA/i;
if (document.addEventListener) {
    document.addEventListener('keydown', function (e) {
        if (8 == e.which) {
            if (!nonPreventTagsRX.test(e.target.tagName) || e.target.disabled || e.target.readOnly) {
                e.preventDefault();
            }
        }
    });
} else if (document.attachEvent) {
    document.attachEvent('keydown', function (e) {
        if (8 == e.which) {
            if (!nonPreventTagsRX.test(e.target.tagName) || e.target.disabled || e.target.readOnly) {
                e.preventDefault();
            }
        }
    });
}

/* Countdown timer
 ------------------------------------------------- */
Utils.decodeTimeout = function (t) {
    var seconds = Math.floor(t % 60);
    var minutes = Math.floor((t / 60) % 60);
    var hours = Math.floor((t / (60 * 60)) % 24);
    var days = Math.floor(t / (60 * 60 * 24));
    return {
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
    };
};

Utils.startCountdown = function (id, startTimeout, onExpired, short){
    var clock = $('#' + id);
    var countdown = startTimeout;
    function updateClock(){
        var t = Utils.decodeTimeout(countdown);
        clock.html(( short ? '' : (('0' + t.hours).slice(-2) + ':')) +
            ('0' + t.minutes).slice(-2) + ':' +
            ('0' + t.seconds).slice(-2)
        );
        if(countdown <= 60) {
            if(!clock.parent().hasClass('critical')) {
                clock.parent().addClass('critical');
            }
        }
        if(countdown<=0){
            clearInterval(timeInterval);
            if(onExpired) {
                onExpired();
            }
        }
        countdown--;
    }
    updateClock();
    var timeInterval = setInterval(updateClock,1000);
};

Utils.repeat = function(str, num){
    return new Array( num + 1 ).join( str );
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function(valueToFind, fromIndex) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            if (len === 0) {
                return false;
            }
            var n = fromIndex | 0;
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            function sameValueZero(x, y) {
                return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
            }
            while (k < len) {
                if (sameValueZero(o[k], valueToFind)) {
                    return true;
                }
                k++;
            }
            return false;
        }
    });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) {
            'use strict';
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var to = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) {
                    for (var nextKey in nextSource) {
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}

$('input.field-user-phone').on('keyup', function (e) {
    var v = $(this).val().replace('+', ''),
        c,
        check = Utils.checkPhoneUA(v);
    if (check === 1 || check === 3) {
        switch (v.substr(0, 1)) {
            case '3':
                c = 12;
                break;
            case '8':
                c = 11;
                break;
            case '0':
                c = 10;
                break;
        }
        $(this).prop('maxlength', c);
    } else {
        $(this).prop('maxlength', 15);
    }
});