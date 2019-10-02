module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
      gas: 100 * 10 ** 6,
    },
    test: {
      host: 'localhost',
      port: 7545,
      network_id: '4447',
      gas: 100 * 10 ** 6,
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
}
