import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ message, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(message.id), 300);
    }, message.duration || 4000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const colors = {
    success: {
      bg: "rgba(40, 167, 69, 0.95)",
      border: "#28a745",
      icon: "✅",
    },
    error: {
      bg: "rgba(220, 53, 69, 0.95)",
      border: "#dc3545",
      icon: "❌",
    },
    info: {
      bg: "rgba(23, 162, 184, 0.95)",
      border: "#17a2b8",
      icon: "ℹ️",
    },
    warning: {
      bg: "rgba(255, 193, 7, 0.95)",
      border: "#ffc107",
      icon: "⚠️",
    },
  };

  const style = colors[message.type];

  return (
    <div
      style={{
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "320px",
        maxWidth: "500px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        animation: isExiting
          ? "slideOut 0.3s ease-out forwards"
          : "slideIn 0.3s ease-out",
        color: "#fff",
        fontWeight: 500,
      }}
    >
      <div style={{ fontSize: "24px" }}>{style.icon}</div>
      <div style={{ flex: 1, fontSize: "15px" }}>{message.message}</div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(message.id), 300);
        }}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: "18px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast} onClose={onClose} />
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}