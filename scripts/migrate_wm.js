const Web3 = require('web3')

const whitelistedMinterContract = require('./../truffle-artifacts/WhitelistedMinter.json')
const accounts = require('./accounts.json')

const config = {
  kovan: {
    rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    mintingControllerAddress: '0xB240E7E8E689aA62FA2358c744B2cAefad4b173C',
    oldWhitelistedMinterAddress: '',
    whitelistedMinterAddress: '0xE3FB17066dEBdcb9c221CC017e27075Ef92fDe8a',
    privateKey: process.env.KOVAN_PRIVATE_KEY,
  },
  ropsten: {
    rpcUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    mintingControllerAddress: '',
    oldWhitelistedMinterAddress: '',
    whitelistedMinterAddress: '',
    privateKey: process.env.ROPSTEN_PRIVATE_KEY,
  },
}

async function getWhitelistedMinter(options) {
  const {web3, account} = options
  const {mintingControllerAddress} = config
  let address = config.whitelistedMinterAddress

  if (!address) {
    console.log('Deploying WhitelistedMinter contract...')

    const contract = new web3.eth.Contract(whitelistedMinterContract.abi)
    const deploy = contract.deploy({
      data: whitelistedMinterContract.bytecode,
      arguments: [mintingControllerAddress],
    })

    const receipt = await sendTransaction(deploy, {web3, account})
    console.log(receipt.contractAddress)
    address = receipt.contractAddress
  }

  return new web3.eth.Contract(whitelistedMinterContract.abi, address)
}

async function addWhitelisted(options) {
  console.log('A', accounts.length)
}

async function sendTransaction(func, options) {
  const {to, web3, account} = options

  try {
    const data = func.encodeABI()
    const nonce = await web3.eth.getTransactionCount(account.address, 'pending')
    const chainId = await web3.eth.net.getId()
    const gas = await func.estimateGas({from: account.address})
    const tx = await account.signTransaction({
      to,
      data,
      gas,
      gasPrice: 8000000000,
      nonce,
      chainId,
    })

    return await web3.eth.sendSignedTransaction(tx.rawTransaction)
  } catch (error) {
    throw error
  }
}

;(async function() {
  console.log('Start migration')

  const {rpcUrl, privateKey} = config[ropsten]

  const web3 = new Web3(rpcUrl)
  const account = web3.eth.accounts.privateKeyToAccount(privateKey)

  const contract = await getWhitelistedMinter({web3, account})
  console.log('WhitelistedMinter contract', contract._address)

  await addWhitelisted({web3, account, contract})
})()
