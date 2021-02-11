import json from './supported-keys.json'

type Key = string

type KeyConfig = Readonly<{
  deprecatedKeyName: string | null
  validationRegex: string | null
  deprecated: boolean
}>

type Config = Readonly<{
  version: string,
  keys: Readonly<Record<Key, KeyConfig>>,
}>;

const configCheck: Config = json

export const SupportedKeys = json
