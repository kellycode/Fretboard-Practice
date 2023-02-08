// USEFUL THINGS

class CookieMgr {

    static setCookie = function (key, value, expiry) {
        var expires = new Date();
        expires.setTime(expires.getTime() + expiry * 24 * 60 * 60 * 1000);
        document.cookie = key + "=" + value + ";expires=" + expires.toUTCString();
    }

    static getCookie = function (key) {
        var keyValue = document.cookie.match("(^|;) ?" + key + "=([^;]*)(;|$)");
        return keyValue ? keyValue[2] : null;
    }

    static eraseCookie = function (key) {
        var keyValue = getCookie(key);
        setCookie(key, keyValue, "-1");
    }
}