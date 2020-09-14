const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const WhitelistedMinter = artifacts.require('util/WhitelistedMinter.sol')
const expectRevert = require('./helpers/expectRevert.js')
const {ZERO_ADDRESS} = require('./helpers/constants.js')

chai.use(chaiAsPromised)
const assert = chai.assert
const {BN} = web3.utils

contract.only('WhitelistedMinter', function([coinbase, faucet, ...accounts]) {
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
})
