pragma solidity ^0.5.0;

import "../../openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FundMock {
    using SafeMath for uint256;

    mapping(address => uint256) private _balances;
    uint256 public _totalSupply;

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function setBalance(address account, uint256 value) public {
        _totalSupply = _totalSupply.add(value);
        _balances[account] = _balances[account].add(value);
    }
}
