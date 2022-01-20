/* on ready
 ---------------------------------------------------------------------------------------------- */
$(function () {
    if (App && App.formCard) {

        App.formCard.additionalValidityCheck = function (month, year) {
            var _ref, b = App.formCard.fieldCard.val().replace(' ', '').substring(0, 6), _k;
            if (typeof month === 'object' && 'month' in month) {
                _ref = month, month = _ref.month, year = _ref.year;
            }

            if (!(month && year)) {
                return false;
            }

            if (App.isTokenize) {
                return false;
            }

            if (!App.formCard.fieldValidity.hasError() && !App.formCard.fieldMonth.hasError()) {
                return true;
            }

            _k = '|' + year + '|' + month + '|' + b;

            if (App.formCard.prolongKey === _k) {
                App.formCard.fieldValidity.toggleInputError(false);
                App.formCard.fieldMonth.toggleInputError(false);
                return true;
            }

            App.formCard.prolongKey = null;
            $.ajax({
                method: 'post',
                url: Utils.safeUrl('/card/check-exp'),
                data: {
                    month: month,
                    year: year,
                    bin: b
                }
            }).done(function (data) {
                if (data.prolong) {
                    App.formCard.prolongKey = _k;
                    App.formCard.fieldValidity.toggleInputError(false);
                    App.formCard.fieldMonth.toggleInputError(false);
                }
            });
        };
    }
});
