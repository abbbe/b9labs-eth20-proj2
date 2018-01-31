pragma solidity ^0.4.18;

contract OwnableKillable {
  address public owner;

  event LogKilled();

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function OwnableKillable() internal {
    owner = msg.sender;
  }

  function kill() public onlyOwner {
    LogKilled();
    selfdestruct(owner);
  }
}

contract Remittance is OwnableKillable {
  mapping (bytes32 => mapping (address => uint256)) remittances;

  event LogRemittance(address sender, uint256 value, address shop, bytes32 otpHash);
  event LogClaim(address shop, bytes32 otp, uint256 amount);

  function remit(bytes32 otpHash, address shop)
    public payable
  {
    require(msg.value > 0);
    LogRemittance(msg.sender, msg.value, shop, otpHash);
    remittances[otpHash][shop] += msg.value; 
  }

  function claim(bytes32 otp) public {
    address shop = msg.sender;
    bytes32 otpHash = keccak256(shop, otp); // should we mix in sender address/nonce?
    uint256 amount = remittances[otpHash][shop];
    require(amount > 0);

    remittances[otpHash][shop] -= amount;
    LogClaim(shop, otp, amount);
    shop.transfer(amount);
  }
}
