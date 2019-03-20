pragma solidity ^0.5.0;

import "../../openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
* @title StableCoin
* @dev Very simple StableCoin example
*/
contract StableCoin is ERC20 {
    uint8 public decimals = 18;
    string public symbol;

    /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
    constructor (address _balanceOwner, uint256 _supply, string memory _symbol) public {
        symbol = _symbol;
        _mint(_balanceOwner, _supply);
    }

    function setDecimals(uint8 _decimals) public {
        decimals = _decimals;
    }

    function mint(address _to, uint256 _value) public {
        _mint(_to, _value);
    }

    function burn(address _to, uint256 _value) public {
        _burn(_to, _value);
    }
}
