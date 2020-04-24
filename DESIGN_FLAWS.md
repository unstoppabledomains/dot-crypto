# .crypto Design Flaws

## Solvable only by redeploying the registry

### Fundamental

#### Shared resolver records are not reset on transfer

Issue can only be solved by clear guidance that shared resolver needs to be reset when it is being used by new owner after domain was transfered from previous owner.

#### Shared resolver records are not reset on resolver assignment

This can be a feature or a bug: when new resolver is assigned to the domain, it might already have records which maybe a feature or a problem (see previous point)


#### Registry#Transfer event doesn't identify if resolver was reset for the domain

`Transfer` event identifies the owner being change for the domain, however it doesn't identify if the resolver was also set to `0x00` or it was just the owner change. Requires manual check current resolver of a domain on `Transfer` event


#### Minting subdomains doesn't check for valid label.

`Registry#_childId` should check that label doesn't contain `.`. Minting such domains results in invalid `tokenId` to be generated and minted which makes problems when generating a mirror.

Other characters that may not be a part of the domain name are also unchecked like emoji or special characters.

Characters category:

* lower case letters
* allowed/unallowed special characters
* `.`

#### No error messages

`require` calls on regisry do not have any error message specified.

#### Bulk manage functionality

Add the ability to bulk-transfer or bulk-assign resolver to many domains at once.

### Internal tokenId nonce is not consistent with acocunt nonce

Suppose one has signed a tx using his account nonce to execute a TX.
If this tx is not executed by any reason and user now manages his domain using internal tokenId nonce afterwards, it means that lost transaction can be reexecuted any time.

Ideally the use of tx with internal tokenId nonce should invalidate all txs using account nonce and vice versa.


### Cosmetical

#### Sync event has tokeinId paramters not on the first position

Ideally, we need to move `tokenId` parameters of `Sync` event that will allow us to query all events of the registry associated to given token. Currently this is impossible.

#### NewURI event doesn't contain initial owner

Currently, we need to listen for 2 events: `NewURI` and `Transfer` in order to get the information how a new domain was minted.
`Transfer` event is part of ERC721. We can not modify it, but we can add the initial owner information into `NewURI` event.

#### Additional convinience methods

* `setupOf(tokenId)` - return owner and resolver address of a domain with single query instead of two
* `ownersOf(tokenIds string[])` - return list of owner addresses for given domains
* `resolversOf(tokenIds string[])`
* `setupsOf(tokenIds: string[])`


## Solvable by introducing new resolver

### Ability to set record for multiple domains

User may want to set ipfs hash for all domains he owns.
That would require him to generate as many signature as there are domains at the moment.
We need a method like:

```
setManyToEachFor(tokenIds, keys, values, signature)
```

# SOLVED

### Custom records can not be mirrored

When resolver notifies registry about record being set via Registry#sync, it encodes the key using one way encryption.

Solution: add encoded keys mapping.

```
{keccak256(key) => key}
```

### Resolver setPreset is not synced with registry


Can be solved by enabling `Registry#sync` call with some special `key` name (e.g. `_`) identying that all of the resolver records were reset for the domain

### Resolver need reconfigure and reconfigureFor methods

This methods would combine calls to #reset+#setMany which should simplify some end user flows requiring 1 signature and 1 tx instead of 2.


### Inability to fetch all records for given domain

Current solidity specification doesn't allow to return the whole mapping as the result of function call and doesn't allow to get all keys from mapping. It can be solved by introducing a mapping to store all record names currently set for domain in the following format:

```
tokenId => presetId => recordKey[]
```

### Put tokenId to the first place for all events

Ethereum has the ability to filter events by parameters, but only using their positions. We need to put tokenId as first parameter on all events. We need to put `tokenId` event parameter to the first place to allow easy filter for all events associated to the same tokenId regardless of event type.

