# Audit Summary

## Security

1. Locked token possible when sent to Registry contract

   - For now I don't care, could be fixed with an addition to the Minting Controller

## Trust

1. Whitelisted accounts can add/renounce a Minter

   - Whitelisted Minter

2. Label allowed to have "." (dot)

   - This is checkable by crosschecking the tokenURI?
   - Maybe we should just use tokenIds for the metadata server?

3. Multiple Minters/WhitelistAdmins possible

   - Whitelisted Minter

## Design

1. Unused \_tokenResolvers mapping
   - Fixed
2. Resolution.\_burn is never called.
   - It is Inside the ERC721Burnable contract
3. Unused imports
   - Fixed
4. Missing third "safe" mint functions
   - Fixed
5. Intermediate child can be burned
   - Can't be reasonably fix?
6. transferFromChildFor visibility could be external
   - Fixed
7. Fallback function is unnecessarily payable/Unnecessary Multiplexer
   - Fixed
8. Missing tokenId parameter in event Sync
   - Fixed
9. Missing sync call in setFor
   - Fixed
10. onlyController can be more specific
    - Maybe
11. Confusing name resolveSunriseSLD
    - Removed SunriseController
12. Missing error messages
    - Space constraints make this impossible
