import chalk from 'chalk'
import {existsSync, readFileSync, writeFileSync} from 'fs'
import {isAbsolute, join} from 'path'
import * as Web3 from 'web3'
import ask from './ask'
import yargs from 'yargs'

const config = require('../.cli-config.json')

const registryJsonInterface = JSON.parse(
  readFileSync(join(__dirname, '../abi/json/Registry.json'), 'utf8'),
)
const signatureJsonInterface = JSON.parse(
  readFileSync(join(__dirname, '../abi/json/SignatureController.json'), 'utf8'),
)
const mintingJsonInterface = JSON.parse(
  readFileSync(join(__dirname, '../abi/json/MintingController.json'), 'utf8'),
)
const whitelistedMinterJsonInterface = JSON.parse(
  readFileSync(join(__dirname, '../abi/json/WhitelistedMinter.json'), 'utf8'),
)
const resolverJsonInterface = JSON.parse(
  readFileSync(join(__dirname, '../abi/json/Resolver.json'), 'utf8'),
)
const uriPrefixJsonInterface = JSON.parse(
  readFileSync(join(__dirname, '../abi/json/URIPrefixController.json'), 'utf8'),
)

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
      default: config.url,
    },
    'private-key': {
      alias: 'k',
      type: 'string',
      desc: 'Private key to use for deployment',
      default: config.privateKey,
    },
    registry: {
      type: 'string',
      desc: 'Address used for registry when continuing after Step 1',
      default: config.addresses.Registry,
    },
    signature: {
      type: 'string',
      desc: 'Address used for signature when continuing after Step 2',
      default: config.addresses.SignatureController,
    },
    minting: {
      type: 'string',
      desc: 'Address used for minting when continuing after Step 4',
      default: config.addresses.MintingController,
    },
    'whitelisted-minter': {
      type: 'string',
      desc: 'Address used for whitelistedMinter when continuing after Step 7',
      default: config.addresses.WhitelistedMinter,
    },
    'uri-prefix': {
      type: 'string',
      desc: 'Address used for UriPrefix when continuing after Step 10',
      default: config.addresses.URIPrefixController,
    },
    resolver: {
      type: 'string',
      desc: 'Address used for resolver when continuing after Step 11',
      default: config.addresses.Resolver,
    },
  })

function sleep(ms = 1000) {
  return new Promise(r => setTimeout(r, ms))
}

