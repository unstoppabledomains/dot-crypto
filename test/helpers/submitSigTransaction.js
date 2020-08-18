const Web3 = require('web3')

async function submitSigTransaction(contractToSend, contractToEncode, fromAccount, method, ...args) {
    const abiVal = contractToEncode.constructor._json.abi.find(v => {return v.name === method && v.inputs.length === args.length})
    const web3 = new Web3(contractToSend.constructor.web3.currentProvider)
    const nonce = await contractToSend.nonceOf(fromAccount)

    const signature = await web3.eth.sign(
      Web3.utils.soliditySha3(
        {
          type: 'bytes32',
          value: Web3.utils.keccak256(
            web3.eth.abi.encodeFunctionCall(abiVal, args),
          ),
        },
        {
          type: 'address',
          value: contractToSend.address,
        },
        {
          type: 'uint256',
          value: nonce,
        },
      ),
      fromAccount,
    )

    return contractToSend[method + 'For'](...args, fixSignature(signature))
  }

function fixSignature (signature) {
  // in geth its always 27/28, in ganache its 0/1. Change to 27/28 to prevent
  // signature malleability if version is 0/1
  // see https://github.com/ethereum/go-ethereum/blob/v1.8.23/internal/ethapi/api.go#L465
  let v = parseInt(signature.slice(130, 132), 16);
  if (v < 27) {
    v += 27;
  }
  const vHex = v.toString(16);
  return signature.slice(0, 130) + vHex;
}

module.exports = submitSigTransaction
