import "../stylesheets/app.css";

import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

import remittance_artifacts from '../../build/contracts/Remittance.json'
var Remittance = contract(remittance_artifacts);
var remittance;
var owner;
var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // display network_id
    web3.version.getNetwork(function (err, networkId) {
      document.getElementById("network_id").innerHTML = networkId;
    });

    // watch blocks and jupdate last_block number
    web3.eth.filter("latest", function (error, blockHash) {
      if (error) {
        document.getElementById("last_block").innerHTML = "#ERROR";
      } else {
        web3.eth.getBlock(blockHash, function (error, block) {
          document.getElementById("last_block").innerHTML = "#" + block.number;
        });
      }
    });
    
    Remittance.setProvider(web3.currentProvider);
    Remittance.deployed().then(_instance => {
      remittance = _instance;
      document.getElementById("contract_address").innerHTML = remittance.contract.address;
      return remittance.owner();
    }).then(_owner => {
      owner = _owner;
      document.getElementById("owner_address").innerHTML = owner;
      self.setStatus('started');
    });
  },

  setStatus: function(message) {
    console.log(message);
    var status = document.getElementById("status");
    status.innerHTML = message;
  }
};

window.addEventListener('load', function() {
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

  App.start();
});
