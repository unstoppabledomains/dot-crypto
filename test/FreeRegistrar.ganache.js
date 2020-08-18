const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')
const FreeRegistrar = artifacts.require('controller/FreeRegistrar.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const usedGas = require("./helpers/getUsedGas");
const getUsedGas = usedGas.getUsedGas;
chai.use(chaiAsPromised)
const assert = chai.assert

contract('FreeRegistrar', function([coinbase, domainReceiver, ...accounts]) {
  let mintingController, registry, resolver, secondLevelTokenId;
  const secondLevelDomainName = 'unstoppable';

  before(async () => {
    await usedGas.init()
    registry = await Registry.deployed()
    mintingController = await MintingController.deployed()
    resolver = await Resolver.deployed()
    await mintingController.mintSLD(coinbase, secondLevelDomainName)
    secondLevelTokenId = await registry.childIdOf(await registry.root(), secondLevelDomainName)
    await registry.resolveTo(resolver.address, secondLevelTokenId)
  })

  it('is successfully constructed', async () => {
    const freeRegistrar = await FreeRegistrar.new(registry.address, secondLevelTokenId)
    assert.notEmpty(freeRegistrar.address)

    const registryAddress = await freeRegistrar.registry()
    assert.equal(registryAddress, registry.address)
    const parentTokenId = await freeRegistrar.parentTokenId()
    assert.equal(parentTokenId.toString(), secondLevelTokenId.toString())
  })

  it('allows a non-owner to mint a new child', async () => {
    const subdomainName = 'subdomain'
    const expectedDomainUri = `${subdomainName}.${secondLevelDomainName}.crypto`
    const freeRegistrar = await FreeRegistrar.new(registry.address, secondLevelTokenId)
    await registry.approve(freeRegistrar.address, secondLevelTokenId)
    const tx = await freeRegistrar.mintChild(domainReceiver, subdomainName, {from: domainReceiver})
    console.log(`      ⓘ FreeRegistrar.mintChild: ${ getUsedGas(tx) }`)
    const subdomainTokenId = await registry.childIdOf(secondLevelTokenId, subdomainName)
    const domainOwner = await registry.ownerOf(subdomainTokenId)
    assert.equal(
      await registry.tokenURI(subdomainTokenId),
      expectedDomainUri
    )
    assert.equal(domainReceiver, domainOwner)
  })

  it('should emit MintChild event', async () => {
    const subdomainName = 'mint-child-event'
    const freeRegistrar = await FreeRegistrar.new(registry.address, secondLevelTokenId)
    await registry.approve(freeRegistrar.address, secondLevelTokenId)
    const tx = await freeRegistrar.mintChild(domainReceiver, subdomainName, {from: domainReceiver})
    const event = tx.logs.find(e => e.event == 'MintChild')
    const subdomainTokenId = await registry.childIdOf(secondLevelTokenId, subdomainName)
    assert.equal(event.args.tokenId, subdomainTokenId.toString())
    assert.equal(event.args.parentTokenId, secondLevelTokenId.toString())
    assert.equal(event.args.label, subdomainName)
  })
})
