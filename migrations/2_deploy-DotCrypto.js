var DotCrypto = artifacts.require('./DotCrypto.sol')

module.exports = deployer => {
  deployer.deploy(DotCrypto)
}
