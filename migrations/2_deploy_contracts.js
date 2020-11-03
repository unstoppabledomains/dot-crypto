const Registry = artifacts.require('Registry.sol')
const URIPrefixController = artifacts.require(
  'controller/URIPrefixController.sol',
)
const SignatureController = artifacts.require(
  'controller/SignatureController.sol',
)
const MintingController = artifacts.require('controller/MintingController.sol')
const DomainZoneController = artifacts.require('controller/DomainZoneController.sol')
const WhitelistedMinter = artifacts.require('util/WhitelistedMinter.sol')
const Resolver = artifacts.require('Resolver.sol')
const ProxyReader = artifacts.require('ProxyReader.sol')
const TwitterValidationOperator = artifacts.require('operators/TwitterValidationOperator.sol')

const rinkebyAccounts = {
  workers: [
    '0xb3B86785A51B950fd54ABdF420ff3B60E091870c',
    '0x7EF88A779651f26a4967026a32Cae4F01fF8D151',
    '0x0c71a3494484459bbF9777Dd3109515B2E653CCb',
    '0x288DA3443BBEBcc7a339182323aa3F23126DFe7a',
    '0xe45541799119C1D63b60e0F834F3A381D4BEDbea',
  ],
  priorityWorkers: [
    '0xdb36B5c4cF1D96f020D7629a09cB54ab787414d6',
    '0x3b9FB7983d897B7fe2fD7563e07e24CbA830b03B',
    '0x903aA579B9eF13862Fda73275B349017d8fD09eB',
    '0x7Ac8596cfbb0504DFDEC08d5088B67E7fbfae47f',
    '0xB83180632b72f988585AF02FC27229bF2Eabd139',
  ],
  admins: [
    '0xec6A3Fb3f8869D50F73829db434525697852Ce3A',
    '0x4C863E316Ce7A19ba23fDF801a369E1F3cc835AA',
  ]
};

module.exports = (deployer, network) => {
  deployer.deploy(Registry).then(async registry => {
    const signatureController = await deployer.deploy(
      SignatureController,
      registry.address,
    )
    const mintingController = await deployer.deploy(
      MintingController,
      registry.address,
    )
    const uriPrefixController = await deployer.deploy(
      URIPrefixController,
      registry.address,
    )
    const domainZoneController = await deployer.deploy(
      DomainZoneController,
      registry.address,
      []
    )

    await registry.addController(signatureController.address)
    await registry.addController(mintingController.address)
    await registry.addController(uriPrefixController.address)

    if (network === 'live') {
      await registry.renounceController()
    }

    const whitelistedMinter = await deployer.deploy(
      WhitelistedMinter,
      mintingController.address,
    )
    await mintingController.addMinter(whitelistedMinter.address)

    if (network === 'rinkeby') {
      for(const admin of rinkebyAccounts.admins) {
        await whitelistedMinter.addWhitelistAdmin(admin)
        await domainZoneController.addWhitelistAdmin(admin)
        await uriPrefixController.addWhitelistAdmin(admin)
      }
      
      await whitelistedMinter.bulkAddWhitelisted([
        ...rinkebyAccounts.workers,
        ...rinkebyAccounts.priorityWorkers
      ])

      await domainZoneController.bulkAddWhitelisted(rinkebyAccounts.priorityWorkers)
    }

    if (network === 'live') {
      await mintingController.renounceMinter()
    }

    await deployer.deploy(Resolver, registry.address, mintingController.address)
    await deployer.deploy(ProxyReader, registry.address)

    if (network === 'rinkeby') {
      await deployer.deploy(
        TwitterValidationOperator,
        registry.address,
        '0x01BE23585060835E02B77ef475b0Cc51aA1e0709',
        rinkebyAccounts.admins)
    }

    console.log('Migrated!')
  })
}
