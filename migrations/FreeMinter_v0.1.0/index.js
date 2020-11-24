const Web3 = require('web3')

const freeMinterContract = require('../../truffle-artifacts/FreeMinter.json')

const CONFIG = {
  mainnet: {
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    registryAddress: '0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe',
    mintingControllerAddress: '0xb0EE56339C3253361730F50c08d3d7817ecD60Ca',
    defaultResolverAddress: '0xb66DcE2DA6afAAa98F2013446dBCB0f4B0ab2842',
    privateKey: process.env.MAINNET_PRIVATE_KEY,
    gasPrice: 70000000000, // 70 gwei
  },
}

async function deployFreeMinter({web3, account, config}) {
  const {registryAddress, mintingControllerAddress, defaultResolverAddress} = config

  console.log('Deploying FreeMinter contract...')

  const contract = new web3.eth.Contract(freeMinterContract.abi)
  const deploy = await contract.deploy({
    data: freeMinterContract.bytecode,
    arguments: [mintingControllerAddress, defaultResolverAddress, registryAddress],
  });

  const receipt = await sendTransaction(deploy, {web3, account, config})
  let address = receipt.contractAddress

  return new web3.eth.Contract(freeMinterContract.abi, address)
}

async function sendTransaction(func, {to, web3, account, config}) {
  try {
    const data = func.encodeABI()

    const callResult = await web3.eth.call({to, data, from: account.address})
    if ((callResult && callResult.error) || (callResult || '').startsWith('0x08c379a')) {
      throw new Error(web3.utils.toAscii('0x' + callResult.substr(138)))
    }

    web3.eth.handleRevert = true
    const nonce = await web3.eth.getTransactionCount(account.address, 'pending')
    console.log(nonce);
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
  console.log(account);
  const options = {
    web3,
    account,
    config,
  }

  const contract = await deployFreeMinter(options)
  console.log('FreeMinter contract', contract._address)

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