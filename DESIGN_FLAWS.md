# .crypto Design Flaws



## Solvable only by redeploying the registry


### Shared resolver records are not reset on transfer

Issue can only be solved by clear guidance that shared resolver needs to be reset when it is being used by new owner after domain was transfered from previous owner.

### Shared resolver records are not reset on resolver assignment

This can be a feature or a bug: when new resolver is assigned to the domain, it might already have records which maybe a feature or a problem (see previous point)


### Registry#Transfer event doesn't identify if resolver was reset for the domain

`Transfer` event identifies the owner being change for the domain, however it doesn't identify if the resolver was also set to `0x00` or it was just the owner change. Requires manual check current resolver of a domain on `Transfer` event

## Solvable by introducing new resolver


### Custom records can not be mirrored

When resolver notifies registry about record being set via Registry#sync, it encodes the key using one way encryption.

### Resolver setPreset is not synced with registry


Can be solved by enabling `Registry#sync` call with some special `key` name (e.g. `_`) identying that all of the resolver records were reset for the domain

### Resolver need reconfigure and reconfigureFor methods

This methods would combine calls to #reset+#setMany which should simplify some end user flows requiring 1 signature and 1 tx instead of 2.
