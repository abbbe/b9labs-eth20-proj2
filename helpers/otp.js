// Accepts secret (hex-encoded byte32) and shop (an address)
// Returns hex-encoded OTP
module.exports = {
    secretToOtp: function (secret_hex, _recipient) {
        // otpHash = web3.sha3(web3.toAscii(CAROL) + web3.toAscii(OTP_HEX));
        return web3.sha3(secret_hex, { encoding: 'hex' });
    },

    secretToOtpHash: function (secret_hex, recipient) {
        return web3.sha3(module.exports.secretToOtp(secret_hex, recipient), { encoding: 'hex' });
    }
}
