import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { nftCarService, type NFTCar } from "../services/nftCarService";
import { useOneChainAccount } from "../hooks/useOneChainAccount";
import { useSignAndExecuteTransaction } from "@onelabs/dapp-kit";

interface StakingStats {
  carId: string;
  hoursStaked: number;
  pendingRewards: number;
}

export default function CarStaking() {
  const { connected, address } = useOneChainAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [cars, setCars] = useState<NFTCar[]>([]);
  const [stakedCars, setStakedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setCars([]);
      setStakedCars([]);
      return;
    }
    nftCarService.getUserCars(address).then(setCars);
    nftCarService.getStakedCars(address).then(setStakedCars);
  }, [address]);

  const stakingStats = useMemo(() => {
    const stats: StakingStats[] = [];
    const now = Date.now();
    for (const car of cars) {
      if (!car.isStaked || !car.stakingStartTime) continue;
      const hours =
        (now - car.stakingStartTime) / (1000 * 60 * 60);
      stats.push({
        carId: car.id,
        hoursStaked: hours,
        pendingRewards: Math.floor(hours * (car.traits.speed * 3)),
      });
    }
    return stats;
  }, [cars]);

  const refreshCars = async () => {
    if (address) {
      const latest = await nftCarService.getUserCars(address);
      setCars(latest);
    }
  };

  const performAction = async (
    action: "stake" | "unstake" | "claim",
    carOrStakedCar: any
  ) => {
    if (!connected || !address) {
      setError("Connect your wallet to manage staking.");
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      if (action === "stake") {
        await nftCarService.stakeCar(address, carOrStakedCar.id, signAndExecute);
        setFeedback(`${carOrStakedCar.name} is now staked and earning SPEEDY on-chain!`);
      } else if (action === "unstake") {
        const stakedCarId = carOrStakedCar.stakedCarId || carOrStakedCar.id;
        const result = await nftCarService.unstakeCar(address, stakedCarId, signAndExecute);
        setFeedback(
          `${carOrStakedCar.car?.name || carOrStakedCar.name} unstaked successfully! Rewards transferred to your wallet.`
        );
      } else {
        const carId = carOrStakedCar.car?.id || carOrStakedCar.id;
        const result = await nftCarService.claimStakingRewards(
          address,
          carId,
          signAndExecute
        );
        setFeedback(
          `Claimed rewards from ${carOrStakedCar.car?.name || carOrStakedCar.name}! Check your wallet.`
        );
      }
      await refreshCars();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process staking action."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Car Staking Pools</h2>
      <p style={{ color: "rgba(255,255,255,0.7)" }}>
        Stake your NFT cars to accumulate SPEEDY tokens over time. Rewards scale
        with rarity and how long the car stays in the pool.
      </p>

      {error && (
        <div
          style={{
            background: "rgba(220,53,69,0.2)",
            border: "1px solid rgba(220,53,69,0.5)",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {feedback && (
        <div
          style={{
            background: "rgba(23,162,184,0.2)",
            border: "1px solid rgba(23,162,184,0.5)",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {feedback}
        </div>
      )}

      {!connected && (
        <div
          style={{
            border: "1px dashed rgba(255,255,255,0.3)",
            padding: "16px",
            borderRadius: "12px",
            marginTop: "20px",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
          }}
        >
          Connect your wallet to view and stake your cars.
        </div>
      )}

      {connected && cars.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.7)" }}>
          No cars available yet. Mint a car first to begin staking.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {cars.map((car) => {
          const stats = stakingStats.find((s) => s.carId === car.id);
          return (
            <div
              key={car.id}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: car.isStaked
                  ? "rgba(40,167,69,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{car.name}</h3>
              <p style={{ margin: "4px 0", fontSize: "13px" }}>
                Rarity: {car.traits.rarity.toUpperCase()}
              </p>
              <p style={{ margin: "4px 0", fontSize: "13px" }}>
                Lifetime Rewards: {car.totalRewards.toLocaleString()} SPEEDY
              </p>

              {car.isStaked && stats ? (
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ margin: "4px 0", fontSize: "13px" }}>
                    Hours staked: {stats.hoursStaked.toFixed(2)}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "13px" }}>
                    Pending rewards: {stats.pendingRewards.toLocaleString()} SPEEDY
                  </p>
                </div>
              ) : (
                <p style={{ margin: "4px 0", fontSize: "13px" }}>
                  Status: Ready to earn
                </p>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {!car.isStaked ? (
                  <button
                    onClick={() => performAction("stake", car)}
                    disabled={loading}
                    style={primaryButtonStyle}
                  >
                    Stake Car
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => performAction("claim", car)}
                      disabled={loading}
                      style={secondaryButtonStyle}
                    >
                      Claim Rewards
                    </button>
                    <button
                      onClick={() => performAction("unstake", car)}
                      disabled={loading}
                      style={dangerButtonStyle}
                    >
                      Unstake
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const primaryButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: "120px",
  border: "none",
  borderRadius: "8px",
  padding: "10px",
  background: "linear-gradient(135deg,#00c9ff,#92fe9d)",
  color: "#0f1117",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
};

const dangerButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "rgba(220,53,69,0.8)",
  color: "#fff",
};