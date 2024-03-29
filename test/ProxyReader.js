const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { utils } = require('web3');

const Registry = artifacts.require('CNSRegistry.sol');
const Resolver = artifacts.require('Resolver.sol');
const MintingController = artifacts.require('controller/MintingController.sol');
const Simple = artifacts.require('controller/test-helpers/Simple.sol');
const ProxyReader = artifacts.require('ProxyReader.sol');
const expectRevert = require('./helpers/expectRevert.js');
const { ZERO_ADDRESS } = require('./helpers/constants.js');

chai.use(chaiAsPromised);
const { assert } = chai;

contract('ProxyReader', ([coinbase, ...accounts]) => {
    const domainName = 'test_42';
    const keys = ['test.key1', 'test.key2'];
    const values = ['test.value1', 'test.value2'];
    let registry, resolver, proxy, tokenId, mintingController;

    before(async () => {
        registry = await Registry.deployed();
        mintingController = await MintingController.deployed();
        resolver = await Resolver.deployed();
        await mintingController.mintSLD(coinbase, domainName);

        tokenId = await registry.childIdOf(await registry.root(), domainName);
        await registry.resolveTo(resolver.address, tokenId);
        
        proxy = await ProxyReader.new(registry.address);
    });

    it('should revert when registry is empty', async () => {
        await expectRevert(ProxyReader.new(ZERO_ADDRESS), 'Registry is empty');
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
            const result = await proxy.childIdOf(tokenId, 't1');
            const expected = await registry.childIdOf(tokenId, 't1');
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
                const [key] = keys;
                const [value] = values;
                await resolver.set(key, value, tokenId);

                const result = await proxy.getMany([key], tokenId);
                assert.equal(result.length, 1);
                assert.equal(result[0], value);
            });

            it('should return list with multiple values', async () => {
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
            const isSupport = await proxy.supportsInterface('0x46d43268');
            assert.isTrue(isSupport);
        });

        describe('getData', () => {
            it('should return empty data when resolver not found', async () => {
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
                const data = await proxy.getData.call([], unknownTokenId)

                assert.equal(data.resolver, ZERO_ADDRESS);
                assert.equal(data.owner, ZERO_ADDRESS);
                assert.deepEqual(data.values, []);
            });

            it('should return empty resolver when resolver is not set', async () => {
                // arrange
                const _domainName = 'hey_hoy_1qw'
                await mintingController.mintSLD(coinbase, _domainName);
                const _tokenId = await registry.childIdOf(await registry.root(), _domainName);

                // act
                const data = await proxy.getData.call([], _tokenId);

                // assert
                assert.equal(data.resolver, ZERO_ADDRESS);
                assert.equal(data.owner, coinbase);
                assert.deepEqual(data.values, []);
            });

            it('should return data by keys', async () => {
                // arrange
                const _domainName = 'hey_hoy_121'
                await mintingController.mintSLD(coinbase, _domainName);
                const _tokenId = await registry.childIdOf(await registry.root(), _domainName);
                await registry.resolveTo(resolver.address, _tokenId);

                // act
                const data = await proxy.getData.call(keys, _tokenId);

                // assert
                assert.equal(data.resolver, resolver.address);
                assert.equal(data.owner, coinbase);
                assert.deepEqual(data.values, ['','']);
            });
        });

        describe('getDataForMany', () => {
            it('should return empty lists for empty list of tokens', async () => {
                const data = await proxy.getDataForMany.call([], [])

                assert.deepEqual(data.resolvers, []);
                assert.deepEqual(data.owners, []);
                assert.deepEqual(data.values, []);
            });

            it('should return empty data when resolver not found', async () => {
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
                const data = await proxy.getDataForMany.call([], [unknownTokenId])

                assert.deepEqual(data.resolvers, [ZERO_ADDRESS]);
                assert.deepEqual(data.owners, [ZERO_ADDRESS]);
                assert.deepEqual(data.values, [[]]);
            });

            it('should return data for multiple tokens', async () => {
                // arrange
                const _domainName = 'test_1291'
                await mintingController.mintSLD(accounts[0], _domainName);
                const _tokenId = await registry.childIdOf(await registry.root(), _domainName);
                for (let i = 0; i < keys.length; i++) {
                    await resolver.set(keys[i], values[i], tokenId);
                }

                // act
                const data = await proxy.getDataForMany.call(keys, [tokenId, _tokenId]);
                
                // assert
                assert.deepEqual(data.resolvers, [resolver.address, ZERO_ADDRESS]);
                assert.deepEqual(data.owners, [coinbase, accounts[0]]);
                assert.deepEqual(data.values, [['test.value1', 'test.value2'], []]);
            });

            it('should return owners for multiple tokens (including unknown)', async () => {
                // arrange
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');

                // act
                const data = await proxy.getDataForMany.call([], [tokenId, unknownTokenId]);
                
                // assert
                assert.deepEqual(data.resolvers, [resolver.address, ZERO_ADDRESS]);
                assert.deepEqual(data.owners, [coinbase, ZERO_ADDRESS]);
                assert.deepEqual(data.values, [[], []]);
            });
        });

        describe('getDataByHash', () => {
            it('should return empty data when resolver not found', async () => {
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
                const data = await proxy.getDataByHash.call([], unknownTokenId)

                assert.equal(data.resolver, ZERO_ADDRESS);
                assert.equal(data.owner, ZERO_ADDRESS);
                assert.deepEqual(data.values, []);
            });

            it('should return empty resolver when resolver is not set', async () => {
                // arrange
                const _domainName = 'hey_hoy_faw'
                await mintingController.mintSLD(coinbase, _domainName);
                const _tokenId = await registry.childIdOf(await registry.root(), _domainName);

                // act
                const data = await proxy.getDataByHash.call([], _tokenId);

                // assert
                assert.equal(data.resolver, ZERO_ADDRESS);
                assert.equal(data.owner, coinbase);
                assert.deepEqual(data.values, []);
            });

            it('should return data by hashes', async () => {
                // arrange
                const hashes = keys.map(utils.keccak256);
                for (let i = 0; i < keys.length; i++) {
                    await resolver.set(keys[i], values[i], tokenId);
                }

                // act
                const data = await proxy.getDataByHash.call(hashes, tokenId);

                // assert
                assert.equal(data.resolver, resolver.address);
                assert.equal(data.owner, coinbase);
                assert.deepEqual(data.keys, keys);
                assert.deepEqual(data.values, values);
            });
        });

        describe('getDataByHashForMany', () => {
            it('should return empty lists for empty list of tokens', async () => {
                const data = await proxy.getDataByHashForMany.call([], [])

                assert.deepEqual(data.resolvers, []);
                assert.deepEqual(data.owners, []);
                assert.deepEqual(data.keys, []);
                assert.deepEqual(data.values, []);
            });

            it('should return empty data when resolver not found', async () => {
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
                const data = await proxy.getDataByHashForMany.call([], [unknownTokenId])

                assert.deepEqual(data.resolvers, [ZERO_ADDRESS]);
                assert.deepEqual(data.owners, [ZERO_ADDRESS]);
                assert.deepEqual(data.keys, [[]]);
                assert.deepEqual(data.values, [[]]);
            });

            it('should return data for multiple tokens', async () => {
                // arrange
                const _domainName = 'test_1082'
                await mintingController.mintSLD(accounts[0], _domainName);
                const _tokenId = await registry.childIdOf(await registry.root(), _domainName);
                const hashes = keys.map(utils.keccak256);
                for (let i = 0; i < keys.length; i++) {
                    await resolver.set(keys[i], values[i], tokenId);
                }

                // act
                const data = await proxy.getDataByHashForMany.call(hashes, [tokenId, _tokenId]);
                
                // assert
                assert.deepEqual(data.resolvers, [resolver.address, ZERO_ADDRESS]);
                assert.deepEqual(data.owners, [coinbase, accounts[0]]);
                assert.deepEqual(data.keys, [['test.key1', 'test.key2'], []]);
                assert.deepEqual(data.values, [['test.value1', 'test.value2'], []]);
            });

            it('should return owners for multiple tokens (including unknown)', async () => {
                // arrange
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');

                // act
                const data = await proxy.getDataByHashForMany.call([], [tokenId, unknownTokenId]);
                
                // assert
                assert.deepEqual(data.resolvers, [resolver.address, ZERO_ADDRESS]);
                assert.deepEqual(data.owners, [coinbase, ZERO_ADDRESS]);
                assert.deepEqual(data.keys, [[], []]);
                assert.deepEqual(data.values, [[], []]);
            });
        });

        describe('ownerOfForMany', () => {
            it('should return empty owner for unknown token', async () => {
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');
                const owners = await proxy.ownerOfForMany.call([unknownTokenId]);
                assert.deepEqual(owners, [ZERO_ADDRESS]);
            });

            it('should return empty list for empty list of tokens', async () => {
                const owners = await proxy.ownerOfForMany.call([]);
                assert.deepEqual(owners, []);
            });

            it('should return owners for multiple tokens', async () => {
                // arrange
                const _domainName = 'test_1211'
                await mintingController.mintSLD(accounts[0], _domainName);
                const _tokenId = await registry.childIdOf(await registry.root(), _domainName);

                // act
                const owners = await proxy.ownerOfForMany.call([tokenId, _tokenId]);
                
                // assert
                assert.deepEqual(owners, [coinbase, accounts[0]]);
            });

            it('should return owners for multiple tokens (including unknown)', async () => {
                // arrange
                const unknownTokenId = await registry.childIdOf(await registry.root(), 'unknown');

                // act
                const owners = await proxy.ownerOfForMany.call([tokenId, unknownTokenId]);
                
                // assert
                assert.deepEqual(owners, [coinbase, ZERO_ADDRESS]);
            });
        });
    });

    it('should revert when resolver is invalid', async () => {
        const _domainName = 'test_rosolver_invalid';

        const invalidResolver = await Simple.new();
        await mintingController.mintSLD(coinbase, _domainName);

        const _tokenId = await registry.childIdOf(await registry.root(), _domainName);
        await registry.resolveTo(invalidResolver.address, _tokenId);

        await expectRevert.unspecified(proxy.getData.call([], _tokenId));
    });
});
