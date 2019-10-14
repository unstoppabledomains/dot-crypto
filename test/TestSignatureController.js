const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const SignatureController = artifacts.require(
  'controller/SignatureController.sol',
)
const SunriseController = artifacts.require('controller/SunriseController.sol')
const Web3 = require('web3')
const EthLib = require('eth-lib')

// TODO: same namehash? notice no keccak256?
function namehash(name) {
  let node =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  if (name != '') {
    let labels = name.split('.')
    for (let i = labels.length - 1; i >= 0; i--) {
      node = Web3.utils.soliditySha3(node, Web3.utils.keccak256(labels[i]))
    }
  }
  return node.toString()
}

contract('SignatureController', ([deployer, user]) => {
  it('transferFromFor', async () => {
    const registry = await Registry.deployed()
    // const mintingController = await MintingController.deployed()
    const signatureController = await SignatureController.deployed()
    const sunriseController = await SunriseController.deployed()

    const web3 = new Web3(registry.constructor.web3.currentProvider)

    await sunriseController.mintSLD(deployer, 'label', {from: deployer})

    let owner = await registry.ownerOf(namehash('label.crypto'))

    console.log('owner', owner)

    // require(owner == ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(hash, nonce))), signature));
    // _validate(keccak256(abi.encodePacked(msg.sig, from, to, tokenId)), tokenId, signature);

    async function submitSigTransaction(method, ...args) {
      const abiVal = signatureController.constructor._json.abi.find(
        v => v.name === method,
      )

      const nonce = (await signatureController.nonceOf(deployer)).toNumber()

      const ihash = Web3.utils.soliditySha3({
        type: 'bytes',
        value: web3.eth.abi.encodeFunctionCall(abiVal, args.concat('0x')),
      })

      const validationHash = await signatureController.getValidation(...args)
      // Web3.utils.soliditySha3(
      //   {type: 'bytes32', value: '0x' + '0'.repeat(64)}, // validationHash},
      //   {type: 'uint256', value: nonce},
      // )
      console.log('vh', ihash, validationHash)

      const message = web3.utils.keccak256('0x'.padEnd(64, '0'))

      const signature = await web3.eth.sign(
        web3.eth.accounts.hashMessage(message),
        deployer,
      )

      console.log('signature', message, signature)

      const result = await signatureController.recover(
        web3.eth.accounts.hashMessage(message),
        signature,
      )

      // const recovered = await web3.eth.accounts.recover(message, signature)
      console.log(
        'messageHash',
        web3.eth.accounts.hashMessage(message),
        result.messageHash,
      )
      console.log('recovered', result.recovered)

      return signatureController[method](...args, signature)
      console.log(method, ...args, signature)
    }

    const tx = await submitSigTransaction(
      'transferFromFor',
      deployer,
      user,
      namehash('label.crypto'),
    )

    console.log('tx', tx)

    owner = await registry.ownerOf(namehash('label.crypto'))

    console.log('owner', owner)
  })
})
