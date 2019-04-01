pragma solidity ^0.5.0;

/**
 * @title Fund interface
 */
interface IFund {
    function refund(address _stableCoin, address _to, uint256 _amount) external;
    function withdrawStableCoin(address _stableCoin, address _to, uint256 _value) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}
