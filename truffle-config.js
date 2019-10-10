module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
    },
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
      runs: 200,
    },
  },
}
