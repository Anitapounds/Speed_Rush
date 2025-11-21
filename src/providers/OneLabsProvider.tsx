"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@onelabs/dapp-kit";
import "@onelabs/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: {
    url: "https://rpc-testnet.onelabs.cc:443",
  },
});

interface OneLabsProviderProps {
  children: ReactNode;
}

export default function OneLabsProvider({ children }: OneLabsProviderProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}