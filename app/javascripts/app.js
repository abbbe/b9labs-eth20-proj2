import "../stylesheets/app.css";

import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

const Promise = require("bluebird");
const otp = require("../../helpers/otp.js");

import remittance_artifacts from '../../build/contracts/Remittance.json'
var Remittance = contract(remittance_artifacts);
var remittance;
var account;

function addOtherAccount(addr) {
  var otherAccounts = document.getElementById("other_accounts");
  // add account switch link
  var entry = document.createElement('a');
  entry.href = "?account=" + addr;
  entry.innerHTML = web3.toChecksumAddress(addr);
  otherAccounts.appendChild(entry);
  // add space
  otherAccounts.appendChild(document.createTextNode(" "));
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

    // take default account from URL parameter, if present
    var urlAccounmtParam = new URL(window.location.href).searchParams.get("account");
    if (urlAccounmtParam) {
      account = urlAccounmtParam;
    }

    web3.eth.getAccountsPromise().then(accounts => {
      if (accounts.length > 0) {
        // if default account not set, use first account
        if (!account) {
          account = accounts[0];
        }

        // show account address and balance
        document.getElementById("account_address").innerHTML = web3.toChecksumAddress(account);
        web3.eth.getBalancePromise(account).then(balance => {
          document.getElementById("account_balance").innerHTML = web3.fromWei(balance, 'ether');
        });

        // show couple other accounts too
        web3.eth.getAccounts(function (error, accounts) {
          accounts.filter((acc) => { return acc != account }).slice(0, 2).forEach(acc => addOtherAccount(acc));
        });
      } else {
        document.getElementById("account_address").innerHTML = "N/A";
        document.getElementById("account_balance").innerHTML = "N/A";
      }
    });

    Remittance.setProvider(web3.currentProvider);
    Remittance.deployed().then(_instance => {
      remittance = _instance;
      document.getElementById("contract_address").innerHTML = web3.toChecksumAddress(remittance.contract.address);
      return remittance.owner();
    }).then(owner => {
      document.getElementById("owner_address").innerHTML = web3.toChecksumAddress(owner);

      // events for sender
      remittance.LogRemittance({ sender: account }, { fromBlock: 0 }).watch((err, event) => {
        if (err) {
          alert('remittance.LogRemittance.watch() has failed');
          return;
        }
        self.handleSenderEvent(event);
      });

      remittance.LogRevoke({ sender: account }, { fromBlock: 0 }).watch((err, event) => {
        if (err) {
          alert('remittance.LogRevoke.watch() has failed');
          return;
        }
        self.handleSenderEvent(event);
      });

      remittance.LogClaim({ sender: account }, { fromBlock: 0 }).watch((err, event) => {
        if (err) {
          alert('remittance.LogClaim.watch() has failed');
          return;
        }
        self.handleSenderEvent(event);
      });

      // events for receiver
      remittance.LogRemittance({ recipient: account }, { fromBlock: 0 }).watch((err, event) => {
        if (err) {
          alert('remittance.LogRemittance.watch() has failed');
          return;
        }
        self.handleReceiverEvent(event);
      });

      remittance.LogRevoke({ recipient: account }, { fromBlock: 0 }).watch((err, event) => {
        if (err) {
          alert('remittance.LogRevoke.watch() has failed');
          return;
        }
        self.handleReceiverEvent(event);
      });

      remittance.LogClaim({ recipient: account }, { fromBlock: 0 }).watch((err, event) => {
        if (err) {
          alert('remittance.LogClaim.watch() has failed');
          return;
        }
        self.handleReceiverEvent(event);
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
    var secret = document.getElementById("new_remittance_otp").value;
    var otpHash = otp.secretToOtpHash(secret, recipient);
    // console.log("secret", secret); // DEBUG
    // console.log("otp", otp.secretToOtp(secret, recipient)); // DEBUG
    // console.log("otpHash", otpHash); // DEBUG

    if (!recipient.length || !web3.isChecksumAddress(recipient)) {
      alert("Invalid recipient address (checksum is mandatory)");
      return;
    }

    if (isNaN(amountEth)) {
      alert("Invalid amount");
      return;
    }

    if (secret.length < 4) {
      alert("Secret must be at least 4 characters long");
      return;
    }

    var self = this;
    remittance.remit.sendTransaction(otpHash, recipient, { from: account, value: amount }).then(txHash => {
      self.setStatus("remit() transaction was mined: " + txHash);
    }).catch(error => {
      self.setStatus("failed to submit remit() transaction: " + error);
    });
  },

  revokeRemittance: function (otpHash) {
    var self = this;
    remittance.revoke.sendTransaction(otpHash, { from: account }).then(txHash => {
      self.setStatus("revoke() transaction was mined: " + txHash);
    }).catch(error => {
      self.setStatus("failed to submit revoke() transaction: " + error);
    });
  },

  claimRemittance: function () {
    var self = this;
    var secret = document.getElementById("claim_otp").value;
    var _otp = otp.secretToOtp(secret, account);
    // console.log("secret", secret); // DEBUG
    // console.log("otp", _otp); // DEBUG
    // console.log("otpHash", otp.secretToOtpHash(secret, account)); // DEBUG
    remittance.claim.sendTransaction(_otp, { from: account }).then(txHash => {
      self.setStatus("claim() transaction was mined: " + txHash);
    }).catch(error => {
      self.setStatus("failed to submit claim() transaction: " + error);
    });
  },

  addRemittanceRecord: function (event) {
    var tr = document.createElement("tr");
    var td, txt;

    // recipient
    td = document.createElement("td");
    txt = document.createTextNode(web3.toChecksumAddress(event.args.recipient));
    td.appendChild(txt);
    tr.appendChild(td);

    // amount
    td = document.createElement("td");
    txt = document.createTextNode(web3.fromWei(event.args.amount, 'ether'));
    td.appendChild(txt);
    tr.appendChild(td);

    // otpHash
    td = document.createElement("td");
    txt = document.createTextNode(event.args.otpHash.slice(2, 10));
    td.appendChild(txt);
    tr.appendChild(td);

    // created at block
    td = document.createElement("td");
    td.id = "remit__created_at_block_" + event.args.otpHash;
    tr.appendChild(td);

    // revoked at block
    td = document.createElement("td");
    td.id = "remit__revoked_at_block_" + event.args.otpHash;
    tr.appendChild(td);

    // claimed at block
    td = document.createElement("td");
    td.id = "remit__claimed_at_block_" + event.args.otpHash;
    tr.appendChild(td);

    td = document.createElement("td");
    var btn = document.createElement("input");
    btn.id = "revoke_btn_" + event.args.otpHash;
    btn.type = "button";
    btn.value = "Revoke";
    btn.onclick = function () { window.App.revokeRemittance(event.args.otpHash); }
    td.appendChild(btn);
    tr.appendChild(td);

    var table = document.getElementById("my_remittances");
    table.appendChild(tr);
  },

  addClaimRecord: function (event) {
    var tr = document.createElement("tr");
    var td, txt;

    // sender
    td = document.createElement("td");
    txt = document.createTextNode(web3.toChecksumAddress(event.args.sender));
    td.appendChild(txt);
    tr.appendChild(td);

    // amount
    td = document.createElement("td");
    txt = document.createTextNode(web3.fromWei(event.args.amount, 'ether'));
    td.appendChild(txt);
    tr.appendChild(td);

    // otpHash
    td = document.createElement("td");
    txt = document.createTextNode(event.args.otpHash.slice(2, 10));
    td.appendChild(txt);
    tr.appendChild(td);

    // created at block
    td = document.createElement("td");
    td.id = "claim__created_at_block_" + event.args.otpHash;
    tr.appendChild(td);

    // revoked at block
    td = document.createElement("td");
    td.id = "claim__revoked_at_block_" + event.args.otpHash;
    tr.appendChild(td);

    // claimed at block
    td = document.createElement("td");
    td.id = "claim__claimed_at_block_" + event.args.otpHash;
    tr.appendChild(td);

    td = document.createElement("td");
    var btn = document.createElement("input");
    btn.id = "claim__btn_" + event.args.otpHash;
    btn.type = "button";
    btn.value = "Claim";
    btn.hidden = true;
    btn.onclick = function () { window.App.claimRemittance(event.args.otpHash); }
    td.appendChild(btn);
    tr.appendChild(td);

    var table = document.getElementById("my_claims");
    table.appendChild(tr);
  },

  handleSenderEvent: function (event) {
    // create record in the table, if not yet there
    var btn = document.getElementById("revoke_btn_" + event.args.otpHash);
    if (!btn) {
      window.App.addRemittanceRecord(event);
      btn = document.getElementById("revoke_btn_" + event.args.otpHash);
    }

    // update block number in corresponding column
    var txt;
    var disableRevokeButton = false;
    if (event.event == "LogRemittance") {
      txt = document.getElementById("remit__created_at_block_" + event.args.otpHash);
    } else if (event.event == "LogRevoke") {
      txt = document.getElementById("remit__revoked_at_block_" + event.args.otpHash);
      disableRevokeButton = true;
    } else if (event.event == "LogClaim") {
      txt = document.getElementById("remit__claimed_at_block_" + event.args.otpHash);
      disableRevokeButton = true;
    } else {
      console.log("unexpected event " + event.event);
      return;
    }

    txt.innerHTML = event.blockNumber;
    if (disableRevokeButton) {
      btn.hidden = true;
    }
  },

  handleReceiverEvent: function (event) {
    // create record in the table, if not yet there
    var btn = document.getElementById("claim__btn_" + event.args.otpHash);
    if (!btn) {
      window.App.addClaimRecord(event);
      btn = document.getElementById("claim__btn_" + event.args.otpHash);
    }

    // update block number in corresponding column
    var txt;
    var disableClaimButton = false;
    if (event.event == "LogRemittance") {
      txt = document.getElementById("claim__created_at_block_" + event.args.otpHash);
    } else if (event.event == "LogRevoke") {
      txt = document.getElementById("claim__revoked_at_block_" + event.args.otpHash);
      disableClaimButton = true;
    } else if (event.event == "LogClaim") {
      txt = document.getElementById("claim__claimed_at_block_" + event.args.otpHash);
      disableClaimButton = true;
    } else {
      console.log("unexpected event " + event.event);
      return;
    }

    txt.innerHTML = event.blockNumber;
    if (disableClaimButton) {
      btn.hidden = true;
    }
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
