const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')

const Web3 = require('web3')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

contract('Registry', function([coinbase, ...accounts]) {
  let mintingController, registry, resolver

  beforeEach(async () => {
    registry = await Registry.deployed()
    mintingController = await MintingController.deployed()
    resolver = await Resolver.deployed()
  })

  it('should resolve tokens', async () => {
    const tok = await registry.childIdOf(await registry.root(), 'label')

    // should fail to set name if not owner
    await assert.isRejected(resolver.set('key', 'value', tok))

    await mintingController.mintSLD(coinbase, 'label')

    // should fail to get name if not resolving to name
    await assert.isRejected(resolver.set('key', 'value', tok))

    await registry.resolveTo(resolver.address, tok)

    await resolver.set('key', 'value', tok)

    assert.equal(
      await resolver.get('key', tok),
      'value',
      'should resolve to resolver',
    )

    await registry.transferFrom(coinbase, accounts[1], tok)

    // should fail to set name if not owned
    await assert.isRejected(resolver.set('key', 'value', tok))
    await assert.isRejected(resolver.get('key', tok))
  })
})
