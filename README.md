# Speed Rush - Web3 Racing Game

A high-octane 3D racing game built on OneChain blockchain, featuring NFT cars, SPEEDY token economy, and car staking mechanics. Race through dynamic tracks, collect NFT cars with unique attributes, and earn rewards while staking your vehicles.

## Features

### Core Gameplay
- **3D Racing Experience** - Immersive racing gameplay powered by Three.js
- **Multiple Car NFTs** - Collect unique racing cars with different stats (Speed, Acceleration, Handling)
- **Dynamic Track Generation** - Race through procedurally generated tracks with obstacles
- **Real-time Performance** - Smooth 60 FPS gameplay with optimized rendering

### Web3 Integration
- **OneChain Blockchain** - Built on Sui-based OneChain network
- **NFT Car System** - Mint and own racing cars as NFTs with on-chain metadata
- **SPEEDY Token** - In-game currency for rewards and transactions
- **Car Staking** - Stake NFT cars to earn passive SPEEDY rewards
- **Wallet Integration** - Seamless OneChain wallet connection

### Honeycomb Protocol
- Integrated with Honeycomb Protocol for advanced NFT management
- Support for character systems, profiles, and resource management
- Comprehensive methods for asset transfers, staking, and missions

## Tech Stack

### Frontend
- **React 19.1** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Three.js** - 3D graphics rendering engine
- **@onelabs/dapp-kit** - OneChain blockchain integration
- **@tanstack/react-query** - Data fetching and state management

### Smart Contracts (Sui Move)
- **speedy_token.move** - SPEEDY token implementation
- **racing_car_nft.move** - NFT car minting and management
- **car_staking.move** - Staking pool for NFT cars

### Blockchain
- **OneChain Network** - Sui-based blockchain by OneLabs
- **Sui Move** - Smart contract language
- **@onelabs/sui** - Sui SDK integration

## Project Structure

```
honeycomb/
├── contracts/
│   └── Speed_Rush/
│       ├── sources/
│       │   ├── speedy_token.move      # Token contract
│       │   ├── racing_car_nft.move    # NFT car contract
│       │   └── car_staking.move       # Staking contract
│       └── tests/
│           └── speed_rush_tests.move
├── src/
│   ├── components/
│   │   ├── SpeedRushGame.tsx         # Main game component
│   │   ├── CarMinting.tsx            # NFT minting interface
│   │   ├── CarStaking.tsx            # Staking interface
│   │   ├── CarSelectionPage.tsx      # Garage/car selection
│   │   ├── WalletConnectButton.tsx   # Wallet connection
│   │   ├── Toast.tsx                 # Notification system
│   │   └── ErrorBoundary.tsx         # Error handling
│   ├── services/
│   │   ├── blockchainService.ts      # Blockchain interactions
│   │   ├── nftCarService.ts          # NFT car management
│   │   └── cardetails.json           # Car metadata
│   ├── hooks/
│   │   ├── useOneChainAccount.ts     # Wallet hook
│   │   └── useToast.ts               # Toast notifications
│   ├── utils/
│   │   ├── honeycombMethods.ts       # Honeycomb protocol methods
│   │   └── uploadNFTAssets.js        # Asset upload utility
│   ├── metadata/
│   │   ├── green.json                # Drift Master metadata
│   │   └── purple.json               # Titan Cruiser metadata
│   ├── providers/
│   │   └── OneLabsProvider.tsx       # OneChain provider
│   ├── types/
│   │   └── global.d.ts               # TypeScript definitions
│   ├── App.tsx                       # Main application
│   └── main.tsx                      # Entry point
├── .env.example                      # Environment template
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Sui CLI** (for contract deployment)
- **OneChain Wallet** (browser extension)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd honeycomb
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# OneChain Network Configuration
VITE_ONECHAIN_RPC_URL=https://rpc-testnet.onelabs.cc:443

# Speed Rush Smart Contract Addresses (OneChain Testnet)
VITE_PACKAGE_ID=0xd57b1600b098ebc1f96b73a1cca8c00e0d658e405c0499ab72f19969c039a65b
VITE_SPEEDY_TREASURY=0x9ca6e1115eac74ffeace894cd8c195952e91267dbbacf6847aeebd3d3c15ee31
VITE_MINTING_CONFIG=0x77287dcad7a8fe15be7021a665c89482132c4edf564a1c6049ef2bdff5e609e7
VITE_STAKING_POOL=0x968d65b0c738a7f8644d567656ff561e3f083b44500c4f3686f4fb43066d4228
VITE_CLOCK_OBJECT=0x6

# Game Configuration
VITE_ENABLE_NFT_CARS=true
VITE_ENABLE_STAKING=true
```

## Development

### Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## Smart Contract Deployment

