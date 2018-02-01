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

  event LogRemittance(address sender, address shop, uint256 amount, bytes32 otpHash);
  event LogClaim(address shop, uint256 amount);
  event LogRevoke(address sender, address shop, uint256 amount);
  //event LogClaimDebug(address shop, bytes32 otp, bytes32 otpHash);

  function remit(bytes32 otpHash, address shop)
    public payable
  {
    require(msg.value > 0);
    remittances[otpHash][shop] += msg.value; 
    LogRemittance(msg.sender, shop, msg.value, otpHash);
  }

  function claim(bytes32 otp) public {
    address shop = msg.sender;
    // bytes32 otpHash = keccak256(shop, otp);
    bytes32 otpHash = keccak256(otp);
    uint256 amount = remittances[otpHash][shop];
    require(amount > 0);

    remittances[otpHash][shop] -= amount;
    //LogClaimDebug(shop, otp, otpHash);
    LogClaim(shop, amount);

    shop.transfer(amount);
  }

  function revoke(bytes32 otp, address shop) public {
    bytes32 otpHash = keccak256(shop, otp);
    uint256 amount = remittances[otpHash][shop];
    require(amount > 0);
    // FIXME make sure only the original sender can revoke

    remittances[otpHash][shop] -= amount;
    LogRevoke(msg.sender, shop, amount);
    
    msg.sender.transfer(amount);    
  }
}
