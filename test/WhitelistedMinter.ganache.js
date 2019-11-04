const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const WhitelistedMinter = artifacts.require('util/WhitelistedMinter.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

contract('WhitelistedMinter', function([coinbase, ...accounts]) {
  let whitelistedMinter, registry

  beforeEach(async () => {
    registry = await Registry.deployed()
    whitelistedMinter = await MintingController.at(
      (await WhitelistedMinter.deployed()).address,
    )
  })

  it('should safely mint SLDs', async () => {
    await whitelistedMinter.safeMintSLD(coinbase, 'label')

    const tok = await registry.childOf(await registry.root(), 'label')

    assert.equal(
      coinbase,
      await registry.ownerOf(tok),
      'should mint name correctly',
    )
  })
})
