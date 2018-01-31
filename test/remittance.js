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

  it.skip("cannot remit via a non-approved shop", function() {
    assert.fail();
  });

  it.skip("can remit via an approved shop", function() {
    assert.fail();
  });
  
  it.skip("an approved shop can claim with correct OTP", function() {
    assert.fail();
  });

  it.skip("an approved shop cannot claim with incorrect OTP", function() {
    assert.fail();
  });

  it.skip("a non-approved shop cannot claim with correct or incorrect OTP", function() {
    assert.fail();
  });

  it.skip("remittance owner can claim after a month without OTP", function() {
    assert.fail();
  });
});
