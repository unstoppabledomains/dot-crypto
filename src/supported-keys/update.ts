import SupportedKeys  from "./supported-keys.json";
import fetch from 'node-fetch';
import fs from 'fs';


type CoinGeckoCoin = {
  id: string,
  symbol: string,
  name: string
};

type CoinGeckoDetailCoin = CoinGeckoCoin & {
  platforms: {
    [key in string]: string
  }
}

type CoinGeckoPlatformDetail = {
  id: string,
  chain_identifier: number,
  name: string,
  shortname: string
}

type MultiChainMeta = {
  key: string;
  deprecatedKeyName: string;
  version: string;
  validationRegex: string | undefined;
}

type UpdatesMetaObject = {
  updatedKeys: Record<string, {validationRegex: string | null, deprecatedKeyName: string, deprecated: boolean}>,
  conflicts: Record<string, CoinGeckoDetailCoin>,
  newKeys: Record<string, {validationRegex: string | null, deprecatedKeyName: string, deprecated: boolean}>
}


const main = async (): Promise<void> => {
  const coins = await getFilteredCoins();
  const assetPlatforms = await getAssetPlatformsList();

  const updates = getUpdatedKeysFromCoins(coins, assetPlatforms);
  console.log(`Was ${Object.keys(SupportedKeys.keys).length} supported keys records`);
  console.log(`Become ${Object.keys(updates.updatedKeys).length} supported keys records`);
  console.log(`Total added keys: ${Object.keys(updates.newKeys).length}`);

  saveUpdates(updates);
}

const getFilteredCoins = async (): Promise<CoinGeckoDetailCoin[]> => {
  const coins = await getCoinsSortedByScore();
  const coinsListWithPlatforms = await getAllCoinsWithPlatforms();
  return coins.map(coin => coinsListWithPlatforms[coin.id]);
}

const getCoinsSortedByScore = async (): Promise<CoinGeckoCoin[]> => {
  // make 2 request to get the 500 coins
  return (await Promise.all([
    getCoinGeckoMarketsPage(0),
    getCoinGeckoMarketsPage(1)
  ])).reduce((a,v) => a.concat(v));
}

