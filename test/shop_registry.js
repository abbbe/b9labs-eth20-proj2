Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

// web3.eth.getTransactionReceiptMined = require("./helpers/getTransactionReceiptMined.js");
// const expectedExceptionPromise = require("./helpers/expectedExceptionPromise.js");

var ShopRegistry = artifacts.require("./ShopRegistry.sol");

contract('ShopRegistry', function(accounts) {
  var registry;
  
  beforeEach("deploy", function() {
    return ShopRegistry.new().then(instance => {
      registry = instance;
    })
  });

  it("should deploy", function() {
    assert.notEqual(registry.contract.address, 0);
  });
});
