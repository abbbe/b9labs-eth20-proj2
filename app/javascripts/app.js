import "../stylesheets/app.css";

import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

const Promise = require("bluebird");

import remittance_artifacts from '../../build/contracts/Remittance.json'
var Remittance = contract(remittance_artifacts);
var remittance;
var account;

function addOtherAccount(addr) {
  var otherAccounts = document.getElementById("other_accounts");
  var entry = document.createElement('span');
  entry.innerHTML = " " + web3.toChecksumAddress(addr);
  otherAccounts.appendChild(entry);
}

function handleRemittanceEvent(event) {
  var table = document.getElementById("my_remittances");
  var tr = document.createElement("tr");
  var td, txt;

  td = document.createElement("td");
  txt = document.createTextNode(web3.toChecksumAddress(event.args.shop));
  td.appendChild(txt);
  tr.appendChild(td);

  td = document.createElement("td");
  txt = document.createTextNode(web3.fromWei(event.args.amount, 'ether'));
  td.appendChild(txt);
  tr.appendChild(td);

  // created at block
  td = document.createElement("td");
  //creation = document.createElement("a");
  //creation.href = "https://etherscan.io/tx/" + event.transactionHash;
  //creation.innerHTML = event.transactionHash;
  txt = document.createTextNode(event.blockNumber);
  td.appendChild(txt);
  tr.appendChild(td);

  // revoked at block
  td = document.createElement("td");
  txt = document.createTextNode("-");
  txt.id = "revoke_block_" + event.transactionHash;
  td.appendChild(txt);
  tr.appendChild(td);

  // claimed at block
  td = document.createElement("td");
  txt = document.createTextNode("-");
  txt.id = "claim_block_" + event.transactionHash;
  td.appendChild(txt);
  tr.appendChild(td);

  td = document.createElement("td");
  var btn = document.createElement("input");
  btn.id = "revoke_" + event.transactionHash;
  btn.type = "button";
  btn.value = "Revoke";
  btn.onClick = `App.revoke("${event.otpHash}")`;
  td.appendChild(btn);
  tr.appendChild(td);

  table.appendChild(tr);
}

function handleRevokeEvent(event) {
  // update revokation block number in the table and hide Revoke button
  var txt = document.getElementById("revoked_at_" + event.transactionHash);
  txt.innerHTML = event.blockNumber;
  var btn = document.getElementById("revoke_btn_" + event.transactionHash);
  btn.hidden = true;
}

function handleClaimEvent(event) {
  // update claim block number in the table and hide Revoke button
  var txt = document.getElementById("claimed_at_" + event.transactionHash);
  txt.innerHTML = event.blockNumber;
  var btn = document.getElementById("revoke_btn_" + event.transactionHash);
  btn.hidden = true;
}

window.App = {
  start: function () {
    var self = this;

    // display network_id
    web3.version.getNetwork(function (err, networkId) {
      document.getElementById("network_id").innerHTML = networkId;
    });

    // watch blocks and update last_block number
    web3.eth.filter("latest", function (error, blockHash) {
      if (error) {
        document.getElementById("last_block").innerHTML = "#ERROR";
      } else {
        web3.eth.getBlock(blockHash, function (error, block) {
          document.getElementById("last_block").innerHTML = "#" + block.number;
        });
      }
    });

    web3.eth.getAccountsPromise().then(accounts => {
      if (accounts.length > 0) {
        account = accounts[0];
        document.getElementById("account_address").innerHTML = account;
        web3.eth.getBalancePromise(account).then(balance => {
          document.getElementById("account_balance").innerHTML = balance;
        });

        web3.eth.getAccounts(function (error, accounts) {
          accounts.slice(1).forEach(acc => addOtherAccount(acc));
        });
      } else {
        document.getElementById("account_address").innerHTML = "N/A";
        document.getElementById("account_balance").innerHTML = "N/A";
      }
    });

    Remittance.setProvider(web3.currentProvider);
    Remittance.deployed().then(_instance => {
      remittance = _instance;
      document.getElementById("contract_address").innerHTML = remittance.contract.address;
      return remittance.owner();
    }).then(owner => {
      document.getElementById("owner_address").innerHTML = owner;

      remittance.LogRemittance().watch((err, event) => {
        if (err) {
          alert('remittance.LogRemittance.watch() has failed');
          return;
        }
        handleRemittanceEvent(event);
      });

      remittance.LogRevoke().watch((err, event) => {
        if (err) {
          alert('remittance.LogRevoke.watch() has failed');
          return;
        }
        handleRevokeEvent(event);
      });

      remittance.LogClaim().watch((err, event) => {
        if (err) {
          alert('remittance.LogClaim.watch() has failed');
          return;
        }
        handleClaimEvent(event);
      });
      
      self.setStatus('started');
    });
  },

  setStatus: function (message) {
    console.log(message);
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  toggleRemittanceView: function () {
    document.getElementById("remittance_view").hidden = false;
    document.getElementById("claim_view").hidden = true;
  },

  toggleClaimView: function () {
    document.getElementById("remittance_view").hidden = true;
    document.getElementById("claim_view").hidden = false;
  },

  createRemittance: function () {
    var recipient = document.getElementById("new_remittance_recipient").value;
    var amountEth = parseFloat(document.getElementById("new_remittance_amount").value);
    var amount = web3.toWei(amountEth, 'ether');
    var otp = document.getElementById("new_remittance_otp").value;

    if (!recipient.length || !web3.isChecksumAddress(recipient)) {
      alert("Invalid recipient address (checksum is mandatory)");
      return;
    }

    if (isNaN(amountEth)) {
      alert("Invalid amount");
      return;
    }

    if (otp.length < 4) {
      alert("Secret must be at least 4 characters long");
      return;
    }

    var self = this;
    remittance.remit.sendTransaction(otp, recipient, { from: account, value: amount }).then(txHash => {
      self.setStatus("remit() transaction was mined: " + txHash);
    }).catch(error => {
      self.setStatus("failed to submit remit() transaction: " + error);
    });
  },

  revokeRemittance(otpHash) {
    assert(false); // FIXME
  }
};

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
  }

  Promise.promisifyAll(web3.eth, { suffix: "Promise" });
  Promise.promisifyAll(web3.version, { suffix: "Promise" });

  App.start();
});
