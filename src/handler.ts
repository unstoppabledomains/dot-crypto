import registryJsonInterface = require('./abi/json/Registry.json')
import signatureJsonInterface = require('./abi/json/SignatureController.json')
import sunriseJsonInterface = require('./abi/json/SunriseController.json')
import multiplexerJsonInterface = require('./abi/json/Multiplexer.json')
import resolverJsonInterface = require('./abi/json/SignatureResolver.json')

import chalk from 'chalk'
import {readFileSync} from 'fs'
import {join} from 'path'
import ask from './ask.js'
import Web3 = require('web3')
import yargs = require('yargs')

export const command = '$0 [...options]'

export const desc = 'Deploy a full set of .crypto contracts'

export const builder = (y: typeof yargs) =>
  y.options({
    step: {
      type: 'number',
      desc: 'Step to continue at.',
      default: 1,
    },
    'gas-price': {
      type: 'number',
      desc: 'Gas price in gwei to use for all transactions.',
      default: 1,
    },
    sleep: {
      type: 'number',
      desc: 'Sleep interval to pause between steps. (Mostly there for ganache)',
      default: 1000,
    },
    url: {
      type: 'string',
      desc: 'Ethereum-RPC URL to use for deployment',
      default: 'https://mainnet.infura.io',
    },
    'private-key': {
      alias: 'k',
      type: 'string',
      desc: 'Private key to use for deployment',
      demandOption: true,
    },
    registry: {
      type: 'string',
      desc: 'Address used for registry when continuing after Step 1',
    },
    signature: {
      type: 'string',
      desc: 'Address used for signature when continuing after Step 2',
    },
    sunrise: {
      type: 'string',
      desc: 'Address used for sunrise when continuing after Step 4',
    },
    multiplexer: {
      type: 'string',
      desc: 'Address used for multiplexer when continuing after Step 7',
    },
    // resolver: {
    //   type: 'string',
    //   desc: "Address used for resolver when continuing after Step 10"
    // },
  })

function sleep(ms = 1000) {
  return new Promise(r => setTimeout(r, ms))
}

