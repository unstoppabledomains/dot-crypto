const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const Web3 = require('web3')

const Registry = artifacts.require('registry/Registry.sol')
const Resolver = artifacts.require('registry/Resolver.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const WhitelistedMinter = artifacts.require('util/WhitelistedMinter.sol')
const expectRevert = require('./helpers/expectRevert.js')
const {ZERO_ADDRESS} = require('./helpers/constants.js')
const {sign} = require('./helpers/signature.js')

chai.use(chaiAsPromised)
const assert = chai.assert
const {BN} = web3.utils

contract('WhitelistedMinter', function([coinbase, faucet, ...accounts]) {
  let whitelistedMinter, registry, mintingController, resolver, customResolver

  beforeEach(async () => {
    registry = await Registry.deployed()
    resolver = await Resolver.deployed()
    mintingController = await MintingController.deployed()
    whitelistedMinter = await WhitelistedMinter.new(mintingController.address, {
      from: coinbase,
    })
    await whitelistedMinter.addWhitelisted(coinbase)
    await mintingController.addMinter(whitelistedMinter.address)

    customResolver = await Resolver.new(
      registry.address,
      mintingController.address,
      {
        from: coinbase,
      },
    )
  })

  describe('renounce minter', () => {
    it('revert when renouncing by non-admin', async () => {
      await expectRevert(
        whitelistedMinter.renounceMinter({from: accounts[0]}),
        'WhitelistAdminRole: caller does not have the WhitelistAdmin role',
      )
    })

    it('revert minting when minter has been renounced', async () => {
      await whitelistedMinter.renounceMinter({from: coinbase})

      await expectRevert(
        whitelistedMinter.safeMintSLD(coinbase, 'label'),
        'MinterRole: caller does not have the Minter role',
      )
    })
  })

  describe('close whitelisted account', () => {
    it('revert when closing by non-whitelisted account', async () => {
      await expectRevert(
        whitelistedMinter.closeWhitelisted(accounts[0], {from: accounts[0]}),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('revert when zero account', async () => {
      await expectRevert(
        whitelistedMinter.closeWhitelisted(ZERO_ADDRESS, {from: coinbase}),
        'WhitelistedMinter: RECEIVER_IS_EMPTY',
      )
    })

    it('close whitelisted without forwarding funds', async () => {
      const initBalance = await web3.eth.getBalance(faucet)

      await whitelistedMinter.closeWhitelisted(faucet, {
        from: coinbase,
        value: 0,
      })

      await expectRevert(
        whitelistedMinter.safeMintSLD(coinbase, 'label'),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )

      const actualBalance = await web3.eth.getBalance(faucet)
      assert.equal(actualBalance, initBalance)
    })

    it('close whitelisted with forwarding funds', async () => {
      const value = 1
      const initBalance = await web3.eth.getBalance(faucet)

      await whitelistedMinter.closeWhitelisted(faucet, {
        from: coinbase,
        value,
      })

      await expectRevert(
        whitelistedMinter.safeMintSLD(coinbase, 'label'),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )

      const actualBalance = await web3.eth.getBalance(faucet)
      const expectedBalance = new BN(initBalance).add(new BN(value))
      assert.equal(actualBalance, expectedBalance)
    })
  })

  describe('rotate whitelisted account', () => {
    it('revert when rotateing by non-whitelisted account', async () => {
      await expectRevert(
        whitelistedMinter.rotateWhitelisted(accounts[0], {from: accounts[0]}),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('revert when zero account', async () => {
      await expectRevert(
        whitelistedMinter.rotateWhitelisted(ZERO_ADDRESS, {from: coinbase}),
        'WhitelistedMinter: RECEIVER_IS_EMPTY',
      )
    })

    it('rotate whitelisted without defining value', async () => {
      const [receiver] = accounts
      const initBalance = await web3.eth.getBalance(receiver)

      await whitelistedMinter.rotateWhitelisted(receiver, {from: coinbase})

      await expectRevert(
        whitelistedMinter.safeMintSLD(coinbase, 'label'),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )

      const actualBalance = await web3.eth.getBalance(receiver)
      assert.equal(actualBalance, initBalance)
    })

    it('rotate whitelisted without forwarding funds', async () => {
      const [receiver] = accounts
      const initBalance = await web3.eth.getBalance(receiver)

      await whitelistedMinter.rotateWhitelisted(receiver, {
        from: coinbase,
        value: 0,
      })

      await expectRevert(
        whitelistedMinter.safeMintSLD(coinbase, 'label'),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )

      const actualBalance = await web3.eth.getBalance(receiver)
      assert.equal(actualBalance, initBalance)
    })

    it('rotate whitelisted with forwarding funds', async () => {
      const value = 3
      const [receiver] = accounts
      const initBalance = await web3.eth.getBalance(receiver)

      await whitelistedMinter.rotateWhitelisted(receiver, {
        from: coinbase,
        value,
      })

      await expectRevert(
        whitelistedMinter.safeMintSLD(coinbase, 'label'),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )

      const actualBalance = await web3.eth.getBalance(receiver)
      const expectedBalance = new BN(initBalance).add(new BN(value))
      assert.equal(actualBalance, expectedBalance.toString())
    })
  })

  describe('mint second level domain', () => {
    it('revert minting when account is not whitelisted', async () => {
      await expectRevert(
        whitelistedMinter.mintSLD(coinbase, 'test-1ka', {
          from: accounts[0],
        }),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('mint domain', async () => {
      await whitelistedMinter.mintSLD(coinbase, 'test-1dp')
      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-1dp',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })

    it('revert minting domain with default resolver when account is not whitelisted', async () => {
      await expectRevert(
        whitelistedMinter.mintSLDToDefaultResolver(
          coinbase,
          'test-1ka',
          [],
          [],
          {
            from: accounts[0],
          },
        ),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('mint domain with default resolver', async () => {
      await whitelistedMinter.setDefaultResolver(resolver.address)

      await whitelistedMinter.mintSLDToDefaultResolver(
        coinbase,
        'test-1ka',
        ['test-1ka-key1'],
        ['test-1ka-value1'],
        {
          from: coinbase,
        },
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-1ka',
      )
      assert.equal(
        await resolver.get('test-1ka-key1', tokenId),
        'test-1ka-value1',
      )
    })

    it('mint domain with default resolver without records', async () => {
      await whitelistedMinter.setDefaultResolver(resolver.address)

      await whitelistedMinter.mintSLDToDefaultResolver(
        coinbase,
        'test-1la',
        [],
        [],
        {
          from: coinbase,
        },
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-1la',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })

    it('revert minting domain with resolver when account is not whitelisted', async () => {
      await expectRevert(
        whitelistedMinter.mintSLDToResolver(
          coinbase,
          'test-1q2',
          [],
          [],
          ZERO_ADDRESS,
          {
            from: accounts[0],
          },
        ),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('mint domain with custom resolver', async () => {
      await whitelistedMinter.mintSLDToResolver(
        coinbase,
        'test-1q2',
        ['test-1q2-key1'],
        ['test-1q2-value1'],
        customResolver.address,
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-1q2',
      )
      assert.equal(
        await customResolver.get('test-1q2-key1', tokenId),
        'test-1q2-value1',
      )
    })

    it('mint domain with custom resolver without records', async () => {
      await whitelistedMinter.setDefaultResolver(resolver.address)

      await whitelistedMinter.mintSLDToResolver(
        coinbase,
        'test-1lp',
        [],
        [],
        customResolver.address,
        {
          from: coinbase,
        },
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-1lp',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })
  })

  describe('meta-mint second level domain', () => {
    const calcSignature = async (
      contract,
      address,
      functionSig,
      from,
      ...args
    ) => {
      const web3 = new Web3(contract.constructor.web3.currentProvider)
      const abi = contract.constructor._json.abi.find(
        v => v.signature === web3.eth.abi.encodeFunctionSignature(functionSig),
      )

      return await sign(
        from,
        {
          type: 'bytes32',
          value: Web3.utils.keccak256(
            web3.eth.abi.encodeFunctionCall(abi, args),
          ),
        },
        {
          type: 'address',
          value: address,
        },
      )
    }

    it('revert meta-mint when signature is empty', async () => {
      const funcSig = 'mintSLDFor(address,string,bytes)'

      await expectRevert(
        whitelistedMinter.methods[funcSig](accounts[0], 'test-m1af', '0x', {
          from: accounts[1],
        }),
        'WhitelistedMinter: SIGNATURE_IS_INVALID',
      )
    })

    it('revert meta-mint when signer is not whitelisted', async () => {
      var signature = await calcSignature(
        whitelistedMinter,
        whitelistedMinter.address,
        'mintSLD(address,string)',
        accounts[0],
        accounts[0],
        'test-m1pp',
      )
      const funcSig = 'mintSLDFor(address,string,bytes)'

      await expectRevert(
        whitelistedMinter.methods[funcSig](
          accounts[0],
          'test-m1pp',
          signature,
          {
            from: accounts[1],
          },
        ),
        'WhitelistedMinter: SIGNER_IS_NOT_WHITELISTED',
      )
    })

    it('revert meta-mint when signature does not match', async () => {
      var signature = await calcSignature(
        whitelistedMinter,
        whitelistedMinter.address,
        'mintSLD(address,string)',
        coinbase,
        accounts[0],
        'wrong-label',
      )
      const funcSig = 'mintSLDFor(address,string,bytes)'

      await expectRevert(
        whitelistedMinter.methods[funcSig](
          accounts[0],
          'test-m1pp',
          signature,
          {
            from: accounts[1],
          },
        ),
        'WhitelistedMinter: SIGNER_IS_NOT_WHITELISTED',
      )
    })

    it('revert meta-mint when signature generated for different contract', async () => {
      var signature = await calcSignature(
        whitelistedMinter,
        faucet,
        'mintSLD(address,string)',
        coinbase,
        accounts[0],
        'wrong-label',
      )
      const funcSig = 'mintSLDFor(address,string,bytes)'

      await expectRevert(
        whitelistedMinter.methods[funcSig](
          accounts[0],
          'test-m1pp',
          signature,
          {
            from: accounts[1],
          },
        ),
        'WhitelistedMinter: SIGNER_IS_NOT_WHITELISTED',
      )
    })

    it('meta-mint domain', async () => {
      var signature = await calcSignature(
        whitelistedMinter,
        whitelistedMinter.address,
        'mintSLD(address,string)',
        coinbase,
        accounts[0],
        'test-m1qp',
      )
      const funcSig = 'mintSLDFor(address,string,bytes)'

      await whitelistedMinter.methods[funcSig](
        accounts[0],
        'test-m1qp',
        signature,
        {
          from: accounts[1],
        },
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-m1qp',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
    })

    it('proxy meta-mint', async () => {
      await whitelistedMinter.addWhitelisted(whitelistedMinter.address)

      const web3 = new Web3(whitelistedMinter.constructor.web3.currentProvider)
      let encodedFunctionSig = web3.eth.abi.encodeFunctionSignature(
        'mintSLD(address,string)',
      )
      const abi = whitelistedMinter.constructor._json.abi.find(
        v => v.signature === encodedFunctionSig,
      )
      const data = web3.eth.abi.encodeFunctionCall(abi, [
        accounts[0],
        'test-p1aaa',
      ])
      await whitelistedMinter.proxy(data, '0x', {
        from: accounts[0],
      })
    })
  })

  describe('safe mint second level domain', () => {
    it('revert safe minting when account is not whitelisted', async () => {
      const funcSig = 'safeMintSLD(address,string)'
      await expectRevert(
        whitelistedMinter.methods[funcSig](coinbase, 'test-2oa', {
          from: accounts[0],
        }),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('safe mint domain', async () => {
      await whitelistedMinter.safeMintSLD(coinbase, 'test-2oa')
      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-2oa',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })

    it('revert safe minting domain with default resolver when account is not whitelisted', async () => {
      const funcSig =
        'safeMintSLDToDefaultResolver(address,string,string[],string[])'
      await expectRevert(
        whitelistedMinter.methods[funcSig](coinbase, 'test-2ka', [], [], {
          from: accounts[0],
        }),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('safe mint domain with default resolver', async () => {
      const funcSig =
        'safeMintSLDToDefaultResolver(address,string,string[],string[])'
      await whitelistedMinter.setDefaultResolver(resolver.address)

      await whitelistedMinter.methods[funcSig](
        coinbase,
        'test-2ue',
        ['test-2ue-key1'],
        ['test-2ue-value1'],
        {
          from: coinbase,
        },
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-2ue',
      )
      assert.equal(
        await resolver.get('test-2ue-key1', tokenId),
        'test-2ue-value1',
      )
    })

    it('safe mint domain with default resolver without records', async () => {
      const funcSig =
        'safeMintSLDToDefaultResolver(address,string,string[],string[])'
      await whitelistedMinter.setDefaultResolver(resolver.address)

      await whitelistedMinter.methods[funcSig](coinbase, 'test-2ll', [], [], {
        from: coinbase,
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-2ll',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })

    it('revert safe minting domain with resolver when account is not whitelisted', async () => {
      const funcSig =
        'safeMintSLDToResolver(address,string,string[],string[],address)'
      await expectRevert(
        whitelistedMinter.methods[funcSig](
          coinbase,
          'test-2qd',
          [],
          [],
          ZERO_ADDRESS,
          {
            from: accounts[0],
          },
        ),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('safe mint domain with custom resolver', async () => {
      await whitelistedMinter.safeMintSLDToResolver(
        coinbase,
        'test-2qd',
        ['test-2qd-key1'],
        ['test-2qd-value1'],
        customResolver.address,
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-2qd',
      )
      assert.equal(
        await customResolver.get('test-2qd-key1', tokenId),
        'test-2qd-value1',
      )
    })

    it('safe mint domain with custom resolver without records', async () => {
      await whitelistedMinter.safeMintSLDToResolver(
        coinbase,
        'test-2kd',
        [],
        [],
        customResolver.address,
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-2kd',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })
  })

  describe('safe mint(data) second level domain', () => {
    it('revert safe minting when account is not whitelisted', async () => {
      const funcSig = 'safeMintSLD(address,string,bytes)'
      await expectRevert(
        whitelistedMinter.methods[funcSig](coinbase, 'test-3oa', '0x', {
          from: accounts[0],
        }),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('safe mint domain', async () => {
      const funcSig = 'safeMintSLD(address,string,bytes)'
      await whitelistedMinter.methods[funcSig](coinbase, 'test-3oa', '0x')

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-3oa',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })

    it('revert safe minting domain with default resolver when account is not whitelisted', async () => {
      const funcSig =
        'safeMintSLDToDefaultResolver(address,string,string[],string[],bytes)'
      await expectRevert(
        whitelistedMinter.methods[funcSig](coinbase, 'test-3ka', [], [], '0x', {
          from: accounts[0],
        }),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('safe mint domain with default resolver', async () => {
      const funcSig =
        'safeMintSLDToDefaultResolver(address,string,string[],string[],bytes)'
      await whitelistedMinter.setDefaultResolver(resolver.address)

      await whitelistedMinter.methods[funcSig](
        coinbase,
        'test-2ka',
        ['test-2ka-key1'],
        ['test-2ka-value1'],
        '0x',
        {
          from: coinbase,
        },
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-2ka',
      )
      assert.equal(
        await resolver.get('test-2ka-key1', tokenId),
        'test-2ka-value1',
      )
    })

    it('safe mint domain with default resolver without records', async () => {
      const funcSig =
        'safeMintSLDToDefaultResolver(address,string,string[],string[],bytes)'
      await whitelistedMinter.setDefaultResolver(resolver.address)

      await whitelistedMinter.methods[funcSig](
        coinbase,
        'test-2rr',
        [],
        [],
        '0x',
        {
          from: coinbase,
        },
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-2rr',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })

    it('revert when minting by non-whitelisted account', async () => {
      const funcSig =
        'safeMintSLDToResolver(address,string,string[],string[],bytes,address)'
      await expectRevert(
        whitelistedMinter.methods[funcSig](
          coinbase,
          'test-3ca',
          [],
          [],
          '0x',
          ZERO_ADDRESS,
          {
            from: accounts[0],
          },
        ),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('safe mint domain with custom resolver', async () => {
      await whitelistedMinter.safeMintSLDToResolver(
        coinbase,
        'test-3re',
        ['test-3re-key1'],
        ['test-3re-value1'],
        '0x',
        customResolver.address,
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-3re',
      )
      assert.equal(
        await customResolver.get('test-3re-key1', tokenId),
        'test-3re-value1',
      )
    })

    it('safe mint domain with custom resolver without records', async () => {
      await whitelistedMinter.safeMintSLDToResolver(
        coinbase,
        'test-3ht',
        [],
        [],
        '0x',
        customResolver.address,
      )

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-3ht',
      )
      assert.equal(await registry.ownerOf(tokenId), coinbase)
    })
  })
})
