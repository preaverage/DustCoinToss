import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";

import WalletConnect from "./wallet-connect";
import Cointoss from "./cointoss";

import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

import { HREFProps } from "../utils/interfaces";
const HREF = ({ href, src }: HREFProps) => {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      <img src={src} alt="" />
    </a>
  );
};

const Renderer = () => {
  const walletConnectPage = useRef<HTMLDivElement>(null);
  const [isLoaded, setLoaded] = useState(false);
  const [isFinished, setFinished] = useState(false);

  const handlePageLoad = () => {
    setLoaded(true);

    setTimeout(() => {
      setFinished(true);

      walletConnectPage.current?.remove();
    }, 700);
  };

  return (
    <>
      <Head>
        <title>Solana Coin Toss</title>
        <link rel="icon" href="./logo-site.png" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <div className="gradient-blue"></div>
      <div className="gradient-yellow"></div>

      <div
        ref={walletConnectPage}
        style={{ pointerEvents: isLoaded ? "none" : "all" }}
      >
        <WalletConnect clickEvent={handlePageLoad} isLoaded={isLoaded} />
      </div>

      <div style={{ pointerEvents: isFinished ? "all" : "none" }}>
        <Cointoss isLoaded={isLoaded} />
      </div>

      <div className="hrefs">
        <HREF
          href="https://discord.com/users/472926813715300352"
          src="https://www.freepnglogos.com/uploads/discord-logo-png/concours-discord-cartes-voeux-fortnite-france-6.png"
        />
      </div>
    </>
  );
};

const WalletWrapper = () => {
  const network = process.env.NEXT_PUBLIC_IS_DEV
    ? WalletAdapterNetwork.Devnet
    : WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Renderer />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletWrapper;
