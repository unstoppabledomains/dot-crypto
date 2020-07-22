# Architecture

## Prerequirements

.crypto domain names registry is based on the following technologies:

* Ethereum [Solidity Smart Contracts]() platform
* [ERC721]() standard
* Ethereum [JSON RPC]()

The person reading this document is expected to understand the bascis of those standards.

## Registry Essentials

The essential part of the Registry is to allow one to own a domain in a form of ERC721 token and associate records to it. 

A domain name is converted to a ERC721 token using the following algorithm.  See [Namehashing]() for more information.
The records have a key-value form. 
Multiple records with the same key are disallowed at the low level and have to be simulated in higher level. See [Standard Record Keys]().

In addition to this, the Registry design has a capability for flexible records managements that allows to implement any records management permission model.
The flexibility is achived by introducing a Resolver contract as a separated contract that can hold records and associating a domain record with a single resolver contract address.
Records can be associated to a domain ONLY via a Resolver contract. 

UD provides a default public resolver contract. See [Managing domain records]()
So the data structure of the registry looks in the following way (pseudocode):

``` solidity
// Mapping from ERC721 token ID to an resolver address
mapping (uint256 => address) internal _tokenResolvers;
// Maping from ERC721 token ID to an owner address
// Part of ERC721 standard
mapping (uint256 => address) internal _tokenOwners;
```

There are other strucutures available as part of ERC721 standard but they do not have any custom functionality on top. See the ERC721 standard for more information

Resolver data structure looks in the following way (pseudocode):

``` solidity
//Mapping of ERC721 token ID to key-value records mapping
mapping mapping (uint256 =>  mapping (string => string)) internal _records;
```

## Resolving a domain

Resolving a domain is a process of retrieving a domain name records when the domain name and required record names are given.
In order to resolve a domain, one would require to make 2 `eth_call` ethereum JSON RPC method calls:

1. Get resolver address via `Registry#resolverOf(tokenId)` where `tokenId` is a ERC721 token of a given domain
2. Get record values via `Resolver#getMany(keys, tokenId)` where `keys` are record names.

Pseudocode example in JavaScript: 

``` typescript
const RegistryAddress = "0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe";
const domain = "example.crypto";
const tokenId = namehash(domain)
const keys = ["crypto.ETH.address", "crypto.BTC.address"];
const resolverAddress = new EthContract(RegistryAddress).call("resolverOf", tokenId);
const values = new EthContract(resolverAddress).call("getMany", keys, tokenId);
keys.forEach((k, i) => console.log(k, values[i]));
```

Reference:

* `namehash` - namehashing algorithm implementation. See [Namehashing]().
* `EthContract#call` - Ethereum JSON RPC implementation for `eth_call` method. See [Ethereum JSON RPC]()

## Managing domain records

Domain records can be managed via default public resolver.
One can develop its own custom resolver with any management permissions defined. 

### Using Default Public Resolver

Default public resolver allows to manage all domain records for anyone given a permission over domain as per [ERC721 "Transfer Mechanism" section](). These includes:

* Owner address of a domain 
* Approved address for a domain
* Owner operator addresses

See ERC721 on how those permissions can be granted and revoked.

Records Management can be done via following Resolver methods:

### Deploying Custom Resolver

TODO

## Namehashing

Namehashing is an algorithm to convert a domain name in a clasical format (like `www.example.crypto`) to ERC721 token.
All .crypto ecosystem contracts accept domain name as a method argument in a form of ERC721 token.

Example implementation in JS: https://github.com/unstoppabledomains/resolution/blob/master/src/cns/namehash.ts
One can verify his implementation of namehashing algorithm using the following reference: https://github.com/unstoppabledomains/resolution/blob/master/src/Cns.test.ts#L130


On the registry side :
