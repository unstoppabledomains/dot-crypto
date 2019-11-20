const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const Simple = artifacts.require('util/Simple.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

contract('MintingController', ([coinbase, ...accounts]) => {
  let mintingController, registry

  beforeEach(async () => {
    registry = await Registry.deployed()
    mintingController = await MintingController.deployed()
  })

  it('minting SLDs', async () => {
    await mintingController.mintSLD(coinbase, 'label')

    const tok = await registry.childIdOf(await registry.root(), 'label')

    assert.equal(
      coinbase,
      await registry.ownerOf(tok),
      'should mint name correctly',
    )

    // should fail to mint existing token
    await assert.isRejected(mintingController.mintSLD.call(coinbase, 'label'))
    await assert.isRejected(
      mintingController.mintSLD.call(accounts[0], 'label'),
    )

    await registry.burn(tok)

    await mintingController.mintSLD(coinbase, 'label')

    assert.equal(
      coinbase,
      await registry.ownerOf(tok),
      'should mint already burnt token',
    )
  })

  it('safe minting SLDs', async () => {
    const tok = await registry.childIdOf(await registry.root(), 'label')

    await registry.burn(tok)

    await mintingController.safeMintSLD(coinbase, 'label')

    assert.equal(
      coinbase,
      await registry.ownerOf(tok),
      'should mint name correctly',
    )

    // should fail to safely mint existing token contract
    await assert.isRejected(mintingController.safeMintSLD(coinbase, 'label'))

    await registry.burn(tok)

    // should fail to safely mint token to non reciever contract
    await assert.isRejected(
      mintingController.safeMintSLD(mintingController.address, 'label'),
    )

    const simple = await Simple.deployed()

    await mintingController.safeMintSLD(simple.address, 'label')

    assert.equal(
      simple.address,
      await registry.ownerOf(tok),
      'should mint name correctly',
    )
  })
})
