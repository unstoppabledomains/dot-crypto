const DotCrypto = artifacts.require('registry/DotCrypto.sol')
const Web3 = require('web3')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

async function deployDotCrypto() {
  const dotCryptoArtifact = await DotCrypto.deployed()

  const web3 = new Web3(dotCryptoArtifact.contract.currentProvider)

  const dotCrypto = new web3.eth.Contract(
    dotCryptoArtifact.abi,
    dotCryptoArtifact.address,
  )

  return dotCrypto
}

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

describe('DotCrypto', () => {
  contract('', ([coinbase, address2, ...addresses]) => {
    it.only('should deploy', () => deployDotCrypto())

    it('should deploy', async () => {
      const dotCrypto = await deployDotCrypto()

      const rootNodeOwner = await dotCrypto.methods
        .ownerOf(namehash('crypto'))
        .call()
      expect(rootNodeOwner).to.equal(
        '0x000000000000000000000000000000000000dEaD',
      )

      console.log(
        'gas:',
        await dotCrypto.methods
          .assignSLD(address2, 'label')
          .estimateGas({from: coinbase}),
      )

      await dotCrypto.methods
        .assignSLD(coinbase, 'label')
        .send({from: coinbase, gas: '100000'})

      const labelCryptoOwner = await dotCrypto.methods
        .ownerOf(namehash('label.crypto'))
        .call()
      expect(labelCryptoOwner).to.equal(coinbase)

      await dotCrypto.methods
        .assign(coinbase, namehash('label.crypto'), 'subdomain')
        .send({from: coinbase, gas: '100000'})

      let subdomainLabelCryptoOwner = await dotCrypto.methods
        .ownerOf(namehash('subdomain.label.crypto'))
        .call()
      expect(subdomainLabelCryptoOwner).to.equal(coinbase)

      await dotCrypto.methods
        .safeTransferFrom(
          coinbase,
          address2,
          namehash('subdomain.label.crypto'),
        )
        .send({from: coinbase, gas: '100000'})

      subdomainLabelCryptoOwner = await dotCrypto.methods
        .ownerOf(namehash('subdomain.label.crypto'))
        .call()
      expect(subdomainLabelCryptoOwner).to.equal(address2)

      await dotCrypto.methods
        .resolveTo(address2, namehash('label.crypto'))
        .send({from: coinbase, gas: '100000'})

      labelCryptoResolver = await dotCrypto.methods
        .resolverOf(namehash('label.crypto'))
        .call()
      expect(labelCryptoResolver).to.equal(address2)

      const events = await dotCrypto.getPastEvents({fromBlock: 0})
      console.log(
        'events:',
        events.map(({event, returnValues}) => [
          event,
          Object.keys(returnValues).reduce((a, v) => {
            if (!/^\d+$/.test(v)) {
              a[v] = returnValues[v]
            }
            return a
          }, {}),
        ]),
      )

      console.log(
        'methods:',
        Object.keys(dotCrypto.methods).filter(v => v.endsWith(')')),
      )
    })
  })

  describe('DotCrypto', () => {
    contract('assignSLD()', ([coinbase, address2, ...addresses]) => {
      it('should assign subdomain', async () => {
        const dotCrypto = await deployDotCrypto()

        await dotCrypto.methods
          .assignSLD(coinbase, 'label')
          .send({from: coinbase, gas: '100000'})

        const owner = await dotCrypto.methods
          .ownerOf(namehash('label.crypto'))
          .call()
        expect(owner).to.equal(coinbase)
      })
    })
  })

  describe('Registry', () => {
    contract('assign()', ([coinbase, address2, ...addresses]) => {
      it('should assign subdomain', async () => {
        const dotCrypto = await deployDotCrypto()

        await dotCrypto.methods
          .assignSLD(coinbase, 'label')
          .send({from: coinbase, gas: '100000'})

        await dotCrypto.methods
          .assign(coinbase, namehash('label.crypto'), 'subdomain')
          .send({from: coinbase, gas: '100000'})

        const owner = await dotCrypto.methods
          .ownerOf(namehash('subdomain.label.crypto'))
          .call()
        expect(owner).to.equal(coinbase)
      })

      it('should fail to assign subdomain if tokenId not owned', async () => {
        const dotCrypto = await deployDotCrypto()
        expect(
          dotCrypto.methods
            .assign(coinbase, namehash('label.crypto'), 'subdomain')
            .send({from: coinbase, gas: '100000'}),
        ).to.be.rejectedWith(Error)
      })
    })
  })

  describe('Resolution', () => {
    contract(
      'resolveTo(address,uint256)|resolverOf(uint256)',
      ([coinbase, address2, ...addresses]) => {
        it('should set resolver address', async () => {
          const dotCrypto = await deployDotCrypto()

          await dotCrypto.methods
            .assignSLD(coinbase, 'label')
            .send({from: coinbase, gas: '100000'})

          await dotCrypto.methods
            .resolveTo(address2, namehash('label.crypto'))
            .send({from: coinbase})

          const resolver = await dotCrypto.methods
            .resolverOf(namehash('label.crypto'))
            .call()

          expect(resolver).to.equal(address2)
        })

        it('should fail to get resolver address if no token exists', async () => {
          const dotCrypto = await deployDotCrypto()

          expect(
            dotCrypto.methods.resolverOf(namehash('no exist')).call(),
          ).to.be.rejectedWith(Error)
        })

        it('should fail to set resolver address if not OAO', async () => {
          const dotCrypto = await deployDotCrypto()

          expect(
            dotCrypto.methods
              .resolveTo(address2, namehash('crypto'))
              .send({from: address2}),
          ).to.be.rejectedWith(Error)
        })

        it('should fail to set resolver address if no token', async () => {
          const dotCrypto = await deployDotCrypto()

          expect(
            dotCrypto.methods
              .resolveTo(address2, namehash('no exist'))
              .send({from: address2}),
          ).to.be.rejectedWith(Error)
        })
      },
    )
  })

  describe('Metadata', () => {
    contract('tokenURI(uint256)', ([coinbase, address2, ...addresses]) => {
      it('should get tokenUri', async () => {
        const dotCrypto = await deployDotCrypto()

        const tokenUri = await dotCrypto.methods
          .tokenURI(namehash('crypto'))
          .call()
        expect(tokenUri).to.equal('dotcrypto:crypto.')
      })

      it('should fail to get tokenUri if no token exists', async () => {
        const dotCrypto = await deployDotCrypto()

        expect(
          dotCrypto.methods.tokenURI(namehash('no exist')).call(),
        ).to.be.rejectedWith(Error)
      })
    })

    contract('name()', ([coinbase, address2, ...addresses]) => {
      it('should get name', async () => {
        const dotCrypto = await deployDotCrypto()

        const name = await dotCrypto.methods.name().call()
        expect(name).to.equal('.crypto')
      })
    })

    contract('symbol()', ([coinbase, address2, ...addresses]) => {
      it('should get symbol', async () => {
        const dotCrypto = await deployDotCrypto()

        const symbol = await dotCrypto.methods.symbol().call()
        expect(symbol).to.equal('UDC')
      })
    })
  })
})
