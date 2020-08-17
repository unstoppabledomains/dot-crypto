const { expectRevert, constants } = require('@openzeppelin/test-helpers');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Registry = artifacts.require('Registry.sol');
const Resolver = artifacts.require('Resolver.sol');
const MintingController = artifacts.require('controller/MintingController.sol');
const ProxyReader = artifacts.require('ProxyReader.sol');

chai.use(chaiAsPromised);
const { assert } = chai;
const { ZERO_ADDRESS } = constants;

contract.only('ProxyReader', ([coinbase, ...accounts]) => {
    const domainName = 'test';
    let registry, resolver, proxy;

    before(async () => {
        registry = await Registry.deployed();
        const mintingController = await MintingController.deployed();
        resolver = await Resolver.deployed();
        await mintingController.mintSLD(coinbase, domainName);
        const tokenId = await registry.childIdOf(await registry.root(), domainName);
        await registry.resolveTo(resolver.address, tokenId);
        proxy = await ProxyReader.new(registry.address);
    });

    it('should revert when registry is empty', async () => {
        await expectRevert(ProxyReader.new(ZERO_ADDRESS), 'Registry is empty');
    });

    it('should revert when resolver not found', async () => {
        const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
        await expectRevert.unspecified(proxy.getMany(['test.key'], unknownTokenId));
    });

    it('should return list with empty value for unregistered key', async () => {
        const tokenId = await registry.childIdOf(await registry.root(), domainName);
        const result = await proxy.getMany(['test.key'], tokenId);
        assert.equal(result.length, 1);
        assert.equal(result[0], '');
    });

    it('should return list with single value', async () => {
        // arrange
        const tokenId = await registry.childIdOf(await registry.root(), domainName);
        await resolver.set('test.key', 'test.value', tokenId);

        const result = await proxy.getMany(['test.key'], tokenId);
        assert.equal(result.length, 1);
        assert.equal(result[0], 'test.value');
    });

    // TODO: optimize arrange block
    it('should return list with multiple values', async () => {
        // arrange
        const tokenId = await registry.childIdOf(await registry.root(), domainName);
        await resolver.set('test.key1', 'test.value1', tokenId);
        await resolver.set('test.key2', 'test.value2', tokenId);

        const result = await proxy.getMany(['test.key1', 'test.key2'], tokenId);
        assert.equal(result.length, 2);
        assert.equal(result[0], 'test.value1');
        assert.equal(result[1], 'test.value2');
    });
});
