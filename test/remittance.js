Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

// web3.eth.getTransactionReceiptMined = require("./helpers/getTransactionReceiptMined.js");
// const expectedExceptionPromise = require("./helpers/expectedExceptionPromise.js");

var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {
  var remittance;

  beforeEach("deploy", function() {
    return Remittance.deployed().then(instance => {
      remittance = instance;
    })
  });

  it("should deploy", function() {
    assert.notEqual(remittance.contract.address, 0);
  });

  it.skip("can always remit positive amount to non-zero shop address", function() {
    assert.fail();
  });
  
  it.skip("shop can claim with correct OTP", function() {
    assert.fail();
  });

  it.skip("shop cannot claim with incorrect OTP", function() {
    assert.fail();
  });

  it.skip("can claim correct amount after remitting twice with same OTP", function() {
    assert.fail();
  });

  it.skip("shop cannot claim twice", function() {
    assert.fail();
  });

  it.skip("non-shop cannot claim even with correct OTP", function() {
    assert.fail();
  });

  it.skip("remittance sender can always claim back", function() {
    assert.fail();
  });

  it.skip("remittance sender cannot claim back twice", function() {
    assert.fail();
  });

  it.skip("contract owner can kill", function () {

  });

  it.skip("contract non-owner cannot kill", function () {

  });
});
