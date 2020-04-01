const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getUsedGas = require("./helpers/getUsedGas").getUsedGas;
chai.use(chaiAsPromised)
const assert = chai.assert
const web3 = require('web3');
const utils = web3.utils;

contract('Resolver', function([coinbase, ...accounts]) {
  let mintingController, registry, resolver

  let initializeDomain = async (name) => {
    const tok = await registry.childIdOf(await registry.root(), name)
    await mintingController.mintSLD(coinbase, name)
    await registry.resolveTo(resolver.address, tok)
    
    return tok;
  }

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

  it('should get key by hash', async () => {
    const tok = await initializeDomain('heyhash')
    const expectedKey = 'new-hashed-key'
    await resolver.set(expectedKey, 'value', tok)
    const expectedKeyHash = utils.keccak256(expectedKey)
    const keyFromHash = await resolver.hashToKey(utils.hexToNumberString(expectedKeyHash))
    
    assert.equal(keyFromHash, expectedKey)
  });

  it('should get many keys by hashes', async () => {
    const tok = await initializeDomain('heyhash-many')
    const expectedKeys = ['keyhash-many-1', 'keyhash-many-2']
    await resolver.setMany(expectedKeys, ['value', 'value'], tok)
    const expectedKeyHashes = expectedKeys.map(key => {
      const keyHash = utils.keccak256(key)
      return utils.hexToNumberString(keyHash)
    });
    const keysFromHashes = await resolver.hashesToKeys(expectedKeyHashes)

    assert.deepEqual(keysFromHashes, expectedKeys)
  });

  it('should not consume additional gas if key hash was set before', async () => {
    const tok = await initializeDomain('heyhash-gas')
    const newKeyHashTx = await resolver.set('keyhash-gas', 'value', tok)
    console.log(`      ⓘ Resolver.set - add new key hash: ${ getUsedGas(newKeyHashTx) }`)
    const exitsKeyHashTx = await resolver.set('keyhash-gas', 'value', tok)
    console.log(`      ⓘ Resolver.set - hey hash already exists: ${ getUsedGas(exitsKeyHashTx) }`)
    
    assert.isAbove(newKeyHashTx.receipt.gasUsed, exitsKeyHashTx.receipt.gasUsed)
  });

  it('should get value by key hash', async () => {
    const tok = await initializeDomain('get-key-by-hash')
    const key = 'get-key-by-hash-key'
    const expectedValue = 'get-key-by-hash-value'
    await resolver.set(key, expectedValue, tok)
    const keyHash = utils.keccak256(key)
    const value = await resolver.getByHash(keyHash, tok)
    
    assert.equal(value, expectedValue)
  });

  it('should get multiple values by hashes', async () => {
    const tok = await initializeDomain('get-many-keys-by-hash')
    const keys = ['key-to-hash-1', 'key-to-hash-2']
    const expectedValues = ['value-42', 'value-43']
    await resolver.setMany(keys, expectedValues, tok)
    const hashedKeys = keys.map(key => {
      const keyHash = utils.keccak256(key)
      return utils.hexToNumberString(keyHash)
    });
    const values = await resolver.getManyByHash(hashedKeys, tok)
    assert.deepEqual(values, expectedValues)
  });
})
