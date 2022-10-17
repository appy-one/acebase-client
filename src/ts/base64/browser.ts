export function encode(str: string) {
    return btoa(unescape(encodeURIComponent(str)));
}

export function decode(base64: string) {
    return decodeURIComponent(escape(atob(base64)));
}
