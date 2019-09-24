# .crypto

## Registry Contracts

### Mine

#### Metadata.sol

- `name()`
- `symbol()`
- `tokenURI(uint256)`

#### Registry.sol

- `assign(address,uint256,string)`
- `burn(uint256)`

#### DotCrypto.sol

- `assignSLD(address,string)`

#### Resolution.sol

- `resolveTo(address,uint256)`
- `resolverOf(uint256)`

#### SunriseRegistry.sol

- `openSunrise(address,uint256,string)`
- `closeSunrise(uint256,bool)`
- `sunriseOf(uint256)`
- `withdrawSunriseFundTo(address)`

#### RepresentativeRegistry.sol

- `assignFor(address,uint256,string,bytes)`
- `safeTransferFromFor(address,address,uint256,bytes,bytes)`
- `resolveToFor(address,uint256,bytes)`
- `burnFor(uint256,bytes)`
- `safeTransferFromFor(address,address,uint256,bytes)`
- `transferFromFor(address,address,uint256,bytes)`
- `nonceOf(address)`

#### PauseableRegistry.sol

- `unpause()`
- `renouncePauser()`
- `paused()`
- `pause()`
- `addPauser(address)`
- `isPauser(address)`

### Open Zeppelin Contracts

#### ERC721.sol

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