export const handler = async argv => {
  const web3: Web3.default = new (Web3 as any)(argv.url)

  const pkPath = isAbsolute(argv.privateKey)
    ? argv.privateKey
    : join(__dirname, '..', argv.privateKey)

  if (existsSync(pkPath)) {
    argv.privateKey = readFileSync(pkPath, 'utf8')
  }

  if (!/^(?:0x)?[a-fA-F\d]{64}$/.test(argv.privateKey)) {
    throw new Error('Bad private key')
  }

  const account = web3.eth.accounts.privateKeyToAccount(
    argv.privateKey.replace(/^(?:0x)?/, '0x'),
  )

  console.log('Using', account.address)

  const gasPrice = web3.utils.toWei(argv.gasPrice.toString(), 'gwei')
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

  let registry, signature, minting, whitelistedMinter, uriPrefix, resolver

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

  if (argv.minting) {
    if (!web3.utils.isAddress(argv.minting)) {
      throw new Error('Bad minting address')
    }
    minting = new web3.eth.Contract(mintingJsonInterface, argv.minting)
  }

  if (argv.whitelistedMinter) {
    if (!web3.utils.isAddress(argv.whitelistedMinter)) {
      throw new Error('Bad whitelistedMinter address')
    }
    whitelistedMinter = new web3.eth.Contract(
      whitelistedMinterJsonInterface,
      argv.whitelistedMinter,
    )
  }

  if (argv.uriPrefix) {
    if (!web3.utils.isAddress(argv.uriPrefix)) {
      throw new Error('Bad uriPrefix address')
    }
    uriPrefix = new web3.eth.Contract(uriPrefixJsonInterface, argv.uriPrefix)
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

        config.addresses.Registry = registry.options.address
        writeFileSync(
          join(__dirname, '../.cli-config.json'),
          JSON.stringify(config, null, 2),
        )

        break
      }
      case 2: {
        console.log('Deploying SignatureController...')

        signature = await deployContract({
          jsonInterface: signatureJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/SignatureController.bin'),
            'utf8',
          ),
          args: [registry.options.address],
        })

        config.addresses.SignatureController = signature.options.address
        writeFileSync(
          join(__dirname, '../.cli-config.json'),
          JSON.stringify(config, null, 2),
        )

        break
      }
      case 3: {
        console.log('Adding SignatureController as a controller...')

        await sendTransaction({
          to: registry.options.address,
          data: registry.methods
            .addController(signature.options.address)
            .encodeABI(),
        })

        break
      }
      case 4: {
        console.log('Deploying MintingController...')

        minting = await deployContract({
          jsonInterface: mintingJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/MintingController.bin'),
            'utf8',
          ),
          args: [registry.options.address],
        })

        config.addresses.MintingController = minting.options.address
        writeFileSync(
          join(__dirname, '../.cli-config.json'),
          JSON.stringify(config, null, 2),
        )

        break
      }
      case 5: {
        console.log('Adding MintingController as a controller...')

        await sendTransaction({
          to: registry.options.address,
          data: registry.methods
            .addController(minting.options.address)
            .encodeABI(),
        })

        break
      }
      case 6: {
        console.log('Deploying URIPrefixController...')

        uriPrefix = await deployContract({
          jsonInterface: uriPrefixJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/URIPrefixController.bin'),
            'utf8',
          ),
          args: [registry.options.address],
        })

        config.addresses.URIPrefixController = uriPrefix.options.address
        writeFileSync(
          join(__dirname, '../.cli-config.json'),
          JSON.stringify(config, null, 2),
        )

        break
      }
      case 7: {
        console.log('Adding URIPrefixController as a controller...')

        await sendTransaction({
          to: registry.options.address,
          data: registry.methods
            .addController(uriPrefix.options.address)
            .encodeABI(),
        })

        break
      }
      case 8: {
        console.log('Renouncing controllership...')

        await sendTransaction({
          to: registry.options.address,
          data: registry.methods.renounceController().encodeABI(),
        })

        break
      }
      case 9: {
        console.log('Deploying WhitelistedMinter...')

        whitelistedMinter = await deployContract({
          jsonInterface: whitelistedMinterJsonInterface,
          bin: readFileSync(
            join(__dirname, '../abi/bin/WhitelistedMinter.bin'),
            'utf8',
          ),
          args: [minting.options.address],
        })

        config.addresses.WhitelistedMinter = whitelistedMinter.options.address
        writeFileSync(
          join(__dirname, '../.cli-config.json'),
          JSON.stringify(config, null, 2),
        )

        break
      }
      case 10: {
        console.log('Adding WhitelistedMinter as a minter...')

        await sendTransaction({
          to: minting.options.address,
          data: minting.methods
            .addMinter(whitelistedMinter.options.address)
            .encodeABI(),
        })

        break
      }
      case 11: {
        console.log('Adding coinbase as whitelisted...')

        await sendTransaction({
          to: whitelistedMinter.options.address,
          data: whitelistedMinter.methods
            .addWhitelisted(account.address)
            .encodeABI(),
        })

        break
      }
      case 12: {
        console.log('Deploying Resolver...')

        resolver = await deployContract({
          jsonInterface: resolverJsonInterface,
          bin: readFileSync(join(__dirname, '../abi/bin/Resolver.bin'), 'utf8'),
          args: [registry.options.address, minting.options.address],
        })

        config.addresses.Resolver = resolver.options.address
        writeFileSync(
          join(__dirname, '../.cli-config.json'),
          JSON.stringify(config, null, 2),
        )

        break
      }
      case 13: {
        console.log('Adding setting default Resolver for Whitelisted Minter...')

        await sendTransaction({
          to: whitelistedMinter.options.address,
          data: whitelistedMinter.methods
            .setDefaultResolver(account.address)
            .encodeABI(resolver.address),
        })

        break
      }
      case 14: {
        // console.log('Configure URI Prefix...')
        // await sendTransaction({
        //   to: uriPrefix.options.address,
        //   data: uriPrefix.methods
        //     .addWhitelisted(account.address)
        //     .encodeABI(),
        // })
        // await sendTransaction({
        //   to: uriPrefix.options.address,
        //   data: uriPrefix.methods
        //     .setTokenURIPrefix(uriPrefix.options.address)
        //     .encodeABI('https://metadata.unstoppabledomains.com/metadata/'),
        // })
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
        console.log('    Minting Controller:', minting.options.address)
        console.log(
          '    Whitelisted Minter:',
          whitelistedMinter.options.address,
        )
        console.log('    EOA admin address:', account.address)
        console.log('    URI Prefix Controller:', uriPrefix.options.address)
        console.log('    Resolver:', resolver.options.address)
        console.log()
        return
      }
    }

    console.log(`${chalk.cyanBright(`${step} Complete`)}.\n`)
    step++
    await sleep(argv.sleep)
  }
}
