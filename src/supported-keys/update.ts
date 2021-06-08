import SupportedKeys  from "./supported-keys.json";
import fetch from 'node-fetch';
import fs from 'fs';

type CoinGeckoAllCoinsResponse = {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    [key in string]: string
  }
}
type CoinGeckoCoinDetailResponse = CoinGeckoAllCoinsResponse & { coingecko_score: number }
type CoinGeckoPlatformDetail = {
  id: string,
  chain_identifier: number,
  name: string,
  shortname: string
}

const main = async (): Promise<void> => {
  const coins = await getFilteredCoins(200);
  const assetPlatforms = await getAssetPlatformsList();
  
  const updatedSuppKeys = getUpdatedKeysFromCoins(coins, assetPlatforms);
  saveUpdates(updatedSuppKeys);
}

const getUpdatedKeysFromCoins = (coins: CoinGeckoCoinDetailResponse[], assetPlatforms: CoinGeckoPlatformDetail[]): any => {
  let updatedKeys = {...SupportedKeys.keys};
  for (const coin of coins) {
    if (isMultiChainCoin(coin)) {
      const multiChainKeys = getMultiChainKeys(coin, assetPlatforms);
      multiChainKeys.forEach(key => {
        if (!updatedKeys[key]) {
          updatedKeys[key] = {
            "deprecatedKeyName": null,
            "validationRegex": key.includes('ERC20') ? "^0x[a-fA-F0-9]{40}$" : null,
            "deprecated": false
          }
          console.log(`added the following: ${key}`);
        }
      })
    } else {
      const key = `crypto.${coin.symbol.toUpperCase()}.address`;
      if (!updatedKeys[key]) {
        updatedKeys[key] = {
          "deprecatedKeyName": null,
          "validationRegex": coin.platforms['ethereum'] ? "^0x[a-fA-F0-9]{40}$" : null,
          "deprecated": false
        }
        console.log(`added the following: ${key}`);
      }
    }
  }
  return updatedKeys;
}

const isMultiChainCoin = (coin: CoinGeckoCoinDetailResponse): boolean => {
  return Object.keys(coin.platforms).length > 1
} 

const getMultiChainKeys = (coin: CoinGeckoCoinDetailResponse, assetPlatforms: CoinGeckoPlatformDetail[]): string[] => {
  const keys: string[] = [];
  for (const [platformId, _] of Object.entries(coin.platforms)) {
    const platform = assetPlatforms.find(platformDetail => platformDetail.id === platformId);
    if (!platform) {
      console.error(`Platform ${platformId} didn't match platforms from CoinGecko`)
      continue ;
    }

    let version = platform.shortname
      ? platform.shortname.replace(/\s/g, "").toUpperCase()
      : platform.name.replace(/\s/g, "").toUpperCase()
    version = version === 'ETH' ? 'ERC20' : version;

    keys.push(`crypto.${coin.symbol.toUpperCase()}.version.${version}.address`);
  }
  return keys;
}

const saveUpdates = (updatedKeys: {
  [key in string]: {
    deprecatedKeyName: string, validationRegex: string | null, deprecated: boolean
  }}) => {
  const versionParts = SupportedKeys.version.split('.');
  versionParts[2] = (Number(versionParts[2]) + 1).toString();
  const version = versionParts.join('.');
  const newFile = {
    version: version,
    keys: updatedKeys
  };
  fs.writeFileSync("./src/supported-keys/supported-keys.json", JSON.stringify(newFile));
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
          shortname: 'ETH'
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
      default: 
        return platform
    }
  })
}

const getFilteredCoins = async (upTo?: number): Promise<CoinGeckoCoinDetailResponse[]> => {
  const coins = await getAllCoins();
  const coinsWithRating: CoinGeckoCoinDetailResponse[] =  []
  console.log("Fetching coins details");
  for (const coin of coins) {
    const details = await getCoinDetails(coin.id);
    coinsWithRating.push(details);
    // Due to CoinGecko limit rate we make 2 request and wait 1.5 second
    if (coinsWithRating.length % 2 === 0) {
      console.log(`Progress: ${(( coinsWithRating.length / coins.length ) * 100).toPrecision(4)}%`);
      await delay(1500);
    }
  }
  coinsWithRating.sort((coinA, coinB) => coinB.coingecko_score - coinA.coingecko_score);
  return coinsWithRating.splice(0, upTo);
}

const getAllCoins = async (): Promise<CoinGeckoAllCoinsResponse[]> => {
  console.log("Fetching coins");
  const response = await fetch("https://api.coingecko.com/api/v3/coins/list?include_platform=true");
  if (response.status !== 200) {
    console.error(await response.json());
    throw new Error('Fetch Error on getting all coins');
  }
  return response.json();
}

const getCoinDetails = async (coinId: string): Promise<CoinGeckoCoinDetailResponse> => {
  const params = 'localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false';
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?${params}`);
  if (response.status !== 200) {
    console.error(await response.json());
    throw new Error(`Fetch Error on getting coin ${coinId} details`);
  }
  return response.json();
}

const delay = (ms: number) => {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

main();