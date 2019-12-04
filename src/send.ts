import {existsSync, readFileSync} from 'fs'
import {isAbsolute, join} from 'path'
import * as Web3 from 'web3'
import ask from './ask.js'
import yargs = require('yargs')

const config = require('../.cli-config.json')

export const command = 'call <contract-name> <method> [params...]'

export const desc = 'Deploy a full set of .crypto contracts'

export const builder = (y: typeof yargs) =>
  y
    .options({
      sleep: {
        type: 'number',
        desc:
          'Sleep interval to pause between steps. (Mostly there for ganache)',
        default: 1000,
      },
      url: {
        type: 'string',
        desc: 'Ethereum-RPC URL to use for deployment',
        default: config.url,
      },
      'private-key': {
        alias: 'k',
        type: 'string',
        desc: 'Private key to use for deployment',
        default: config.privateKey,
      },
      to: {
        alias: 'at',
        type: 'string',
        desc: 'Address to interact with',
        // demandOption: true,
      },
      value: {
        alias: 'v',
        type: 'number',
        desc: 'Value to send with the contract',
        default: 0,
      },
      wei: {
        type: 'boolean',
        desc: 'Specify value with wei instead of ether.',
      },
      'gas-price': {
        type: 'number',
        desc: 'Gas price in gwei to use for all transactions.',
        default: 1,
      },
    })
    .positional('contract-name', {
      describe: 'Name of contract to interact with. (Source for ABI)',
      type: 'string',
    })
    .positional('method', {
      describe: 'Name of method to interact with.',
      type: 'string',
    })
    .positional('params', {
      describe: 'Arguments for the method',
      type: 'string',
    })

function sleep(ms = 1000) {
  return new Promise(r => setTimeout(r, ms))
}

export const handler = async argv => {
  const web3: Web3.default = new (Web3 as any)(argv.url)

  const gasPrice = web3.utils.toWei(argv.gasPrice.toString(), 'gwei')

  const defaultTo =
    config.addresses[
      argv.contractName.charAt(0).toUpperCase() + argv.contractName.substr(1)
    ]

  if (!argv.to && defaultTo) {
    argv.to = defaultTo
  }

  const abiPath = join(
    __dirname,
    `../abi/json/${argv.contractName.charAt(0).toUpperCase() +
      argv.contractName.substr(1)}.json`,
  )

  if (!existsSync(abiPath)) {
    throw new Error('Bad contract name')
  }

  const abi = JSON.parse(readFileSync(abiPath, 'utf8'))

  const contract = new web3.eth.Contract(abi, argv.to)

  const contractCode = await web3.eth.getCode(argv.to)

  if (!contractCode) {
    throw new Error('Contract does not exist. Maybe you put in the wrong one?')
  }

  if (!contract.methods[argv.method]) {
    throw new Error(`Method '${argv.method}' does not exist.`)
  }

  const methodAbi = abi.find(v => v.name === argv.method)

  const isView =
    methodAbi.stateMutability === 'pure' || methodAbi.stateMutability === 'view'

  const pkPath = isAbsolute(argv.privateKey)
    ? argv.privateKey
    : join(__dirname, '..', argv.privateKey)

  if (existsSync(pkPath)) {
    argv.privateKey = readFileSync(pkPath, 'utf8')
  }

  let account
  if (
    isView
      ? !(!argv.privateKey || /^(?:0x)?[a-fA-F\d]{64}$/.test(argv.privateKey))
      : !/^(?:0x)?[a-fA-F\d]{64}$/.test(argv.privateKey)
  ) {
    throw new Error('Bad private key')
  }
  if (argv.privateKey) {
    account = web3.eth.accounts.privateKeyToAccount(
      argv.privateKey.replace(/^(?:0x)?/, '0x'),
    )
  }

  const netId = await web3.eth.net.getId()

  async function sendTransaction(tx: any = {}) {
    const signed = await account.signTransaction({
      ...tx,
      gasPrice,
      gas: await web3.eth.estimateGas({...tx, from: account.address}),
    })

    const transactionHash: string = await new Promise((resolve, reject) => {
      ;(web3 as any).currentProvider.send(
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'eth_sendRawTransaction',
          params: [signed.rawTransaction],
        },
        ((err, resp) => {
          if (err) {
            reject(err)
          } else if (resp.error) {
            reject(new Error(resp.error.message))
          } else {
            resolve(resp.result)
          }
        }) as any,
      )
    })

    if (netId === 1) {
      console.log(`Check etherscan: https://etherscan.io/tx/${transactionHash}`)
    }
    console.log('transactionHash:', transactionHash)

    process.stdout.write('Waiting for confirmation...')

    let receipt
    do {
      try {
        receipt = await web3.eth.getTransactionReceipt(transactionHash)
      } catch (error) {
        receipt = null
      }

      if (!receipt) {
        process.stdout.write('.')
      }

      await sleep(argv.sleep)
    } while (!receipt)

    console.log()

    if (!receipt.status) {
      throw new Error('bad receipt status')
    }

    return receipt
  }

  const value = argv.wei
    ? argv.value.toString()
    : web3.utils.fromWei(argv.value.toString(), 'ether')

  if (isView) {
    const resp = await contract.methods[argv.method](...argv.params).call({
      value,
      gasPrice,
      from: account ? account.address : undefined,
    })

    if (resp == null || typeof resp !== 'object') {
      process.stdout.write((resp == null ? 'null' : resp).toString() + '\n')
    } else {
      process.stdout.write(
        Object.keys(resp)
          .filter(v => /^\d+$/.test(v))
          .reduce((a, v) => {
            a[v] = resp[v].toString()
            return a
          }, [])
          .join(' ') + '\n',
      )
    }
  } else {
    console.log(
      `Calling ${argv.contractName}.${argv.method}(${
        argv.params.length ? argv.params.join(', ') : ''
      })`,
    )

    try {
      const gasEstimate = await contract.methods[argv.method](
        ...argv.params,
      ).estimateGas({
        to: argv.to,
        value,
        gasPrice,
        from: account ? account.address : undefined,
      })

      let total = gasEstimate * Number(gasPrice) + value

      if (total > 10 ** 9) {
        const ether = Number(web3.utils.fromWei(total, 'ether'))
        total = `${
          ether.toFixed(6) === '0.000000' ? '~0' : ether.toFixed(6)
        } ether`
      } else {
        total = `${total} wei`
      }

      console.log(
        `Costing approx. gas (${gasEstimate}) * gasPrice (${Number(
          gasPrice,
        )}) + value (${argv.value}) = ${total}`,
      )
    } catch (error) {
      console.error('Bad simulation (estimateGas). Aborting...')
      process.exit(1)
    }

    await ask('Continue?')
    if (argv.value > 0) {
      await ask(`Sending ${value} wei along with the transaction. Continue?`)
    }

    await sendTransaction({
      to: argv.to,
      value,
      data: contract.methods[argv.method](...argv.params).encodeABI(),
    })

    console.log('Done.')
  }
}
