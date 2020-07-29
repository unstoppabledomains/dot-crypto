# Development

## Installation

First install the dependencies.

```sh
yarn install
```

Also install the 0.5.12 Solidity toolchain. [Install Page](https://solidity.readthedocs.io/en/v0.5.12/installing-solidity.html).

We also provide a deployment/interaction cli found in `src`. To use this cli, install, then:

```sh
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

## CLI

First compile the contracts.

```sh
yarn compile
```

The cli has some configuration inside `.cli-config.json`. Feel free to change these to fit you're needs.

Using the config `dot-crypto` will deploy a new set of contracts and overwrite the `.cli-config.json` file.

This also means that if you keep track of the step you can pause and resume deployment. e.g.

```sh
> dot-crypto
...
Step 4: ...
^C

> dot-crypto --step 4
... Resuming deployment
```

After deployment you can use the `call` command like this.

```sh
dot-crypto call sunriseController mintSLD 0x1a5363cA3ceeF73b1544732e3264F6D600cF678E label
```

```sh
dot-crypto call registry ownerOf $(dot-crypto call registry childOf $(dot-crypto call registry root) label)
```

## Tests

Ganache doesn't recover signatures correctly! As a result the tests are split up into `ganache-cli` and `geth -dev` tests.

## Run Ganache Tests

Run a ganache server in the background.

```sh
yarn rpc:ganache
```

Run the tests.

```sh
yarn test:ganache
```

Stop ganache server.

```sh
yarn rpc:stop
```

## Run Geth Tests

Run a geth dev server in the background.

```sh
yarn rpc:geth
```

Run the tests.

```sh
yarn test:geth
```

Stop geth server.

```sh
yarn rpc:stop
```
