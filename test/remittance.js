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
});
