const Registry = artifacts.require('Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')
const FreeDomainsMinter = artifacts.require('util/FreeDomainsMinter.sol')

module.exports = async (deployer) => {
    const registry = await Registry.deployed();
    const mintingController = await MintingController.deployed()
    const resolver = await Resolver.deployed()
    const freeDomainsMinter = await deployer.deploy(FreeDomainsMinter, mintingController.address, resolver.address, registry.address)
    await mintingController.addMinter(freeDomainsMinter.address)
}
