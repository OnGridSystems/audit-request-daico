pragma solidity ^0.5.0;

import "./Claimable.sol";


contract ProxyTransferable {
  address public owner;

  /**
  * @dev The ProxyClaimable constructor sets the original `owner` of the contract to the sender
  * account.
  */
  constructor() public {
    owner = msg.sender;
  }

  /**
  * @dev Throws if called by any account other than the owner.
  */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
  * @dev Call transferOwnership of another contract.
  * @param _contractAddr The address of contract we want change owner, to new owner of the contract.
  */
  function proxyTransferOwnership(address _contractAddr, address to)
  public onlyOwner
  {
    Claimable instance = Claimable(_contractAddr);
    instance.transferOwnership(to);
  }
}
