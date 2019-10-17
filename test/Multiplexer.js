const Registry = artifacts.require('registry/Registry.sol')
const SunriseController = artifacts.require('controller/SunriseController.sol')
const Multiplexer = artifacts.require('util/Multiplexer.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

contract('MintingController', function([coinbase, ...accounts]) {
  let multiplexer, registry

  beforeEach(async () => {
    registry = await Registry.deployed()
    multiplexer = await SunriseController.at(
      (await Multiplexer.deployed()).address,
    )
  })

  it('should forward calls', async () => {
    await multiplexer.safeMintSLD(coinbase, 'label')

    const tok = await registry.childOf(await registry.root(), 'label')

    assert.equal(
      coinbase,
      await registry.ownerOf(tok),
      'should mint name correctly',
    )
  })

  it('should get calldata', async () => {
    assert(!(await multiplexer.isSunriseOver()), 'should get calldata')

    // should get rejection calldata
    await assert.isRejected(multiplexer.isSunrise(1))
  })
})
