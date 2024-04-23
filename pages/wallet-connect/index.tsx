import styles from "./index.module.css";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

import generateSignature from "../../utils/generateSignature";

import { PageProps } from "../../utils/interfaces";
import { useEffect, useRef } from "react";

const WalletConnect = ({ clickEvent, isLoaded }: PageProps) => {
  const { setVisible } = useWalletModal();
  const { publicKey, connected, signMessage } = useWallet();

  const walletConnectCenterRef = useRef<HTMLDivElement>(null);

  const handleClick = async () => {
    if (!connected) {
      setVisible(true);
    } else {
      const hasSigned = await generateSignature({ publicKey, signMessage });

      if (!hasSigned) return;

      console.log(hasSigned);

      if (clickEvent) clickEvent();
    }
  };

  useEffect(() => {
    if (isLoaded) {
      walletConnectCenterRef.current?.classList.toggle(styles.loaded);
    }
  }, [isLoaded]);

  return (
    <div className={styles.walletConnect}>
      <div
        ref={walletConnectCenterRef}
        onClick={handleClick}
        className={styles.center}
      >
        <p>Solana</p>
        <img src="./logo-site.png" alt="" />
        <p>Coin Toss</p>

        <p className={styles.small}>
          {!connected ? "(Click to Connect)" : "(Click to Double or Nothing)"}
        </p>
      </div>
    </div>
  );
};

export default WalletConnect;
