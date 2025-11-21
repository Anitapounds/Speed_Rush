import { useMemo, useState, useEffect, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import "./App.css";
import SpeedRushGame from "./components/SpeedRushGame";
import CarMinting from "./components/CarMinting";
import CarStaking from "./components/CarStaking";
import CarSelectionPage from "./components/CarSelectionPage";
import WalletConnectButton from "./components/WalletConnectButton";
import { ToastContainer } from "./components/Toast";
import { useOneChainAccount } from "./hooks/useOneChainAccount";
import { useToast } from "./hooks/useToast";
import { nftCarService, type NFTCar } from "./services/nftCarService";

type View = "menu" | "game" | "minting" | "staking" | "garage";

export default function App() {
  const [view, setView] = useState<View>("menu");
  const [selectedCar, setSelectedCar] = useState<NFTCar | null>(null);
  const [userCars, setUserCars] = useState<NFTCar[]>([]);
  const { connected, shortAddress, address } = useOneChainAccount();
  const { toasts, removeToast, success, error, info, warning } = useToast();
  const isGameView = view === "game";

  
  const loadUserCars = useCallback(async () => {
    if (!address) {
      setUserCars([]);
      setSelectedCar(null);
      return;
    }
    try {
      const cars = await nftCarService.getUserCars(address);
      setUserCars(cars);
      
      if (cars.length > 0 && !selectedCar) {
        setSelectedCar(cars[0]);
      }
    } catch (err) {
      console.error("Failed to load cars:", err);
    }
  }, [address, selectedCar]);

  
  useEffect(() => {
    loadUserCars();
  }, [loadUserCars]);

  const headerTitle = useMemo(() => {
    switch (view) {
      case "minting":
        return "Mint Cars";
      case "staking":
        return "Stake Cars";
      case "garage":
        return "Garage";
      case "game":
        return "Racing Arena";
      default:
        return "Speed Rush";
    }
  }, [view]);

  const requireWallet = (target: View) => {
    if (!connected) {
      warning("Connect your OneChain wallet to access this feature.");
      return;
    }
    setView(target);
  };

  const startRace = () => {
    if (!connected) {
      warning("Connect your OneChain wallet to race.");
      return;
    }
    if (userCars.length === 0) {
      info("Please select a car from your garage first! Redirecting...");
      setTimeout(() => setView("garage"), 1500);
      return;
    }
    if (!selectedCar) {
      info("Please select a car from your garage first! Redirecting...");
      setTimeout(() => setView("garage"), 1500);
      return;
    }
    setView("game");
  };

  const handleCarSelected = (car: NFTCar) => {
    setSelectedCar(car);
    success(`${car.name} selected! Ready to race!`);
    setTimeout(() => setView("menu"), 1500);
  };

  const renderContent = () => {
    if (view === "menu") {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          <FeatureCard
            title="Start Racing"
            emoji="🏁"
            description={
              selectedCar
                ? `Racing with: ${selectedCar.name}`
                : "Select a car from your garage to start racing."
            }
            primaryLabel={selectedCar ? "Race Now!" : "Select Car First"}
            onPrimary={startRace}
          />
          <FeatureCard
            title="NFT Cars"
            emoji="🏎️"
            description="Mint beautifully crafted racing machines to expand your garage."
            primaryLabel="Mint Cars"
            onPrimary={() => requireWallet("minting")}
            secondaryLabel="View Garage"
            onSecondary={() => requireWallet("garage")}
          />
          <FeatureCard
            title="Car Staking"
            emoji="💰"
            description="Stake your NFT cars to accumulate SPEEDY rewards over time."
            primaryLabel="Stake Cars"
            onPrimary={() => requireWallet("staking")}
          />
        </div>
      );
    }

    if (view === "game") {
      return (
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <SpeedRushGame
            onExit={() => setView("menu")}
            selectedCar={selectedCar}
          />
        </div>
      );
    }

    if (view === "minting") {
      return (
        <Section title="Mint NFT Cars" onBack={() => setView("menu")}>
          <CarMinting
            onMintSuccess={loadUserCars}
            showToast={success}
            showError={error}
          />
        </Section>
      );
    }

    if (view === "staking") {
      return (
        <Section title="Car Staking" onBack={() => setView("menu")}>
          <CarStaking />
        </Section>
      );
    }

    return (
      <Section title="Garage" onBack={() => setView("menu")}>
        <div style={{ marginBottom: "16px" }}>
          {selectedCar && (
            <div
              style={{
                background: "rgba(255,215,0,0.1)",
                border: "1px solid rgba(255,215,0,0.3)",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              ✅ Currently Selected: <strong>{selectedCar.name}</strong>
            </div>
          )}
        </div>
        <CarSelectionPage
          onSelect={handleCarSelected}
          onNavigateToMinting={() => setView("minting")}
        />
      </Section>
    );
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg,#111428,#1c1b3a,#2c1840)",
          color: "#fff",
          overflow: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
      <header
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {view !== "menu" && (
            <button
              onClick={() => setView("menu")}
              style={{
                borderRadius: "999px",
                border: "none",
                padding: "8px 16px",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Menu
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: "28px" }}>⚡ {headerTitle}</h1>
            <p style={{ margin: 0, opacity: 0.7, fontSize: "14px" }}>
              Powered by OneChain Labs
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <WalletConnectButton />
        </div>
      </header>

      {isGameView ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {renderContent()}
        </div>
      ) : (
        <main
          style={{
            flex: 1,
            padding: "20px",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {renderContent()}
        </main>
      )}
      </div>
    </>
  );
}

interface FeatureCardProps {
  title: string;
  emoji: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

function FeatureCard({
  title,
  emoji,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: FeatureCardProps) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.35)",
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div style={{ fontSize: "40px" }}>{emoji}</div>
      <h2 style={{ margin: "10px 0" }}>{title}</h2>
      <p style={{ opacity: 0.75, minHeight: "60px" }}>{description}</p>
      <button style={primaryButtonStyle} onClick={onPrimary}>
        {primaryLabel}
      </button>
      {secondaryLabel && onSecondary && (
        <button style={secondaryButtonStyle} onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  onBack: () => void;
}

function Section({ title, children, onBack }: SectionProps) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.25)",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "20px",
        minHeight: "calc(100vh - 180px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button style={secondaryButtonStyle} onClick={onBack}>
          ← Back to Menu
        </button>
      </div>
      {children}
    </div>
  );
}

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg,#ffb347,#ffcc33)",
  color: "#1b1b1b",
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: "10px",
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  marginBottom: 0,
};