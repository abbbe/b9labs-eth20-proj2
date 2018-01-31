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

contract ShopRegistry is OwnableKillable {
  enum ShopState { Unknown, Applied, Rejected, Accepted }
  mapping (address => ShopState) shops;

  event LogShopApplied(address shop, string name);
  event LogShopAccepted(address shop);
  event LogShopRejected(address shop);

  function applyShop(string name) public {
    require(shops[msg.sender] == ShopState.Unknown);
    shops[msg.sender] = ShopState.Applied;
    LogShopApplied(msg.sender, name);
  }

  function rejectShop(address shop) onlyOwner public {
    shops[shop] = ShopState.Rejected;
    LogShopRejected(shop);
  }

  function acceptShop(address shop) onlyOwner public {
    shops[shop] = ShopState.Accepted;
    LogShopAccepted(shop);
  }

  modifier onlyAcceptedShop(address addr) {
    require(shops[addr] == ShopState.Accepted);
    _;
  }
}

contract Remittance is ShopRegistry {
  mapping (bytes32 => mapping (address => uint256)) remittances;

  event LogRemittance(address shop, bytes32 otpHash, uint256 amount);
  event LogClaim(address shop, bytes32 otp, uint256 amount);

  function remit(bytes32 otpHash, address shop)
    public payable onlyAcceptedShop(shop)
  {
    require(msg.value > 0);
    LogRemittance(shop, otpHash, msg.value);
    remittances[otpHash][shop] += msg.value; 
  }

  function claim(bytes32 otp)
    public onlyAcceptedShop(msg.sender)
  {
    address shop = msg.sender;
    bytes32 otpHash = keccak256(otp);
    uint256 amount = remittances[otpHash][shop];
    require(amount > 0);

    LogClaim(shop, otp, amount);
    msg.sender.transfer(amount);
  }
}
