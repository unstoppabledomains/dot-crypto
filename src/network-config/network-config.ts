import json from './network-config.json'

export type ChainId = number

export type ContractName =
  | 'Registry'
  | 'SignatureController'
  | 'MintingController'
  | 'WhitelistedMinter'
  | 'URIPrefixController'
  | 'DomainZoneController'
  | 'Resolver'
  | 'ProxyReader'
  | 'TwitterValidationOperator'

export type Address = string

export type NetworkConfig = Readonly<{
  contracts: Readonly<
    Record<
      ContractName,
      {address: Address; legacyAddresses: ReadonlyArray<Address>}
    >
  >
}>

export type Config = Readonly<{
  version: string
  networks: Readonly<Record<ChainId, NetworkConfig>>
}>

const configCheck: Config = json

export const ContractsConfig = json
