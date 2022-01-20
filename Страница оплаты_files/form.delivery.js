/**
 *  delivery info
 */

function Delivery() {
    var that = this;
    this.form     = $('#delivery-form');
    this.dType    = $('#delivery-type');
    this.dCountry = $('#delivery-country');
    this.dArea    = $('#delivery-area');
    this.dState   = $('#delivery-state');
    this.dCity    = $('#delivery-city');
    this.dDep     = $('#delivery-dep');
    this.tCity    = $('#delivery-city-text');
    this.tAddress = $('#delivery-address');
    this.bArea    = $('#delivery-block-areas');
    this.bState   = $('#delivery-block-state');
    this.bLists   = $('#delivery-block-lists');
    this.bOther   = $('#delivery-block-other');
    this.bCountry = $('#delivery-block-countries');
    this.bReceiver = $('#delivery-block-receiver');
    this.tClient  = $('#delivery-client');
    this.tPhone   = $('#delivery-phone');

    this.isPicker = (that.dType.selectpicker);

    this.init = function () {
        this.dType.on('change', function (event) {
            that.dType.toggleInputError(false);

            if (that.isPicker) {
                that.dDep.find('option').remove().end();
                that.dDep.selectpicker('refresh');
                that.dCity.find('option').remove().end();
                that.dCity.selectpicker('refresh');
                that.dArea.find('option').remove().end();
                that.dArea.selectpicker('refresh');
            } else {
                that.dDep.find('option').remove().end().change();
                that.dCity.find('option').remove().end().change();
                that.dArea.find('option').remove().end().change();
            }

            that.bCountry.hide();
            that.bOther.hide();
            that.bLists.hide();

            if ('' === that.dType.val() || !that.dType.val()) {
                that.bArea.fadeOut();
                return;
            }

            that.form.attr('data-type', that.dType.val());

            if ('other' === that.dType.val()) {
                that.bCountry.fadeIn();
                that.dArea.hideError();
                that.dCity.hideError();
                that.dDep.hideError();
            }

            if ('pickup' === that.dType.val()) {
                //that.bCountry.fadeIn();
                that.dArea.hide();
                that.dCity.hideError();
                that.dDep.hideError();
                that.bLists.fadeIn();
            }
            that.bArea.slideDown(function () {
                that.scrollingDown();
            });
            $.ajax({
                url: Utils.safeUrl('/delivery/areas?type=' + that.dType.val())
            }).done(function (response) {
                var data = $.parseJSON(response);
                if (data) {
                    //
                    //dDep.append('<option value=""></option>');
                    if (that.isPicker) {
                        that.dDep.selectpicker('refresh');
                    } else {
                        that.dDep.change();
                    }
                    //
                    //dCity.append('<option value=""></option>');
                    if (that.isPicker) {
                        that.dCity.selectpicker('refresh');
                    } else {
                        that.dCity.change();
                    }
                    //
                    that.dArea.append('<option value=""></option>');
                    var cnt = 0, last;
                    $.each(data, function (key, value) {
                        that.dArea.append('<option value=' + key + '>' + value + '</option>');
                        cnt++;
                        last = key;
                    });
                    if (cnt === 1) {
                        that.dArea.val(last);
                        that.bArea.hide();
                    }

                    if (that.isPicker) {
                        that.dArea.selectpicker('refresh');
                    } else {
                        that.dArea.change();
                    }
                }
            });
        });

        this.dCountry.on('change', function (event) {

            if ('' === that.dCountry.val() || !that.dCountry.val()) {
                return;
            }

            if ('UKR' === that.dCountry.val()) {
                //that.bOther.fadeOut();
                that.bArea.slideDown();
                that.bState.hide();
            } else {
                if ('USA' === that.dCountry.val()) {
                    that.bState.show();
                } else {
                    that.bState.hide();
                }
                that.bArea.hide();
                that.bOther.slideDown();
                that.bReceiver.slideDown(function () { that.scrollingDown(); });
            }
        });

        this.dArea.on('change', function (event) {
            that.dArea.toggleInputError(false);

            if (!that.dType.val() || !that.dArea.val()) {
                return;
            }

            if (that.isPicker) {
                that.dDep.find('option').remove().end();
                that.dDep.selectpicker('refresh');
                that.dCity.find('option').remove().end();
                that.dCity.selectpicker('refresh');
            } else {
                that.dDep.find('option').remove().end().change();
                that.dCity.find('option').remove().end().change();
            }

            if ('other' === that.dType.val()) {
                //bLists.hide();
                that.bOther.show();
            } else {
                //bOther.hide();
                that.bLists.show();
            }

            $.ajax({
                url: Utils.safeUrl('/delivery/cities?type=' + that.dType.val() + '&area=' + that.dArea.val())
            }).done(function (response) {
                var data = $.parseJSON(response);
                if (data) {
                    //
                    //dDep.append('<option value=""></option>');
                    if (that.isPicker) {
                        that.dDep.selectpicker('refresh');
                    } else {
                        that.dDep.change();
                    }
                    //
                    that.dCity.append('<option value=""></option>');
                    var cnt = 0, last;
                    $.each(data, function (key, value) {
                        that.dCity.append('<option value=' + key + '>' + value + '</option>');
                        cnt++;
                        last = key;
                    });
                    if (cnt === 0 && 'pickup' === that.dType.val()) {
                        that.bLists.hide();
                    } else if (cnt === 1) {
                        that.dCity.val(last);
                    }
                    if (that.isPicker) {
                        that.dCity.selectpicker('refresh');
                    } else {
                        that.dCity.change();
                    }
                }
            });

            that.bReceiver.slideDown(function () { that.scrollingDown(); });
        });

        this.dCity.on('change', function (event) {

            if (!that.dType.val() || !that.dCity.val()) {
                return;
            }

            that.dCity.toggleInputError(false);

            if (that.isPicker) {
                that.dDep.find('option').remove().end();
                that.dDep.selectpicker('refresh');
            } else {
                that.dDep.find('option').remove().end().change();
            }
            $.ajax({
                url: Utils.safeUrl('/delivery/deps?type=' + that.dType.val() + '&city=' + that.dCity.val())
            }).done(function (response) {
                var data = $.parseJSON(response);
                if (data) {
                    //
                    that.dDep.append('<option value=""></option>');
                    var cnt = 0, last;
                    $.each(data, function (key, value) {
                        that.dDep.append('<option value=' + key + '>' + value + '</option>');
                        cnt++;
                        last = key;
                    });
                    if (cnt === 1) {
                        that.dDep.val(last);
                    }
                    if (that.isPicker) {
                        that.dDep.selectpicker('refresh');
                    } else {
                        that.dDep.change();
                    }
                }
            });
        });

        this.dDep.on('change', function (event) {
            that.dDep.toggleInputError(false);
        });

        if (this.dType.attr('data-once')) {
            this.dType.trigger('change');
        }

        this.tPhone.on('blur', function () {
            that.tPhone.checkRequired(App.msgLoc.phoneIsRequired);
            if (!that.tPhone.hasError()) {
                that.tPhone.isPhoneValid();
            }
        });

        this.tClient.blur(function () {
            that.tClient.checkRequired(App.msgLoc.fieldIsRequired);
        });
    };

    this.revalidate = function () {
        that.dType.checkRequired();
        that.dState.toggleInputError(false);
        if('other' === that.dType.val()) {
            if ('UKR' === that.dCountry.val()) {
                that.dArea.checkRequired();
            } else {
                if ('USA' === that.dCountry.val()) {
                    that.dState.checkRequired();
                }
                if(that.isPicker) {
                    that.dArea.selectpicker('refresh');
                }
                that.dArea.hideError();
            }
            that.dCity.hideError();
            that.dDep.hideError();
            that.tCity.checkRequired();
            that.tAddress.checkRequired();
        } else {
            that.dArea.checkRequired();
            if ('pickup' !== that.dType.val()) {
                that.dCity.checkRequired();
                that.dDep.checkRequired();
            }
            that.tCity.hideError();
            that.tAddress.hideError();
        }
        that.tPhone.checkRequired(App.msgLoc.phoneIsRequired);
        if (!this.tPhone.hasError()) {
            this.tPhone.isPhoneValid();
        }
        that.tClient.checkRequired(App.msgLoc.fieldIsRequired);
    };

    this.disableFields = function () {
        this.dType.prop('disabled', true).prev().prev().addClass('disabled');
        this.dCountry.prop('disabled', true).prev().prev().addClass('disabled');
        this.dArea.prop('disabled', true).prev().prev().addClass('disabled');
        this.dState.prop('disabled', true).prev().prev().addClass('disabled');
        this.dCity.prop('disabled', true).prev().prev().addClass('disabled');
        this.dDep.prop('disabled', true).prev().prev().addClass('disabled');
        this.tCity.prop('disabled', true).prev().prev().addClass('disabled');
        this.tAddress.prop('disabled', true).prev().prev().addClass('disabled');
    };

    this.scrollingDown = function () {
        if (this.form.attr('data-scroll-auto')) {
            $("html, body").animate({ scrollTop: $(document).height() }, 1000);
        }
    };

    this.init();
}
