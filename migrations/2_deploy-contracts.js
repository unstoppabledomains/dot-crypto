const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const SignatureController = artifacts.require(
  'controller/SignatureController.sol',
)
const SunriseController = artifacts.require('controller/SunriseController.sol')
const ChildrenController = artifacts.require(
  'controller/ChildrenController.sol',
)

module.exports = deployer => {
  return deployer.deploy(Registry).then(async registry => {
    const minting = await deployer.deploy(MintingController, registry.address)
    const signature = await deployer.deploy(
      SignatureController,
      registry.address,
    )
    const sunrise = await deployer.deploy(
      SunriseController,
      registry.address,
      60 * 60 * 24 * 365,
    )
    const children = await deployer.deploy(ChildrenController, registry.address)

    await registry.addController(minting.address)
    await registry.addController(signature.address)
    await registry.addController(sunrise.address)
    await registry.addController(children.address)
    await registry.renounceController()
  })
}
