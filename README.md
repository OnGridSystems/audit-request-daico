# DAICO smart contracts

[![Solidity](https://img.shields.io/badge/solidity-0.5-blue.svg)](#)
![GitHub last commit](https://img.shields.io/github/last-commit/OnGridSystems/DAICO-contracts.svg)
![License](https://img.shields.io/github/license/OnGridSystems/DAICO-contracts.svg)
[![Build Status Dev](https://travis-ci.com/OnGridSystems/DAICO-contracts.svg?token=waZyqGFoEW87kExjCQoq&branch=dev)](https://travis-ci.com/OnGridSystems/DAICO-contracts)
[![Build Status Master](https://travis-ci.com/OnGridSystems/DAICO-contracts.svg?token=waZyqGFoEW87kExjCQoq&branch=master)](https://travis-ci.com/OnGridSystems/DAICO-contracts)

## DAICO, the new crowdfunding paradigm

DAICO It is actually an integration of ICO (as funding principle) and DAO (as crowd-wisdom mechanism). These artifacts, glued together,implement more controllable and secure fundraising powered by 'programmable money' principle. It allows to spend money gradually over time under investors/stakeholders supervision. Investors get the opportunity to influence cash flow and, in some critical cases, refund their contributions. Investor can vote to change limits, stop funding or totally withdraw all the remaining resources if the project team fails. 

See the [initial Explanation of DAICO](https://ethresear.ch/t/explanation-of-daicos/465) from Vitalik Buterin.

## Smart contracts
In DAICO funds get raised in a way that prevents unlimited control by the project team. In contrast to rudimentary Bank/Escrow schemes, funds get locked/constrained by the autonomously running code - blockchain smart contracts.

* `Token` - Plain ERC-20 mintable token of the project. The life cycle of this kind of contract is as long as it is possible, so it should be simple and strictly follow a proven ERC-20 standard;
* `Organization` - keeps the configuration and binds all entities together: the set of allowed Stablecoins, `Token` address, `Governance` address, `Fund`s;
* `Governance` - the voting contract for almost the entire life cycle. Critically important actions are performed through the `Governance` by DAO-like voting;
* `xSale`, `TokenSale`, `PreSale`, `CrowdSale`, `OtherSale` receive and process investors' funds and in return mint the given amount of project `Token`;
* `Fund` - The storage of the allowed stablecoins. Keeps the contributions until the given conditions are met, in SPENDING mode allows withdrawals through the connected `Tap`s;
* `Tap` - The spending rate-limiting contract connected to the `Fund`;
* `StableCoin` - 3rd part ERC-20 token which has a price stability of fiat currency (SoV). It's external asset from DAICO point of view, but has a tight integration with the stack.

## Core principles

### Using stablecoins, not Ether
Ether and any other infrustructure-level cryptocurrency prices are inherently instable. Though volatility is fine for speculation, it’s not great for everyday payments and long-running projects. The price rally of 2017 inspired teams to use cryptocurrency for funding but a year later ether prices experienced a 90%+ drop. This aggressive volatility makes it impractical and risky to use crypto as the store of value in crowdfunding. To address this problem, a certain subset of cryptocurrencies emerged which have a price stability of fiat currencies - [stable coins](https://etherscan.io/tokens?l=Stablecoin).

### Decoupling
DAICO is a loosely coupled set of smart contracts in which each of components has, or makes use of, little or no knowledge of other separate contracts. As the result, contracts can be replaced during organization lifetime with alternative implementations. This separation allows good flexibility and long-term operation of the organization itself and its most valuable long-living asset - Token.

### Autonomy
At certain points of time vital DAICO contracts (`Token`s, `Fund`s) must operate autonomously to be trusted (giving the guarantee that it's technically impossible to execute mission-critical actions like token minting, funds spending and so on). Decoupling can provide a good level of autonomy for given interval of time or until prescribed conditions are met (locking or partial minting/withdrawal limits).
For example, the mintable `Token` contract should have the `PreSale` contract as the single mintable owner during the initial period when the `Governance` DAO is not finalized yet. After the first round, its early investors become the DAO voters, DAO finalizes and activates and the ownership transfer is forced to the DAO `Governance` contract. All further administrative decisions (like token minting or spending) are processed democratically through the DAO Propose-Vote-Execute mechanism.

### Ownership
The contract stack can be build with the simplest owner-to-object relations binding all entities. If the contract has admininstrative methods (like token minting or funds spending), these privileges belong to the role of an owner and assigned to another contract (say, the owner of the `Token` could be either `Governance` or `PreSale` contract). If we need to modify the behaviour of the `PreSale` over time, we should transfer its ownership to the newly deployed `PreSale`-2 entity and we can implement the logic of next ownership transfer after the `PreSale`-2 has already served its purpose.

Example: the participants of DAO could decide to undertake unplanned investment round. They agreed to create and deploy the new `TokenSale` contract which is able to receive 1000 USD worth of stablecoins minting up to 100 tokens. For this purpose they vote to transfer ownership from the `Governance` to the new `TokenSale` and it starts. After the given target (cap) of deposits is reached, the `Token` ownership gets transferred back to the `Governance` and stays under the control of DAO board.

### Claimable ownership
The one-way ownership transfer is a common and widely used pattern but it lacks a safety mechanism for accidental transferring of the ownership to the wrong address. To ensure that we will never accidentally move the ownership of a vital long-lifespan contract to the wrong address we use the 2-way `transferOwnership` / `claimOwnership` mechanism that was very nicely provided in [v1.12.0@OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/0e65947efbffc592cffea8c2ae9d3b8e11659854/contracts/ownership/Claimable.sol), was removed in v2, see [openzeppelin-solidity#1488](https://github.com/OpenZeppelin/openzeppelin-solidity/issues/1488).

# Authors

* [Kirill Varlamov](https://github.com/ongrid), OnGrid Systems ([github](https://github.com/OnGridSystems), [site](https://ongrid.pro))
* [Dmitry Romanov](https://github.com/onionglass), OnGrid Systems ([github](https://github.com/OnGridSystems), [site](https://ongrid.pro))
