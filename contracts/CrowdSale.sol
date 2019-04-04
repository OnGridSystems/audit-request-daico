pragma solidity ^0.5.0;

import "./Claimable.sol";
import "./ProxyClaimable.sol";
import "./Governance.sol";
import "../openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
* @title Organization interface
*/
interface IOrg {
    function token() external returns (address);

    function isStableCoin(address _stableCoin) external returns (bool);

    function getStableCoinCount() external view returns (uint256);

    function getStableCoin(uint256 i) external view returns (address);
}


// ToDo check best practices interface vs abstract contract
/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
 /* ToDo already declared in Governance, uncomment
contract IERC20 {
    uint8 public decimals;

    function transfer(address to, uint256 value) external returns (bool);

    function balanceOf(address _owner) external view returns (uint256 balance);
}
*/

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract IERC20Mintable is IERC20 {
    function mint(address _to, uint256 _value) public;
}

/**
 * @title CrowdSale interface
 * @dev CrowdSale interface
 */
contract ICrowdSale is IERC20 {
    address public stcFund;
}

contract ContributorRelay {
    address public contributorAcct;
    address public crowdSaleCtct;

    constructor(address _contributorAcct) public {
        crowdSaleCtct = msg.sender;
        contributorAcct = _contributorAcct;
    }

    // ToDo check best practice on arg types (address vs specific iface)
    function relayStcToFund(IERC20 _stableCoin, uint256 amount)
    public
    {
        require(msg.sender == crowdSaleCtct, "Call only from CrowdSale account");
        // ToDo what happens if transfer fails
        _stableCoin.transfer(ICrowdSale(crowdSaleCtct).stcFund(), amount);
    }

    function returnStcToContributor(IERC20 _stableCoin, uint256 amount)
    public
    {
        require(msg.sender == contributorAcct, "Call only from contributorAcct account");
        _stableCoin.transfer(contributorAcct, amount);
    }
}

