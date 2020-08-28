const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { utils } = require('web3');

const Registry = artifacts.require('Registry.sol');
const Resolver = artifacts.require('Resolver.sol');
const MintingController = artifacts.require('controller/MintingController.sol');
const ProxyReader = artifacts.require('ProxyReader.sol');
const expectRevert = require('./helpers/expectRevert.js');
const { ZERO_ADDRESS } = require('./helpers/constants.js');

chai.use(chaiAsPromised);
const { assert } = chai;

contract('ProxyReader', ([coinbase, ...accounts]) => {
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
        await expectRevert(ProxyReader.new(ZERO_ADDRESS), '-Registry is empty');
    });

    it('should support IERC165 interface', async () => {
        const isSupport = await proxy.supportsInterface('0x01ffc9a7');
        assert.isTrue(isSupport);
    });

    describe('IRegistryReader', () => {
        it('should support IRegistryReader interface', async () => {
            const isSupport = await proxy.supportsInterface('0x6eabca0d');
            assert.isTrue(isSupport);
        });

        it('should proxy name call', async () => {
            const result = await proxy.name();
            const expected = await registry.name();
            assert.equal(result, expected);
        });

        it('should proxy symbol call', async () => {
            const result = await proxy.symbol();
            const expected = await registry.symbol();
            assert.equal(result, expected);
        });

        it('should proxy tokenURI call', async () => {
            const result = await proxy.tokenURI(tokenId);
            const expected = await registry.tokenURI(tokenId);
            assert.equal(result, expected);
        });

        it('should proxy isApprovedOrOwner call', async () => {
            const result = await proxy.isApprovedOrOwner(accounts[0], tokenId);
            const expected = await registry.isApprovedOrOwner(accounts[0], tokenId);
            assert.equal(result, expected);
        });

        it('should proxy resolverOf call', async () => {
            const result = await proxy.resolverOf(tokenId);
            const expected = await registry.resolverOf(tokenId);
            assert.equal(result, expected);
        });

        it('should proxy childIdOf call', async () => {
            const result = await proxy.childIdOf(tokenId, "t1");
            const expected = await registry.childIdOf(tokenId, "t1");
            assert.equal(result.toString(), expected.toString());
        });

        it('should proxy isController call', async () => {
            const result = await proxy.isController(accounts[0]);
            const expected = await registry.isController(accounts[0]);
            assert.equal(result, expected);
        });

        it('should proxy balanceOf call', async () => {
            const result = await proxy.balanceOf(accounts[0]);
            const expected = await registry.balanceOf(accounts[0]);
            assert.equal(result.toString(), expected.toString());
        });

        it('should proxy ownerOf call', async () => {
            const result = await proxy.ownerOf(tokenId);
            const expected = await registry.ownerOf(tokenId);
            assert.equal(result, expected);
        });

        it('should proxy getApproved call', async () => {
            const result = await proxy.getApproved(tokenId);
            const expected = await registry.getApproved(tokenId);
            assert.equal(result, expected);
        });

        it('should proxy isApprovedForAll call', async () => {
            const result = await proxy.isApprovedForAll(accounts[0], accounts[1]);
            const expected = await registry.isApprovedForAll(accounts[0], accounts[1]);
            assert.equal(result, expected);
        });

        it('should proxy root call', async () => {
            const result = await proxy.root();
            const expected = await registry.root();
            assert.equal(result.toString(), expected.toString());
        });
    });

    describe('IResolverReader', () => {
        it('should support IResolverReader interface', async () => {
            const isSupport = await proxy.supportsInterface('0xc897de98');
            assert.isTrue(isSupport);
        });

        describe('getMany', () => {
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
                const [key] = keys;
                const [value] = values;
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
                assert.deepEqual(result, values);
            });
        });

        it('should proxy nonceOf call', async () => {
            const result = await proxy.nonceOf(tokenId);
            const expected = await resolver.nonceOf(tokenId);
            assert.equal(result.toString(), expected.toString());
        });

        it('should proxy registry call', async () => {
            const result = await proxy.registry();
            const expected = await resolver.registry();
            assert.equal(result, expected);
        });

        it('should proxy get call', async () => {
            const result = await proxy.get(keys[0], tokenId);
            const expected = await resolver.get(keys[0], tokenId);
            assert.equal(result, expected);
        });

        it('should proxy getByHash call', async () => {
            const keyHash = utils.keccak256(keys[0]);
            const result = await proxy.getByHash(keyHash, tokenId);
            const expected = await resolver.getByHash(keyHash, tokenId);
            assert.equal(result.toString(), expected.toString());
        });

        it('should proxy getManyByHash call', async () => {
            const keyHash = utils.keccak256(keys[0]);
            const result = await proxy.getManyByHash([keyHash], tokenId);
            const expected = await resolver.getManyByHash([keyHash], tokenId);
            assert.deepEqual(result, expected);
        });
    });

    describe('IDataReader', () => {
        it('should support IDataReader interface', async () => {
            const isSupport = await proxy.supportsInterface('0x9229583e');
            assert.isTrue(isSupport);
        });

        it('should revert when resolver not found', async () => {
            const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
            await expectRevert.unspecified(proxy.getData([keys[0]], unknownTokenId));
        });

        it('should return data by keys', async () => {
            const data = await proxy.getData(keys, tokenId);
            assert.equal(data.resolver, resolver.address);
            assert.equal(data.owner, coinbase);
            assert.deepEqual(data.values, values);
        });

        it('should return data by hashes', async () => {
            // arrange
            const hashes = keys.map(utils.keccak256);
            for (let i = 0; i < keys.length; i++) {
                await resolver.set(keys[i], values[i], tokenId);
            }

            const data = await proxy.getDataByHash(hashes, tokenId);
            assert.equal(data.resolver, resolver.address);
            assert.equal(data.owner, coinbase);
            assert.deepEqual(data.keys, keys);
            assert.deepEqual(data.values, values);
        });
    });
});
