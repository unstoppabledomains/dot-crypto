import json from './network-config.json';

type ChainId = number;

type ContractName = 'CNSRegistry' | 'SignatureController' | 'MintingController' | 'WhitelistedMinter'
    | 'URIPrefixController' | 'DomainZoneController' | 'Resolver' | 'ProxyReader' | 'TwitterValidationOperator' | 'FreeMinter';

type Address = string;
type BlockNumber = string;

type NetworkConfig = Readonly<{
    contracts: Readonly<Record<ContractName, { address: Address, legacyAddresses: ReadonlyArray<Address>, deploymentBlock: BlockNumber }>>,
}>;

type Config = Readonly<{
    version: string,
    networks: Readonly<Record<ChainId, NetworkConfig>>,
}>;

const configCheck: Config = json;

export const ContractsConfig = json;
