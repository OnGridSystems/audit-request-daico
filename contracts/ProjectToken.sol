pragma solidity ^0.5.0;

import "./Claimable.sol";
import "./token/ERC20/ERC20Mintable.sol";


contract ProjectToken is Claimable, ERC20Mintable {
    string public name = "Project Token";
    string public symbol = "PRJ";
    uint8 public decimals = 18;

}
