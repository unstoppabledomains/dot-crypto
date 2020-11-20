const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const {assert} = chai
const expectRevert = require('./helpers/expectRevert.js')

const FreeDomainsMinter = artifacts.require('util/FreeDomainsMinter.sol')
const Registry = artifacts.require('Registry.sol')
const Resolver = artifacts.require('Resolver.sol')

const DomainNamePrefix = 'udtestdev-'

contract('FreeDomainsMinter', function([, developer, receiver]) {
  let freeDomainsMinter, registry, resolver, domainSuffix

  before(async () => {
    freeDomainsMinter = await FreeDomainsMinter.deployed()
    registry = await Registry.deployed()
    resolver = await Resolver.deployed()
  })

  beforeEach(() => {
    domainSuffix = `prefixed-domain-${Math.random() * 1000}`
  })

  describe('FreeDomainsMinter.claim(string calldata _label)', () => {
    it('should mint prefixed domain', async () => {
      await freeDomainsMinter.methods['claim(string)'](domainSuffix, {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const tokenUri = await registry.tokenURI(tokenId)
      assert.equal(tokenUri, `${DomainNamePrefix}${domainSuffix}.crypto`)
    })

    it('should send domain to requester', async () => {
      await freeDomainsMinter.methods['claim(string)'](domainSuffix, {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const owner = await registry.ownerOf(tokenId)
      assert.equal(owner, developer)
    })

    it('should not allow to mint the same domain twice', async () => {
      await freeDomainsMinter.methods['claim(string)'](domainSuffix, {from: developer})
      await expectRevert(
        freeDomainsMinter.methods['claim(string)'](domainSuffix, {from: developer}),
        'ERC721: token already minted',
      )
    })
  })

  describe('FreeDomainsMinter.claim(string calldata _label, address _receiver)', () => {
    it('should mint domain to receiver', async () => {
      await freeDomainsMinter.methods['claim(string,address)'](domainSuffix, receiver, {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const owner = await registry.ownerOf(tokenId)
      assert.equal(owner, receiver)
    })
  })

  describe('FreeDomainsMinter.claim(string calldata _label, address _receiver, string[] calldata _keys, string [] calldata _values)', () => {
    it('should mint domain to receiver with predefined keys', async () => {
      await freeDomainsMinter.methods['claim(string,address,string[],string[])'](domainSuffix, receiver, ['key'], ['value'], {from: developer})
      const tokenId = await registry.childIdOf(await registry.root(), `${DomainNamePrefix}${domainSuffix}`)
      const owner = await registry.ownerOf(tokenId)
      const values = await resolver.getMany(['key'], tokenId)
      assert.equal(owner, receiver)
      assert.deepEqual(values, ['value'])
    })
  })
})