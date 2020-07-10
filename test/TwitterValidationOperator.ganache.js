const TwitterValidationOperator = artifacts.require('operators/TwitterValidationOperator.sol')
const LinkTokenMock = artifacts.require('mocks/LinkTokenMock.sol');
const Registry = artifacts.require('registry/Registry.sol')
const Resolver = artifacts.require('Resolver.sol')
const MintingController = artifacts.require('controller/MintingController.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const assert = chai.assert
const usedGas = require("./helpers/getUsedGas");
const getUsedGas = usedGas.getUsedGas;

contract('TwitterValidationOperator', function([coinbase, whitelisted, paymentCapper, fundsReceiver]) {
  const domainName = 'twitter-validation'
  let linkToken, registry, resolver, mintingController, domainTokenId, operator
    
  before(async () => {
    linkToken = await LinkTokenMock.new()
    await linkToken.mint(coinbase, 100500)
    registry = await Registry.deployed()
    resolver = await Resolver.deployed()
    mintingController = await MintingController.deployed()
    await mintingController.mintSLD(coinbase, domainName)
    domainTokenId = await registry.childIdOf(await registry.root(), domainName)
    await registry.resolveTo(resolver.address, domainTokenId)
  })

  beforeEach(async () => {
    operator = await TwitterValidationOperator.new(registry.address, linkToken.address, [paymentCapper])
    await registry.approve(operator.address, domainTokenId)
    await operator.addWhitelisted(whitelisted)
    await operator.setPaymentPerValidation(1, {from: paymentCapper})
    await linkToken.transfer(operator.address, 100)
  })

  it('should set twitter username and signature', async () => {
    let tx = await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    console.log(`      ⓘ TwitterValidationOperator.setValidation - first validation, first domain: ${ getUsedGas(tx) }`)
    let validationRecords = await resolver.getMany(['social.twitter.username', 'validation.social.twitter.username'], domainTokenId)
    assert.deepEqual(validationRecords, ['rainberk', 'signature'])
    
    tx = await operator.setValidation('apple', 'apple-signature', domainTokenId, {from: whitelisted})
    console.log(`      ⓘ TwitterValidationOperator.setValidation - second validation, first domain: ${ getUsedGas(tx) }`)
    validationRecords = await resolver.getMany(['social.twitter.username', 'validation.social.twitter.username'], domainTokenId)
    assert.deepEqual(validationRecords, ['apple', 'apple-signature'])

    await mintingController.mintSLD(coinbase, 'testing-test')
    const secondDomainTokenId = await registry.childIdOf(await registry.root(), 'testing-test')
    await registry.resolveTo(resolver.address, secondDomainTokenId)
    await registry.approve(operator.address, secondDomainTokenId)
    tx = await operator.setValidation('google', 'google-signature', secondDomainTokenId, {from: whitelisted})
    console.log(`      ⓘ TwitterValidationOperator.setValidation - third validation, second domain: ${ getUsedGas(tx) }`)
    validationRecords = await resolver.getMany(['social.twitter.username', 'validation.social.twitter.username'], secondDomainTokenId)
    assert.deepEqual(validationRecords, ['google', 'google-signature'])
  })

  it('should unlock LINK tokens after validation', async () => {
    const withdrawalAmount = await operator.withdrawableTokens()
    const paymentPerValidation = await operator.paymentPerValidation()
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const expectedAmount = withdrawalAmount.add(paymentPerValidation).toNumber()
    const actualAmount = (await operator.withdrawableTokens()).toNumber()
    assert.equal(actualAmount, expectedAmount)
  })

  it('should withdraw allowed LINK tokens', async () => {
    const funderInitialBalance = await linkToken.balanceOf(fundsReceiver)
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const withdrawableTokens = await operator.withdrawableTokens()
    await operator.withdraw(fundsReceiver, withdrawableTokens)
    const expectedBalance = funderInitialBalance.add(withdrawableTokens).toNumber()
    const actualBalance = (await linkToken.balanceOf(fundsReceiver)).toNumber()
    assert.isAbove(actualBalance, 0)
    assert.equal(actualBalance, expectedBalance)
  })

  it('should not allow to withdraw more LINK tokens that were unlocked', async () => {
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const withdrawableTokens = (await operator.withdrawableTokens()).toNumber()
    try {
      await operator.withdraw(fundsReceiver, withdrawableTokens + 1)
      assert.fail('withdraw function should fail when trying withdraw too much tokens')
    } catch (e) {
      assert.equal(e.reason, 'Amount requested is greater than withdrawable balance')
    }
  })

  it('should not allow to withdraw LINK tokens from non-admin address', async () => {
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const withdrawableTokens = await operator.withdrawableTokens()
    try {
      await operator.withdraw(fundsReceiver, withdrawableTokens, {from: whitelisted})
      assert.fail('withdraw function should fail when trying to call from non-admin address')
    } catch (e) {
      assert.equal(e.reason, 'WhitelistAdminRole: caller does not have the WhitelistAdmin role')
    }
  })

  it('should not allowed to set validation from non-whitelised address', async () => {
    try {
      await operator.setValidation('rainberk', 'signature', domainTokenId, {from: fundsReceiver})
      assert.fail('setValidation function should fail when trying to call from non-whitelisted address')
    } catch (e) {
      assert.equal(e.reason, 'WhitelistedRole: caller does not have the Whitelisted role')
    }
  })

  it('should unlock LINK tokens for each validation', async () => {
    const paymentPerValidation = (await operator.paymentPerValidation()).toNumber()
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const tokensAvailable = (await operator.withdrawableTokens()).toNumber()
    assert.equal(tokensAvailable, paymentPerValidation * 3)
  })

  it('should unlock predefined payment amount for valiation', async () => {
    const paymentPerValidation = 5;
    operator = await TwitterValidationOperator.new(registry.address, linkToken.address, [paymentCapper])
    await operator.setPaymentPerValidation(paymentPerValidation, {from: paymentCapper})
    await registry.approve(operator.address, domainTokenId)
    await operator.addWhitelisted(whitelisted)
    await linkToken.transfer(operator.address, paymentPerValidation)
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const tokensAvailable = (await operator.withdrawableTokens()).toNumber()
    assert.equal(tokensAvailable, paymentPerValidation)
  })

  it('should not allow set price per validation from Admin', async () => {
    try {
      await operator.setPaymentPerValidation(100, {from: coinbase})
      assert.fail('setPaymentPerValidation function should fail when trying to call from non-capper address')
    } catch (e) {
      assert.equal(e.reason, 'CapperRole: caller does not have the Capper role')
    }
  })

  it('should not allow set price per valiation from Whitelisted', async () => {
    try {
      await operator.setPaymentPerValidation(100, {from: whitelisted})
      assert.fail('setPaymentPerValidation function should fail when trying to call from non-capper address')
    } catch (e) {
      assert.equal(e.reason, 'CapperRole: caller does not have the Capper role')
    }
  })

  it('should not allow validate if operator does not have enough LINK tokens on balance', async () => {
    const paymentPerValidation = 5;
    operator = await TwitterValidationOperator.new(registry.address, linkToken.address, [paymentCapper])
    await registry.approve(operator.address, domainTokenId)
    await operator.addWhitelisted(whitelisted)
    await operator.setPaymentPerValidation(paymentPerValidation, {from: paymentCapper})
    await linkToken.transfer(operator.address, paymentPerValidation - 1)
    try {
      await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
      assert.fail('setValidation function should fail if does not have enough LINK on balance')
    } catch (e) {
      assert.equal(e.reason, 'Not enough of LINK tokens on balance')
    }
  })

  it('should work with zero price', async () => {
    operator = await TwitterValidationOperator.new(registry.address, linkToken.address, [paymentCapper])
    await registry.approve(operator.address, domainTokenId)
    await operator.addWhitelisted(whitelisted)
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const paymentPerValidation = (await operator.paymentPerValidation()).toNumber();
    assert.equal(paymentPerValidation, 0);
  })

  it('should work with Registry.setApprovalForAll approval', async () => {
    operator = await TwitterValidationOperator.new(registry.address, linkToken.address, [paymentCapper])
    await registry.setApprovalForAll(operator.address, true)
    await operator.addWhitelisted(whitelisted)
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
  }) 

  it('should pass canSetValidation check', async () => {
    assert.isTrue(await operator.canSetValidation({from: whitelisted}))
  })

  it('should fail canSetValidation from non-whitelisted address', async () => {
    await assert.isRejected(operator.canSetValidation())
  })

  it('should fail canSetValidation if not enough balance', async () => {
    await operator.setPaymentPerValidation(999999, {from: paymentCapper})
    await assert.isRejected(operator.canSetValidation({from: whitelisted}))
  })
})
