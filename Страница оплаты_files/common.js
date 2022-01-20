$(function () {

    var pWrap = $('#text-products'), pCtrl;
    if (pWrap.length > 0) {
        pCtrl = pWrap.find('.form-control');
        if (pCtrl[0].scrollHeight > pCtrl.innerHeight()) {
            pWrap.removeClass('none').addClass('collapsed');
        }
    }

    //
    $('.row .col-right .form-control').on('focus', function () {
        $(this).closest('.row').addClass('active');
    }).on('blur', function () {
        $(this).closest('.row').removeClass('active');
    });
    $('.validation-wrapper .form-control').on('focus', function () {
        $(this).closest('.form-group').addClass('active');
    }).on('blur', function () {
        $(this).closest('.form-group').removeClass('active');
    });

    //
    $('.btn-text-expand').click(function (e) {
        $(this).closest('.text-wrapper').removeClass('collapsed').addClass('expanded');
    });
    $('.btn-text-collapse').click(function (e) {
        $(this).closest('.text-wrapper').removeClass('expanded').addClass('collapsed');
    });


    $(document).on('checkoutAmountChanged', function (event, data) {
        if (App.formParts)   { App.formParts.calcParts(); }
        if (App.formMono)    { App.formMono.calcParts(); }
        if (App.formPPrivat) { App.formPPrivat.calcParts(); }
        if (App.formAbank)   { App.formAbank.calcParts(); }
        if (App.formIIAbank) { App.formIIAbank.calcParts(); }
        if (App.formGlobus)  { App.formGlobus.calcParts(); }
        if (App.formPosch)   { App.formPosch.calcParts(); }
    });
});
