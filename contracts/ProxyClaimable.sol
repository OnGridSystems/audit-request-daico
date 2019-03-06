pragma solidity ^0.5.0;

import "./Claimable.sol";


/**
 * @title Claimable
 * @dev Claimable contract, where the ownership needs to be claimed.
 * This allows the new owner to accept the transfer.
 */
contract ProxyClaimable {
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
    * @dev Call claimOwnership of another contract.
    * @param _contractAddr The address of contract who must claim ownership.
    */
    function proxyClaimOwnership(address _contractAddr) external onlyOwner {
        Claimable instance = Claimable(_contractAddr);
        instance.claimOwnership();
    }
}