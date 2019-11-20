const Registry = artifacts.require('Registry.sol')
const URIPrefixController = artifacts.require(
  'controller/URIPrefixController.sol',
)
const SignatureController = artifacts.require(
  'controller/SignatureController.sol',
)
const MintingController = artifacts.require('controller/MintingController.sol')
const WhitelistedMinter = artifacts.require('util/WhitelistedMinter.sol')
const Resolver = artifacts.require('Resolver.sol')
const Simple = artifacts.require('util/Simple.sol')

module.exports = (deployer, network, accounts) => {
  deployer.deploy(Registry).then(async registry => {
    const signatureController = await deployer.deploy(
      SignatureController,
      registry.address,
    )
    const sunriseController = await deployer.deploy(
      MintingController,
      registry.address,
    )
    const uriPrefixController = await deployer.deploy(
      URIPrefixController,
      registry.address,
    )

    await registry.addController(signatureController.address)
    await registry.addController(sunriseController.address)
    await registry.addController(uriPrefixController.address)

    if (network === 'live') {
      await registry.renounceController()
    }

    const whitelistedMinter = await deployer.deploy(
      WhitelistedMinter,
      sunriseController.address,
    )
    await whitelistedMinter.addWhitelisted(accounts[0])
    await sunriseController.addMinter(whitelistedMinter.address)

    if (network === 'live') {
      await sunriseController.renounceMinter()
    }

    await deployer.deploy(Resolver, registry.address)
    const simple = await deployer.deploy(Simple)

    console.log('Migrated!')
  })
}
