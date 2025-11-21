import { useCurrentAccount } from "@onelabs/dapp-kit";
import { useMemo } from "react";

export function useOneChainAccount() {
  const currentAccount = useCurrentAccount();
  const address = currentAccount?.address ?? null;

  const shortAddress = useMemo(() => {
    if (!address) {
      return null;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  return {
    account: currentAccount,
    address,
    shortAddress,
    connected: Boolean(address),
  };
}