For detailed deployment instructions, see [contracts/DEPLOYMENT.md](contracts/DEPLOYMENT.md)

### Quick Deployment

1. **Install Sui CLI**
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

2. **Configure OneChain Testnet**
```bash
sui client new-env --alias onechain-testnet --rpc https://rpc-testnet.onelabs.cc:443
sui client switch --env onechain-testnet
```

3. **Build and Publish Contracts**
```bash
cd contracts/Speed_Rush
sui move build
sui client publish --gas-budget 100000000
```

4. **Update Frontend Configuration**

Copy the package ID and object IDs from deployment output to your `.env` file.

## Available Cars

### 1. Drift Master (Green)
- **Speed**: 7/10
- **Acceleration**: 7/10
- **Handling**: 9/10
- **Description**: A balanced car with great handling for tight turns

### 2. Titan Cruiser (Purple)
- **Speed**: 6/10
- **Acceleration**: 4/10
- **Handling**: 10/10
- **Description**: A bulky car with massive control but slower acceleration

### 3. Nitro Runner (Red)
- **Speed**: 10/10
- **Acceleration**: 9/10
- **Handling**: 6/10
- **Description**: A high-speed racing machine with blazing acceleration

## Game Features

### Racing Arena
- Real-time 3D racing gameplay
- Obstacle avoidance mechanics
- Score tracking and performance metrics
- Dynamic difficulty scaling

### NFT Car Minting
- Mint unique racing car NFTs
- On-chain metadata and attributes
- Arweave image storage
- Multiple car types with different stats

### Car Staking
- Stake NFT cars to earn SPEEDY tokens
- Time-based reward calculation
- Flexible stake/unstake functionality
- Real-time reward tracking

### Garage System
- View all owned NFT cars
- Select active racing car
- Display car attributes and stats
- Manage car collection

## Honeycomb Protocol Integration

The project integrates Honeycomb Protocol for advanced NFT functionality:

### Available Methods
- **Asset Management**: Transfer, burn assets
- **User Management**: Create users, profiles
- **Character System**: Assemble characters, manage traits
- **Staking System**: Character staking, rewards
- **Mission System**: Send characters on missions
- **Resource Management**: Mint, burn, transfer resources
- **Badge System**: Initialize and claim badges

See [src/utils/honeycombMethods.ts](src/utils/honeycombMethods.ts) for full method list.

## Wallet Connection

1. Install [OneChain Wallet](https://onelabs.cc) browser extension
2. Create or import a wallet
3. Fund with testnet tokens from OneChain faucet
4. Click "Connect Wallet" in the app
5. Approve connection in wallet popup

## Testing

### Test Smart Contracts
```bash
cd contracts/Speed_Rush
sui move test
```

### Frontend Testing
The project uses the following for testing:
- TypeScript type checking
- ESLint for code quality
- React Error Boundaries for runtime errors

## Configuration

### Game Settings
Adjust game parameters in `src/components/SpeedRushGame.tsx`:
- Speed multipliers
- Obstacle frequency
- Track width
- Camera settings

### NFT Metadata
Update car metadata in:
- `src/metadata/green.json`
- `src/metadata/purple.json`
- `src/services/cardetails.json`

### Blockchain Settings
Configure network and contracts in:
- `.env` - Environment variables
- `src/services/blockchainService.ts` - Contract configuration

## Performance Optimization

- Three.js scene optimization for 60 FPS
- Lazy loading for components
- Memoized React components
- Efficient blockchain queries
- Asset preloading

## Security Considerations

- No private keys in frontend code
- All transactions require wallet approval
- Contract addresses validated
- Input sanitization for user data
- Rate limiting for blockchain calls

## Troubleshooting

### Wallet Connection Issues
- Ensure OneChain Wallet extension is installed
- Check that you're on OneChain testnet
- Refresh the page and try reconnecting

### Transaction Failures
- Verify sufficient gas balance
- Check contract addresses in `.env`
- Ensure wallet is connected
- Review browser console for errors

### Game Performance
- Enable hardware acceleration in browser
- Close unnecessary browser tabs
- Update graphics drivers
- Lower game quality settings if needed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Resources

- [OneChain Documentation](https://docs.onelabs.cc)
- [Sui Move Documentation](https://docs.sui.io/concepts/sui-move-concepts)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Documentation](https://react.dev)
- [Honeycomb Protocol](https://honeycomb.gg)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **OneChain Labs** - Blockchain infrastructure
- **Honeycomb Protocol** - NFT management framework
- **Sui Foundation** - Smart contract platform
- **Three.js Community** - 3D graphics engine

## Support

For issues or questions:
- GitHub Issues: Report bugs and feature requests
- OneChain Discord: Community support
- Documentation: Check the docs folder

---

Built with ⚡ by the Speed Rush Team

**Powered by OneChain Labs**
