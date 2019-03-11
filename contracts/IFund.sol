pragma solidity ^0.5.0;

/**
 * @title Fund interface
 */
interface IFund {
    function balanceOf(address who) external view returns (uint256);
}
