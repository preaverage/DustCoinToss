import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { CollectWinnings } from "../../../utils/cointoss";
import { TossingProps } from "../../../utils/interfaces";
import styles from "./index.module.css";

const Tossing = ({
  gameData,
  selectedData,
  isTxComplete,
  connection,
  close,
}: TossingProps) => {
  const { sendTransaction } = useWallet();

  const data = {
    side: gameData.side ? gameData.side : selectedData.side,
    amount: gameData.amount ? gameData.amount : selectedData.amount,
    color: gameData.won ? "#00edff" : "#fece00",
  };

  const [text, setText] = useState("AWAITING DEPOSIT");

  const updateText = (change: string) => {
    if (gameData.won !== undefined) {
      return;
    }

    setText(change);
  };

  const handleCollect = async () => {
    if (gameData.won === undefined) return;

    if (gameData.won) {
      const response = await CollectWinnings({
        gameData,
        connection,
        sendTransaction,
      });
    }

    return close();
  };

  useEffect(() => {
    if (gameData.won !== undefined) return;
    if (isTxComplete && !text.includes("TOSSING")) {
      return updateText("TOSSING");
    }

    setTimeout(() => {
      if (text.includes("...")) {
        if (isTxComplete) {
          return updateText("TOSSING");
        }

        return updateText("AWAITING DEPOSIT");
      }

      updateText(text + ".");
    }, 750);
  }, [text]);

  const audioElem = useRef() as React.MutableRefObject<HTMLAudioElement>;
  useEffect(() => {
    if (gameData.won === undefined) return;

    if (audioElem) {
      audioElem.current.volume = 0.5;
      audioElem.current.play();
    }
  }, [gameData.won]);

  return (
    <div className={styles.center}>
      <img
        className={`${
          gameData.won === undefined ? styles.spin : styles.slowSpin
        }`}
        src="./logo-site.png"
        alt=""
      />

      {gameData.won === undefined ? (
        <div>
          <p>{text}</p>
          <p>
            {data.side} FOR {data.amount} SOL
          </p>
        </div>
      ) : (
        <div>
          <p style={{ color: data.color }}>
            YOU {gameData.won ? "WON" : "LOST"}
          </p>

          <button onClick={handleCollect}>
            {gameData.won ? `COLLECT ${gameData.amount} SOL` : "TRY AGAIN"}
          </button>
        </div>
      )}

      <audio
        ref={audioElem}
        src={
          gameData.won !== undefined && gameData.won
            ? "./sfx/won.wav"
            : !gameData.won
            ? "./sfx/loss.wav"
            : ""
        }
      />
    </div>
  );
};

export default Tossing;
