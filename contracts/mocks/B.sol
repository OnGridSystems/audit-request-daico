pragma solidity ^0.5.0;

import "../Claimable.sol";
import "../ProxyTransferable.sol";
import "../ProjectToken.sol";
import "../ProxyClaimable.sol";

contract B is Claimable, ProxyClaimable, ProxyTransferable {
    address private token;
    address private nextOwner;
    bool private endMinting = false;
    uint256 private cap = 2;

    /**
    * @dev The B constructor sets the token address and next owner address
    */
    constructor(address _token, address _nextOwner) public {
        token = _token;
        nextOwner = _nextOwner;
    }

    /**
    * @dev Function to mint tokens
    * @param _to The address that will receive the minted tokens.
    * @param _value The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function proxyMint(address _to, uint256 _value) public onlyOwner returns (bool) {
        require(cap >= _value);
        ProjectToken instance = ProjectToken(token);
        instance.mint(_to, _value);
        cap = cap - _value;
        if (cap == 0) {
            endMinting = true;
        }
        return true;
    }

    /**
    * @dev Return token ownership to original owner if minting finished
    */
    function returnTokenToOriginalOwner() public {
        require(endMinting);
        ProjectToken instance = ProjectToken(token);
        instance.transferOwnership(nextOwner);
    }

}
