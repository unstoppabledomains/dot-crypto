const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const Web3 = require('web3')

const Registry = artifacts.require('CNSRegistry.sol')
const Resolver = artifacts.require('Resolver.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const WhitelistedMinter = artifacts.require('util/WhitelistedMinter.sol')
const expectRevert = require('./helpers/expectRevert.js')
const expectEvent = require('./helpers/expectEvent.js')
const {ZERO_ADDRESS} = require('./helpers/constants.js')
const {sign} = require('./helpers/signature.js')

chai.use(chaiAsPromised)
const assert = chai.assert
const {BN} = web3.utils

contract('WhitelistedMinter', function([coinbase, faucet, ...accounts]) {
  let whitelistedMinter, registry, mintingController, resolver, customResolver

  const getCallData = (contract, funcSig, ...args) => {
    const web3 = new Web3(contract.constructor.web3.currentProvider)
    let encodedFunctionSig = web3.eth.abi.encodeFunctionSignature(funcSig)
    const abi = contract.constructor._json.abi.find(
      v => v.signature === encodedFunctionSig,
    )
    return web3.eth.abi.encodeFunctionCall(abi, args)
  }

  const calcSignature = async (data, address, from) => {
    address = address || whitelistedMinter.address
    from = from || coinbase

    return await sign(
      from,
      {
        type: 'bytes32',
        value: Web3.utils.keccak256(data),
      },
      {
        type: 'address',
        value: address,
      },
    )
  }

  beforeEach(async () => {
    registry = await Registry.deployed()
    resolver = await Resolver.deployed()
    mintingController = await MintingController.deployed()
    whitelistedMinter = await WhitelistedMinter.new(mintingController.address, {
      from: coinbase,
    })
    await whitelistedMinter.addWhitelisted(coinbase)
    await mintingController.addMinter(whitelistedMinter.address)
    await whitelistedMinter.setDefaultResolver(resolver.address)

    customResolver = await Resolver.new(
      registry.address,
      mintingController.address,
      {
        from: coinbase,
      },
    )
  })

  describe('default resolver', () => {
    it('should return default resolver', async () => {
      const result = await whitelistedMinter.getDefaultResolver()
      assert.equal(result, resolver.address)
    })

    it('should update default resolver', async () => {
      await whitelistedMinter.setDefaultResolver(customResolver.address)

      const result = await whitelistedMinter.getDefaultResolver()
      assert.equal(result, customResolver.address)
    })

    it('should revert when setting by by non-admin', async () => {
      await expectRevert(
        whitelistedMinter.setDefaultResolver(customResolver.address, {
          from: accounts[0],
        }),
        'WhitelistAdminRole: caller does not have the WhitelistAdmin role',
      )
    })
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

  describe('relay', () => {
    it('revert relay meta-mint when signer is not whitelisted', async () => {
      const data = getCallData(
        whitelistedMinter,
        'mintSLD(address,string)',
        accounts[0],
        'test-p1-revert',
      )
      const signature = await calcSignature(data, faucet)

      await expectRevert(
        whitelistedMinter.relay(data, signature, {
          from: accounts[0],
        }),
        'WhitelistedMinter: SIGNER_IS_NOT_WHITELISTED',
      )
    })

    it('revert relay meta-mint when signature is empty', async () => {
      const data = getCallData(
        whitelistedMinter,
        'mintSLD(address,string)',
        accounts[0],
        'test-p1-revert',
      )

      await expectRevert(
        whitelistedMinter.relay(data, '0x', {
          from: accounts[0],
        }),
        'WhitelistedMinter: SIGNATURE_IS_INVALID',
      )
    })

    it('revert relay meta-mint when unsupported call', async () => {
      const data = getCallData(
        whitelistedMinter,
        'setDefaultResolver(address)',
        accounts[0],
      )
      const signature = await calcSignature(data)

      await expectRevert(
        whitelistedMinter.relay(data, signature, {
          from: accounts[1],
        }),
        'WhitelistedMinter: UNSUPPORTED_CALL',
      )
    })

    it('relay meta-mint to default resolver', async () => {
      const data = getCallData(
        whitelistedMinter,
        'mintSLDToDefaultResolver(address,string,string[],string[])',
        accounts[0],
        'test-p1-p1adr',
        [],
        [],
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1adr',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0x3d7989fe00000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })

    it('relay meta-mint to custom resolver', async () => {
      const data = getCallData(
        whitelistedMinter,
        'mintSLDToResolver(address,string,string[],string[],address)',
        accounts[0],
        'test-p1-p1arr',
        [],
        [],
        customResolver.address,
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1arr',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])

      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0xaceb476400000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })

    it('relay meta-safe mint', async () => {
      const data = getCallData(
        whitelistedMinter,
        'safeMintSLD(address,string)',
        accounts[0],
        'test-p1-p1sapr',
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1sapr',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0xb2da297900000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })

    it('relay meta-safe mint with data', async () => {
      const data = getCallData(
        whitelistedMinter,
        'safeMintSLD(address,string,bytes)',
        accounts[0],
        'test-p1-p1saor',
        '0x',
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1saor',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0xbe362e2e00000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })

    it('relay meta-safe mint to default resolver', async () => {
      const data = getCallData(
        whitelistedMinter,
        'safeMintSLDToDefaultResolver(address,string,string[],string[])',
        accounts[0],
        'test-p1-p1slla',
        [],
        [],
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1slla',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0x61050ffd00000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })

    it('relay meta-safe mint to default resolver with data', async () => {
      const data = getCallData(
        whitelistedMinter,
        'safeMintSLDToDefaultResolver(address,string,string[],string[],bytes)',
        accounts[0],
        'test-p1-p1slql',
        [],
        [],
        '0x',
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1slql',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0x4b18abea00000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })

    it('relay meta-safe mint to custom resolver', async () => {
      const data = getCallData(
        whitelistedMinter,
        'safeMintSLDToResolver(address,string,string[],string[],address)',
        accounts[0],
        'test-p1-p1slee',
        [],
        [],
        customResolver.address,
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1slee',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0x4b44c01a00000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })

    it('relay meta-safe mint to custom resolver with data', async () => {
      const data = getCallData(
        whitelistedMinter,
        'safeMintSLDToResolver(address,string,string[],string[],bytes,address)',
        accounts[0],
        'test-p1-p1sppq',
        [],
        [],
        '0x',
        customResolver.address,
      )
      const signature = await calcSignature(data)
      const receipt = await whitelistedMinter.relay(data, signature, {
        from: accounts[1],
      })

      const tokenId = await registry.childIdOf(
        await registry.root(),
        'test-p1-p1sppq',
      )
      assert.equal(await registry.ownerOf(tokenId), accounts[0])
      expectEvent(receipt, 'Relayed', {
        sender: accounts[1],
        signer: coinbase,
        funcSig:
          '0x898851f800000000000000000000000000000000000000000000000000000000',
        dataHash: Web3.utils.keccak256(data),
      })
    })
  })

  describe('Gas consumption', () => {
    const keys1 = ['test-key1']
    const keys2 = [...keys1, 'test-key2']
    const keys5 = [...keys2, 'test-key3', 'test-key4', 'test-key5']
    const keys10 = [
      ...keys5,
      'test-key6',
      'test-key7',
      'test-key8',
      'test-key9',
      'test-key10',
    ]
    const values1 = ['test-value1']
    const values2 = [...values1, 'test-value2']
    const values5 = [...values2, 'test-value3', 'test-value4', 'test-value5']
    const values10 = [
      ...values5,
      'test-value6',
      'test-value7',
      'test-value8',
      'test-value9',
      'test-value10',
    ]

    function percDiff(a, b) {
      return -((a - b) / a) * 100
    }

    const getCases = () => {
      const {address: addr} = customResolver
      return [
        {
          func: 'mintSLD',
          funcSig: 'mintSLD(address,string)',
          params: [accounts[0], 't1-w1-'],
        },
        {
          func: 'mintSLDToDefaultResolver',
          funcSig: 'mintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-l0-', [], []],
        },
        {
          func: 'mintSLDToDefaultResolver',
          funcSig: 'mintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-l1-', keys1, values1],
        },
        {
          func: 'mintSLDToDefaultResolver',
          funcSig: 'mintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-l2-', keys2, values2],
        },
        {
          func: 'mintSLDToDefaultResolver',
          funcSig: 'mintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-l5-', keys5, values5],
        },
        {
          func: 'mintSLDToDefaultResolver',
          funcSig: 'mintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-l10-', keys10, values10],
        },
        {
          func: 'mintSLDToResolver',
          funcSig:
            'mintSLDToResolver(address,string,string[],string[],address)',
          params: [accounts[0], 't1-g0-', [], [], addr],
        },
        {
          func: 'mintSLDToResolver',
          funcSig:
            'mintSLDToResolver(address,string,string[],string[],address)',
          params: [accounts[0], 't1-g1-', keys1, values1, addr],
        },
        {
          func: 'mintSLDToResolver',
          funcSig:
            'mintSLDToResolver(address,string,string[],string[],address)',
          params: [accounts[0], 't1-g2-', keys2, values2, addr],
        },
        {
          func: 'mintSLDToResolver',
          funcSig:
            'mintSLDToResolver(address,string,string[],string[],address)',
          params: [accounts[0], 't1-g5-', keys5, values5, addr],
        },
        {
          func: 'mintSLDToResolver',
          funcSig:
            'mintSLDToResolver(address,string,string[],string[],address)',
          params: [accounts[0], 't1-g10-', keys10, values10, addr],
        },
        {
          func: 'safeMintSLD',
          funcSig: 'safeMintSLD(address,string)',
          params: [accounts[0], 't1-m1-'],
        },
        {
          func: 'safeMintSLD',
          funcSig: 'safeMintSLD(address,string,bytes)',
          params: [accounts[0], 't1-y1-', '0x'],
        },
        {
          func: 'safeMintSLDToDefaultResolver',
          funcSig:
            'safeMintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-c0-', [], []],
        },
        {
          func: 'safeMintSLDToDefaultResolver',
          funcSig:
            'safeMintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-c1-', keys1, values1],
        },
        {
          func: 'safeMintSLDToDefaultResolver',
          funcSig:
            'safeMintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-c2-', keys2, values2],
        },
        {
          func: 'safeMintSLDToDefaultResolver',
          funcSig:
            'safeMintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-c5-', keys5, values5],
        },
        {
          func: 'safeMintSLDToDefaultResolver',
          funcSig:
            'safeMintSLDToDefaultResolver(address,string,string[],string[])',
          params: [accounts[0], 't1-c10-', keys10, values10],
        },
        {
          func: 'safeMintSLDToResolver',
          funcSig:
            'safeMintSLDToResolver(address,string,string[],string[],bytes,address)',
          params: [accounts[0], 't1-qq-', [], [], '0x', addr],
        },
        {
          func: 'safeMintSLDToResolver',
          funcSig:
            'safeMintSLDToResolver(address,string,string[],string[],bytes,address)',
          params: [accounts[0], 't1-qw-', keys1, values1, '0x1234', addr],
        },
        {
          func: 'safeMintSLDToResolver',
          funcSig:
            'safeMintSLDToResolver(address,string,string[],string[],bytes,address)',
          params: [accounts[0], 't1-qe-', keys2, values2, '0x1234', addr],
        },
        {
          func: 'safeMintSLDToResolver',
          funcSig:
            'safeMintSLDToResolver(address,string,string[],string[],bytes,address)',
          params: [accounts[0], 't1-q5-', keys5, values5, '0x1234', addr],
        },
        {
          func: 'safeMintSLDToResolver',
          funcSig:
            'safeMintSLDToResolver(address,string,string[],string[],bytes,address)',
          params: [accounts[0], 't1-q10-', keys10, values10, '0x1234', addr],
        },
      ]
    }

    it('Consumption', async () => {
      const result = []

      const cases = getCases()
      for (let i = 0; i < cases.length; i++) {
        const {func, funcSig, params} = cases[i]
        const [acc, token, ...rest] = params
        const relayParams = [acc, token + 'r', ...rest]

        const callData = getCallData(whitelistedMinter, funcSig, ...relayParams)
        const signature = await calcSignature(callData)
        const {receipt: relayReceipt} = await whitelistedMinter.relay(
          callData,
          signature,
          {
            from: accounts[1],
          },
        )

        const tx = await whitelistedMinter[func](...params)
        result.push({
          funcSig,
          records: Array.isArray(params[2]) ? params[2].length : '-',
          send: tx.receipt.gasUsed,
          relay: relayReceipt.gasUsed,
          increase:
            percDiff(tx.receipt.gasUsed, relayReceipt.gasUsed).toFixed(2) +
            ' %',
        })
      }
      console.table(result)
    })
  })
})
