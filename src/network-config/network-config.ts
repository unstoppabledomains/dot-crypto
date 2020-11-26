import json from './network-config.json';

type ChainId = number;

type ContractName = 'Registry' | 'SignatureController' | 'MintingController' | 'WhitelistedMinter'
    | 'URIPrefixController' | 'DomainZoneController' | 'Resolver' | 'ProxyReader' | 'TwitterValidationOperator' | 'FreeMinter';

type Address = string;

type NetworkConfig = Readonly<{
    contracts: Readonly<Record<ContractName, { address: Address, legacyAddresses: ReadonlyArray<Address> }>>,
}>;

type Config = Readonly<{
    version: string,
    networks: Readonly<Record<ChainId, NetworkConfig>>,
}>;

const configCheck: Config = json;

export const ContractsConfig = json;
