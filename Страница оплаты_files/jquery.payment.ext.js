var restrictAmount = function(e) {
    var input, $target, digit, di;
    $target = $(e.currentTarget);
    digit = String.fromCharCode(e.which);

    di = $target.val().indexOf(',');
    if(di === -1) {
        di = $target.val().indexOf('.');
    }
    if(di !== -1) {
        if($target.val().substr(di+1).length >= 2) {
            return false;
        }
    }

    if (e.metaKey || e.ctrlKey) {
        return true;
    }
    if (e.which === 44 || e.which === 46) {
        if('' === $target.val()) {
            return false;
        }
        return (di === -1);
    }
    if (e.which === 32) {
        return false;
    }
    if (e.which === 0) {
        return true;
    }
    if (e.which < 33) {
        return true;
    }
    input = String.fromCharCode(e.which);
    return !!/[\d\s]/.test(input);
};

$.payment.fn.restrictAmount = function() {
    this.on('keypress', restrictAmount);
    return this;
};
