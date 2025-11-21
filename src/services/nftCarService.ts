import { blockchainService } from "./blockchainService";
import type { RacingCar } from "./blockchainService";
import { useSignAndExecuteTransaction } from "@onelabs/dapp-kit";

export interface CarTraits {
  speed: number;
  handling: number;
  acceleration: number;
  durability: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface NFTCar {
  id: string;
  mintAddress: string;
  owner: string;
  name: string;
  description: string;
  image: string;
  traits: CarTraits;
  mintedAt: number;
  isStaked: boolean;
  stakingStartTime: number | null;
  totalRewards: number;
}

const RARITY_MAP: Record<number, "common" | "rare" | "epic" | "legendary"> = {
  0: "common",
  1: "rare",
  2: "epic",
  3: "legendary",
};

export const CAR_TEMPLATES: Record<
  string,
  Omit<
    NFTCar,
    | "id"
    | "mintAddress"
    | "owner"
    | "mintedAt"
    | "isStaked"
    | "stakingStartTime"
    | "totalRewards"
  >
> = {
  nitrorunner: {
    name: "Nitro Runner",
    image: "https://arweave.net/AUgjbSGUbXzvjfX_0y2hHG9mVRH1Syk_ZI0iqmN8OAw",
    description: "A high-speed racing machine with blazing acceleration",
    traits: {
      speed: 10,
      handling: 6,
      acceleration: 9,
      durability: 5,
      rarity: "legendary",
    },
  },
  driftmaster: {
    name: "Drift Master",
    image: "https://arweave.net/zsDN0qpQw49dlVGIV5J84qONMlIBz29QmCI2RzSN4R0",
    description: "A balanced car with great handling for tight turns",
    traits: {
      speed: 7,
      handling: 9,
      acceleration: 7,
      durability: 7,
      rarity: "rare",
    },
  },
  titancruiser: {
    name: "Titan Cruiser",
    image: "https://arweave.net/JDrAc2F2v5fPROokIQLiXuQhFaiXPQK2R_Ly4jRDtmc",
    description: "A bulky car with massive control but slower acceleration",
    traits: {
      speed: 6,
      handling: 10,
      acceleration: 4,
      durability: 9,
      rarity: "rare",
    },
  },
};

const STAKING_RATES: Record<CarTraits["rarity"], number> = {
  common: 1,
  rare: 3,
  epic: 10,
  legendary: 25,
};

type TemplateId = keyof typeof CAR_TEMPLATES;

class NFTCarService {
  private convertToNFTCar(
    car: RacingCar,
    owner: string,
    isStaked: boolean = false
  ): NFTCar {
    const rarity = RARITY_MAP[car.rarity] || "common";
    return {
      id: car.id,
      mintAddress: car.id,
      owner,
      name: car.name,
      description: car.description,
      image: car.image_url,
      traits: {
        speed: car.top_speed,
        handling: car.handling,
        acceleration: car.acceleration,
        durability: (car.top_speed + car.handling + car.acceleration) / 3,
        rarity,
      },
      mintedAt: car.minted_at,
      isStaked,
      stakingStartTime: null,
      totalRewards: 0,
    };
  }

  async getUserCars(owner: string): Promise<NFTCar[]> {
    if (!owner) return [];
    try {
      const cars = await blockchainService.getUserCars(owner);
      return cars.map((car) => this.convertToNFTCar(car, owner, false));
    } catch (error) {
      console.error("Error fetching user cars:", error);
      return [];
    }
  }

  async mintCar(owner: string, templateId: TemplateId, signAndExecute: any) {
    if (!owner) {
      throw new Error("Wallet not connected");
    }
    const template = CAR_TEMPLATES[templateId];
    if (!template) {
      throw new Error("Unknown car template");
    }

    try {
      const rarityMap: Record<string, number> = {
        common: 0,
        rare: 1,
        epic: 2,
        legendary: 3,
      };

      const rarity = rarityMap[template.traits.rarity] || 0;

      const tx = await blockchainService.mintCar(
        template.name,
        template.name,
        "Red",
        rarity
      );

      const result = await signAndExecute({
        transaction: tx,
      });

      if (result.digest) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const cars = await this.getUserCars(owner);
        const newCar = cars[0];

        return {
          success: true,
          mintAddress: newCar.id,
          car: newCar,
          digest: result.digest,
        };
      } else {
        throw new Error("Transaction failed - no digest returned");
      }
    } catch (error) {
      console.error("Error minting car:", error);
      throw error;
    }
  }

  async stakeCar(owner: string, carMint: string, signAndExecute: any) {
    if (!owner) throw new Error("Wallet not connected");

    try {
      const tx = await blockchainService.stakeCar(carMint);
      const result = await signAndExecute({
        transaction: tx,
      });

      if (result.digest) {
        return { success: true, digest: result.digest };
      } else {
        throw new Error("Staking transaction failed - no digest returned");
      }
    } catch (error) {
      console.error("Error staking car:", error);
      throw error;
    }
  }

  async unstakeCar(
    owner: string,
    stakedCarObjectId: string,
    signAndExecute: any
  ) {
    if (!owner) throw new Error("Wallet not connected");

    try {
      const tx = await blockchainService.unstakeCar(stakedCarObjectId);
      const result = await signAndExecute({
        transaction: tx,
      });

      if (result.digest) {
        return { success: true, rewards: 0, digest: result.digest };
      } else {
        throw new Error("Unstaking transaction failed - no digest returned");
      }
    } catch (error) {
      console.error("Error unstaking car:", error);
      throw error;
    }
  }

  async claimStakingRewards(owner: string, carId: string, signAndExecute: any) {
    if (!owner) throw new Error("Wallet not connected");

    try {
      const tx = await blockchainService.claimRewards(carId);
      const result = await signAndExecute({
        transaction: tx,
      });

      if (result.digest) {
        return { success: true, rewardsEarned: 0, digest: result.digest };
      } else {
        throw new Error(
          "Claim rewards transaction failed - no digest returned"
        );
      }
    } catch (error) {
      console.error("Error claiming rewards:", error);
      throw error;
    }
  }

  async getStakedCars(owner: string) {
    if (!owner) return [];
    try {
      return await blockchainService.getStakedCars(owner);
    } catch (error) {
      console.error("Error fetching staked cars:", error);
      return [];
    }
  }

  async getTokenBalance(owner: string): Promise<number> {
    if (!owner) return 0;
    try {
      return await blockchainService.getTokenBalance(owner);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return 0;
    }
  }
}

export const nftCarService = new NFTCarService();
