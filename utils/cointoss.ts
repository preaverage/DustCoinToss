import * as anchor from "@project-serum/anchor";
import * as splToken from "@solana/spl-token";

import {
  CollectWinningsProps,
  GameDataProps,
  GenerateTransactionProps,
  HandleFinishProps,
  HandleGameProps,
  HandleTossProps,
  HandleTossReturnProps,
} from "./interfaces";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";

const house = new anchor.web3.PublicKey(
  "AMkHS7aWhMAw8agGE7cuaLMtmqpZDjGGKNsLdb2vGEfm"
);
const houseFees = new anchor.web3.PublicKey(
  "Fq9hTuvuVuVP5ra4HF4hrxjdvte8xBvMdJJESkoQNJC1"
);

const isDev = process.env.NEXT_PUBLIC_IS_DEV;
const fetchURL = isDev ? "http://localhost:8080" : process.env.API_URL;

const initData = {
  selectedData: {
    side: "",
    amount: 0,
  },
  gameData: {
    gameId: undefined,
    side: undefined,
    amount: undefined,
    won: undefined,
    status: undefined,
    signature: undefined,
    transaction: undefined,
  } as GameDataProps,
};

const handleToss = async ({
  selectedData,
}: HandleTossProps): Promise<HandleTossReturnProps | undefined> => {
  if (!selectedData.amount || !selectedData.side) return;
  if (!document.cookie.split("game-signature=")[1]) {
    location.reload();

    return;
  }

  const response = await fetch(`${fetchURL}/api/cointoss`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization:
        "Bearer " +
        (document.cookie.match(
          /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
        ) || [, null])[1],
    },
    body: JSON.stringify({
      amount: selectedData.amount,
      side: selectedData.side,
    }),
    mode: "cors",
  });

  if (response.status !== 200) {
    location.reload();

    return;
  }

  const responseData = await response.json();
  return {
    gameData: responseData,
  };
};

const generateTransaction = async ({
  publicKey,
  selectedData,
  responseData,
  connection,
  signTransaction,
}: GenerateTransactionProps): Promise<anchor.web3.Transaction | undefined> => {
  const MEMO_PROGRAM_ID = new anchor.web3.PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );
  const bufferData = Buffer.from(
    `gameId=${responseData.gameId}, side=${responseData.side}, amount=${responseData.amount}`,
    "utf-8"
  );

  if (!signTransaction) throw new WalletNotConnectedError();

  let transaction = undefined as unknown as anchor.web3.Transaction;
  try {
    transaction = new anchor.web3.Transaction({
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    }).add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: publicKey as anchor.web3.PublicKey,
        toPubkey: house,
        lamports: selectedData.amount * anchor.web3.LAMPORTS_PER_SOL,
      }),
      new anchor.web3.TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: bufferData,
      })
    );
  } catch (err: unknown) {
    location.reload();

    return;
  }

  return transaction;
};

const handleGame = async ({
  responseData,
  sentTransaction,
}: HandleGameProps): Promise<{ status: string }> => {
  if (!document.cookie.split("game-signature=")[1]) {
    location.reload();

    return {
      status: "failed",
    };
  }

  const response = await fetch(
    `${fetchURL}/api/cointoss/${responseData.gameId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization:
          "Bearer " +
          (document.cookie.match(
            /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
          ) || [, null])[1],
      },
      body: JSON.stringify({
        status: "pending",
        signature: sentTransaction,
      }),
      mode: "cors",
    }
  );
  if (response.status === 400) {
    return {
      status: "failed",
    };
  }
  const resData = await response.json();

  return {
    status: resData.status,
  };
};

const handleFinish = async ({ gameData }: HandleFinishProps) => {
  if (!document.cookie.split("game-signature=")[1]) {
    location.reload();

    return;
  }

  const response = await fetch(`${fetchURL}/api/cointoss/${gameData.gameId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization:
        "Bearer " +
        (document.cookie.match(
          /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
        ) || [, null])[1],
    },
    body: JSON.stringify({
      signature: gameData.signature,
    }),
    mode: "cors",
  });
  if (response.status !== 200) {
    location.reload();

    return;
  }

  const responseData = await response.json();
  return responseData;
};

const CollectWinnings = async ({
  gameData,
  connection,
  sendTransaction,
}: CollectWinningsProps) => {
  console.log(gameData);

  if (!document.cookie.split("game-signature=")[1]) {
    location.reload();

    return;
  }

  try {
    const sentTx = await sendTransaction(
      anchor.web3.Transaction.from(gameData.transaction.data),
      connection
    );

    await fetch(`${fetchURL}/api/cointoss/${gameData.gameId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization:
          "Bearer " +
          (document.cookie.match(
            /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
          ) || [, null])[1],
      },
      body: JSON.stringify({
        side: gameData.side,
        amount: gameData.amount,
        status: "finalized",
        sentTx: sentTx,
        transaction: gameData.transaction,
      }),
      mode: "cors",
    });
  } catch (err: any) {
    if (err.message.includes("Blockhash not found")) {
      location.reload();

      return;
    }

    await fetch(`${fetchURL}/api/cointoss/${gameData.gameId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization:
          "Bearer " +
          (document.cookie.match(
            /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
          ) || [, null])[1],
      },
      body: JSON.stringify({
        side: gameData.side,
        amount: gameData.amount,
        status: "finalized",
        sentTx: "null",
        transaction: gameData.transaction,
      }),
      mode: "cors",
    });
  }

  return {
    finalized: true,
  };
};

const fetchAmounts = async () => {
  if (!document.cookie.split("game-signature=")[1]) {
    location.reload();

    return;
  }

  const response = await fetch(`${fetchURL}/api/cointoss/getAmounts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization:
        "Bearer " +
        (document.cookie.match(
          /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
        ) || [, null])[1],
    },
    mode: "cors",
  });

  if (response.status !== 200) {
    location.reload();

    return;
  }

  const responseData = await response.json();
  return responseData;
};

export {
  initData,
  handleToss,
  handleGame,
  generateTransaction,
  handleFinish,
  CollectWinnings,
  fetchAmounts,
};
