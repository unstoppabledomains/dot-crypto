const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Registry = artifacts.require('Registry.sol');
const Resolver = artifacts.require('Resolver.sol');
const MintingController = artifacts.require('controller/MintingController.sol');
const ProxyReader = artifacts.require('ProxyReader.sol');
const expectRevert = require('./helpers/expectRevert.js');
const { ZERO_ADDRESS } = require('./helpers/constants.js');

chai.use(chaiAsPromised);
const { assert } = chai;

contract('ProxyReader', ([coinbase]) => {
    const domainName = 'test_42';
    const keys = ['test.key1', 'test.key2'];
    const values = ['test.value1', 'test.value2'];
    let registry, resolver, proxy, tokenId;

    before(async () => {
        registry = await Registry.deployed();
        const mintingController = await MintingController.deployed();
        resolver = await Resolver.deployed();
        await mintingController.mintSLD(coinbase, domainName);
        tokenId = await registry.childIdOf(await registry.root(), domainName);
        await registry.resolveTo(resolver.address, tokenId);
        proxy = await ProxyReader.new(registry.address);
    });

    it('should revert when registry is empty', async () => {
        await expectRevert(ProxyReader.new(ZERO_ADDRESS), 'Registry is empty');
    });

    it('should revert when resolver not found', async () => {
        const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
        await expectRevert.unspecified(proxy.getMany([keys[0]], unknownTokenId));
    });

    it('should return list with empty value for unregistered key', async () => {
        const result = await proxy.getMany([keys[0]], tokenId);
        assert.equal(result.length, 1);
        assert.equal(result[0], '');
    });

    it('should return list with single value', async () => {
        // arrange
        const [ key ] = keys;
        const [ value ] = values;
        await resolver.set(key, value, tokenId);

        const result = await proxy.getMany([key], tokenId);
        assert.equal(result.length, 1);
        assert.equal(result[0], value);
    });

    it('should return list with multiple values', async () => {
        // arrange
        for (let i = 0; i < keys.length; i++) {
            await resolver.set(keys[i], values[i], tokenId);
        }

        const result = await proxy.getMany(keys, tokenId);
        assert.equal(result.length, 2);
        for (let i = 0; i < keys.length; i++) {
            assert.equal(result[i], values[i]);
        }
    });
});
