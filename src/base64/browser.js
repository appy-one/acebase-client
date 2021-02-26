const Base64 = {
    encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    },
    decode(base64) {
        return decodeURIComponent(escape(atob(base64)));
    }
};
module.exports = Base64;