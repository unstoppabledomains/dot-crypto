# .crypto

Contracts and tools for .crypto.

## Inheritance Hierarchy

![Alt text](./inheritance.svg)

## Registry Contracts

### Mine

Before you check out the contracts you should be familiar with ERC721/NFTs.

#### Metadata.sol

Complies with the ERC721 Metadata extension. Basically copy paste of Zeppelin
ERC721Metadata.sol. The only exception is that the `tokenURI` method appends the
`dotcrypto:` scheme.

- `name()`
- `symbol()`
- `tokenURI(uint256)`

#### Resolution.sol

Provides the resolver logic for dot crypto.

- `resolveTo(address,uint256)`
- `resolverOf(uint256)`

#### Registry.sol

Provides the initial relationship between parent and child nodes. Needs to be
fixed to use something other than `_mint`. Also lets people burn nodes.

- `assign(address,uint256,string)`
- `burn(uint256)`

#### RegistrySunrise.sol

Provides logic for trademark sunrise names.

- `openSunrise(address,uint256,string)`
- `closeSunrise(uint256,bool)`
- `sunriseOf(uint256)`
- `withdrawSunriseFundTo(address)`

#### RegistryRepresentative.sol

Provides logic for representatives to manage a the registry on an account's behalf.

- `assignFor(address,uint256,string,bytes)`
- `safeTransferFromFor(address,address,uint256,bytes,bytes)`
- `resolveToFor(address,uint256,bytes)`
- `burnFor(uint256,bytes)`
- `safeTransferFromFor(address,address,uint256,bytes)`
- `transferFromFor(address,address,uint256,bytes)`
- `nonceOf(address)`

#### PauseableRegistry.sol

Modifies internal registry methods to make them pauseable.

#### DotCrypto.sol

Is `Ownable` and provides the functionality to mint SLD domains.

- `assignSLD(address,string)`

### Open Zeppelin Contracts

https://docs.openzeppelin.com/contracts/2.x/

#### ERC721.sol

Check out: https://eips.ethereum.org/EIPS/eip-721
As well as: http://erc721.org

- `getApproved(uint256)`
- `approve(address,uint256)`
- `transferFrom(address,address,uint256)`
- `safeTransferFrom(address,address,uint256)`
- `ownerOf(uint256)`
- `balanceOf(address)`
- `setApprovalForAll(address,bool)`
- `safeTransferFrom(address,address,uint256,bytes)`
- `isApprovedForAll(address,address)`

#### Ownable.sol

- `owner()`
- `isOwner()`
- `transferOwnership(address)`
- `renounceOwnership()`

#### Pauseable.sol

- `unpause()`
- `renouncePauser()`
- `paused()`
- `pause()`
- `addPauser(address)`
- `isPauser(address)`
