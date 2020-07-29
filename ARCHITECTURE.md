# Architecture

## Pre-requirements

.crypto domain names registry is based on the following technologies:

Required to resolve a domain:

* [JSON](https://www.json.org/json-en.html) - standard data interchange format in web
* [SHA-3](https://en.wikipedia.org/wiki/SHA-3) - modern secure cryptographic hashing algorithm
* [Solidity ABI](https://solidity.readthedocs.io/en/v0.6.11/abi-spec.html) - function call parameters encoding/decoding algorithm
* [Ethereum JSON RPC](https://eth.wiki/json-rpc/API) - access ethereum blockchain data via JSON RPC interface

Additionally required to manage domain records, transfer domains to other owner address and configure management permission:

* [EIP-721](https://eips.ethereum.org/EIPS/eip-721) - ERC-721 Non-Fungible Token Standard
* [Ethereum Transactions](https://docs.ethhub.io/using-ethereum/transactions/) - executing blockchain transactions

The person reading this document is expected to understand the basics of those standards.

TODO: Add high level diagram on Ethereum infrastructure

## Registry Essentials

The essential part of the registry is to allow one to own a domain and associate records to it. 
Domain ownership is held in a form of ERC721 token.

A domain name is converted to an ERC721 token using a [Namehashing](#namehashing) algorithm.
The records have a key-value form. 
**Multiple records with the same key are unsupported** at the low level and have to be simulated in higher level. See [Records Reference](#records-reference). An attempt to add a record that already exist on resolver will result in record value being overwritten.

In addition to this, the registry design has a capability for flexible records managements that allows to implement any records management permission model.
The flexibility is achieved by introducing a Resolver contract as a separated contract that can hold records and associating a domain with a single resolver contract address.
Records can be associated to a domain ONLY via a Resolver contract. 
A single resolver can hold records for multiple domains.

UD provides a default public resolver contract. See [Managing domain records](#management)
So the data structure of the registry looks in the following way (pseudocode):

``` solidity
// Mapping from ERC721 token ID to a resolver address
mapping (uint256 => address) internal _tokenResolvers;
// Maping from ERC721 token ID to an owner address
// Part of ERC721 standard
mapping (uint256 => address) internal _tokenOwners;
```

Registry is a "singleton" contract and only exists in a single instance deployed at [0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe](https://etherscan.io/address/0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe)

There are other structures available as part of ERC721 standard but they do not have any custom functionality on top. See the ERC721 standard for more information on additional permission data stored on the registry.

Resolver data structure looks in the following way (pseudocode):

``` solidity
//Mapping of ERC721 token ID to key-value records mapping
mapping (uint256 =>  mapping (string => string)) internal _records;
```

<div id="domain-resolution"></div>

## Resolving a domain

Resolving a domain is a process of retrieving a domain records when the domain name and required record names are given.
There is no limitation on who can read domain records on Registry side. Anyone having an access to Ethereum Node on the mainnet can resolve a domain.

Resolving a domain requires a software to have an access to ethereum network. See [Network Configuration](#network-configuration) for more information

In order to resolve a domain, one would require to make 2 `eth_call` ethereum JSON RPC method calls:

1. Get resolver address via `Registry#resolverOf(tokenId)` where `tokenId` is a ERC721 token of a given domain
2. Get record values via `Resolver#getMany(keys, tokenId)` where `keys` are record names.

Pseudocode example in JavaScript: 

``` typescript
const RegistryAddress = "0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe";
const domain = "example.crypto";
const tokenId = namehash(domain)
const keys = ["crypto.ETH.address", "crypto.BTC.address"];
const resolverAddress = ethCall(RegistryAddress, "resolverOf", tokenId);
const values = ethcall(resolverAddress, "getMany", keys, tokenId);
keys.forEach((k, i) => console.log(k, values[i]));
```

Reference:

* `namehash` - namehashing algorithm implementation. See [Namehashing](#namehashing).
* `echCall` - Ethereum JSON RPC implementation for `eth_call` method. See [Ethereum JSON RPC](https://eth.wiki/json-rpc/API#eth_call)

See [Records Reference](#records-reference) for more information on which specific records to query.

### Record Value Validation

Crypto resolver doesn't have any built-in record value validation when it is updated for two reasons:

* Any validation would require additional gas to be paid
* Solidity is special purpose programming language that doesn't have any built-in data validation tools like Regular Expressions

Any domain management application must perform record format validation before submitting a transaction.
However, there is no guarantee that all management application will do it correctly. 
That is why records must be validated when domain is resolved too.

See [Records Reference](#records-reference) for more information for the validator of each record.

<div id="network-configuration"></div>

### Configuring Ethereum Network connection

Domain Resolution Configuration at low level requires 3 configuration parameters:

1. Ethereum JSON RPC provider
2. Ethereum CHAIN ID
3. Crypto Registry Contract Address

Ethereum JSON RPC provider is an API implementing Ethereum JSON RPC standard. Usually, it is given in a form of HTTP API end point. However, other forms may exist in case when ethereum node is launched locally.

Ethereum CHAIN ID is an ID of ethereum network a node is connected to. Each RPC provider can only be connected to one network. There is only one production network with CHAIN ID equal to `1` and called `mainnet`. Other networks are only used for testing purposes of a different kind. See [EIP-155](https://eips.ethereum.org/EIPS/eip-155) for more information. CHAIN ID of an ethereum node can be determined by calling [net_version method](https://eth.wiki/json-rpc/API#net_version) on JSON RPC which should be used as a default when only JSON RPC provider is given.

Crypto Registry Contract Address is an actual address of a contract deployed. There is only one production registry address on the mainnet: [0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe](https://etherscan.io/address/0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe). This address should be used as a default for mainnet configuration.

### Retrieving all records

Current Resolver allows one to retrieve all crypto records of a domain. However, due to some limitation of Ethereum Technology and gas price optimizations on management, it comes with a significant performance downside requiring one to do at least 3 queries to blockchain. In case when a domain has 1000+ records or large records changing history, it can require more.

TODO: describe the algorithm

<div id="management"></div>

## Managing domain records 

Domain records can be managed via default public resolver.
One can develop its own custom resolver with any management permissions defined. 

### Using Default Public Resolver

Default public resolver allows to manage all domain records for any address given a permission over domain as per [ERC721 "Transfer Mechanism"](https://eips.ethereum.org/EIPS/eip-721) section. These includes:

* Owner address of a domain 
* Approved address for a domain
* Owner's operator addresses

See ERC721 on how those permissions can be granted and revoked.
Any records change is submitted as a signed as a [ethereum blockchain transaction](https://ethereum.org/en/whitepaper/#messages-and-transactions). 

Records Management can be done via [Resolver methods](https://github.com/unstoppabledomains/dot-crypto/blob/master/contracts/IResolver.sol):

### Meta-transactions support

Most Registry and Resolver methods have a [meta-transaction](https://docs.openzeppelin.com/learn/sending-gasless-transactions) support. Generally meta-transactions allow to separate a transaction signer address from a transaction funding address. It allows to separate the address that approve a transaction to happen from an address that pays a gas fee for the transaction.

For each management method, there is a method with meta-transaction support that has `For` suffix at the end. Example: `resetFor` is a meta-transaction version of `reset`. This method has an additional `signature` argument as a last parameter. A meta-transaction method checks the permission for a domain against the address that generated the signature argument, unlike base method that checks it against Solidity `_sender` keyword.

TODO: more information on how meta-transaction signature can be generated.

### Deploying Custom Resolver

TODO

<div id="namehashing"></div>

## Namehashing Domain Name

Namehashing is an algorithm that converts a domain name in a classical format (like `www.example.crypto`) to ERC721 token id.
All .crypto ecosystem contracts accept domain name as a method argument in a form of ERC721 token.

Namehashing is defined as a part of [EIP-137](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-137.md#namehash-algorithm) standard.

Example implementation in JS: https://github.com/unstoppabledomains/resolution/blob/master/src/cns/namehash.ts
One can verify his implementation of namehashing algorithm using the following reference table:

| Domain Name               | ERC721 Token                                                          |
|---------------------------|-----------------------------------------------------------------------|
| .                         | `0x0000000000000000000000000000000000000000000000000000000000000000`  |
| crypto                    | `0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f`  |
| example.crypto            | `0xd584c5509c6788ad9d9491be8ba8b4422d05caf62674a98fbf8a9988eeadfb7e`  |
| www.example.crypto        | `0x3ae54ac25ccd63401d817b6d79a4a56ae7f79a332fe77a98fa0c9d10adf9b2a1`  |
| welcome.to.ukraine.crypto | `0x8c2503ec1678c38aea1bb40b2c878feec5ba4807ab16293cb53cbf0b9a8a0533`  |

<div id="records-reference"></div>

## Records Reference 

TODO

### Crypto Payments

TODO

<div id='dns-records'></div>

### DNS records

Resolver records may contain classical DNS records besides other records. In order to distinguish those from other crypto records, the `browser.dns.*` namespace is used.  So DNS `A` corresponds to `browser.dns.A` crypto record. Any [listed DNS record](https://en.wikipedia.org/wiki/List_of_DNS_record_types) as per RFC standards is supported. All record names must follow upper case naming convention.

As crypto resolver doesn't support multiple records with the same key, but DNS does allow that, DNS record value must always be stored as [JSON](http://json.org) serialized array of strings. 
Example 1: a domain that needs one `CNAME` record set to `example.com.` must be configured as one crypto record `browser.dns.CNAME` set to `["example.com."]`.
Example 2: a domain that needs two `A` records set to `10.0.0.1` and `10.0.0.2` must be configured as one crypto record `browser.dns.A` set to `["10.0.0.1","10.0.0.2"]`.

No other data transformation is required when converting a traditional DNS record into Crypto record other than aggregating records with the same name to one record using serialization as JSON array of strings.

TODO: confirm the following paragraphs with DNS technology experts

Crypto records do not have a support for TTL at the moment. Ethereum blockchain has a built-in distribution system that automatically synchronizes updates and doesn't require TTL.

Crypto records do not have a domain name associated to them. That is why there is no feature of storing your subdomain records inside a parent domain.
Example: `www.example.com` record can only be set inside the same domain name but never inside `example.com`.

<div id="ipfs-records"></div>

### IPFS records

Crypto resolvers currently has 2 records that store information about IPFS resolution:

1. `ipfs.html.value` - stores [IPFS content hash](https://docs.ipfs.io/concepts/content-addressing/#identifier-formats) of a website that suppose to be displayed in Dapp Browser
2. `ipfs.redirect_domain.value` - stores an URL that a browser should redirect to if it doesn't support IPFS content display.


## Security and Permission

TODO

### Ethereum Network Security

### Domain Ownership protection

### Sub-domains permission