export const handler = async argv => {
  const web3: Web3 = new Web3(argv.url)

  if (!/^(?:0x)?[a-f\d]{64}$/.test(argv.privateKey)) {
    throw new Error('Bad private key')
  }

  const account = web3.eth.accounts.privateKeyToAccount(
    argv.privateKey.replace(/^(?:0x)?/, '0x'),
  )

  const gasPrice = Web3.utils.toWei(argv.gasPrice.toString(), 'gwei')
  const netId = await web3.eth.net.getId()

  async function sendTransaction(tx: any = {}) {
    const signed = await account.signTransaction({
      ...tx,
      gasPrice,
      gas: await web3.eth.estimateGas({...tx, from: account.address}),
    })

    const transactionHash: string = await new Promise((resolve, reject) => {
      web3.currentProvider.send(
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

  async function deployContract({
    jsonInterface = [],
    bin,
    args = [],
    tx = {},
  }: {
    jsonInterface: any[]
    bin: string
    args?: any[]
    tx?: {value?: string | number}
  }) {
    const contract = new web3.eth.Contract(jsonInterface)

    const receipt = await sendTransaction({
      data: contract
        .deploy({
          data: '0x' + bin,
          arguments: args,
        })
        .encodeABI(),
    })

    contract.options.address = receipt.contractAddress

    console.log('address:', contract.options.address)

    return contract
  }

  let step = argv.step

  let registry, signature, sunrise, multiplexer, resolver

  if (argv.registry) {
    if (!web3.utils.isAddress(argv.registry)) {
      throw new Error('Bad registry address')
    }
    registry = new web3.eth.Contract(registryJsonInterface, argv.registry)
  }

  if (argv.signature) {
    if (!web3.utils.isAddress(argv.signature)) {
      throw new Error('Bad signature address')
    }
    signature = new web3.eth.Contract(signatureJsonInterface, argv.signature)
  }

  if (argv.sunrise) {
    if (!web3.utils.isAddress(argv.sunrise)) {
      throw new Error('Bad sunrise address')
    }
    sunrise = new web3.eth.Contract(sunriseJsonInterface, argv.sunrise)
  }

  if (argv.multiplexer) {
    if (!web3.utils.isAddress(argv.multiplexer)) {
      throw new Error('Bad multiplexer address')
    }
    multiplexer = new web3.eth.Contract(
      multiplexerJsonInterface,
      argv.multiplexer,
    )
  }

  if (argv.resolver) {
    if (!web3.utils.isAddress(argv.resolver)) {
      throw new Error('Bad resolver address')
    }
    resolver = new web3.eth.Contract(resolverJsonInterface, argv.resolver)
  }

  await ask("You're deploying a .crypto registry! Continue?")
  console.log('This will take a little while. Please be patient.')
  console.log()

  while (true) {
    process.stdout.write(`${chalk.cyanBright('Step ' + step)}: `)
    switch (step) {
      case 1: {
        console.log('Deploying Registry...')

        registry = await deployContract({
          jsonInterface: registryJsonInterface,
          bin: readFileSync(join(__dirname, '../abi/bin/Registry.bin'), 'utf8'),
        })

        break
      }
      case 2: {
        console.log('Deploying SignatureController...')

        if (![registry].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        signature = await deployContract({
          jsonInterface: signatureJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/SignatureController.bin'),
            'utf8',
          ),
          args: [registry.options.address],
        })

        break
      }
      case 3: {
        console.log('Adding SignatureController as a controller...')

        if (![registry, signature].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        await sendTransaction({
          to: registry.options.address,
          data: registry.methods
            .addController(signature.options.address)
            .encodeABI(),
        })

        break
      }
      case 4: {
        console.log('Deploying SunriseController...')

        if (![registry, signature].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        sunrise = await deployContract({
          jsonInterface: sunriseJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/SunriseController.bin'),
            'utf8',
          ),
          args: [registry.options.address, 60 * 60 * 24 * 365],
        })

        break
      }
      case 5: {
        console.log('Adding SunriseController as a controller...')

        if (![registry, signature, sunrise].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        await sendTransaction({
          to: registry.options.address,
          data: registry.methods
            .addController(sunrise.options.address)
            .encodeABI(),
        })

        break
      }
      case 6: {
        console.log('Renouncing controllership...')

        if (![registry, signature, sunrise].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        await sendTransaction({
          to: registry.options.address,
          data: registry.methods.renounceController().encodeABI(),
        })

        break
      }
      case 7: {
        console.log('Deploying Multiplexer...')

        if (![registry, signature, sunrise].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        multiplexer = await deployContract({
          jsonInterface: multiplexerJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/Multiplexer.bin'),
            'utf8',
          ),
          args: [sunrise.options.address],
        })

        break
      }
      case 8: {
        console.log('Adding coinbase as whitelisted...')

        if (![registry, signature, sunrise, multiplexer].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        await sendTransaction({
          to: multiplexer.options.address,
          data: multiplexer.methods.addWhitelisted(account.address).encodeABI(),
        })

        break
      }
      case 9: {
        console.log('Adding Multiplexer as a minter...')

        if (![registry, signature, sunrise, multiplexer].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        await sendTransaction({
          to: sunrise.options.address,
          data: sunrise.methods
            .addMinter(multiplexer.options.address)
            .encodeABI(),
        })

        break
      }
      case 10: {
        console.log('Deploying SignatureResolver...')

        if (![registry, signature, sunrise, multiplexer].every(v => v)) {
          throw new Error('Fill out all the required contracts')
        }

        resolver = await deployContract({
          jsonInterface: resolverJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/SignatureResolver.bin'),
            'utf8',
          ),
          args: [registry.options.address],
        })

        // break
      }
      default: {
        console.log(`${chalk.cyanBright(`${step} Complete`)}.`)
        console.log()
        console.log(`${chalk.green('Deployment Complete')}!`)
        console.log()
        console.log('Here are the addresses:')
        console.log()
        console.log('    Registry:', registry.options.address)
        console.log('    Signature Controller:', signature.options.address)
        console.log('    Sunrise Controller:', sunrise.options.address)
        console.log('    Multiplexer:', multiplexer.options.address)
        console.log('    Multiplexed minter address:', account.address)
        console.log('    Signature Resolver:', resolver.options.address)
        console.log()
        return
      }
    }

    console.log(`${chalk.cyanBright(`${step} Complete`)}.\n`)
    step++
    await sleep(argv.sleep)
  }
}
