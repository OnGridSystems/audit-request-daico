pragma solidity ^0.5.0;

contract BadToken {

    /**
     * @dev Function mint always revert
     */
    function mint(address to, uint256 value) public returns (bool) { //solhint-disable-line no-unused-vars
        require(false);
        return true;
    }
}
