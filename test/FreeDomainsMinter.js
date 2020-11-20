const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const {assert} = chai

const FreeDomainsMinter = artifacts.require('util/FreeDomainsMinter.sol')
const Registry = artifacts.require('Registry.sol')
const Resolver = artifacts.require('Resolver.sol')
const MintingController = artifacts.require('controllers/MintingController.sol')

const DomainNamePrefix = 'unstoppable-development-'

contract('FreeDomainsMinter', function([coinbase, developer, receiver]) {
  let freeDomainsMinter, registry, resolver, mintingController, domainSuffix

  before(async () => {
    freeDomainsMinter = await FreeDomainsMinter.deployed()
    registry = await Registry.deployed()
    resolver = await Resolver.deployed()
    mintingController = await MintingController.deployed()
  })

  beforeEach(() => {
    domainSuffix = `prefixed-domain-${Math.random() * 1000}`
  })

  describe('FreeDomainsMinter.claimDomain(string calldata _label)', () => {
    it('should mint prefixed domain', async () => {
      await freeDomainsMinter.methods['claimDomain(string)'](domainSuffix, {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const tokenUri = await registry.tokenURI(tokenId)
      assert.equal(tokenUri, `${DomainNamePrefix}${domainSuffix}.crypto`)
    })

    it('should send domain to requester', async () => {
      await freeDomainsMinter.methods['claimDomain(string)'](domainSuffix, {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const owner = await registry.ownerOf(tokenId)
      assert.equal(owner, developer)
    })

    it('should not allow to mint the same domain twice', async () => {
      await freeDomainsMinter.methods['claimDomain(string)'](domainSuffix, {from: developer})
      try {
        await freeDomainsMinter.methods['claimDomain(string)'](domainSuffix, {from: developer})
        assert.fail('claimDomain function should fail when trying claim already claimed domain')
      } catch (e) {
        assert.equal(e.reason, 'ERC721: token already minted')
      }
    })
  })

  describe('FreeDomainsMinter.claimDomain(string calldata _label, address _receiver)', () => {
    it('should mint domain to receiver', async () => {
      await freeDomainsMinter.methods['claimDomain(string,address)'](domainSuffix, receiver, {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const owner = await registry.ownerOf(tokenId)
      assert.equal(owner, receiver)
    })
  })

  describe('FreeDomainsMinter.claimDomain(string calldata _label, address _receiver, string[] calldata _keys, string [] calldata _values)', () => {
    it('should mint domain to receiver with predefined keys', async () => {
      await freeDomainsMinter.methods['claimDomain(string,address,string[],string[])'](domainSuffix, receiver, ['key'], ['value'], {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const owner = await registry.ownerOf(tokenId)
      const values = await resolver.getMany(['key'], tokenId)
      assert.equal(owner, receiver)
      assert.deepEqual(values, ['value'])
    })
  })

  describe('Set default resolver', async () => {
    it('should set new default resolver', async () => {
      const oldResolverAddress = await freeDomainsMinter.getDefaultResolver()
      const newDefaultResolver = await Resolver.new(
        registry.address,
        mintingController.address,
        {
          from: coinbase,
        },
      )
      await freeDomainsMinter.setDefaultResolver(newDefaultResolver.address, {from: coinbase})
      const newResolverAddress = await freeDomainsMinter.getDefaultResolver()
      assert.equal(newResolverAddress, newDefaultResolver.address)
      assert.notEqual(oldResolverAddress, newResolverAddress)
    })

    it('should throw error if setting resolver from non-admin account', async () => {
      try {
        await freeDomainsMinter.setDefaultResolver(resolver.address, {from: developer})
        assert.fail('setDefaultResolver function should fail when trying to set from non-admin account')
      } catch (e) {
        assert.equal(e.reason, 'WhitelistAdminRole: caller does not have the WhitelistAdmin role')
      }
    })
  })
})