/**
* @title CrowdSale
*
* @dev The contract which receives stablecoin-contributions and mints tokens
*/
contract CrowdSale is Claimable, ProxyClaimable {
    using SafeMath for uint256;

    // We convert all USD values to aUSD (attoUSD)
    // to achieve highest accuracy operating with different stablecoins
    uint256 constant public USD = 10 ** 18;
    uint256 constant public SOFTCAP_AUSD = 3000000 * USD; // 3M USD
    uint256 constant public SOFTCAP_DEADLINE = 1999999999; // ToDo need clarification
    uint256 constant public HARDCAP_AUSD = 10000000 * USD; // 10M USD
    uint256 constant public HARDCAP_DEADLINE = 1999999999; // ToDo need clarification
    uint256 constant public MIN_CONTRIB_AUSD = 100000 * USD; // 100K USD
    // amount of raised funds (the sum of all contributed stablecoins)
    uint256 public raisedAUsd;
    bool public softCapReached; // true if softCap reached
    // if running==true the CrowdSale is active and able to process contributions
    // otherwise it's in configuration mode and should be start()'ed
    bool public running;
    // the Externally Owned Account of webservice
    address public webPlatformAcct; 
    // Organization contract keeps the token address and the list of allowed stablecoins
    IOrg public org;
    Governance public gov; // ToDo change to iface
    //Fund collecting contributor's stablecoins on its balance
    address public stcFund;
    // The tap connected to stcFund. Used in Refunding process
    address public refundTap;

    event ContributorRelayDeployed(address contributorRelay);

    /**
    * @dev Constructor
    * @param _org address of Organization contract.
    * @param _gov address of Governance contract
    * @param _refundTap address of tap connected to refundable Tap
    */
    constructor (IOrg _org, Governance _gov, address _refundTap, address _stcFund, address _webPlatformAcct) public {
        org = _org;
        gov = _gov;
        stcFund = _stcFund;
        refundTap = _refundTap; // ToDo: should be configured implicitly as stcFund.tap
        webPlatformAcct = _webPlatformAcct;
    }

    /**
    * @dev set Backend account address.
    * @param _webPlatformAcct address Address to be set as Backend account address.
    */
    function setWebPlatformAcct(address _webPlatformAcct) public onlyOwner {
        webPlatformAcct = _webPlatformAcct;
    }

    /**
    * @dev creates personal ContributorRelay contract for individual contributor
    * @param _contributorAcct address of desired Token.
    * @return bool operation result.
    */
    function newContributorRelay(address _contributorAcct) public {
        address contributorRelay = address(new ContributorRelay(_contributorAcct));
        emit ContributorRelayDeployed(contributorRelay);
    }

    /**
    * @dev Processes contribution and mints corresponding amount of tokens
    * @param _contributorRelay personal ContributorRelay contract to wthdraw from
    * @param _stcAddr address of stablecoin contract to withdraw
    * @param _stcAmount amount of stablecoins to withdraw in minimal fraction units
    */
    function processContribution(ContributorRelay _contributorRelay, address _stcAddr, uint256 _stcAmount) 
    public returns (bool) {
        require(msg.sender == webPlatformAcct || msg.sender == _contributorRelay.contributorAcct());
        // ToDo check _stcAddr is in allowed stablecoins
        // ToDo check _stcAmount != 0
        // ToDo check _stcAmount is available on _contributorRelay's balance
        // ToDo Convert stablecoin to aUSD value
        // ToDo aUsdAmount = convertStcAmountToAUsd(_stcAddr, _stcAmount)
        // ToDo calculate tokens = calculateTokensByAUsdContribution(_aUsdAmount)
        uint256 aUsdAmount = convertStcAmountToAUsd(_stcAddr, _stcAmount);
        uint256 tokens = calculateTokensByAUsdContribution(aUsdAmount);
        // ToDo mint tokens
        // Register contribution in Governance contract
        address contributorAcct = _contributorRelay.contributorAcct();
        bool result = gov.registerContribution(contributorAcct, _stcAddr, _stcAmount, tokens);
        return result;
    }

    /**
    * @dev Finishes configuration and starts the CrowdSale
    */
    function start() public pure { // solhint-disable-line no-empty-blocks

    }

    /**
    * @dev Prematurely finish the CrowdSale. 
    * The CrowdSale contract will be finally destroyed
    */
    function finish() public pure { // solhint-disable-line no-empty-blocks

    }

    /**
    * @dev Try to switch state
    * It made public intentionally to make state transition autonomous
    * (anybody can try to initiate it from any account)
    */
    function tryToSwitchState() public pure { // solhint-disable-line no-empty-blocks

    }

    /**
    * @dev Convert given amount of specific Stablecoin uinits to attoUsd (10e-18 USD)
    * Since stablecoins have different decimals, the USD price of minimal unit is different
    */
    // solhint-disable-next-line no-unused-vars
    function convertStcAmountToAUsd(address _stcAddr, uint256 _stcAmount) public pure returns (uint256) {
        // ToDo check _stcAddr in allowed stablecoins otherwise revert
        // get decimals from stablecoin.decimals() public getter
        // multiply by 10 ** remainingDecimals and return
        return _stcAmount;
    }

    /**
    * @dev Calculate token amount (in minimal units of the token) for given 
    * contribution in attoUSD (10e-18 USD)
    */
    // solhint-disable-next-line code-complexity
    function calculateTokensByAUsdContribution(uint256 aUsdAmount)
    public
    pure
    returns (uint256)
    {
        if (aUsdAmount < 500000 * USD) {
            return aUsdAmount;
        }
        if (aUsdAmount <= 1000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(5).div(100));
        }
        if (aUsdAmount <= 2000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(10).div(100));
        }
        if (aUsdAmount <= 3000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(15).div(100));
        }
        if (aUsdAmount <= 4000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(20).div(100));
        }
        if (aUsdAmount <= 5000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(25).div(100));
        }
        if (aUsdAmount <= 6000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(30).div(100));
        }
        if (aUsdAmount <= 7000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(35).div(100));
        }
        if (aUsdAmount <= 8000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(40).div(100));
        }
        if (aUsdAmount <= 9000000 * USD) {
            return aUsdAmount.add(aUsdAmount.mul(45).div(100));
        }
        return aUsdAmount.add(aUsdAmount.mul(50).div(100));
    }

}
