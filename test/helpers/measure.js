// const getTransactionReceiptMined = require("./getTransactionReceiptMined.js");

// returns promise of an array containing account balances (as BigNumber, in wei)
function getBalances(accounts) {
  return Promise.all(accounts.map(acc => web3.eth.getBalancePromise(acc)));
}

module.exports = {
  measureTx: function (accounts, truffleTxObjPromise, resolve, reject) {
    // first se take a snapshot of balances of all accounts involved
    return getBalances(accounts).then(before =>
      // then we go ahead with truffle-contract transaction
      truffleTxObjPromise.then(txObj =>
        // by now the transaction is mined, txObject.tx (hash) and txObj.receipt are set
        // we take another snapshot of balances
        getBalances(accounts).then(after =>                
          // then we get transaction info (need it to get gasPrice)
          web3.eth.getTransactionPromise(txObj.tx).then(tx => {
            //console.log("txObj.receipt", txObj.receipt);
            //console.log("tx", tx);
            var cost = txObj.receipt.gasUsed * tx.gasPrice;
            var diff = before.map((_, i) => after[i].minus(before[i]).toString(10));
            // console.log(before, after, diff);
            return { cost: cost, before: before, after: after, diff: diff, txObj: txObj, tx: tx, status: txObj.receipt.status };
          })))).catch(reject);
  },

  assertStrs10Equal: function (actual, expected) {
      var actualStrs = actual.map(n => n.toString(10))
      var expectedStrs = expected.map(n => n.toString(10))
      assert.deepEqual(actualStrs, expectedStrs);
  }
}
