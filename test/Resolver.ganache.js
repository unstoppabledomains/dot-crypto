const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')


const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getUsedGas = require("./helpers/getUsedGas").getUsedGas;
chai.use(chaiAsPromised)
const assert = chai.assert

contract('Resolver', function([coinbase, ...accounts]) {
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

    let tx = await registry.resolveTo(resolver.address, tok)
    console.log(`      ⓘ Resolver.resolveTo: ${ getUsedGas(tx) }`)

    tx = await resolver.set('key', 'value', tok)
    console.log(`      ⓘ Resolver.set: ${ getUsedGas(tx) }`)

    assert.equal(
      await resolver.get('key', tok),
      'value',
      'should resolve to resolver',
    )

    // should setMany
    tx = await resolver.setMany(['key1'], ['value1'], tok)
    console.log(`      ⓘ Resolver.setMany - one value: ${ getUsedGas(tx) }`)
    tx = await resolver.setMany(['key2', 'key3'], ['value2', 'value3'], tok)
    console.log(`      ⓘ Resolver.setMany - two values: ${ getUsedGas(tx) }`)
    tx = await resolver.setMany(['key4', 'key5', 'key6'], ['value4', 'value5', 'value6'], tok)
    console.log(`      ⓘ Resolver.setMany - three values: ${ getUsedGas(tx) }`)
    assert.deepEqual(
      await resolver.getMany(['key2', 'key3'], tok),
      ['value2', 'value3']
    );

    // should setPreset
    tx = await resolver.setPreset(1, tok)
    console.log(`      ⓘ Resolver.setPreset: ${ getUsedGas(tx) }`)
    assert.equal(
      await resolver.presetOf(tok),
      1
    );

    // should reset
    tx = await resolver.reset(tok);
    console.log(`      ⓘ Resolver.reset: ${ getUsedGas(tx) }`)
    assert.notEqual(
      await resolver.presetOf(tok),
      1
    );

    await registry.transferFrom(coinbase, accounts[1], tok)

    // should fail to set name if not owned
    await assert.isRejected(resolver.set('key', 'value', tok))
    await assert.isRejected(resolver.get('key', tok))
  });
})
