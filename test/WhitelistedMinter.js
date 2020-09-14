const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const Registry = artifacts.require('registry/Registry.sol')
const Resolver = artifacts.require('registry/Resolver.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const WhitelistedMinter = artifacts.require('util/WhitelistedMinter.sol')
const expectRevert = require('./helpers/expectRevert.js')
const {ZERO_ADDRESS} = require('./helpers/constants.js')

chai.use(chaiAsPromised)
const assert = chai.assert
const {BN} = web3.utils

contract('WhitelistedMinter', function([coinbase, faucet, ...accounts]) {
  let whitelistedMinter, registry, mintingController

  beforeEach(async () => {
    registry = await Registry.deployed()
    mintingController = await MintingController.deployed()
    whitelistedMinter = await WhitelistedMinter.new(mintingController.address, {
      from: coinbase,
    })
    await whitelistedMinter.addWhitelisted(coinbase)
    await mintingController.addMinter(whitelistedMinter.address)
  })

  it('should safely mint SLDs', async () => {
    await whitelistedMinter.safeMintSLD(coinbase, 'label')

    const tok = await registry.childIdOf(await registry.root(), 'label')

    assert.equal(
      coinbase,
      await registry.ownerOf(tok),
      'should mint name correctly',
    )
  })

  describe('renounceMinter', () => {
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

  describe('closeWhitelisted', () => {
    it('revert when closing by non-whitelisted account', async () => {
      await expectRevert(
        whitelistedMinter.closeWhitelisted(accounts[0], {from: accounts[0]}),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('revert when zero account', async () => {
      await expectRevert(
        whitelistedMinter.closeWhitelisted(ZERO_ADDRESS, {from: coinbase}),
        'WhitelistedMinter: receiver must be non-zero.',
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

  describe('rotateWhitelisted', () => {
    it('revert when rotateing by non-whitelisted account', async () => {
      await expectRevert(
        whitelistedMinter.rotateWhitelisted(accounts[0], {from: accounts[0]}),
        'WhitelistedRole: caller does not have the Whitelisted role ',
      )
    })

    it('revert when zero account', async () => {
      await expectRevert(
        whitelistedMinter.rotateWhitelisted(ZERO_ADDRESS, {from: coinbase}),
        'WhitelistedMinter: receiver must be non-zero.',
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

  describe('mintSLD with custom resolver', () => {
    it('revert when zero resolver', async () => {
      await expectRevert.unspecified(
        whitelistedMinter.mintSLD(coinbase, 'test-1q2', [], [], ZERO_ADDRESS),
      )
    })

    it('revert when minting by non-whitelisted account', async () => {
      await expectRevert(
        whitelistedMinter.mintSLD(coinbase, 'test-1q2', [], [], ZERO_ADDRESS, {
          from: accounts[0],
        }),
        'WhitelistedRole: caller does not have the Whitelisted role',
      )
    })

    it('mintSLD with custom resolver', async () => {
      const customResolver = await Resolver.new(
        registry.address,
        mintingController.address,
        {
          from: coinbase,
        },
      )
      await whitelistedMinter.mintSLD(
        coinbase,
        'test-1q2',
        ['test-1q2-key1'],
        ['test-1q2-value1'],
        customResolver.address,
      )

      const tok = await registry.childIdOf(await registry.root(), 'test-1q2')
      assert.equal(
        await customResolver.get('test-1q2-key1', tok),
        'test-1q2-value1',
      )
    })
  })

  describe('safeMintSLD with custom resolver', () => {
    it('revert when zero resolver', async () => {
      await expectRevert.unspecified(
        whitelistedMinter.safeMintSLDToResolver(
          coinbase,
          'test-2qd',
          [],
          [],
          ZERO_ADDRESS,
        ),
      )
    })

    it('revert when minting by non-whitelisted account', async () => {
      await expectRevert(
        whitelistedMinter.safeMintSLDToResolver(
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

    it('safeMintSLD with custom resolver', async () => {
      const customResolver = await Resolver.new(
        registry.address,
        mintingController.address,
        {
          from: coinbase,
        },
      )
      await whitelistedMinter.safeMintSLDToResolver(
        coinbase,
        'test-2qd',
        ['test-2qd-key1'],
        ['test-2qd-value1'],
        customResolver.address,
      )

      const tok = await registry.childIdOf(await registry.root(), 'test-2qd')
      assert.equal(
        await customResolver.get('test-2qd-key1', tok),
        'test-2qd-value1',
      )
    })
  })

  describe('safeMintSLD-data with custom resolver', () => {
    it('revert when zero resolver', async () => {
      await expectRevert.unspecified(
        whitelistedMinter.safeMintSLDToResolver(
          coinbase,
          'test-3ca',
          [],
          [],
          '0x',
          ZERO_ADDRESS,
        ),
      )
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

    it('safeMintSLD with custom resolver', async () => {
      const customResolver = await Resolver.new(
        registry.address,
        mintingController.address,
        {
          from: coinbase,
        },
      )
      await whitelistedMinter.safeMintSLDToResolver(
        coinbase,
        'test-3ca',
        ['test-3ca-key1'],
        ['test-3ca-value1'],
        '0x',
        customResolver.address,
      )

      const tok = await registry.childIdOf(await registry.root(), 'test-3ca')
      assert.equal(
        await customResolver.get('test-3ca-key1', tok),
        'test-3ca-value1',
      )
    })
  })
})
