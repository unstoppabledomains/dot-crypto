const Proxy = artifacts.require('Proxy.sol')
const Simple = artifacts.require('Simple.sol')
const Web3 = require('web3')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

async function deployProxy() {
  const proxyArtifact = await Proxy.deployed()
  const simpleArtifact = await Simple.deployed()

  const web3 = new Web3(proxyArtifact.contract.currentProvider)

  const proxy = new web3.eth.Contract(simpleArtifact.abi, proxyArtifact.address)
  const simple = new web3.eth.Contract(
    simpleArtifact.abi,
    simpleArtifact.address,
  )

  return [proxy, simple]
}

describe('Proxy', () => {
  contract('', ([coinbase, address2, ...addresses]) => {
    it('should deploy', async () => {
      const [proxy, simple] = await deployProxy()

      const proxySend = await proxy.methods.set(1).send({from: coinbase})
      const simpleSend = await simple.methods.set(1).send({from: coinbase})

      const proxyCalldata = await proxy.methods.get().call()
      const simpleCalldata = await simple.methods.get().call()

      console.log({
        proxy: proxy.options.address,
        simple: simple.options.address,
        proxyCalldata,
        simpleCalldata,
        proxySend: proxySend.gasUsed,
        simpleSend: simpleSend.gasUsed,
      })
    })
  })
})
