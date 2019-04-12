const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = 'tonight short fun bracket sure rubber always also stable grass hammer quit warfare hair family';
const infuraKey = 'b43f89fc090e492c91930334fc4ca30d';
/* Addresses derived from the seed
NEVER EVER USE THEM IN PRODUCTION!!!
Index 0:
  Private key (hex, compressed): d5c0f9992e40a7c33eac9ceb199230f3d3ce480ff6d5f97ae3250ec631827ab8
  Address: 0x7b509c4bf9a7d97e95a822ee122d969b54d6c74e
Index 1:
  Private key (hex, compressed): b6e7201e988bdff6ec52bd7ebcaa128e286c80352b8d4879850c650f46eab92e
  Address: 0xb938d3b98ebf0ecde6ea8e4bb69fcb5b41b8ffed
Index 2:
  Private key (hex, compressed): ba3aa7a9890a8beebc44986a0a41e31f7557b5487393bceffa4c6a337c481f1d
  Address: 0x5ae2fe15da1f2a4ae0e24099f769a1372b3ad43a
Index 3:
  Private key (hex, compressed): 800dc9a1f3b5a5d077418f0e0096a1ed56281b86b162c6efab95ee73bb402359
  Address: 0x81f389d4c9f20169d7e54de7cb178a0409e59f1b
Index 4:
  Private key (hex, compressed): ac0037d443181c55def1b714b1c23d7a1cf01d8d92f50ff994a30825e756fd85
  Address: 0x5f02fd8585d9ddda68894470afc5b428fadbc9bd
Index 5:
  Private key (hex, compressed): e8ba4c955e059c5347be5ec15ca6772739eda092a9f13b78ba0efc38e0f1dacb
  Address: 0xeba6e3b5411383c0476074fd40bb07d0f790af0c
Index 6:
  Private key (hex, compressed): 083b1d0ce015a54f79681943854a251d7df65d78d665f737189aa58cb2199fa0
  Address: 0x2eb879c28ccb425d7d8056e9a334c0ecc989e918
Index 7:
  Private key (hex, compressed): f4044cb564d37ce900440078cc4bac45c0c278cdfe3410528ff4dce6d3b3dd2f
  Address: 0x3c77c818a7f201e3e23bf3fec026242c37fb1501
Index 8:
  Private key (hex, compressed): a062b7e394410499f3793f3cc4dc84fbc3faabcadb5609daa417cbb288099205
  Address: 0xd56ceabccbf42127a54b23945d248c1168d87b5d
Index 9:
  Private key (hex, compressed): 5d0319c5deee1b399030c8ea32009d21c420ee03545ca02dde22298fa0393ca3
  Address: 0x354eb737ac6f046ab3d085b20246fe54c65b0fb7
*/

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/v3/' + infuraKey);
      },
      network_id: 4, // eslint-disable-line camelcase
      gas: 3000000,
      from: '0x7b509c4BF9a7D97E95A822EE122D969B54D6c74E',
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/v3/' + infuraKey);
      },
      network_id: 3, // eslint-disable-line camelcase
      gas: 3000000,
      from: '0x7b509c4BF9a7D97E95A822EE122D969B54D6c74E',
    },
  },
  compilers: {
    solc: {
      version: '0.5.7',
    },
  },
};
