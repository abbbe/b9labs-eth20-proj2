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

  it.skip("unknown shop should be prohibited", function() {
    assert.fail();
  });
  
  it.skip("applied shop should be prohibited", function() {
    assert.fail();
  });

  it.skip("rejected shop should be prohibited", function() {
    assert.fail();
  });

  it.skip("accepted shop should be allowed", function() {
    assert.fail();
  });

  it.skip("accepted then rejected shop should be prohibited", function() {
    assert.fail();
  });

  it.skip("rejected then accepted shop should be accepted", function() {
    assert.fail();
  });

  it.skip("kill should work", function() {
    assert.fail();
  });
});
