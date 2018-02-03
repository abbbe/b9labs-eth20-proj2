pragma solidity ^0.4.18;

contract OwnableKillable {
  address public owner;
  bool public killed;

  event LogKilled();

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  modifier notKilled() {
    require(!killed);
    _;
  }

  function OwnableKillable() internal {
    owner = msg.sender;
  }

  function kill()
    onlyOwner()
    notKilled()
    public
  {
    LogKilled();
    killed = true;
  }
}