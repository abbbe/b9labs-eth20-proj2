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

  const SECRET_HEX = web3.sha3("blah");
  const BADSECRET_HEX = web3.sha3("no-blah");

  describe("mmm... tests...", function () {
    beforeEach("deploy", function () {
      return Remittance.deployed().then(instance => {
        remittance = instance;
      })
    });

    it.skip("sender cannot remit zero amount", function () {
    });

    it.skip("sender cannot remit zero shop address", function () {
    });

    it.skip("contract owner can kill", function () {
    });

    it.skip("cannot send funds to killed contract", function () {
    });

    it.skip("contract non-owner cannot kill", function () {
    });

    it.skip("can claim correct amount after remitting twice with same OTP", function () {
      assert.fail();
    });

    it.skip("sender can revoke unclaimed remittance", function () {
      assert.fail();
    });

    it.skip("sender cannot revoke revoked remittance", function () {
      assert.fail();
    });
  });

  describe("main use case", function () {
    var remittance;
    var testAccounts;

    before("deploy", function () {
      return Remittance.deployed().then(instance => {
        remittance = instance;
        assert.notEqual(remittance.contract.address, 0);

        testAccounts = [remittance.contract.address, ALICE, CAROL];
      })
    });

    it("sender can remit positive amount to non-zero shop address", function () {
      var otpValue = otp.generate(SECRET_HEX, CAROL);
      return measure.measureTx(testAccounts,
        remittance.remit(otpValue, CAROL, { from: ALICE, value: TEST_AMOUNT }))
        .then(m => {
          assert.equal(m.status, 1, 'remit failed');
          measure.assertStrs10Equal(m.diff, [TEST_AMOUNT, -m.cost - TEST_AMOUNT, 0]);
          // FIXME: check events
        });
    });

    it("shop cannot claim with an incorrect OTP", function () {
      return expectedExceptionPromise(function () {
        return remittance.claim(BADSECRET_HEX, { from: CAROL, gas: 3000000 })
      }, 3000000);
    });

    it.skip("non-shop cannot claim even with correct OTP", function () {
      assert.fail();
    });

    it("shop can claim with correct OTP", function () {
      return measure.measureTx(testAccounts,
        remittance.claim(SECRET_HEX, { from: CAROL }))
        .then(m => {
          assert.equal(m.status, 1, 'remit failed');
          measure.assertStrs10Equal(m.diff, [-TEST_AMOUNT, 0, -m.cost + TEST_AMOUNT]);
          // FIXME: check events
        });
    });

    it.skip("shop cannot claim twice", function () {
      assert.fail();
    });

    it.skip("sender cannot revoke claimed remittance", function () {
      assert.fail();
    });
  });
});