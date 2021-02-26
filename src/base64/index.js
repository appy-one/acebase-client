const Base64 = {
    encode(str) {
        return Buffer.from(str, 'utf8').toString('base64');
    },
    decode(base64) {
        return Buffer.from(base64, 'base64').toString('utf8');
    }
};
module.exports = Base64;