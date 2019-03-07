pragma solidity ^0.5.0;

import "../../openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
* @title StableCoin
* @dev Very simple StableCoin example
*/
contract StableCoin is ERC20 {
    uint8 public constant DECIMALS = 18;
    string public symbol;

    /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
    constructor (address _balanceOwner, uint256 _supply, string memory _symbol) public {
        symbol = _symbol;
        _mint(_balanceOwner, _supply);
    }

    /**
    * @dev Total number of decimals
    */
    function decimals() public pure returns (uint256) {
        return DECIMALS;
    }
}
