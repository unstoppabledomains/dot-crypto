// const DotCrypto = artifacts.require('DotCrypto.sol')
// const Multiplexer = artifacts.require('Multiplexer.sol')
const Simple = artifacts.require('Simple.sol')
const Proxy = artifacts.require('Proxy.sol')

module.exports = deployer => {
  return deployer.deploy(Simple).then(simple => {
    return deployer.deploy(Proxy, simple.address)
  })

  // return deployer.deploy(DotCrypto, {gas: 100 * 10 ** 6}).then(dotCrypto => {
  //   return deployer.deploy(Multiplexer, dotCrypto.address)
  // })
}
