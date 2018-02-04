module.exports = {
    secretToOtp: function (secret_hex, _recipient) {
        return web3.sha3(secret_hex, { encoding: 'hex' });
    },

    secretToOtpHash: function (secret_hex, recipient) {
        var otpValue = module.exports.secretToOtp(secret_hex, recipient);
        return web3.sha3(otpValue + recipient.replace("0x", ""), { encoding: 'hex' });
    }
}
