const TwitterValidationOperator = artifacts.require('operators/TwitterValidationOperator.sol')
const LinkTokenMock = artifacts.require('mocks/LinkTokenMock.sol');
const Registry = artifacts.require('registry/Registry.sol')
const Resolver = artifacts.require('Resolver.sol')
const MintingController = artifacts.require('controller/MintingController.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const assert = chai.assert

contract('TwitterValidationOperator', function([coinbase, whitelisted, fundsReceiver]) {
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
    operator = await TwitterValidationOperator.new(registry.address, linkToken.address, 1)
    await registry.approve(operator.address, domainTokenId)
    await operator.addWhitelisted(whitelisted)
    await linkToken.transfer(operator.address, 100)
  })

  it('should set twitter username and signature', async () => {
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const validationRecords = await resolver.getMany(['social.twitter.username', 'validation.social.twitter.username'], domainTokenId)
    assert.deepEqual(validationRecords, ['rainberk', 'signature'])
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
    operator = await TwitterValidationOperator.new(registry.address, linkToken.address, paymentPerValidation)
    await registry.approve(operator.address, domainTokenId)
    await operator.addWhitelisted(whitelisted)
    await linkToken.transfer(operator.address, paymentPerValidation)
    await operator.setValidation('rainberk', 'signature', domainTokenId, {from: whitelisted})
    const tokensAvailable = (await operator.withdrawableTokens()).toNumber()
    assert.equal(tokensAvailable, paymentPerValidation)
  })
})
