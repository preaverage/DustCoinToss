import { useEffect, useState, useRef } from "react";
import styles from "./index.module.css";

import { PageProps, ButtonProps } from "../../utils/interfaces";
import {
  initData,
  handleToss,
  generateTransaction,
  handleGame,
  handleFinish,
} from "../../utils/cointoss";
import Tossing from "./toss";

import * as anchor from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

const Button = ({ selected, select, side, amount }: ButtonProps) => {
  const isSelected = side ? side === selected : amount === selected;

  return (
    <button
      onClick={() => select(side ? side : amount)}
      className={isSelected ? styles.buttonSelected : ""}
    >
      {side ? side : `${amount} DUST`}
    </button>
  );
};

const Cointoss = ({ isLoaded }: PageProps) => {
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const [selectedData, setSelectedData] = useState(initData.selectedData);
  const [gameData, setGameData] = useState(initData.gameData);

  const canToss = selectedData.side && selectedData.amount;
  const renderData = {
    sides: ["heads", "tails"],
    amounts: [1, 5, 10, 15],
  };

  const [isFlipping, setFlipping] = useState(false);
  const [isTxComplete, setTxComplete] = useState(false);
  const [connection, setConnection] = useState(
    undefined as unknown as anchor.web3.Connection
  );

  useEffect(() => {
    if (!isLoaded) return;

    const initialConnection = new anchor.web3.Connection(
      anchor.web3.clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
    setConnection(initialConnection);
  }, [isLoaded]);

  useEffect(() => {
    if (!isTxComplete || gameData.won !== undefined) return;

    runFinish();
  }, [isTxComplete]);

  const select = (val: string | number | undefined) => {
    if (typeof val === "string") {
      setSelectedData({
        ...selectedData,
        side: val,
      });
    }

    if (typeof val === "number") {
      setSelectedData({
        ...selectedData,
        amount: val,
      });
    }
  };

  // const handleClick = async () => {
  //   const response = await handleToss({ selectedData });
  //   if (!response) return;

  //   setGameData(response.gameData);
  //   setSelectedData({
  //     side: response.gameData.side as string,
  //     amount: response.gameData.amount as number,
  //   });

  //   if (response.gameData.status === "complete") {
  //     setTxComplete(true);
  //     setFlipping(true);

  //     return;
  //   }

  //   const transaction = await generateTransaction({
  //     publicKey,
  //     selectedData,
  //     responseData: response.gameData,
  //     connection,
  //     signTransaction,
  //   });
  //   if (!transaction) {
  //     return;
  //   }

  //   setFlipping(true);

  //   try {
  //     const sentTransaction = await sendTransaction(transaction, connection);
  //     const submitGame = await handleGame({
  //       responseData: response.gameData,
  //       sentTransaction,
  //     });

  //     if (submitGame.status === "failed") {
  //       setFlipping(false);
  //       setGameData(initData.gameData);

  //       return;
  //     }

  //     setGameData({ ...response.gameData, signature: sentTransaction });
  //     setTxComplete(true);
  //   } catch (err: unknown) {
  //     setFlipping(false);

  //     return;
  //   }
  // };

  const handleClick = () => {
    setFlipping(true);

    const randomChance = Math.random() < 0.5;
    const randomTimeout = Math.floor(Math.random() * (2500 - 500 + 1)) + 500;

    setTimeout(() => {
      setGameData({ ...selectedData, won: randomChance });
    }, randomTimeout);
  };

  const runFinish = async () => {
    const data = await handleFinish({
      gameData: gameData,
    });

    setGameData(data);
  };

  return (
    <div className={styles.cointoss}>
      {!isFlipping ? (
        <div
          className={`${styles.center} ${
            !isLoaded ? styles.left : styles.loaded
          }`}
        >
          <img src="./logo-site.png" alt="" />

          <p>Select a side</p>
          <div className={styles.sides}>
            {renderData.sides.map((side) => {
              return (
                <Button
                  key={`btn-${side}`}
                  selected={selectedData.side}
                  select={select}
                  side={side}
                />
              );
            })}
          </div>

          <p>And an amount</p>
          <div className={styles.amounts}>
            {renderData.amounts.map((amount) => {
              return (
                <Button
                  key={`btn-${amount}`}
                  selected={selectedData.amount}
                  select={select}
                  amount={amount}
                />
              );
            })}
          </div>

          <p>Finally...</p>
          <button
            onClick={handleClick}
            className={`${styles.tossButton} ${canToss ? styles.enabled : ""}`}
          >
            Toss
          </button>
        </div>
      ) : (
        <Tossing
          gameData={gameData}
          selectedData={selectedData}
          isTxComplete={isTxComplete}
          connection={connection}
          close={() => {
            setTxComplete(false);

            setSelectedData(initData.selectedData);
            setGameData(initData.gameData);

            setFlipping(false);
          }}
        />
      )}
    </div>
  );
};

export default Cointoss;
