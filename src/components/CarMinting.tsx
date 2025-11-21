import { useEffect, useState } from "react";
import { CAR_TEMPLATES, nftCarService, type NFTCar } from "../services/nftCarService";
import { useOneChainAccount } from "../hooks/useOneChainAccount";
import { useSignAndExecuteTransaction } from "@onelabs/dapp-kit";

type TemplateId = keyof typeof CAR_TEMPLATES;

interface CarMintingProps {
  onMintSuccess?: () => void;
  showToast?: (message: string) => void;
  showError?: (message: string) => void;
}

export default function CarMinting({ onMintSuccess, showToast, showError }: CarMintingProps) {
  const { connected, address } = useOneChainAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [minting, setMinting] = useState<Record<string, boolean>>({});
  const [cars, setCars] = useState<NFTCar[]>([]);

  useEffect(() => {
    if (!address) {
      setCars([]);
      return;
    }
    nftCarService.getUserCars(address).then(setCars);
  }, [address]);

  const handleMint = async (templateId: TemplateId) => {
    if (!connected || !address) {
      showError?.("Connect your OneChain wallet to mint a racing car.");
      return;
    }

    setMinting((prev) => ({ ...prev, [templateId]: true }));

    try {
      const result = await nftCarService.mintCar(address, templateId, signAndExecute);
      if (result.success) {
        setCars((prev) => [result.car, ...prev]);
        showToast?.(`${result.car.name} minted successfully! TX: ${result.digest?.slice(0, 8)}...`);

        
        if (onMintSuccess) {
          await onMintSuccess();
        }
      }
    } catch (err) {
      showError?.(
        err instanceof Error ? err.message : "Minting failed. Please try again."
      );
    } finally {
      setMinting((prev) => ({ ...prev, [templateId]: false }));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "10px" }}>Mint NFT Cars</h2>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px" }}>
        Collect unique racing cars on OneChain. Each car comes with traits that
        influence staking rewards and racing performance.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {(Object.keys(CAR_TEMPLATES) as TemplateId[]).map((templateId) => {
          const template = CAR_TEMPLATES[templateId];

          
          const isOwned = cars.some(car => car.name === template.name);

          return (
            <div
              key={templateId}
              style={{
                background: "rgba(0,0,0,0.35)",
                border: `1px solid ${isOwned ? "rgba(0,255,0,0.3)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "12px",
                padding: "16px",
                position: "relative",
              }}
            >
              
              {isOwned && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(0,255,0,0.9)",
                    color: "#000",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    zIndex: 1,
                  }}
                >
                  ✓ Owned
                </div>
              )}

              <img
                src={template.image}
                alt={template.name}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  opacity: isOwned ? 0.7 : 1,
                }}
              />
              <h3 style={{ margin: "0 0 6px 0" }}>{template.name}</h3>
              <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
                {template.description}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                }}
              >
                <span>Speed: {template.traits.speed * 10}%</span>
                <span>Handling: {template.traits.handling * 10}%</span>
              </div>
              <button
                onClick={() => handleMint(templateId)}
                disabled={minting[templateId] || isOwned}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: isOwned
                    ? "rgba(100,100,100,0.5)"
                    : template.traits.rarity === "legendary"
                      ? "linear-gradient(135deg,#f2994a,#f2c94c)"
                      : "#4e54c8",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: isOwned ? "not-allowed" : "pointer",
                  opacity: (minting[templateId] || isOwned) ? 0.6 : 1,
                }}
              >
                {isOwned ? "✓ Already Owned" : minting[templateId] ? "Minting..." : "Mint Car"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Garage ({cars.length})</h3>
        {cars.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            No cars minted yet. Pick a model above to start your collection.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {cars.map((car) => (
              <div
                key={car.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <strong>{car.name}</strong>
                <p style={{ margin: "6px 0", fontSize: "12px" }}>
                  Minted: {new Date(car.mintedAt).toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  Status: {car.isStaked ? "⛓️ Staked" : "✅ Ready to race"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}