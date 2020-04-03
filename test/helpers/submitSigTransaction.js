const Web3 = require('web3')

async function submitSigTransaction(contractToSend, contractToEncode, fromAccount, method, ...args) {
    const abiVal = contractToEncode.constructor._json.abi.find(v => v.name === method)
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

    return contractToSend[method + 'For'](...args, signature)
  }

module.exports = submitSigTransaction
