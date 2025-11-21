import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@onelabs/dapp-kit";
import type { ComponentProps, MouseEvent } from "react";

type ButtonProps = ComponentProps<"button">;

interface WalletConnectButtonProps extends ButtonProps {
  labelWhenDisconnected?: string;
}

export default function WalletConnectButton({
  labelWhenDisconnected = "Connect Wallet",
  children,
  disabled,
  onClick,
  type = "button",
  style,
  ...rest
}: WalletConnectButtonProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: disconnect, isPending } = useDisconnectWallet();

  const connectedLabel =
    currentAccount?.address && children === undefined
      ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
      : children ?? labelWhenDisconnected;

  if (currentAccount) {
    const handleDisconnect = async (
      event: MouseEvent<HTMLButtonElement>
    ) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      await disconnect();
    };

    return (
      <button
        type={type}
        {...rest}
        onClick={handleDisconnect}
        disabled={disabled || isPending}
        style={{
          padding: "10px 18px",
          borderRadius: "999px",
          border: "none",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          ...style,
        }}
      >
        {isPending ? "Disconnecting..." : connectedLabel}
      </button>
    );
  }

  return (
    <ConnectModal
      trigger={
        <button
          type={type}
          {...rest}
          disabled={disabled}
          style={{
            padding: "10px 18px",
            borderRadius: "999px",
            border: "none",
            background: "#ffb347",
            color: "#1b1b1b",
            fontWeight: 700,
            cursor: "pointer",
            ...style,
          }}
        >
          {children ?? labelWhenDisconnected}
        </button>
      }
    />
  );
}