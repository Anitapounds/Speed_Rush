import { Transaction } from "@onelabs/sui/transactions";
import { SuiClient } from "@onelabs/sui/client";
import { bcs } from "@onelabs/sui/bcs";


export const CONTRACTS = {
  PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID,
  SPEEDY_TREASURY: import.meta.env.VITE_SPEEDY_TREASURY,
  MINTING_CONFIG: import.meta.env.VITE_MINTING_CONFIG,
  STAKING_POOL: import.meta.env.VITE_STAKING_POOL,
  CLOCK: import.meta.env.VITE_CLOCK_OBJECT || "0x6",
};


const RPC_URL = import.meta.env.VITE_ONECHAIN_RPC_URL || "https://rpc-testnet.onelabs.cc:443";

export interface RacingCar {
  id: string;
  name: string;
  description: string;
  image_url: string;
  rarity: number;
  model: string;
  color: string;
  top_speed: number;
  acceleration: number;
  handling: number;
  minted_at: number;
}

export interface StakeInfo {
  car_id: string;
  owner: string;
  rarity: number;
  staked_at: number;
  last_claim: number;
}

class BlockchainService {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({
      url: RPC_URL,
    });
  }

  
  async awardRaceTokens(
    walletAddress: string,
    distance: number,
    obstaclesAvoided: number,
    bonusBoxes: number
  ) {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACTS.PACKAGE_ID}::speedy_token::award_race_tokens`,
      arguments: [
        tx.object(CONTRACTS.SPEEDY_TREASURY),
        tx.pure.address(walletAddress),
        tx.pure.u64(distance),
        tx.pure.u64(obstaclesAvoided),
        tx.pure.u64(bonusBoxes),
      ],
    });

    return tx;
  }

  
  async awardWelcomeBonus(walletAddress: string) {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACTS.PACKAGE_ID}::speedy_token::award_welcome_bonus`,
      arguments: [tx.object(CONTRACTS.SPEEDY_TREASURY), tx.pure.address(walletAddress)],
    });

    return tx;
  }

  
  async mintFreeStarterCar(walletAddress: string) {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACTS.PACKAGE_ID}::racing_car_nft::mint_free_car`,
      arguments: [tx.object(CONTRACTS.MINTING_CONFIG), tx.pure.address(walletAddress)],
    });

    return tx;
  }

  
  async mintCar(
    name: string,
    model: string,
    color: string,
    rarity: number
  ) {
    const tx = new Transaction();

    
    const nameBytes = Array.from(new TextEncoder().encode(name));
    const modelBytes = Array.from(new TextEncoder().encode(model));
    const colorBytes = Array.from(new TextEncoder().encode(color));

    tx.moveCall({
      target: `${CONTRACTS.PACKAGE_ID}::racing_car_nft::mint_car`,
      arguments: [
        tx.object(CONTRACTS.MINTING_CONFIG),
        tx.pure(bcs.vector(bcs.U8).serialize(nameBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(modelBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(colorBytes)),
        tx.pure.u8(rarity),
      ],
    });

    return tx;
  }

  
  async stakeCar(carObjectId: string) {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACTS.PACKAGE_ID}::car_staking::stake_car`,
      arguments: [
        tx.object(CONTRACTS.STAKING_POOL),
        tx.object(carObjectId),
        tx.object(CONTRACTS.CLOCK),
      ],
    });

    return tx;
  }

  
  async claimRewards(carId: string) {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACTS.PACKAGE_ID}::car_staking::claim_rewards`,
      arguments: [
        tx.object(CONTRACTS.STAKING_POOL),
        tx.object(CONTRACTS.SPEEDY_TREASURY),
        tx.pure.id(carId),
        tx.object(CONTRACTS.CLOCK),
      ],
    });

    return tx;
  }

  
  async unstakeCar(stakedCarObjectId: string) {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACTS.PACKAGE_ID}::car_staking::unstake_car`,
      arguments: [
        tx.object(CONTRACTS.STAKING_POOL),
        tx.object(CONTRACTS.SPEEDY_TREASURY),
        tx.object(stakedCarObjectId),
        tx.object(CONTRACTS.CLOCK),
      ],
    });

    return tx;
  }

  
  async getUserCars(walletAddress: string): Promise<RacingCar[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: walletAddress,
        filter: {
          StructType: `${CONTRACTS.PACKAGE_ID}::racing_car_nft::RacingCar`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return objects.data.map((obj: any) => {
        const fields = obj.data?.content?.fields || {};
        return {
          id: obj.data.objectId,
          name: fields.name || "Unknown Car",
          description: fields.description || "",
          image_url: fields.image_url || "",
          rarity: fields.rarity || 0,
          model: fields.model || "",
          color: fields.color || "",
          top_speed: fields.top_speed || 0,
          acceleration: fields.acceleration || 0,
          handling: fields.handling || 0,
          minted_at: fields.minted_at || 0,
        };
      });
    } catch (error) {
      console.error("Error fetching user cars:", error);
      return [];
    }
  }

  
  async getStakedCars(walletAddress: string) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: walletAddress,
        filter: {
          StructType: `${CONTRACTS.PACKAGE_ID}::car_staking::StakedCar`,
        },
        options: {
          showContent: true,
        },
      });

      return objects.data.map((obj: any) => {
        const fields = obj.data?.content?.fields || {};
        const carFields = fields.car?.fields || {};
        return {
          stakedCarId: obj.data.objectId,
          car: {
            id: carFields.id?.id || "",
            name: carFields.name || "Unknown Car",
            rarity: carFields.rarity || 0,
            model: carFields.model || "",
            color: carFields.color || "",
            top_speed: carFields.top_speed || 0,
            acceleration: carFields.acceleration || 0,
            handling: carFields.handling || 0,
          },
        };
      });
    } catch (error) {
      console.error("Error fetching staked cars:", error);
      return [];
    }
  }

  
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.client.getBalance({
        owner: walletAddress,
        coinType: `${CONTRACTS.PACKAGE_ID}::speedy_token::SPEEDY_TOKEN`,
      });

      return parseInt(balance.totalBalance) / 1_000_000_000; 
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return 0;
    }
  }

  
  async calculatePendingRewards(carId: string): Promise<number> {
    try {
      const tx = new Transaction();

      const [rewards] = tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::car_staking::calculate_rewards`,
        arguments: [
          tx.object(CONTRACTS.STAKING_POOL),
          tx.pure.id(carId),
          tx.object(CONTRACTS.CLOCK),
        ],
      });

      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0",
      });

      
      
      return 0; 
    } catch (error) {
      console.error("Error calculating rewards:", error);
      return 0;
    }
  }

  
  async getTotalMinted(): Promise<number> {
    try {
      const config = await this.client.getObject({
        id: CONTRACTS.MINTING_CONFIG,
        options: { showContent: true },
      });

      const fields = (config.data?.content as any)?.fields || {};
      return fields.total_minted || 0;
    } catch (error) {
      console.error("Error fetching total minted:", error);
      return 0;
    }
  }

  
  async getTotalStaked(): Promise<number> {
    try {
      const pool = await this.client.getObject({
        id: CONTRACTS.STAKING_POOL,
        options: { showContent: true },
      });

      const fields = (pool.data?.content as any)?.fields || {};
      return fields.total_staked || 0;
    } catch (error) {
      console.error("Error fetching total staked:", error);
      return 0;
    }
  }
}

export const blockchainService = new BlockchainService();