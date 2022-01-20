function fp($obj) {
    function getCookie(name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    var token;
    try {
        token = localStorage.getItem('token');
    }
    catch (e) {
    }

    if (!token)
        try {
            token = sessionStorage.getItem('token');
        }
        catch (e) {
        }

    if (!token)
        token = getCookie('token');

    function setToken(token) {
        function setLocalStorage(token) {
            try {
                localStorage.setItem('token', token);
            }
            catch (e) {
            }
        }

        function setSessionStorage(token) {
            try {
                sessionStorage.setItem('token', token);
            }
            catch (e) {
            }
        }

        function setCookie(token) {
            var time = new Date();
            time.setTime(time.getTime() + 365 * 24 * 3600 * 1000);
            document.cookie = 'token=' + encodeURIComponent(token)
            + '; expires=' + (time.toUTCString ? time.toUTCString() : time)
            + '; path=/; secure';
        }

        setLocalStorage(token);
        setSessionStorage(token);
        setCookie(token);

        $(function () {
            $obj && $obj.val(token);
        });
    }

    if (!token && typeof Fingerprint2 !== 'undefined') {
        new Fingerprint2().get(function(result, components){
            setToken(result);
        });
    }
    else {
        setToken(token);
    }
}