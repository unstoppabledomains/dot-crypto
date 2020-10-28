const Web3 = require('web3')

const proxyReaderContract = require('../../truffle-artifacts/ProxyReader.json')

const CONFIG = {
  rinkeby: {
    rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    registryAddress: '0x90bAb77911d4faF00E6CE4FdFd038B3B65d0662d',
    privateKey: process.env.RINKEBY_PRIVATE_KEY,
    gasPrice: 2000000000, // 2 gwei
  },
  mainnet: {
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    registryAddress: '0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe',
    privateKey: process.env.MAINNET_PRIVATE_KEY,
    gasPrice: 36000000000, // 36 gwei
  },
}

async function deployProxyReader({web3, account, config}) {
  const {registryAddress} = config

  console.log('Deploying ProxyReader contract...')

  const contract = new web3.eth.Contract(proxyReaderContract.abi)
  const deploy = contract.deploy({
    data: proxyReaderContract.bytecode,
    arguments: [registryAddress],
  })

  const receipt = await sendTransaction(deploy, {web3, account, config})
  address = receipt.contractAddress

  return new web3.eth.Contract(proxyReaderContract.abi, address)
}

async function sendTransaction(func, {to, web3, account, config}) {
  try {
    const data = func.encodeABI()

    const callResult = await web3.eth.call({to, data, from: account.address})
    if ((callResult || '').startsWith('0x08c379a')) {
      throw new Error(web3.utils.toAscii('0x' + callResult.substr(138)))
    }

    web3.eth.handleRevert = true
    const nonce = await web3.eth.getTransactionCount(account.address, 'pending')
    const chainId = await web3.eth.net.getId()
    const gas = await web3.eth.estimateGas({data, to, from: account.address})
    const tx = await account.signTransaction({
      to,
      data,
      gas,
      gasPrice: config.gasPrice,
      nonce,
      chainId,
    })

    const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction)
    gasUsed = gasUsed.add(web3.utils.toBN(receipt.gasUsed))
    return receipt
  } catch (error) {
    throw error
  }
}

let gasUsed
;(async function() {
  console.log('Start migration')

  const config = CONFIG.mainnet
  const {rpcUrl, privateKey} = config

  const web3 = new Web3(rpcUrl)
  gasUsed = web3.utils.toBN(0)

  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  const options = {
    web3,
    account,
    config,
  }

  const contract = await deployProxyReader(options)
  console.log('ProxyReader contract', contract._address)

  console.log('Completed migration')

  console.log()
  console.log('Summary')
  console.log('=======')
  console.log(`Gas price: ${config.gasPrice} wei`)
  console.log(`Gas used: ${gasUsed.toString()}`)
  const cost = gasUsed.mul(web3.utils.toBN(config.gasPrice))
  console.log(`Final cost: ${web3.utils.fromWei(cost, 'ether')} ETH`)
  console.log()
})()