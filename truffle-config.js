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
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8545,
      from: '0x94e3361495bD110114ac0b6e35Ed75E77E6a6cFA',
    },

  },

  compilers: {
    solc: {
      version: '0.5.4',
    },
  },
};
