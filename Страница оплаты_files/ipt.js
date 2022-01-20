function EvaluateInputTime($obj, $input) {
    var self = this;

    function getTimestamp() {
        return new Date().getTime() / 1000;
    }

    this.diff = 0;
    this.inputTime = 0;
    this.timestamp = $obj.get(0) == document.activeElement ? getTimestamp() : 0;

    this.value = $obj
        .on('keyup', function () {
            if (self.value == this.value) return;

            self.diff = getTimestamp() - self.timestamp;
            self.value = this.value;
        })
        .on('focus', function () {
            self.timestamp = getTimestamp();
        })
        .on('blur', function () {
            self.inputTime += self.diff;
            self.diff = 0;
            $input.val(self.inputTime);
        }).val();
    $obj.parents('form').on('submit', function () {
        $input.val(self.inputTime + self.diff);
    });
}