import { useEffect, useState } from "react";
import { nftCarService, type NFTCar } from "../services/nftCarService";
import { useOneChainAccount } from "../hooks/useOneChainAccount";

interface Props {
  onSelect?: (car: NFTCar) => void;
  onNavigateToMinting?: () => void;
}

export default function CarSelectionPage({ onSelect, onNavigateToMinting }: Props) {
  const { address, connected } = useOneChainAccount();
  const [cars, setCars] = useState<NFTCar[]>([]);

  useEffect(() => {
    if (!address) {
      setCars([]);
      return;
    }
    nftCarService.getUserCars(address).then(setCars);
  }, [address]);

  if (!connected) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Connect your wallet to view your garage.
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div style={{ fontSize: "64px" }}>🏎️</div>
        <h2 style={{ margin: 0, color: "#fff" }}>No Cars in Your Garage</h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", maxWidth: "400px" }}>
          You need to mint at least one NFT car before you can select it for racing.
          Head to the minting page to get your first racing machine!
        </p>
        {onNavigateToMinting && (
          <button
            onClick={onNavigateToMinting}
            style={{
              padding: "14px 32px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg,#ffb347,#ffcc33)",
              color: "#1b1b1b",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: "10px",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            🏁 Mint Your First Car
          </button>
        )}
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return { border: "#ffd700", glow: "0 0 20px rgba(255, 215, 0, 0.5)" };
      case "epic":
        return { border: "#9d4edd", glow: "0 0 15px rgba(157, 78, 221, 0.4)" };
      case "rare":
        return { border: "#3a86ff", glow: "0 0 12px rgba(58, 134, 255, 0.3)" };
      default:
        return { border: "rgba(255,255,255,0.15)", glow: "none" };
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0" }}>Select Your Racing Car</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: "15px" }}>
          Click on any car to select it for racing
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {cars.map((car) => {
          const rarityStyle = getRarityColor(car.traits.rarity);
          return (
            <button
              key={car.id}
              onClick={() => onSelect?.(car)}
              style={{
                textAlign: "left",
                borderRadius: "16px",
                border: `2px solid ${rarityStyle.border}`,
                background: "linear-gradient(135deg, rgba(0,0,0,0.5), rgba(20,20,40,0.6))",
                padding: "0",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: rarityStyle.glow,
                overflow: "hidden",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = `${rarityStyle.glow}, 0 8px 24px rgba(0,0,0,0.4)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = rarityStyle.glow;
              }}
            >
              
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: rarityStyle.border,
                  color: car.traits.rarity === "common" ? "#000" : "#fff",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  zIndex: 1,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                {car.traits.rarity}
              </div>

              
              <div
                style={{
                  width: "100%",
                  height: "180px",
                  background: `url(${car.image}) center/cover`,
                  borderBottom: `2px solid ${rarityStyle.border}`,
                  position: "relative",
                }}
              >
                
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  }}
                />
              </div>

              
              <div style={{ padding: "16px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.6,
                    marginBottom: "4px",
                    fontFamily: "monospace",
                  }}
                >
                  ID: #{car.mintAddress.slice(-6)}
                </div>

                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {car.name}
                </h3>

                
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginTop: "12px",
                  }}
                >
                  <StatBar
                    label="Speed"
                    value={car.traits.speed}
                    color="#ff6b6b"
                  />
                  <StatBar
                    label="Handling"
                    value={car.traits.handling}
                    color="#4ecdc4"
                  />
                  <StatBar
                    label="Acceleration"
                    value={car.traits.acceleration}
                    color="#ffe66d"
                  />
                  <StatBar
                    label="Durability"
                    value={car.traits.durability}
                    color="#a8dadc"
                  />
                </div>

                
                <div
                  style={{
                    marginTop: "16px",
                    padding: "10px",
                    background: `linear-gradient(135deg, ${rarityStyle.border}, ${rarityStyle.border}dd)`,
                    borderRadius: "8px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: car.traits.rarity === "common" ? "#000" : "#fff",
                  }}
                >
                  SELECT THIS CAR
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          opacity: 0.7,
          marginBottom: "4px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: "6px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: color,
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ fontSize: "12px", marginTop: "2px", fontWeight: 600 }}>
        {value}%
      </div>
    </div>
  );
}