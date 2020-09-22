const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const Web3 = require('web3')

const ProxyText = artifacts.require('util/ProxyTest.sol')
const expectRevert = require('./helpers/expectRevert.js')

chai.use(chaiAsPromised)
const {assert} = chai

contract.skip('ProxyText', ([coinbase]) => {
  let proxyTest

  before(async () => {
    proxyTest = await ProxyText.new({
      from: coinbase,
    })
  })

  function getCallData(web3, method, ...params) {
    const abi = ProxyText.toJSON().abi.find(v => v.name === method)
    return web3.eth.abi.encodeFunctionCall(abi, params)
  }

  async function sign(web3, pk, ...params) {
    return web3.eth.accounts.sign(Web3.utils.soliditySha3(...params), pk)
  }

  async function calcSignature(web3, pk, data, address) {
    return await sign(
      web3,
      pk,
      {
        type: 'bytes32',
        value: Web3.utils.keccak256(data),
      },
      {
        type: 'address',
        value: address,
      },
    )
  }

  describe('Ganache', () => {
    it('revert get string', async () => {
      const web3 = new Web3(proxyTest.constructor.web3.currentProvider)
      const abi = ProxyText.toJSON().abi.find(v => v.name === 'getString')
      const data = web3.eth.abi.encodeFunctionCall(abi, [0])

      await expectRevert(
        web3.eth.call(
          {
            to: proxyTest.address,
            data,
          },
          'latest',
        ),
        'VM Exception while processing transaction: revert',
      )
    })
  })

  describe('Ropsten', () => {
    const to = '0xcEB5675bb721eBA2aB838F5dCD8329D97b4e68eF'
    const pKey = process.env.ROPSTEN_PRIVATE_KEY
    const web3 = new Web3(
      `https://ropsten.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    )

    const setString = async (key, value) => {
      const contract = new web3.eth.Contract(ProxyText.toJSON().abi, to)
      const setStringData = contract.methods.setString(key, value).encodeABI()
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to,
          data: setStringData,
          gas: 50000,
        },
        pKey,
      )
      const tx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      console.debug('tx', tx)
    }

    it('return same response(direct and proxy) when get string revert', async () => {
      const data = getCallData(web3, 'getString', 0)
      const directCall = await web3.eth.call({to, data}, 'latest')
      console.log('directCall', directCall)

      const sig = await calcSignature(web3, pKey, data, to)
      const proxyData = getCallData(web3, 'proxy', data, sig.signature)
      const proxyCall = await web3.eth.call({to, data: proxyData}, 'latest')
      console.debug('proxyCall', proxyCall)

      assert.equal(directCall, proxyCall)
    })

    it('return same response(direct and proxy) when get uint revert', async () => {
      const data = getCallData(web3, 'getUint', 0)
      const directCall = await web3.eth.call({to, data}, 'latest')
      console.debug('directCall', directCall)

      const sig = await calcSignature(web3, pKey, data, to)
      const proxyData = getCallData(web3, 'proxy', data, sig.signature)
      const proxyCall = await web3.eth.call({to, data: proxyData}, 'latest')
      console.debug('directProxyCall', proxyCall)

      assert.equal(directCall, proxyCall)
    })

    it('return same response(direct and proxy) when get string', async () => {
      // await setString(1, 'hello')

      const data = getCallData(web3, 'getString', 1)
      const directCall = await web3.eth.call({to, data}, 'latest')
      console.debug('directCall', directCall)

      const sig = await calcSignature(web3, pKey, data, to)
      const proxyData = getCallData(web3, 'proxy', data, sig.signature)
      const proxyCall = await web3.eth.call({to, data: proxyData}, 'latest')
      console.debug('proxyCall', proxyCall)

      const proxyCallDecode = web3.eth.abi.decodeParameters(
        ['bytes'],
        proxyCall,
      )
      assert.equal(directCall, proxyCallDecode['0'])

      const decodedOutput = web3.eth.abi.decodeParameters(
        ['string'],
        proxyCallDecode['0'],
      )
      assert.equal('hello', decodedOutput['0'])
    })
  })
})
