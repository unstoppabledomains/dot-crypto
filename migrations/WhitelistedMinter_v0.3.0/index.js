const Web3 = require('web3')

const whitelistedMinterContract = require('../../truffle-artifacts/WhitelistedMinter.json')
const mintingControllerContract = require('../../truffle-artifacts/MintingController.json')
const accounts = require('./accounts.json')

// NOTES: Source WhitelistedMinter requires to have 0xd5534bc03144b4d8be84c7282c625fd3ff05c5d3 whitelisted address for Rinkeby
const CONFIG = {
  rinkeby: {
    rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    mintingControllerAddress: '0x641c06c8E0e42aF6f903614f7D6532Ae3C60dC4b',
    sourceWhitelistedMinterAddress:
      '0x7B44Dd1beec7ab65f7FFD5E364400ec7b9F49217',
    targetWhitelistedMinterAddress: '',
    privateKey: process.env.RINKEBY_PRIVATE_KEY,
    minterPrivateKey: process.env.MINTER_PRIVATE_KEY,
    relayerPrivateKey: process.env.RINKEBY_RELAYER_PRIVATE_KEY,
    relay: true,
    gasPrice: 2000000000, // 2 gwei
    chunkSize: 100,
  },
  mainnet: {
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_TEST_KEY}`,
    mintingControllerAddress: '0xb0EE56339C3253361730F50c08d3d7817ecD60Ca',
    sourceWhitelistedMinterAddress:
      '0xB485D89aBA096Fc9F117fA28B80dC8AAC7971049',
    targetWhitelistedMinterAddress:
      '0xd3fF3377b0ceade1303dAF9Db04068ef8a650757',
    privateKey: process.env.MAINNET_PRIVATE_KEY,
    minterPrivateKey: process.env.MINTER_PRIVATE_KEY,
    relayerPrivateKey: process.env.MINTER_PRIVATE_KEY,
    relay: false,
    gasPrice: 50000000000, // 50 gwei
    chunkSize: 100,
  },
}

async function getWhitelistedMinter({web3, account, config}) {
  const {mintingControllerAddress} = config
  let address = config.targetWhitelistedMinterAddress

  if (!address) {
    console.log('Deploying WhitelistedMinter contract...')

    const contract = new web3.eth.Contract(whitelistedMinterContract.abi)
    const deploy = contract.deploy({
      data: whitelistedMinterContract.bytecode,
      arguments: [mintingControllerAddress],
    })

    const receipt = await sendTransaction(deploy, {web3, account, config})
    address = receipt.contractAddress
  }

  return new web3.eth.Contract(whitelistedMinterContract.abi, address)
}

async function addWhitelistedMinterToController({
  config,
  web3,
  account,
  contract,
}) {
  const {mintingControllerAddress} = config
  const mintingController = new web3.eth.Contract(
    mintingControllerContract.abi,
    mintingControllerAddress,
  )

  const isMinter = await mintingController.methods
    .isMinter(contract._address)
    .call()

  if (!isMinter) {
    console.log('Adding minter...', contract._address)
    const addMinter = mintingController.methods.addMinter(contract._address)
    await sendTransaction(addMinter, {
      web3,
      account,
      to: mintingControllerAddress,
      config,
    })
    console.log('Added minter', contract._address)
  }
}

async function migrateWhitelistedMinters({config, web3, contract, account}) {
  const {sourceWhitelistedMinterAddress, chunkSize} = config
  const sourceContract = new web3.eth.Contract(
    whitelistedMinterContract.abi,
    sourceWhitelistedMinterAddress,
  )

  const mintersToAdd = []
  for (const acc of accounts) {
    const isWhitelistedFrom = await sourceContract.methods
      .isWhitelisted(acc)
      .call()
    const isWhitelistedTo = await contract.methods.isWhitelisted(acc).call()

    if (isWhitelistedFrom && !isWhitelistedTo) {
      mintersToAdd.push(acc)
    }
  }

  for (let i = 0, j = mintersToAdd.length; i < j; i += chunkSize) {
    const array = mintersToAdd.slice(i, i + chunkSize)

    console.log('Whitelisting...', array)
    const whitelist = contract.methods.bulkAddWhitelisted(array)
    await sendTransaction(whitelist, {
      web3,
      account,
      to: contract._address,
      config,
    })
    console.log('Whitelisted', array.length, 'minters')
  }
}

async function migrateWhitelistedAdmins({config, web3, contract, account}) {
  const admins = await getWhitelistedAdmins({config, web3})

  for (const admin of admins) {
    const isWhitelistedAdmin = await contract.methods
      .isWhitelistAdmin(admin)
      .call()
    if (isWhitelistedAdmin) return

    console.log('WhitelistingAdmin...', admin)
    const whitelistAdmin = await contract.methods.addWhitelistAdmin(admin)
    await sendTransaction(whitelistAdmin, {
      web3,
      account,
      to: contract._address,
      config,
    })
    console.log('WhitelistedAdmin', admin)
  }
}

async function verifyMint(options) {
  const {web3, account, minter, relayer, contract, config} = options
  const domainName = `test-domain-${Date.now()}`

  console.log('Minting...', domainName)
  const mintSLD = await contract.methods.mintSLD(account.address, domainName)

  if (config.relay) {
    console.log('Relaying mint...', domainName)
    const data = mintSLD.encodeABI()
    const sig = await sign(minter, data, contract._address)
    console.log('sig', sig)

    const relayMintSLD = await contract.methods.relay(data, sig.signature)
    await sendTransaction(relayMintSLD, {
      web3,
      account: relayer,
      to: contract._address,
      config,
    })
  } else {
    await sendTransaction(mintSLD, {
      web3,
      account: minter,
      to: contract._address,
      config,
    })
  }
  console.log('Minted', domainName)
}

async function renounceAdmin({web3, account, contract, config}) {
  console.log('Renouncing admin...', account.address)
  const renounceWhitelistAdmin = await contract.methods.renounceWhitelistAdmin()
  await sendTransaction(renounceWhitelistAdmin, {
    web3,
    account,
    to: contract._address,
    config,
  })
  console.log('Renounced admin', account.address)
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

async function getWhitelistedAdmins({config, web3}) {
  const {sourceWhitelistedMinterAddress} = config
  const sourceContract = new web3.eth.Contract(
    whitelistedMinterContract.abi,
    sourceWhitelistedMinterAddress,
  )

  const latestBlock = await web3.eth.getBlock('latest')
  const events = await sourceContract.getPastEvents(
    'WhitelistAdminAdded',
    {
      fromBlock: 0,
      toBlock: latestBlock.number,
    },
    async error => {
      if (error) {
        throw error
      }
    },
  )

  return events
    .filter(
      async e =>
        await sourceContract.methods
          .isWhitelistAdmin(e.returnValues.account)
          .call(),
    )
    .map(e => e.returnValues.account)
}

async function sign(account, data, address) {
  return await account.sign(
    Web3.utils.soliditySha3(
      {
        type: 'bytes32',
        value: Web3.utils.keccak256(data),
      },
      {
        type: 'address',
        value: address,
      },
    ),
  )
}

let gasUsed
;(async function() {
  console.log('Start migration')

  const config = CONFIG.rinkeby
  const {rpcUrl, privateKey, minterPrivateKey, relayerPrivateKey} = config

  const web3 = new Web3(rpcUrl)
  gasUsed = web3.utils.toBN(0)

  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  const minter = web3.eth.accounts.privateKeyToAccount(minterPrivateKey)
  const relayer = web3.eth.accounts.privateKeyToAccount(relayerPrivateKey)
  const options = {
    web3,
    account,
    minter,
    relayer,
    config,
  }

  const contract = await getWhitelistedMinter(options)
  console.log('WhitelistedMinter contract', contract._address)

  options.contract = contract

  await migrateWhitelistedMinters(options)
  await migrateWhitelistedAdmins(options)
  // await addWhitelistedMinterToController(options)
  await verifyMint(options)
  // await renounceAdmin(options)

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
