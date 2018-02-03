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

    it.skip("can claim correct amounts from different senders remiting with same OTP", function () {
      assert.fail();
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

    it("sender can revoke an unclaimed remittance", function () {
      return remittance.revoke(otpHash, { from: ALICE }).then(txObj2 => {
        // FIXME check logs
        assert.equal(txObj2.receipt.status, 1, 'revoke failed');
      });
    });

    it("sender cannot revoke remittance twice", function () {
      return expectedExceptionPromise(function () {
        return remittance.revoke(otpHash, { from: ALICE, gas: 3000000 })
      }, 3000000);
    });

    it("recipient cannot claim revoked remittance", function () {
      return expectedExceptionPromise(function () {
        return remittance.claim(SECRET_HEX, { from: CAROL, gas: 3000000 })
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
      var otpValue = otp.secretToOtpHash(SECRET_HEX, CAROL);
      return measure.measureTx(testAccounts,
        remittance.remit(otpValue, CAROL, { from: ALICE, value: TEST_AMOUNT }))
        .then(m => {
          assert.equal(m.status, 1, 'remit failed');
          measure.assertStrs10Equal(m.diff, [TEST_AMOUNT, -m.cost - TEST_AMOUNT, 0]);
          // FIXME: check events
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

    it("recipient can claim with correct OTP", function () {
      return measure.measureTx(testAccounts,
        remittance.claim(otp.secretToOtp(SECRET_HEX, CAROL), { from: CAROL }))
        .then(m => {
          assert.equal(m.status, 1, 'remit failed');
          measure.assertStrs10Equal(m.diff, [-TEST_AMOUNT, 0, -m.cost + TEST_AMOUNT]);
          // FIXME: check events
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