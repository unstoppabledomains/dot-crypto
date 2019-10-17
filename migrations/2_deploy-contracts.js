const Registry = artifacts.require('registry/Registry.sol')
// const MintingController = artifacts.require('controller/MintingController.sol')
const SignatureController = artifacts.require(
  'controller/SignatureController.sol',
)
const SunriseController = artifacts.require('controller/SunriseController.sol')
const Multiplexer = artifacts.require('util/Multiplexer.sol')
const SignatureResolver = artifacts.require('resolver/SignatureResolver.sol')
const Simple = artifacts.require('util/Simple.sol')

module.exports = (deployer, network, accounts) => {
  return deployer.deploy(Registry).then(async registry => {
    const signatureController = await deployer.deploy(
      SignatureController,
      registry.address,
    )
    const sunriseController = await deployer.deploy(
      SunriseController,
      registry.address,
      60 * 60 * 24 * 365,
    )
    await registry.addController(signatureController.address)
    await registry.addController(sunriseController.address)

    if (network === 'live') {
      await registry.renounceController()
    }

    const multiplexer = await deployer.deploy(
      Multiplexer,
      sunriseController.address,
    )
    await multiplexer.addWhitelisted(accounts[0])
    await sunriseController.addMinter(multiplexer.address)

    if (network === 'live') {
      await sunriseController.renounceMinter()
    }

    await deployer.deploy(SignatureResolver, registry.address)
    const simple = await deployer.deploy(Simple)
  })
}
