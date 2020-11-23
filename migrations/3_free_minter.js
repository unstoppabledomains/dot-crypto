const Registry = artifacts.require('Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')
const FreeMinter = artifacts.require('util/FreeMinter.sol')

module.exports = async (deployer) => {
    const registry = await Registry.deployed()
    const mintingController = await MintingController.deployed()
    const resolver = await Resolver.deployed()
    const freeDomainsMinter = await deployer.deploy(FreeMinter, mintingController.address, resolver.address, registry.address)
    await mintingController.addMinter(freeDomainsMinter.address)
}
