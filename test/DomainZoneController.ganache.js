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
  });

  it('address should not be whitelisted if weren\'t added', async () => {
     const domainZoneController = await DomainZoneController.new(registry.address, accounts)
     assert.isFalse(await domainZoneController.isWhitelisted(coinbase))
  })

  it('should mint new child (subdomain) from whitelisted address', async () => {
    const subdomainName = 'subdomain'
    const expectedDomainUri = `${subdomainName}.${secondLevelDomainName}.crypto`
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.addController(domainZoneController.address)
    await mintingController.addMinter(domainZoneController.address)
    await domainZoneController.mintChild(domainReceiver, secondLevelTokenId, subdomainName, [], [], {from: whitelisted})
    const subdomainTokenId = await registry.childIdOf(secondLevelTokenId, subdomainName)
    assert.equal(
        await registry.tokenURI(subdomainTokenId),
        expectedDomainUri
    )
  });

  it('should mint new child (subdomain) with predefined resolver and domain records', async () => {
    const subdomainName = 'subdomain-with-records'
    const keys = ['crypto.ETH.address'];
    const values = ['0x2a02559786988d4f65154391673f8323db1c7a30']
    const domainZoneController = await DomainZoneController.new(registry.address, [whitelisted])
    await registry.addController(domainZoneController.address)
    await mintingController.addMinter(domainZoneController.address)
    await domainZoneController.mintChild(domainReceiver, secondLevelTokenId, subdomainName, keys, values, {from: whitelisted})
    const subdomainTokenId = await registry.childIdOf(secondLevelTokenId, subdomainName)
    assert.deepEqual(
        await resolver.getMany(keys, subdomainTokenId),
        values
    )
  });
})
