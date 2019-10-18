const Registry = artifacts.require('registry/Registry.sol')
const SignatureController = artifacts.require(
  'controller/SignatureController.sol',
)
const SunriseController = artifacts.require('controller/SunriseController.sol')
const Web3 = require('web3')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

async function submitSigTransaction(web3, method, ...args) {
  const abiVal = signatureController.constructor._json.abi.find(
    v => v.name === method,
  )

  const nonce = await signatureController.nonceOf(web3.defaultAccount)

  const signature = await web3.eth.sign(
    Web3.utils.keccak256(
      Web3.utils.keccak256(
        web3.eth.abi
          .encodeFunctionCall(abiVal, args.concat('0x'))
          // abi.encodeWithSelector appends an extra null word bc of the existence of a string
          // web3.eth.abi.encodeFunctionCall doesn't do this for us
          .concat('0'.repeat(64)),
      ) + nonce.toString(16).padStart(64, '0'),
    ),
    web3.defaultAccount,
  )

  // console.log(method, ...args, signature)

  return signatureController[method](...args, signature)
}

contract('SignatureController', ([coinbase, ...accounts]) => {
  let sunriseController, registry, web3

  beforeEach(async () => {
    registry = await Registry.deployed()
    sunriseController = await SunriseController.deployed()
    signatureController = await SignatureController.deployed()
    web3 = new Web3(registry.constructor.web3.currentProvider)
    web3.defaultAccount = coinbase
  })

  it('should transfer using transferFromFor', async () => {
    await sunriseController.mintSLD(coinbase, 'transferFromFor-label')

    const tok = await registry.childOf(
      await registry.root(),
      'transferFromFor-label',
    )

    await submitSigTransaction(
      web3,
      'transferFromFor',
      coinbase,
      '0x1234567890123456789012345678901234567890',
      tok.toString(),
    )

    assert.equal(
      await registry.ownerOf(tok),
      '0x1234567890123456789012345678901234567890',
      'should transfer ownership',
    )

    // should fail to transfer unowned name
    await assert.isRejected(
      submitSigTransaction(
        web3,
        'transferFromFor',
        coinbase,
        '0x1234567890123456789012345678901234567890',
        tok.toString(),
      ),
    )
  })

  it('should transfer using safeTransferFromFor', async () => {
    await sunriseController.mintSLD(coinbase, 'safeTransferFromFor-label')

    const tok = await registry.childOf(
      await registry.root(),
      'safeTransferFromFor-label',
    )

    await submitSigTransaction(
      web3,
      'safeTransferFromFor',
      coinbase,
      '0x1234567890123456789012345678901234567890',
      tok.toString(),
      '0x12345678',
    )

    assert.equal(
      await registry.ownerOf(tok),
      '0x1234567890123456789012345678901234567890',
      'should transfer ownership',
    )

    // should fail to transfer unowned name
    await assert.isRejected(
      submitSigTransaction(
        web3,
        'safeTransferFromFor',
        coinbase,
        '0x1234567890123456789012345678901234567890',
        tok.toString(),
        '0x12345678',
      ),
    )
  })

  it('should resolve using resolveToFor', async () => {
    await sunriseController.mintSLD(coinbase, 'resolveTo-label')

    const tok = await registry.childOf(await registry.root(), 'resolveTo-label')

    await submitSigTransaction(
      web3,
      'resolveToFor',
      '0x1234567890123456789012345678901234567890',
      tok.toString(),
    )

    assert.equal(
      await registry.resolverOf(tok),
      '0x1234567890123456789012345678901234567890',
      'should resolve to new address',
    )

    await registry.transferFrom(
      coinbase,
      '0x5678901234567890123456789012345678901234',
      tok,
    )

    // should fail to transfer unowned name
    await assert.isRejected(
      submitSigTransaction(
        web3,
        'resolveToFor',
        '0x1234567890123456789012345678901234567890',
        tok.toString(),
      ),
    )
  })

  it('should burn using burnFor', async () => {
    await sunriseController.mintSLD(coinbase, 'burnFor-label')

    const tok = await registry.childOf(await registry.root(), 'burnFor-label')

    await submitSigTransaction(web3, 'burnFor', tok.toString())

    assert.equal(
      await registry.ownerOf(tok),
      '0x0000000000000000000000000000000000000000',
      'should burn token',
    )

    // should fail to burn non existent token
    await assert.isRejected(
      submitSigTransaction(web3, 'burnFor', tok.toString()),
    )
  })

  it('should mint using mintChildFor', async () => {
    await sunriseController.mintSLD(coinbase, 'mintChildFor-label')

    const tok = await registry.childOf(
      await registry.root(),
      'mintChildFor-label',
    )

    await submitSigTransaction(
      web3,
      'mintChildFor',
      coinbase,
      tok.toString(),
      'label',
    )

    assert.equal(
      await registry.ownerOf(await registry.childOf(tok, 'label')),
      coinbase,
      'should mint token',
    )

    await registry.transferFrom(
      coinbase,
      '0x5678901234567890123456789012345678901234',
      tok,
    )

    // should fail to mint token without permission
    await assert.isRejected(
      submitSigTransaction(
        web3,
        'mintChildFor',
        coinbase,
        tok.toString(),
        'label',
      ),
    )
  })

  it('should mint using transferFromChildFor', async () => {
    await sunriseController.mintSLD(coinbase, 'transferFromChildFor-label')

    const tok = await registry.childOf(
      await registry.root(),
      'transferFromChildFor-label',
    )
    const threeld = await registry.childOf(tok, 'label')

    await registry.mintChild(coinbase, tok, 'label')

    await submitSigTransaction(
      web3,
      'transferFromChildFor',
      coinbase,
      '0x1234567890123456789012345678901234567890',
      tok.toString(),
      'label',
    )

    assert.equal(
      await registry.ownerOf(threeld),
      '0x1234567890123456789012345678901234567890',
      'should transfer token',
    )

    await registry.transferFrom(
      coinbase,
      '0x5678901234567890123456789012345678901234',
      tok,
    )

    // should fail to mint token without permission
    await assert.isRejected(
      submitSigTransaction(
        web3,
        'transferFromChildFor',
        coinbase,
        '0x1234567890123456789012345678901234567890',
        tok.toString(),
        'label',
      ),
    )
  })

  it('should mint using safeTransferFromChildFor', async () => {
    await sunriseController.mintSLD(coinbase, 'safeTransferFromChildFor-label')

    const tok = await registry.childOf(
      await registry.root(),
      'safeTransferFromChildFor-label',
    )
    const threeld = await registry.childOf(tok, 'label')

    await registry.mintChild(coinbase, tok, 'label')

    await submitSigTransaction(
      web3,
      'safeTransferFromChildFor',
      coinbase,
      '0x1234567890123456789012345678901234567890',
      tok.toString(),
      'label',
      '0x12345768',
    )

    assert.equal(
      await registry.ownerOf(threeld),
      '0x1234567890123456789012345678901234567890',
      'should transfer token',
    )

    await registry.transferFrom(
      coinbase,
      '0x5678901234567890123456789012345678901234',
      tok,
    )

    // should fail to mint token without permission
    await assert.isRejected(
      submitSigTransaction(
        web3,
        'safeTransferFromChildFor',
        coinbase,
        '0x1234567890123456789012345678901234567890',
        tok.toString(),
        'label',
        '0x12345768',
      ),
    )
  })

  it('should mint using burnChildFor', async () => {
    await sunriseController.mintSLD(coinbase, 'burnChildFor-label')

    const tok = await registry.childOf(
      await registry.root(),
      'burnChildFor-label',
    )
    const threeld = await registry.childOf(tok, 'label')

    await registry.mintChild(coinbase, tok, 'label')

    await submitSigTransaction(web3, 'burnChildFor', tok.toString(), 'label')

    assert.equal(
      await registry.ownerOf(threeld),
      '0x0000000000000000000000000000000000000000',
      'should burn token',
    )

    await registry.transferFrom(
      coinbase,
      '0x5678901234567890123456789012345678901234',
      tok,
    )

    // should fail to mint token without permission
    await assert.isRejected(
      submitSigTransaction(web3, 'burnChildFor', tok.toString(), 'label'),
    )
  })
})
