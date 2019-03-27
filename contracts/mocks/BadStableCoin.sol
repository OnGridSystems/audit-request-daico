pragma solidity ^0.5.0;

contract BadStableCoin {
    uint8 public decimals = 18;

    function balanceOf(address who) public view returns (uint256) { //solhint-disable-line no-unused-vars
        return uint256(2**100);
    }

    function transfer(address to, uint256 value) public returns (bool) { //solhint-disable-line no-unused-vars
        return false;
    }
}
