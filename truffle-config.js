// const HDWalletProvider = require('@truffle/hdwallet-provider')

module.exports = {
  networks: {
    // development: {
    //   host: 'localhost',
    //   port: 7545,
    //   network_id: '*',
    // },
    // live: {
    //   host: 'localhost',
    //   port: 8545,
    //   network_id: '1',
    // },
    // ropsten: {
    //   provider: new HDWalletProvider(
    //     ['3ad0bf208c2999caeaa72dbf5578d244a1840755013977c89f1fd22defd047a9'],
    //     'https://ropsten.infura.io/v3',
    //   ),
    //   network_id: '3',
    // },
    test: {
      host: 'localhost',
      port: 7545,
      network_id: '4447',
      gas: 6721975,
    },
  },
  solc: {
    version: '0.5.11',
    optimizer: {
      enabled: true,
      runs: 1,
    },
  },
}
