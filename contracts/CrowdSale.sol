pragma solidity ^0.5.0;

import "../openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Claimable.sol";
import "./ProxyClaimable.sol";
import "./Governance.sol";


/**
 * @title IERC20 mintable interface
 */
interface IERC20Mintable {
    function mint(address to, uint256 value) external returns (bool);
}


/**
* @title Organization interface
*/
interface IOrg {

    function isStableCoin(address _stableCoin) external returns (bool);

    function getStableCoinCount() external view returns (uint256);

    function getStableCoin(uint256 i) external view returns (address);

    function token() external view returns (address);
}


/**
 * @title CrowdSale interface
 * @dev CrowdSale interface
 */
contract ICrowdSale {
    address public stcFund;
}

contract ContributorRelay {
    address public contributorAcct;
    address public crowdSaleCtct;

    constructor(address _contributorAcct) public {
        crowdSaleCtct = msg.sender;
        contributorAcct = _contributorAcct;
    }

    function relayStcToFund(ERC20Detailed _stableCoin, uint256 amount)
    public
    {
        require(msg.sender == crowdSaleCtct, "Call only from CrowdSale account");
        _stableCoin.transfer(ICrowdSale(crowdSaleCtct).stcFund(), amount);
    }

    function returnStcToContributor(ERC20Detailed _stableCoin, uint256 amount)
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
    uint256 constant public AUSD_DECIMALS = 18;
    uint256 constant public USD = 10 ** AUSD_DECIMALS;
    uint256 constant public SOFTCAP_AUSD = 3000000 * USD; // 3M USD
    uint256 constant public SOFTCAP_DEADLINE = 1999999999;
    uint256 constant public HARDCAP_AUSD = 10000000 * USD; // 10M USD
    uint256 constant public HARDCAP_DEADLINE = 2999999999;
    uint256 constant public MIN_CONTRIB = 100000;
    uint256 constant public MIN_CONTRIB_AUSD = MIN_CONTRIB * USD; // 100K USD
    // amount of raised funds (the sum of all contributed stablecoins)
    uint256 public raisedAUsd;
    bool public softCapReached; // true if softCap reached
    // if running==true the CrowdSale is active and able to process contributions
    // otherwise it's in configuration mode and should be start()'ed
    enum State { Init, PreSoftCap, PostSoftCap }
    State public state = State.Init;
    // the Externally Owned Account of webservice
    address public webPlatformAcct; 
    // Organization contract keeps the token address and the list of allowed stablecoins
    IOrg public org;
    Governance public gov;
    //Fund collecting contributor's stablecoins on its balance
    address public stcFund;
    // The tap connected to stcFund. Used in Refunding process

    event ContributorRelayDeployed(address contributorRelay);

    /**
    * @dev Constructor
    * @param _org address of Organization contract.
    * @param _gov address of Governance contract
    */
    constructor (IOrg _org, Governance _gov, address _stcFund, address _webPlatformAcct) public {
        org = _org;
        gov = _gov;
        stcFund = _stcFund;
        webPlatformAcct = _webPlatformAcct;
    }

    /**
    * @dev set Backend account address during initial configuration
    * @param _webPlatformAcct address Address to be set as Backend account address.
    */
    function setWebPlatformAcct(address _webPlatformAcct) public onlyOwner {
        require(state == State.Init);
        webPlatformAcct = _webPlatformAcct;
    }

    /**
    * @dev creates personal ContributorRelay contract for individual contributor
    * @param _contributorAcct address of desired Token.
    * @return bool operation result.
    */
    function newContributorRelay(address _contributorAcct) public {
        require(state != State.Init);
        address contributorRelay = address(new ContributorRelay(_contributorAcct));
        emit ContributorRelayDeployed(contributorRelay);
    }

    /**
    * @dev Processes contribution and mints corresponding amount of tokens
    * @param _contributorRelay personal ContributorRelay contract to wthdraw from
    * @param _stcAddr address of stablecoin contract to withdraw
    * @param _stcAmount amount of stablecoins to withdraw in minimal fraction units
    */
    function processContribution(
        ContributorRelay _contributorRelay,
        address _stcAddr,
        uint256 _stcAmount
    )
    public returns (bool) {
        require(state != State.Init);
        require(msg.sender == webPlatformAcct || msg.sender == _contributorRelay.contributorAcct());
        require(org.isStableCoin(_stcAddr), "Not a stablecoin");
        require(_stcAmount >= MIN_CONTRIB);
        require(ERC20Detailed(_stcAddr).balanceOf(address(_contributorRelay))
                >= _stcAmount);
        uint256 aUsdAmount = convertStcAmountToAUsd(_stcAddr, _stcAmount);
        uint256 tokens = calculateTokensByAUsdContribution(aUsdAmount);
        IERC20Mintable token = IERC20Mintable(org.token());
        token.mint(address(gov), tokens);
        _contributorRelay.relayStcToFund(ERC20Detailed(_stcAddr), _stcAmount);
        // Register contribution in Governance contract
        address contributorAcct = _contributorRelay.contributorAcct();
        bool result = gov.registerContribution(contributorAcct, _stcAddr, _stcAmount, tokens);
        return result;
    }

    /**
    * @dev Finishes configuration and starts the CrowdSale.
    * Executed by admin once after configuration complete
    */
    function start() public onlyOwner {
        require(state == State.Init);
        state = State.PreSoftCap;
    }

    /**
    * @dev the owner (governance) can finish the CrowdSale prematurely
    * (only after SoftCap raised)
    */
    function finish() public onlyOwner {
        require(state == State.PostSoftCap);
        selfdestruct(msg.sender);
    }

    /**
    * @dev Try to switch state
    * It made public intentionally to make state transition autonomous
    * (anybody can try to initiate it from any account)
    */
    function tryToSwitchState() public {
        require(state != State.Init);
        if (raisedAUsd >= HARDCAP_AUSD || now >= HARDCAP_DEADLINE) {
            transferOwnership(address(gov));
            gov.proxyClaimOwnership(address(this));
            gov.makeVotable();
            selfdestruct(msg.sender);
        }
        if (raisedAUsd >= SOFTCAP_AUSD) {
            transferOwnership(address(gov));
            gov.proxyClaimOwnership(address(this));
            gov.makeVotable();
            state = State.PostSoftCap;
            return;
        }
        if (now >= SOFTCAP_DEADLINE) {
            gov.startRefunding();
            selfdestruct(msg.sender);
        }
    }

    /**
    * @dev Convert given amount of specific Stablecoin uinits to attoUsd (10e-18 USD)
    * Since stablecoins have different decimals, the USD price of minimal unit is different
    */
    function convertStcAmountToAUsd(
        address _stcAddr,
        uint256 _stcAmount
    ) public view returns (uint256) {
        uint8 decimals = ERC20Detailed(_stcAddr).decimals();
        uint256 remainingDecimals = uint256(AUSD_DECIMALS).sub(decimals);
        uint256 multiplier = 10 ** remainingDecimals;
        return _stcAmount.mul(multiplier);
    }

    /**
    * @dev Calculate token amount (in minimal units of the token) for given 
    * contribution in attoUSD (10e-18 USD)
    */
    // solhint-disable-next-line code-complexity
    function calculateTokensByAUsdContribution(uint256 aUsdAmount)
    public
    view
    returns (uint256)
    {
        uint256 tokenDecimals = ERC20Detailed(org.token()).decimals();
        uint256 decDivider = 10 ** (18 - tokenDecimals);
        uint256 baseTokens = aUsdAmount.mul(20).div(decDivider);
        if (aUsdAmount < 500000 * USD) {
            return baseTokens;
        }
        if (aUsdAmount < 1000000 * USD) {
            return baseTokens.add(baseTokens.mul(5).div(100));
        }
        if (aUsdAmount < 2000000 * USD) {
            return baseTokens.add(baseTokens.mul(10).div(100));
        }
        if (aUsdAmount < 3000000 * USD) {
            return baseTokens.add(baseTokens.mul(15).div(100));
        }
        if (aUsdAmount < 4000000 * USD) {
            return baseTokens.add(baseTokens.mul(20).div(100));
        }
        if (aUsdAmount < 5000000 * USD) {
            return baseTokens.add(baseTokens.mul(25).div(100));
        }
        if (aUsdAmount < 6000000 * USD) {
            return baseTokens.add(baseTokens.mul(30).div(100));
        }
        if (aUsdAmount < 7000000 * USD) {
            return baseTokens.add(baseTokens.mul(35).div(100));
        }
        if (aUsdAmount < 8000000 * USD) {
            return baseTokens.add(baseTokens.mul(40).div(100));
        }
        if (aUsdAmount < 9000000 * USD) {
            return baseTokens.add(baseTokens.mul(45).div(100));
        }
        return baseTokens.add(baseTokens.mul(50).div(100));
    }

}
