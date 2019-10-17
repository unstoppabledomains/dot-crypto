# .crypto

Contracts and tools for .crypto.

## Developing

### Installation

First install the dependencies.

```sh
yarn install
```

Also install the 0.5.11 Solidity toolchain. [Install Page](https://solidity.readthedocs.io/en/v0.5.11/installing-solidity.html).

We also provide a deployment/interaction cli found in `src`. To use this cli, install, then:

```
yarn build
```

```sh
yarn link
```

You should now have a `dot-crypto` executable in your `$PATH`.

Now try:

```sh
dot-crypto --help
```

### CLI

The cli has some configuration inside `.cli-config.json`. Feel free to change these to fit you're needs.

Using the config `dot-crypto` will deploy a new set of contracts and overwrite the `.cli-config.json` file.

This also means that if you keep track of the step you can pause and resume deployment. e.g.

```
> dot-crypto
...
Step 4: ...
^C

> dot-crypto --step 4
... Resuming deployment
```

After deployment you can use the `call` command like this.

```sh
dot-crypto call sunriseController mintSLD label
```

```sh
dot-crypto call registry ownerOf $(dot-crypto call registry childOf $(dot-crypto call registry root) label)
```

### Tests

Run a ganache server in the background.

```sh
yarn rpc:ganache
```

Run the tests.

```sh
yarn test
```

## Inheritance Hierarchy

![Alt text](./inheritance.svg)

## High level bullet points

dot-crypto is a name registry similar to ZNS. See https://github.com/unstoppabledomains/zns

ZNS was inspired by ENS. See https://eips.ethereum.org/EIPS/eip-137.

Here are some of the characteristics we share.

- Domain storage as a hash, or `uint256`.

- Subdomain derivation is using the `namehash` alg.

- A resolver system.

It differs in a couple important ways.

- Domains are `ERC721` Tokens.

- Minting of domains is centralized.

- No rent/annual fee on purchased names. Once you own a domain you keep it.

  - Except for potentially trademarked domains.

- We are trademark "aware". Select names get flagged on minting using the
  `SunriseController`. We reserve the right to takedown sunrise names for an
  indeterminate period of time.

- Most non-erc721 logic is hosted inside a set of `Controller` contracts.

  - The registry has a set of controlled functions to interface with these controllers.
