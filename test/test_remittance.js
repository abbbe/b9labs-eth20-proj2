Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

// web3.eth.getTransactionReceiptMined = require("./helpers/getTransactionReceiptMined.js");
// const expectedExceptionPromise = require("./helpers/expectedExceptionPromise.js");
const measure = require("./helpers/measure.js");

var Remittance = artifacts.require("./Remittance.sol");


contract('Remittance', function (accounts) {
  const TEST_AMOUNT = 1000000;

  const ALICE = accounts[1];
  const CAROL = accounts[2];

  const OTP_HEX = web3.sha3("blah");

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
    var otpHash;

    before("deploy", function () {
      return Remittance.deployed().then(instance => {
        remittance = instance;
        assert.notEqual(remittance.contract.address, 0);

        testAccounts = [remittance.contract.address, ALICE, CAROL];

        var shopNotp = web3.toAscii(CAROL) + web3.toAscii(OTP_HEX);
        otpHash = web3.sha3(shopNotp);
      })
    });

    it("sender can remit positive amount to non-zero shop address", function () {
      return measure.measureTx(testAccounts,
        // FIXME remittance.remit(otpHash, CAROL, { from: ALICE, value: TEST_AMOUNT }))
        remittance.remit(OTP_HEX, CAROL, { from: ALICE, value: TEST_AMOUNT }))
        .then(m => {
          measure.assertStrs10Equal(m.diff, [TEST_AMOUNT, -m.cost - TEST_AMOUNT, 0]);
          // FIXME: check events
        });
    });

    it.skip("shop cannot claim with an incorrect OTP", function () {
      assert.fail();
    });

    it.skip("non-shop cannot claim even with correct OTP", function () {
      assert.fail();
    });

    it("shop can claim with correct OTP", function () {
      console.log("shop:", CAROL);
      console.log("opt:", OTP_HEX);
      console.log("otpHash:", otpHash);
      return measure.measureTx(testAccounts,
        remittance.claim(OTP_HEX, { from: CAROL }))
        .then(m => {
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