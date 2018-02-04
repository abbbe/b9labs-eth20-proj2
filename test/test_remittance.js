Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

// web3.eth.getTransactionReceiptMined = require("./helpers/getTransactionReceiptMined.js");
const expectedExceptionPromise = require("./helpers/expectedExceptionPromise.js");
const measure = require("./helpers/measure.js");
const otp = require("../helpers/otp.js");

var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function (accounts) {
  const TEST_AMOUNT = 1000000;

  const ALICE = accounts[1];
  const CAROL = accounts[2];
  const MALORY = accounts[3];

  const SECRET_HEX = web3.sha3("blah");
  const BADSECRET_HEX = web3.sha3("no-blah");

  it("cannot send funds to constructor", function () {
    return Remittance.new({ value: 1 }).then(
      txObj => assert.fail('should not have worked'),
      e => assert.isAtLeast(e.message.indexOf("Cannot send value to non-payable constructor"), 0)
    );
  });

  describe("deployed:", function () {
    var remittance;

    beforeEach("deploy", function () {
      return Remittance.new().then(instance => {
        remittance = instance;
      })
    });

    it("sender cannot remit zero amount", function () {
      return expectedExceptionPromise(function () {
        return remittance.remit(otp.secretToOtpHash(SECRET_HEX, CAROL), CAROL, { from: ALICE, gas: 3000000 })
      }, 3000000);
    });

    it("sender cannot remit to zero recipient address", function () {
      return expectedExceptionPromise(function () {
        return remittance.remit(otp.secretToOtpHash(SECRET_HEX, CAROL), 0, { from: ALICE, value: 1, gas: 3000000 })
      }, 3000000);
    });

    it("sender cannot reuse OTP", function () {
      return remittance.remit(otp.secretToOtpHash(SECRET_HEX, CAROL), CAROL, { from: ALICE, value: 1 })
        .then(txObj =>
          expectedExceptionPromise(function () {
            return remittance.remit(otp.secretToOtpHash(SECRET_HEX, CAROL), CAROL, { from: ALICE, value: 1, gas: 3000000 })
          }, 3000000));
    });

    it("cannot just send funds to the contract", function () {
      return remittance.sendTransaction({ value: 1 }).then(
        () => assert.fail('should not have worked'),
        e => assert.isAtLeast(e.message.indexOf("VM Exception while processing transaction: revert"), 0)
      );
    });

    it("contract owner can kill", function () {
      return remittance.kill().then(
        txObj => assert.equal(txObj.receipt.status, 1, 'kill failed')
      );
    });

    it("cannot kill killed contract", function () {
      return remittance.kill().then(
        txObj1 => {
          assert.equal(txObj1.receipt.status, 1, 'first kill failed');
          return remittance.kill();
        }).then(
        txObj => assert.equal(txObj.receipt.status, 0, 'should not have worked'),
        e => assert.isAtLeast(e.message.indexOf("Exception while processing transaction: revert"), 0)
        );
    });

    it("contract non-owner cannot kill", function () {
      return remittance.kill({ from: ALICE }).then(
        txObj => assert.equal(txObj.receipt.status, 0, 'should not have worked'),
        e => assert.isAtLeast(e.message.indexOf("Exception while processing transaction: revert"), 0)
      );
    });

    it("cannot send funds with kill()", function () {
      return remittance.kill({ value: 1 }).then(
        txObj => assert.fail('should not have worked'),
        e => assert.isAtLeast(e.message.indexOf("Cannot send value to non-payable function"), 0)
      );
    });
  });

  /*
   * sender remits successfully
   * sender revokes successfully
   * sendor cannot revoke second time
   * recipient cannot claim
   */
  describe("revoke:", function () {
    var remittance;
    var otpHash = otp.secretToOtpHash(SECRET_HEX, CAROL);

    before("deploy+remit", function () {
      return Remittance.new().then(instance => {
        remittance = instance;

        return remittance.remit(otpHash, CAROL, { from: ALICE, value: TEST_AMOUNT })
          .then(txObj1 => {
            assert.equal(txObj1.receipt.status, 1, 'remit failed');
          })
      })
    });

    it("cannot send funds with revoke()", function () {
      return remittance.revoke(otpHash, { from: ALICE, value: 1 }).then(
        txObj => assert.fail('should not have worked'),
        e => assert.isAtLeast(e.message.indexOf("Cannot send value to non-payable function"), 0)
      );
    });

    it("sender can revoke an unclaimed remittance, LogRevoke fires", function () {
      return remittance.revoke(otpHash, { from: ALICE }).then(txObj => {
        assert.equal(txObj.receipt.status, 1, 'revoke failed');
        // event LogRevoke(address indexed sender, address indexed recipient, uint256 amount, bytes32 otpHash);
        assert.strictEqual(txObj.logs.length, 1);
        assert.strictEqual(txObj.logs[0].event, "LogRevoke");
        assert.strictEqual(txObj.logs[0].args.sender, ALICE);
        assert.strictEqual(txObj.logs[0].args.recipient, CAROL);
        assert.strictEqual(txObj.logs[0].args.amount.toString(10), TEST_AMOUNT.toString(10));
        assert.strictEqual(txObj.logs[0].args.otpHash, otpHash);
      });
    });

    it("sender cannot revoke remittance twice", function () {
      return expectedExceptionPromise(function () {
        return remittance.revoke(otpHash, { from: ALICE, gas: 3000000 })
      }, 3000000);
    });

    it("recipient cannot claim revoked remittance", function () {
      return expectedExceptionPromise(function () {
        return remittance.claim(otp.secretToOtp(SECRET_HEX, CAROL), { from: CAROL, gas: 3000000 })
      }, 3000000);
    });
  });

  /*
   * sender remits successfully
   * recipient cannot claim with incorrect OTP
   * non-recipient cannot claim even with correct OTP
   * recipient claims successfully with correct OTP
   * recipient cannot claim second time
   * sender cannot revoke
   */

  describe("claim:", function () {
    var remittance;
    var testAccounts;

    before("deploy", function () {
      return Remittance.new().then(instance => {
        remittance = instance;
        assert.notEqual(remittance.contract.address, 0);

        testAccounts = [remittance.contract.address, ALICE, CAROL];
      })
    });

    it("sender can remit positive amount to non-zero recipient address", function () {
      var otpHash = otp.secretToOtpHash(SECRET_HEX, CAROL);
      return measure.measureTx(testAccounts,
        remittance.remit(otpHash, CAROL, { from: ALICE, value: TEST_AMOUNT }))
        .then(m => {
          assert.equal(m.status, 1, 'remit failed');
          measure.assertStrs10Equal(m.diff, [TEST_AMOUNT, -m.cost - TEST_AMOUNT, 0]);
          assert.strictEqual(m.txObj.logs.length, 1);
          assert.strictEqual(m.txObj.logs[0].event, "LogRemittance");
          assert.strictEqual(m.txObj.logs[0].args.sender, ALICE);
          assert.strictEqual(m.txObj.logs[0].args.recipient, CAROL);
          assert.strictEqual(m.txObj.logs[0].args.amount.toString(10), TEST_AMOUNT.toString(10));
          assert.strictEqual(m.txObj.logs[0].args.otpHash, otpHash);
        });
    });

    it("recipient cannot claim with an incorrect OTP", function () {
      return expectedExceptionPromise(function () {
        return remittance.claim(otp.secretToOtp(BADSECRET_HEX), { from: CAROL, gas: 3000000 })
      }, 3000000);
    });

    it("non-recipient cannot claim even with correct OTP", function () {
      return expectedExceptionPromise(function () {
        return remittance.claim(otp.secretToOtp(SECRET_HEX, CAROL), { from: MALORY, gas: 3000000 })
      }, 3000000);
    });

    it("cannot send funds with claim()", function () {
      return remittance.claim(otp.secretToOtp(SECRET_HEX, CAROL), { from: CAROL, value: 1 }).then(
        () => assert.fail('should not have worked'),
        e => assert.isAtLeast(e.message.indexOf("Cannot send value to non-payable function"), 0)
      );
    });

    it("recipient can claim with correct OTP, LogClaim fires", function () {
      var otpValue = otp.secretToOtp(SECRET_HEX, CAROL);
      var otpHash = otp.secretToOtpHash(SECRET_HEX, CAROL);
      return measure.measureTx(testAccounts,
        remittance.claim(otpValue, { from: CAROL }))
        .then(m => {
          assert.equal(m.status, 1, 'remit failed');
          assert.strictEqual(m.txObj.logs[0].event, "LogClaim");
          assert.strictEqual(m.txObj.logs[0].args.sender, ALICE);
          assert.strictEqual(m.txObj.logs[0].args.recipient, CAROL);
          assert.strictEqual(m.txObj.logs[0].args.amount.toString(10), TEST_AMOUNT.toString(10));
          assert.strictEqual(m.txObj.logs[0].args.otpHash, otpHash, 'otpHash mismatch');
          measure.assertStrs10Equal(m.diff, [-TEST_AMOUNT, 0, -m.cost + TEST_AMOUNT]);
        });
    });

    it("recipient cannot claim twice", function () {
      return expectedExceptionPromise(function () {
        return remittance.claim(otp.secretToOtp(SECRET_HEX, CAROL), { from: CAROL, gas: 3000000 })
      }, 3000000);
    });

    it("sender cannot revoke claimed remittance", function () {
      return expectedExceptionPromise(function () {
        return remittance.revoke(otp.secretToOtpHash(SECRET_HEX, CAROL), { from: ALICE, gas: 3000000 })
      }, 3000000);
    });
  });
});