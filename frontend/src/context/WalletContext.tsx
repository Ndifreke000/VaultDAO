import React, { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import {
  isConnected,
  isAllowed,
  setAllowed,
  getUserInfo,
  getNetwork,
} from "@stellar/freighter-api";
import Toast from "../components/UI/Toast";
import type { ToastType } from "../components/UI/Toast";
import { WalletContext } from "./WalletContextProps";

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  const addressRef = useRef<string | null>(null);
  const networkRef = useRef<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const checkInstallation = useCallback(async () => {
    try {
      const installed = await isConnected();
      setIsInstalled(!!installed);
      return !!installed;
    } catch {
      console.error("Installation check failed");
      return false;
    }
  }, []);

  const validateNetwork = useCallback(async () => {
    try {
      const currentNetwork = await getNetwork();
      if (currentNetwork !== networkRef.current) {
        setNetwork(currentNetwork);
        networkRef.current = currentNetwork;
        if (currentNetwork && currentNetwork !== "TESTNET" && connected) {
          showToast("Please switch to Stellar Testnet in Freighter", "warning");
        }
      }
      return currentNetwork;
    } catch {
      return null;
    }
  }, [connected, showToast]);

  const updateWalletState = useCallback(async () => {
    try {
      const allowed = await isAllowed();
      if (allowed) {
        const userInfo = await getUserInfo();
        if (userInfo?.publicKey) {
          if (userInfo.publicKey !== addressRef.current) {
            setAddress(userInfo.publicKey);
            addressRef.current = userInfo.publicKey;
            setConnected(true);
          }
          await validateNetwork();
          return true;
        }
      }
      setAddress(null);
      addressRef.current = null;
      setConnected(false);
      localStorage.removeItem("wallet_connected");
    } catch {
      console.error("Failed to update wallet state");
    }
    return false;
  }, [validateNetwork]);

  useEffect(() => {
    const init = async () => {
      if (await checkInstallation() && localStorage.getItem("wallet_connected") === "true") {
        await updateWalletState();
      }
    };
    init();
    const interval = setInterval(async () => {
      if (await isConnected()) await updateWalletState();
    }, 3000);
    return () => clearInterval(interval);
  }, [checkInstallation, updateWalletState]);

  const connect = async () => {
    if (!isInstalled && !(await checkInstallation())) {
      showToast("Freighter wallet not found.", "error");
      window.open("https://www.freighter.app/", "_blank");
      return;
    }
    try {
      if (await setAllowed()) {
        if (await updateWalletState()) {
          localStorage.setItem("wallet_connected", "true");
          showToast("Wallet connected!", "success");
        }
      }
    } catch {
      showToast("Connection failed", "error");
    }
  };

  const disconnect = useCallback(async () => {
    setConnected(false);
    setAddress(null);
    setNetwork(null);
    addressRef.current = null;
    networkRef.current = null;
    localStorage.removeItem("wallet_connected");
    showToast("Wallet disconnected", "info");
    return Promise.resolve();
  }, [showToast]);

  return (
    <WalletContext.Provider 
      value={{ 
        isConnected: connected, 
        isInstalled, 
        address, 
        network, 
        connect, 
        disconnect 
      }}
    >
      {children}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
    </WalletContext.Provider>
  );
};