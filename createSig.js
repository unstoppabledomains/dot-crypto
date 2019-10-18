const Web3 = require('web3')

const {isAbsolute, join} = require('path')
const {readFileSync, existsSync} = require('fs')

const config = require('./.cli-config.json')

const web3 = new Web3(config.url)

const pkPath = isAbsolute(config.privateKey)
  ? config.privateKey
  : join(__dirname, config.privateKey)

if (existsSync(pkPath)) {
  config.privateKey = readFileSync(pkPath, 'utf8')
}

if (!/^(?:0x)?[a-f\d]{64}$/.test(config.privateKey)) {
  throw new Error('Bad private key')
}

const account = web3.eth.accounts.privateKeyToAccount(
  config.privateKey.replace(/^(?:0x)?/, '0x'),
)

function createSig(nonce, method, ...args) {
  const signatureControllerAbi = require('./abi/json/SignatureController.json')

  const signature = account.sign(
    Web3.utils.keccak256(
      Web3.utils.keccak256(
        web3.eth.abi
          .encodeFunctionCall(
            signatureControllerAbi.find(v => v.name === method),
            args.concat('0x'),
          )
          .concat('0'.repeat(64)),
      ) + nonce.toString(16).padStart(64, '0'),
    ),
  )

  return signature.signature
}

if (require.main === module) {
  process.stdout.write(createSig(...process.argv.slice(2)))
}
