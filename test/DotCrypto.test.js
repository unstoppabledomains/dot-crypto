const DotCrypto = artifacts.require('DotCrypto.sol')
const Web3 = require('web3')

async function deployDotCrypto() {
  const dotCryptoArtifact = await DotCrypto.deployed()

  const web3 = new Web3(dotCryptoArtifact.contract.currentProvider)

  const dotCrypto = new web3.eth.Contract(
    dotCryptoArtifact.abi,
    dotCryptoArtifact.address,
  )

  return dotCrypto
}

// TODO: same namehash? notice no keccak256 label
function namehash(name) {
  let node =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  if (name != '') {
    let labels = name.split('.')
    for (let i = labels.length - 1; i >= 0; i--) {
      node = Web3.utils.soliditySha3(node, labels[i])
    }
  }
  return node.toString()
}

const rootNode =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

contract('DotCrypto', () => {
  it('should deploy', async () => {
    const dotCrypto = await deployDotCrypto()

    const rootNodeOwner = await dotCrypto.methods
      .ownerOf('0x' + '0'.repeat(64))
      .call()
    console.log('rootNodeOwner:', rootNodeOwner)

    await dotCrypto.methods.mint(rootNodeOwner, rootNode, 'crypto').send({
      from: rootNodeOwner,
    })

    const cryptoOwner = await dotCrypto.methods
      .ownerOf(namehash('crypto'))
      .call()
    console.log('cryptoOwner:', cryptoOwner)

    // console.log(Object.keys(dotCrypto.methods))

    await dotCrypto.methods
      .resolveTo(
        '0x1234567890123456789012345678901234567890',
        namehash('crypto'),
      )
      .send({from: rootNodeOwner})

    const resolver = await dotCrypto.methods
      .resolverOf(namehash('crypto'))
      .call()
    console.log('resolver:', resolver)

    await dotCrypto.methods.burn(namehash('crypto')).send({
      from: rootNodeOwner,
    })

    const events = await dotCrypto.getPastEvents({fromBlock: 0})
    console.log(
      'events:',
      events.map(({event, returnValues}) => ({event, returnValues})),
    )

    // console.log(Object.keys(dotCrypto.methods))
  })
})
