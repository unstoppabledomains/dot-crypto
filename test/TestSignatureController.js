const Registry = artifacts.require('registry/Registry.sol')
const MintingController = artifacts.require('controller/MintingController.sol')
const SignatureController = artifacts.require(
  'controller/SignatureController.sol',
)
const SunriseController = artifacts.require('controller/SunriseController.sol')
const ChildrenController = artifacts.require(
  'controller/ChildrenController.sol',
)
const Web3 = require('web3')

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
    const mintingController = await MintingController.deployed()
    const signatureController = await SignatureController.deployed()
    const sunriseController = await SunriseController.deployed()
    const childrenController = await ChildrenController.deployed()

    const web3 = new Web3(registry.constructor.web3.currentProvider)

    await mintingController.mintSLD(deployer, 'label', {from: deployer})

    await registry.resolveTo(deployer, namehash('label.crypto'))
    const wClearing = await registry.transferFrom(
      deployer,
      user,
      namehash('label.crypto'),
    )

    const woClearing = await registry.transferFrom(
      user,
      deployer,
      namehash('label.crypto'),
      {from: user},
    )

    console.log('wClearing', wClearing)
    console.log('woClearing', woClearing)

    return

    let owner = await registry.ownerOf(namehash('label.crypto'))

    console.log('owner', owner)

    // require(owner == ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(hash, nonce))), signature));
    // _validate(keccak256(abi.encodePacked(msg.sig, from, to, tokenId)), tokenId, signature);

    async function submitSigTransaction(method, ...args) {
      const abiVal = signatureController.constructor._json.abi.find(
        v => v.name === method,
      )

      const nonce = (await signatureController.nonceOf(deployer)).toNumber()

      console.log({nonce})

      console.log(web3.eth.abi.encodeFunctionCall(abiVal, args.concat('0x')))

      const message = web3.eth.abi.encodeParameters(
        ['bytes32', 'uint256'],
        [
          Web3.utils.keccak256(
            web3.eth.abi.encodeFunctionCall(abiVal, args.concat('0x')),
          ),
          nonce,
        ],
      )

      console.log(
        'vh',
        Web3.utils.keccak256(
          web3.eth.abi.encodeFunctionCall(abiVal, args.concat('0x')),
        ),
      )

      const validationHash = await signatureController.getValidation(...args)
      console.log('vh', validationHash)

      const signature = await web3.eth.sign(
        Web3.utils.keccak256(message),
        deployer,
      )

      console.log(method, ...args, signature)

      return signatureController[method](...args, signature)
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
