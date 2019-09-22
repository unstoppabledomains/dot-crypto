var Registry = artifacts.require('./Registry.sol')

module.exports = deployer => {
  deployer.deploy(Registry)
}
