# .crypto

[![Unstoppable Domains Documentation](https://img.shields.io/badge/docs-unstoppabledomains.com-blue)](https://docs.unstoppabledomains.com/)

Crypto Registry Naming Service (CNS) is a naming service implemented using Ethereum Smart Contract Platform.
Each name inside CNS has a format of a domain name in `.crypto` top level domain space. Like `example.crypto`.

CNS's goal is to be an alternative to classical domain names system (DNS) by fixing its core downsides:

- Censorship Resistance
- Ensure permanent ownership of the domain by the owner
- Decentralized registration
- Decentralized access

CNS documentation is available at [docs.unstoppabledomains.com](https://docs.unstoppabledomains.com/).

## Getting started

If you're interested in contributing or compiling/testing the smart contracts, see our [development guide](./DEVELOPMENT.md).

### Resolution libraries

Available domain resolution libraries to retrieve crypto registry data:

- [resolution.js](https://github.com/unstoppabledomains/resolution)
- [resolution-java](https://github.com/unstoppabledomains/resolution-java)

Work in progress:

- [resolution-swift](https://github.com/unstoppabledomains/resolution-swift)

These libraries are only set to read data from crypto registry making them lightweight and fit for most application that do not require domain management compatibilities.

<div id="deployed-contracts"></div>

## Deployed Smart Contracts addresses

### Mainnet

| Contract Source                                                          | Ethereum Addresses                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Registry](./contracts/Registry.sol)                                     | [0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe](https://etherscan.io/address/0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe)                                                                                                                           |
| [SignatureController](./contracts/controllers/SignatureController.sol)   | [0x82EF94294C95aD0930055f31e53A34509227c5f7](https://etherscan.io/address/0x82EF94294C95aD0930055f31e53A34509227c5f7)                                                                                                                           |
| [MintingController](./contracts/controllers/MintingController.sol)       | [0xb0EE56339C3253361730F50c08d3d7817ecD60Ca](https://etherscan.io/address/0xb0EE56339C3253361730F50c08d3d7817ecD60Ca)                                                                                                                           |
| [WhitelistedMinter](./contracts/util/WhitelistedMinter.sol)              | [0xB485D89aBA096Fc9F117fA28B80dC8AAC7971049](https://etherscan.io/address/0xB485D89aBA096Fc9F117fA28B80dC8AAC7971049)                                                                                                                           |
| [URIPrefixController](./contracts/controllers/URIPrefixController.sol)   | [0x09B091492759737C03da9dB7eDF1CD6BCC3A9d91](https://etherscan.io/address/0x09B091492759737C03da9dB7eDF1CD6BCC3A9d91)                                                                                                                           |
| [DomainZoneController](./contracts/controllers/DomainZoneController.sol) | [0xeA70777e28E00E81f58b8921fC47F78B8a72eFE7](https://etherscan.io/address/0xeA70777e28E00E81f58b8921fC47F78B8a72eFE7)                                                                                                                           |
| [Resolver](./contracts/Resolver.sol)                                     | [0xb66DcE2DA6afAAa98F2013446dBCB0f4B0ab2842](https://etherscan.io/address/0xb66DcE2DA6afAAa98F2013446dBCB0f4B0ab2842)                                                                                                                           |
| Resolver **(legacy)**                                                    | [0xa1cac442be6673c49f8e74ffc7c4fd746f3cbd0d](https://etherscan.io/address/0xa1cac442be6673c49f8e74ffc7c4fd746f3cbd0d) <br>[0x878bc2f3f717766ab69c0a5f9a6144931e61aed3](https://etherscan.io/address/0x878bc2f3f717766ab69c0a5f9a6144931e61aed3) |
| [ProxyReader](./contracts/ProxyReader.sol)                               | [0x7ea9Ee21077F84339eDa9C80048ec6db678642B1](https://etherscan.io/address/0x7ea9Ee21077F84339eDa9C80048ec6db678642B1)                                                                                                                           |

## Coding guidelines

Common rules for smart contract development.

### Metadata

It is useful to use `Version` of smart contracts, it helps analyzing deployed contract. Besides versions it is useful to receive `Name` of smart contract, when the contract is not verified.

```
    string public constant NAME = 'Unstoppable Whitelisted Minter';
    string public constant VERSION = '0.1.0';
```

We agreed to use three-part version number. Semantic - `{major}.{minor}.{patch}`

Each smart contract update should lead version change.

### Error messages

As a good practice reverting transaction must be with a message. We agreed to use error codes with `<contract_name>: <error_code>` naming convention.

`contract_name` allows to understand place where the error were thrown (eg `Reslover`)

`error_code` should be in uppercase with underscores. It have next structure: `{noun}_{verb}` (eg `RECEIVER_IS_EMPTY`)

Example of reverting code:

```
require(receiver != address(0x0), "WhitelistedMinter: RECEIVER_IS_EMPTY");
```
