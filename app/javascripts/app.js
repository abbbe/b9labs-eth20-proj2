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
  entry.innerHTML = " " + addr;
  otherAccounts.appendChild(entry);
}

function addRemittance() {
  var table = document.getElementById("my_remittances");
  var tr = document.createElement("tr");

  var td = document.createElement("td");
  var txt = document.createTextNode("0xdfb73a488f8a9a45e9ac2b433e061ee60ab2fede");
  td.appendChild(txt);
  tr.appendChild(td);

  var td = document.createElement("td");
  var txt = document.createTextNode("0.1");
  td.appendChild(txt);
  tr.appendChild(td);

  var td = document.createElement("td");
  var creation = document.createElement("a");
  creation.href = "http://etherscan.io/";
  creation.innerHTML = "xxx";
  td.appendChild(creation);
  tr.appendChild(td);

  var td = document.createElement("td");
  var creation = document.createElement("a");
  creation.href = "http://etherscan.io/";
  creation.innerHTML = "xxx";
  td.appendChild(creation);
  tr.appendChild(td);

  var td = document.createElement("td");
  var creation = document.createElement("a");
  creation.href = "http://etherscan.io/";
  creation.innerHTML = "xxx";
  td.appendChild(creation);
  tr.appendChild(td);

  var td = document.createElement("td");
  var input = document.createElement("input");
  input.type = "button";
  input.value = "Revoke";
  td.appendChild(input);
  tr.appendChild(td);

  table.appendChild(tr);
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
      self.setStatus('started');
    });

    addRemittance();
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
