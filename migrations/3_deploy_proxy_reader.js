const Registry = artifacts.require('Registry.sol')
const ProxyReader = artifacts.require('ProxyReader.sol')

module.exports = (deployer) => {
  Registry.deployed().then(async registry => {
    await deployer.deploy(ProxyReader, registry.address)

    console.log('Migrated!')
  });
}
