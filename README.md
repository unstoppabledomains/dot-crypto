# .crypto

Crypto Registry Naming Service (CNS) is a naming service implemented using Ethereum Smart Contract Platform.
Each name inside CNS has a format of a domain name in `.crypto` top level domain space. Like `example.crypto`

## Documentation:

* [Architecture](./ARCHITECTURE.md) - detailed overview on CNS design
* [Browser Resotuion](./BROWSER_RESOLUTION_HOWTO.md) - Resolving CNS domain in a browser howto
* [Development Guide](./DEVELOPMENT.md) - Developer's guide on smart contract source code development and deployment
* [Records Reference](./RECORDS_REFERENCE.md) - A table of all possible records that can be set for CNS domains


## Deployed Smart Contracts addresses

### Mainnet
| Contract Name            | Ethereum Addresses                                                                         |
|--------------------------|--------------------------------------------------------------------------------------------|
| `Registry`               | 0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe                                                 |
| `SignatureController`    | 0x82EF94294C95aD0930055f31e53A34509227c5f7                                                 |
| `MintingController`      | 0xb0EE56339C3253361730F50c08d3d7817ecD60Ca                                                 |
| `WhitelistedMinter`      | 0xB485D89aBA096Fc9F117fA28B80dC8AAC7971049                                                 |
| `URIPrefixController`    | 0x09B091492759737C03da9dB7eDF1CD6BCC3A9d91                                                 |
| `Resolver` **(default)** | 0xb66DcE2DA6afAAa98F2013446dBCB0f4B0ab2842                                                 |
| `Resolver` **(legacy)**  | 0xa1cac442be6673c49f8e74ffc7c4fd746f3cbd0d, <br>0x878bc2f3f717766ab69c0a5f9a6144931e61aed3 |
| `DomainZoneController`   | 0xeA70777e28E00E81f58b8921fC47F78B8a72eFE7                                                 |
