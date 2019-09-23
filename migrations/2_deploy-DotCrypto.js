var DotCrypto = artifacts.require('registry/DotCrypto.sol')

module.exports = deployer => {
  deployer.deploy(DotCrypto)
}
