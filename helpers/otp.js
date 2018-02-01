// Accepts secret (hex-encoded byte32) and shop (an address)
// Returns hex-encoded OTP
module.exports = {
    generate: function (secret_hex, shop) {
        // otpHash = web3.sha3(web3.toAscii(CAROL) + web3.toAscii(OTP_HEX));
        assert(secret_hex.length == 32 * 2 + 2);
        return web3.sha3(secret_hex, { encoding: 'hex' });
    }
}