const getCoinGeckoMarketsPage = async (page: number): Promise<CoinGeckoCoin[]> => {
  const params = `vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`;
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params}`);
  if (response.status !== 200) {
    console.error(await response.json());
    throw new Error('Fetch Error on getting top 200 coins');
  }
  return response.json();
}

const getAllCoinsWithPlatforms = async (): Promise<{[key in string]: CoinGeckoDetailCoin}> => {
  const response = await fetch("https://api.coingecko.com/api/v3/coins/list?include_platform=true");
  if (response.status !== 200) {
    console.error(await response.json());
    throw new Error('Fetch Error on getting all coins with platforms');
  }
  const coinList: CoinGeckoDetailCoin[] = await response.json();
  const coinsMap: {[key in string]: CoinGeckoDetailCoin} = {};
  coinList.forEach(coin => {
    coinsMap[coin.id] = coin;
  });
  return coinsMap;
}

const getAssetPlatformsList = async (): Promise<CoinGeckoPlatformDetail[]> => {
  const response = await fetch("https://api.coingecko.com/api/v3/asset_platforms");
  if (response.status !== 200) {
    throw new Error('Fetch Error on getting AssetPlatforms List');
  }
  const platformList = await response.json() as CoinGeckoPlatformDetail[];
  // some of the platforms have long names, 
  // this makes sure they are compatable with the rest of the supported-keys file
  return platformList.map(platform => {
    switch(platform.id) {
      case 'ethereum':
        return {
          ...platform,
          shortname: 'ERC20'
        }
      case 'zilliqa':
        return {
          ...platform,
          shortname: 'ZIL'
        }
      case 'ethereum-classic':
        return {
          ...platform,
          shortname: 'ETC'
        }
      case 'binancecoin':
        return {
          ...platform,
          shortname: 'BEP2'
        }
      case 'binance-smart-chain':
        return {
          ...platform,
          shortname: 'BEP20'
        }
      case 'harmony-shard-0':
        return {
          ...platform,
          shortname: 'HRC20'
        }
      default: 
        return platform
    }
  })
}


const getUpdatedKeysFromCoins = (coins: CoinGeckoDetailCoin[], assetPlatforms: CoinGeckoPlatformDetail[]): UpdatesMetaObject => {
  let updatedKeys = {...SupportedKeys.keys};
  const newKeys = {};
  const conflicts = {};
  let coinCounter = 0;
  
  for (const coin of coins) {
    if (isMultiChainCoin(coin)) {
      const isExist = Object.keys(updatedKeys).find(key => key.includes(coin.symbol.toUpperCase()));
      if (isExist) {
        conflicts[coin.symbol] = coin;
        continue ;
      }
      coinCounter++;
      const multiChainMeta = getMultiChainMeta(coin, assetPlatforms);
      multiChainMeta.forEach(metaData => {
        if (updatedKeys[metaData.key] !== undefined) {
          return;
        }

        updatedKeys[metaData.key] = {
          "deprecatedKeyName": metaData.deprecatedKeyName,
          "validationRegex": metaData.validationRegex ?? null,
          "deprecated": false
        }
        newKeys[metaData.key] = updatedKeys[metaData.key];
      })
    } else {
      const key = `crypto.${coin.symbol.toUpperCase()}.address`;
      if (updatedKeys[key] !== undefined) {
        conflicts[coin.symbol] = coin;
        continue;
      }

      const platformId = Object.keys(coin.platforms)[0];
      const platform = getPlatform(platformId, assetPlatforms);
      const version = platform ? getVersion(platform) : '';
      const validationRegex = getValidationRegex(version);
      
      updatedKeys[key] = {
        "deprecatedKeyName": coin.symbol.toUpperCase(),
        "validationRegex": validationRegex ?? null,
        "deprecated": false
      }
      newKeys[key] = updatedKeys[key];
      coinCounter++;
    }
  }
  console.log(`added ${coinCounter} new coins`);
  return {updatedKeys, conflicts, newKeys};
}

const isMultiChainCoin = (coin: CoinGeckoDetailCoin): boolean => {
  return Object.keys(coin.platforms).length > 1
} 

const getMultiChainMeta = (coin: CoinGeckoDetailCoin, assetPlatforms: CoinGeckoPlatformDetail[]): MultiChainMeta[] => {
  const parseResult: MultiChainMeta[] = [];
  for (const [platformId, _] of Object.entries(coin.platforms)) {
    const platform = getPlatform(platformId, assetPlatforms);
    if (!platform) {
      console.error(`Platform ${platformId} didn't match platforms from CoinGecko`)
      continue ;
    }
    const symbol = coin.symbol.toUpperCase();
    const version = getVersion(platform);
    const validationRegex = getValidationRegex(version);

    parseResult.push({
      key: `crypto.${symbol}.version.${version}.address`,
      deprecatedKeyName: `${symbol}_${version}`,
      version,
      validationRegex
    });
  }
  return parseResult;
}

const getPlatform = (platformId: string, assetPlatforms: CoinGeckoPlatformDetail[]): CoinGeckoPlatformDetail | undefined => {
  return assetPlatforms.find(platformDetail => platformDetail.id === platformId);
}

const getVersion = (platform: CoinGeckoPlatformDetail): string => {
  return platform.shortname
  ? platform.shortname.replace(/\s/g, "").toUpperCase()
  : platform.name.replace(/\s/g, "").toUpperCase();
}

const getValidationRegex = (version: string): string | undefined => {
  const versionToRegexMap = {
    'OMNI': '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$',
    'EOS': '^[a-z][a-z1-5.]{10}[a-z1-5]$',
    'BEP2': '^(bnb|tbnb)[a-zA-HJ-NP-Z0-9]{39}$',
    'TRON': '^[T][a-zA-HJ-NP-Z0-9]{33}$',
    'BEP20': '^0x[a-fA-F0-9]{40}$',
    'ERC20': '^0x[a-fA-F0-9]{40}$',
    'HRC20': '^0x[a-fA-F0-9]{40}$',
    'OPERA': '^0x[a-fA-F0-9]{40}$',
    'FUSE': '^0x[a-fA-F0-9]{40}$',
  }

  return versionToRegexMap[version];
}

const saveUpdates = (updates: UpdatesMetaObject) => {
  const  { updatedKeys, conflicts } = updates;

  const versionParts = SupportedKeys.version.split('.');
  versionParts[2] = (Number(versionParts[2]) + 1).toString();
  const version = versionParts.join('.');
  const newFile = {
    version: version,
    keys: updatedKeys
  };
  fs.writeFileSync("./src/supported-keys/supported-keys.json", JSON.stringify(newFile));

  if (Object.keys(conflicts).length > 0) {
    console.log(`Found ${Object.keys(conflicts).length} conflicts, storing them under conflicts.json`);
    fs.writeFileSync("./src/supported-keys/conflicts.json", JSON.stringify(conflicts));
  }
}

main();