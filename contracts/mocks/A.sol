pragma solidity ^0.5.0;

import "../Claimable.sol";
import "../ProxyClaimable.sol";
import "../ProxyTransferable.sol";
import "../ProjectToken.sol";

contract A is Claimable, ProxyClaimable, ProxyTransferable {
    address private token;

    /**
    * @dev The A constructor sets the token address
    */
    constructor(address _token) public {
        token = _token;
    }

    /**
    * @dev Function to mint tokens
    * @param _to The address that will receive the minted tokens.
    * @param _value The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function proxyMint(address _to, uint256 _value) external onlyOwner returns (bool) {
        ProjectToken instance = ProjectToken(token);
        return instance.mint(_to, _value);
    }

}
