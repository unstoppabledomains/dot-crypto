module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
    },
    live: {
      host: 'localhost',
      port: 8545,
      network_id: '1',
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '4447',
      gas: 6721975,
    },
    devgeth: {
      host: 'localhost',
      port: 7545,
      network_id: '1337',
      gas: 4401670,
    },
  },
  compilers: {
    solc: {
      version: '0.5.12',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  contracts_build_directory: 'truffle_artifacts',
}
