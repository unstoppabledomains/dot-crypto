const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Resolver = artifacts.require('Resolver.sol')
const DomainZoneController = artifacts.require('controller/DomainZoneController.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getUsedGas = require("./helpers/getUsedGas").getUsedGas;
chai.use(chaiAsPromised)
const assert = chai.assert

contract('DomainZoneController', function([coinbase, whitelisted, domainReceiver, ...accounts]) {
  let mintingController, registry, resolver, secondLevelTokenId;
  const secondLevelDomainName = 'unstoppable';

  before(async () => {
    registry = await Registry.deployed()
    mintingController = await MintingController.deployed()
    resolver = await Resolver.deployed()
    await mintingController.mintSLD(coinbase, secondLevelDomainName)
    secondLevelTokenId = await registry.childIdOf(await registry.root(), secondLevelDomainName)
    await registry.resolveTo(resolver.address, secondLevelTokenId)
  })

  it('should accept addreses on contract deploy', async () => {
    const domainZoneController = await DomainZoneController.new(registry.address, accounts)
    assert.notEmpty(domainZoneController.address)
  })

  it('should deploy contract with empty addresses array', async () => {
    const domainZoneController = await DomainZoneController.new(registry.address, [])
    assert.notEmpty(domainZoneController.address)
  })

  it('addresses added in constructor should be whitelisted', async () => {
    const domainZoneController = await DomainZoneController.new(registry.address, accounts)
    assert.isAbove(accounts.length, 0)
    for (account of accounts) {
        assert.isTrue(await domainZoneController.isWhitelisted(account))
    }
  })

  it('address should not be whitelisted if weren\'t added', async () => {
     const domainZoneController = await DomainZoneController.new(registry.address, accounts)
     assert.isFalse(await domainZoneController.isWhitelisted(coinbase))
  })

  it('should mint new child (subdomain) from whitelisted address', async () => {
    const subdomainName = 'subdomain'
    const expectedDomainUri = `${subdomainName}.${secondLevelDomainName}.crypto`
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.approve(domainZoneController.address, secondLevelTokenId)
    await domainZoneController.mintChild(domainReceiver, secondLevelTokenId, subdomainName, [], [], {from: whitelisted})
    const subdomainTokenId = await registry.childIdOf(secondLevelTokenId, subdomainName)
    assert.equal(
        await registry.tokenURI(subdomainTokenId),
        expectedDomainUri
    )
  })

  it('should mint new child (subdomain) with predefined resolver and domain records', async () => {
    const subdomainName = 'subdomain-with-records'
    const keys = ['crypto.ETH.address']
    const values = ['0x2a02559786988d4f65154391673f8323db1c7a30']
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.approve(domainZoneController.address, secondLevelTokenId)
    await domainZoneController.mintChild(domainReceiver, secondLevelTokenId, subdomainName, keys, values, {from: whitelisted})
    const subdomainTokenId = await registry.childIdOf(secondLevelTokenId, subdomainName)
    assert.deepEqual(
        await resolver.getMany(keys, subdomainTokenId, {from: domainReceiver}),
        values
    )
  })

  it('should not allow mint subdomain from not whitelisted address', async () => {
    const subdomainName = 'not-allowed-to-mint'
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.approve(domainZoneController.address, secondLevelTokenId)
    try {
        await domainZoneController.mintChild(domainReceiver, secondLevelTokenId, subdomainName, [], [], {from: domainReceiver})
        assert.fail('mintChild function should fail when trying to call from not allowed address')
    } catch (e) {
        assert.equal(e.reason, 'WhitelistedRole: caller does not have the Whitelisted role')
    }
  })

  it('should transfer minted domain to owner', async () => {
    const subdomainName = 'transferred-subdomain'
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.approve(domainZoneController.address, secondLevelTokenId)
    await domainZoneController.mintChild(domainReceiver, secondLevelTokenId, subdomainName, [], [], {from: whitelisted})
    const subdomainTokenId = await registry.childIdOf(secondLevelTokenId, subdomainName)
    assert.equal(
        await registry.ownerOf(subdomainTokenId),
        domainReceiver
    )
  })

  it('should not allow minting from not allowed second-level domains', async () => {
    const subdomainName = 'not-allowed-to-transfer'
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    assert.isRejected(domainZoneController.mintChild(domainReceiver, secondLevelTokenId, subdomainName, [], [], {from: whitelisted}))
  })

  it('should resolve to new resolver', async () => {
    const domainName = 'resolve-to-new-resolver'
    await mintingController.mintSLD(coinbase, domainName)
    const tokenId = await registry.childIdOf(await registry.root(), domainName)
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.transferFrom(coinbase, domainZoneController.address, tokenId)
    assert.isRejected(registry.resolverOf(tokenId))
    await domainZoneController.resolveTo(resolver.address, tokenId, {from: whitelisted})
    assert.equal(
      await registry.resolverOf(tokenId),
      resolver.address
    )
  })

  it('should not resolve to new resolver from not whitelisted address', async () => {
    const domainName = 'not-allowed-to-resolve'
    await mintingController.mintSLD(coinbase, domainName)
    const tokenId = await registry.childIdOf(await registry.root(), domainName)
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.transferFrom(coinbase, domainZoneController.address, tokenId)
    try {
        await domainZoneController.resolveTo(resolver.address, tokenId)
        assert.fail('resolveTo function should fail when trying to call from not allowed address')
    } catch (e) {
        assert.equal(e.reason, 'WhitelistedRole: caller does not have the Whitelisted role')
    }
  })
  
  it('should set records for domain', async () => {
    const keys = ['crypto.ETH.address']
    const values = ['0x2a02559786988d4f65154391673f8323db1c7a30']
    const domainName = 'set-many-records'
    await mintingController.mintSLD(coinbase, domainName)
    const tokenId = await registry.childIdOf(await registry.root(), domainName)
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.resolveTo(resolver.address, tokenId)
    await registry.setOwner(domainZoneController.address, tokenId)
    await domainZoneController.setMany(keys, values, tokenId, {from: whitelisted})
    assert.deepEqual(
      await resolver.getMany(keys, tokenId),
      values
    )
  })

  it('should not set records from not whitelisted addresse', async () => {
    const keys = ['crypto.ETH.address']
    const values = ['0x2a02559786988d4f65154391673f8323db1c7a30']
    const domainName = 'set-many-records-not-allowed'
    await mintingController.mintSLD(coinbase, domainName)
    const tokenId = await registry.childIdOf(await registry.root(), domainName)
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.resolveTo(resolver.address, tokenId)
    await registry.setOwner(domainZoneController.address, tokenId)
    try {
      await domainZoneController.setMany(keys, values, tokenId)
      assert.fail('setMany function should fail when trying to call from not allowed address')
    } catch (e) {
        assert.equal(e.reason, 'WhitelistedRole: caller does not have the Whitelisted role')
    }
  })
})
