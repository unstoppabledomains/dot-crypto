import json from './supported-keys.json'

type Key = string

type KeyConfig = Readonly<{
  deprecatedKeyName: string
  validationRegex?: string
  deprecated?: boolean
}>

type Config = Readonly<Record<Key, KeyConfig>>

const configCheck: Config = json

export const ContractsConfig = json
