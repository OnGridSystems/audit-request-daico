pragma solidity ^0.5.0;

/**
* @title Tap
* @dev Simple tap allowing spender to withdraw stablecoins at given rate
*/
contract Tap {
    address public spender;
    address public fund;
    string public description;
    uint256 public rate;
    uint256 public lastWithdraw;
    uint256 public excessAmount;
    bool public active;
    address public registry;

    /**
    * @dev Constructor that configures the initial bucket state on deployment
    */
    constructor (
        address _registry,
        address _fund,
        address _spender,
        uint256 _rate,
        string memory _description
    ) public {
        spender = _spender;
        fund = _fund;
        description = _description;
        rate = _rate;
        lastWithdraw = now; // solhint-disable not-rely-on-time
        registry = _registry;
    }
}
