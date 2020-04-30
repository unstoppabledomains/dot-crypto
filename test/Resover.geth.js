const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const usedGas = require("./helpers/getUsedGas");
const getUsedGas = usedGas.getUsedGas;
chai.use(chaiAsPromised)
const assert = chai.assert
const submitSigTransaction = require('./helpers/submitSigTransaction')

contract('Resolver', function([coinbase, notOwner]) {
  let mintingController, registry, resolver

  let initializeDomain = async (name) => {
    const tok = await registry.childIdOf(await registry.root(), name)
    await mintingController.mintSLD(coinbase, name)
    await registry.resolveTo(resolver.address, tok)
    
    return tok;
  }

  before(async () => {
    await usedGas.init()
  })

  beforeEach(async () => {
    registry = await Registry.deployed()
    mintingController = await MintingController.deployed()
    resolver = await Resolver.deployed()
  })

  it('should reconfigure resolver with new values', async () => {
    const tok = (await initializeDomain('reconfigure')).toString(10)
    await resolver.set('old-key', 'old-value', tok)
    const tx = await submitSigTransaction(
        resolver,
        resolver,
        coinbase, 
        'reconfigure',
        ['new-key'], 
        ['new-value'], 
        tok
    )
    console.log(`      ⓘ Resolver.reconfigureFor: ${ getUsedGas(tx) }`)
    
    assert.equal(await resolver.get('old-key', tok), '')
    assert.equal(await resolver.get('new-key', tok), 'new-value')
    // should fail when trying to reconfigure non-owned domain
    await assert.isRejected(
        submitSigTransaction(
            resolver,
            resolver,
            notOwner, 
            'reconfigure',
            ['new-key'], 
            ['new-value'], 
            tok
        )  
    )
  })

  it('should setManyFor', async () => {
    const tok = (await initializeDomain('set-many-for')).toString(10)
    const keys = ['new-key-1', 'new-key-2'];
    const expectedValues = ['new-value-1', 'new-value-2'];
    const tx = await submitSigTransaction(
        resolver,
        resolver,
        coinbase,
        'setMany',
        keys,
        expectedValues,
        tok
    )
    console.log(`      ⓘ Resolver.setManyFor - two values: ${ getUsedGas(tx) }`)
    
    const values = await resolver.getMany(keys, tok)
    assert.deepEqual(values, expectedValues)
  })
})
