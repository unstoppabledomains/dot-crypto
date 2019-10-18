const Registry = artifacts.require('registry/Registry.sol')
const SunriseController = artifacts.require('controller/SunriseController.sol')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert

contract('Registry', function([coinbase, ...accounts]) {
  let sunriseController, registry

  beforeEach(async () => {
    registry = await Registry.deployed()
    sunriseController = await SunriseController.deployed()
  })

  it('should manage regular tokens correctly', async () => {
    await sunriseController.mintSLD(coinbase, 'regular')

    const regularTok = await registry.childOf(await registry.root(), 'regular')

    assert(
      !(await sunriseController.isSunrise(regularTok)),
      'should get sunrise status for regular token',
    )

    // should fail to resolve non sunrise domains
    await assert.isRejected(
      sunriseController.resolveSunriseSLD(regularTok, false),
    )
  })

  it('should mint sunrise SLD', async () => {
    await sunriseController.mintSunriseSLD(coinbase, 'sunrise')

    const tok = await registry.childOf(await registry.root(), 'sunrise')

    assert(
      await sunriseController.isSunrise(tok),
      'should get sunrise status for sunrise token',
    )

    assert.equal(
      await registry.ownerOf(tok),
      coinbase,
      'should mint sunrise token',
    )

    await sunriseController.resolveSunriseSLD(tok, true)

    assert(
      !(await sunriseController.isSunrise(tok)),
      'should not have leftover token sunrise after burning',
    )
    assert.equal(
      await registry.ownerOf(tok),
      coinbase,
      'should resolve sunrise token',
    )

    // Can't resolve non sunrise domain
    await assert.isRejected(sunriseController.resolveSunriseSLD(tok, true))

    const tok2 = await registry.childOf(await registry.root(), 'sunrise2')

    await sunriseController.mintSunriseSLD(coinbase, 'sunrise2')

    await sunriseController.resolveSunriseSLD(tok2, false)

    // should not have leftover token sunrise after burning
    await assert.isRejected(sunriseController.isSunrise(tok2))
    // should resolve sunrise token
    await assert.isRejected(registry.ownerOf(tok2))
  })

  it('should control sunrise length correctly', async () => {
    assert(
      !(await sunriseController.isSunriseOver()),
      'should be in sunrise period',
    )

    assert(
      /^\d+$/.test((await sunriseController.sunrise()).toString()),
      'should be in sunrise period',
    )

    const tok = await registry.childOf(await registry.root(), 'label')

    // should not get sunrise for non existent token
    await assert.isRejected(sunriseController.isSunrise(tok))

    await sunriseController.setSunrise(1000)

    assert(
      /^\d+$/.test((await sunriseController.sunrise()).toString()),
      'should be in sunrise period',
    )

    assert(
      !(await sunriseController.isSunriseOver()),
      'should be in sunrise period',
    )

    await sunriseController.setSunrise(0)

    // should be out of sunrise period
    await assert.isRejected(sunriseController.sunrise())

    assert(
      await sunriseController.isSunriseOver(),
      'should be out of sunrise period',
    )
  })
})
