pragma solidity ^0.4.18;

import "./OwnableKillable.sol";

contract Remittance is OwnableKillable {
  struct RemittanceInfo {
    address sender;
    address recipient;
    uint256 amount;
    bool revoked;
    bool claimed;
  }
  mapping (bytes32 => RemittanceInfo) remittances;

  event LogRemittance(address indexed sender, address indexed recipient, uint256 amount, bytes32 otpHash);
  event LogRevoke(address indexed sender, address indexed recipient, uint256 amount, bytes32 otpHash);
  event LogClaim(address indexed sender, address indexed recipient, uint256 amount, bytes32 otpHash);

  function remit(bytes32 otpHash, address recipient)
    notKilled()
    public payable
  {
    // do not allow empty remittances
    require(msg.value > 0);

    require(recipient != address(0));

    // do not allow OTP hash reuse
    require(remittances[otpHash].sender == address(0));

    // update state, emit event
    remittances[otpHash].sender = msg.sender;
    remittances[otpHash].recipient = recipient;
    remittances[otpHash].amount = msg.value;
    LogRemittance(msg.sender, recipient, msg.value, otpHash);
  }

  function claim(bytes32 otp)
    notKilled()
    public
  {
    bytes32 otpHash = keccak256(otp);

    // only recipient can claim
    address recipient = remittances[otpHash].recipient;
    require(msg.sender == recipient);

    // cannot claim revoked
    require(!remittances[otpHash].revoked);
    // cannot claim claimed
    require(!remittances[otpHash].claimed);

    // update state, emit event, transfer
    remittances[otpHash].claimed = true;
    uint256 amount = remittances[otpHash].amount;
    LogClaim(remittances[otpHash].sender, recipient, amount, otpHash);
    recipient.transfer(amount);
  }

  function revoke(bytes32 otpHash)
    notKilled()
    public
  {
    // only sender can revoke
    require(msg.sender == remittances[otpHash].sender);

    // cannot claim revoked
    require(!remittances[otpHash].revoked);
    // cannot claim claimed
    require(!remittances[otpHash].claimed);

    // update state, emit event, transfer
    remittances[otpHash].revoked = true;
    uint256 amount = remittances[otpHash].amount;
    LogRevoke(msg.sender, remittances[otpHash].recipient, amount, otpHash);
    msg.sender.transfer(amount);    
  }
}
