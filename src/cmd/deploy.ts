import registryJsonInterface = require('../abi/json/Registry.json')
import signatureJsonInterface = require('../abi/json/SignatureController.json')
import sunriseJsonInterface = require('../abi/json/SunriseController.json')
import multiplexerJsonInterface = require('../abi/json/Multiplexer.json')
import resolverJsonInterface = require('../abi/json/SignatureResolver.json')

import Web3 = require('web3')
import {readFileSync} from 'fs'
import {join} from 'path'
import yargs = require('yargs')

export const command = 'deploy [...options]'

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

export const handler = async argv => {
  const web3 = new Web3(
    argv.url,
    // 'http://localhost:7545',
    // 'https://mainnet.infura.io',
  )

  if (!/^(?:0x)?[a-f\d]{64}$/.test(argv.privateKey)) {
    throw new Error('Bad private key')
  }

  const account = web3.eth.accounts.privateKeyToAccount(
    argv.privateKey.replace(/^(?:0x)?/, '0x'),
    // '0xac818f8ea6d0eae11901c0fba3f1e20732988953cc1d8bd88f9be39d4ee9ed10', // ganache
    // '0xdca3eddd09a0dd2ab33da69357a68c7b791f65cc61ee8367ba017191356c1161', // Metamask
  )

  function sleep(ms = 1000) {
    return new Promise(r => setTimeout(r, ms))
  }

  async function sendTransaction(
    tx: any = {
      gasPrice: Web3.utils.toWei('1', 'gwei'),
    },
  ) {
    const signed = await account.signTransaction({
      ...tx,
      gas: await web3.eth.estimateGas({...tx, from: account.address}),
    })

    const result = await web3.eth.sendSignedTransaction(signed.rawTransaction)

    console.log(
      `Check etherscan: https://etherscan.io/tx/${result.transactionHash}`,
    )
    console.log('transactionHash:', result.transactionHash)
  }

  async function deployContract({
    jsonInterface = [],
    bin,
    args = [],
    tx = {
      gasPrice: Web3.utils.toWei('1', 'gwei'),
    },
  }: {
    jsonInterface: any[]
    bin: string
    args?: any[]
    tx?: {
      value?: string | number
      gasPrice?: string | number
    }
  }) {
    const contract = new web3.eth.Contract(jsonInterface)

    const unsigned = {
      ...tx,
      data: contract
        .deploy({
          data: '0x' + bin,
          arguments: args,
        })
        .encodeABI(),
    }

    const signed = await account.signTransaction({
      ...unsigned,
      gas: await web3.eth.estimateGas({...unsigned, from: account.address}),
    })

    const result = await web3.eth.sendSignedTransaction(signed.rawTransaction)

    console.log(
      `Check etherscan: https://etherscan.io/tx/${result.transactionHash}`,
    )
    console.log('transactionHash:', result.transactionHash)

    let receipt
    do {
      try {
        receipt = await web3.eth.getTransactionReceipt(result.transactionHash)
      } catch (error) {
        console.error(error.message)
        receipt = null
      }

      if (!receipt) {
        console.log('Waiting for confirmation...')
      }

      await sleep(argv.sleep)
    } while (!receipt)

    if (!receipt.status) {
      throw new Error('bad receipt status')
    }

    contract.options.address = receipt.contractAddress

    console.log('address:', contract.options.address)

    return contract
  }

  const gasPrice = Web3.utils.toWei(argv.gasPrice.toString(), 'gwei')
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

  console.log(
    "You're deploying a .crypto registry! This will take a little while. Please be patient.",
  )
  console.log()

  while (true) {
    process.stdout.write(`[Step ${step}]: `)
    switch (step) {
      case 1: {
        console.log('Deploying Registry...')

        registry = await deployContract({
          jsonInterface: registryJsonInterface,
          bin: readFileSync(
            join(__dirname, '../../abi/bin/Registry.bin'),
            'utf8',
          ),
          tx: {gasPrice},
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
            join(__dirname, '../../abi/bin/SignatureController.bin'),
            'utf8',
          ),
          args: [registry.options.address],
          tx: {gasPrice},
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
            join(__dirname, '../../abi/bin/SunriseController.bin'),
            'utf8',
          ),
          args: [registry.options.address, 60 * 60 * 24 * 365],
          tx: {gasPrice},
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
            join(__dirname, '../../abi/bin/Multiplexer.bin'),
            'utf8',
          ),
          args: [sunrise.options.address],
          tx: {gasPrice},
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
            join(__dirname, '../../abi/bin/SignatureResolver.bin'),
            'utf8',
          ),
          args: [registry.options.address],
          tx: {gasPrice},
        })

        // break
      }
      default: {
        console.log('Done.\n')
        console.log("You've deployed a .crypto registry!")
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

    console.log(`[Step ${step}]: Done.\n`)
    step++
    await sleep(argv.sleep)
  }
}
