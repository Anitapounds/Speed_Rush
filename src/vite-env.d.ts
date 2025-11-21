/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONECHAIN_RPC_URL: string;
  readonly VITE_PACKAGE_ID: string;
  readonly VITE_SPEEDY_TREASURY: string;
  readonly VITE_MINTING_CONFIG: string;
  readonly VITE_STAKING_POOL: string;
  readonly VITE_CLOCK_OBJECT: string;
  readonly VITE_ENABLE_NFT_CARS: string;
  readonly VITE_ENABLE_STAKING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}