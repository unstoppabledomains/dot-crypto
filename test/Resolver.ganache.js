const Registry = artifacts.require('registry/Registry.sol')
const SunriseController = artifacts.require('controller/SunriseController.sol')
const SignatureResolver = artifacts.require('resolver/SignatureResolver.sol')

const Web3 = require('web3')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

contract('Registry', function([coinbase, ...accounts]) {
  let sunriseController, registry, resolver

  beforeEach(async () => {
    registry = await Registry.deployed()
    sunriseController = await SunriseController.deployed()
    resolver = await SignatureResolver.deployed()
  })

  it('should resolve tokens', async () => {
    const tok = await registry.childOf(await registry.root(), 'label')

    // should fail to set name if not owner
    await assert.isRejected(
      resolver.set(Web3.utils.toHex('key'), Web3.utils.toHex('value'), tok),
    )

    await sunriseController.mintSLD(coinbase, 'label')

    // should fail to get name if not resolving to name
    await assert.isRejected(
      resolver.set(Web3.utils.toHex('key'), Web3.utils.toHex('value'), tok),
    )

    await registry.resolveTo(resolver.address, tok)

    await resolver.set(Web3.utils.toHex('key'), Web3.utils.toHex('value'), tok)

    assert.equal(
      Web3.utils.toUtf8(await resolver.get(Web3.utils.toHex('key'), tok)),
      'value',
      'should resolve to resolver',
    )

    await registry.transferFrom(coinbase, accounts[1], tok)

    // should fail to set name if not owned
    await assert.isRejected(
      resolver.set(Web3.utils.toHex('key'), Web3.utils.toHex('value'), tok),
    )
    await assert.isRejected(resolver.get(Web3.utils.toHex('key'), tok))
  })
})
