# Speed Rush Contract Deployment Guide

## Prerequisites

1. Install Sui CLI:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

2. Set up OneChain testnet:
```bash
sui client new-env --alias onechain-testnet --rpc https://rpc-testnet.onelabs.cc:443
sui client switch --env onechain-testnet
```

3. Fund your wallet with testnet tokens from OneChain faucet

## Deployment Steps

### 1. Build the contracts
```bash
cd contracts/Speed_Rush
sui move build
```

### 2. Publish the package
```bash
sui client publish --gas-budget 100000000
```

After publishing, you'll receive:
- **Package ID**: The address of your published package
- **GameTreasury**: The SPEEDY token treasury object
- **MintingConfig**: The NFT minting configuration object
- **StakingPool**: The car staking pool object

### 3. Update Frontend Configuration

Edit `src/services/blockchainService.ts` and update the CONTRACTS object:

```typescript
export const CONTRACTS = {
  PACKAGE_ID: "0xYOUR_PACKAGE_ID", // From step 2
  SPEEDY_TREASURY: "0xYOUR_TREASURY_ID", // From step 2
  MINTING_CONFIG: "0xYOUR_MINTING_CONFIG_ID", // From step 2
  STAKING_POOL: "0xYOUR_STAKING_POOL_ID", // From step 2
  CLOCK: "0x6", // Standard Sui Clock object
};
```

### 4. Initialize the System

After deployment, initialize your treasury with tokens:

```bash
# Mint initial SPEEDY supply (example: 1 million SPEEDY)
sui client call \
  --package YOUR_PACKAGE_ID \
  --module speedy_token \
  --function mint \
  --args YOUR_TREASURY_ID 1000000000000000 \
  --gas-budget 10000000
```

## Contract Addresses

After deployment, save these addresses:

```
Package ID:
GameTreasury (SPEEDY Token):
MintingConfig (NFT Cars):
StakingPool (Car Staking):
```

## Testing on Testnet

1. Connect your OneChain wallet to the app
2. Mint a free starter car
3. Claim welcome bonus (100 SPEEDY)
4. Play the game to earn more SPEEDY
5. Stake your car to earn passive rewards

## Mainnet Deployment

When ready for mainnet:

1. Switch to OneChain mainnet:
```bash
sui client new-env --alias onechain-mainnet --rpc https://rpc-mainnet.onelabs.cc:443
sui client switch --env onechain-mainnet
```

2. Repeat deployment steps with mainnet wallet
3. Update frontend configuration with mainnet addresses
4. Test thoroughly before public launch

## Security Notes

- The `admin` address in GameTreasury, MintingConfig, and StakingPool should be a secure multisig wallet
- Consider using a timelock for admin functions
- Audit smart contracts before mainnet deployment
- Set reasonable mint limits and reward rates

## Support

For issues or questions, visit:
- OneChain Labs Documentation: https://docs.onelabs.cc
- Sui Move Documentation: https://docs.sui.io/concepts/sui-move-concepts
