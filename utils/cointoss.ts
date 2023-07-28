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

const fakeWallet = anchor.web3.Keypair.fromSecretKey(
  bs58.decode(
    "tkeTBbQchSPupLitNt7FwVp199H3pkDYu5vAytJPaXCMH5hecRAnNFNsL6AXeZQMPw1SKjsETuLDmgANoGfg4WT"
  )
);

const house = new anchor.web3.PublicKey(
  "Fq9hTuvuVuVP5ra4HF4hrxjdvte8xBvMdJJESkoQNJC1"
);
const houseFees = new anchor.web3.PublicKey(
  "Fq9hTuvuVuVP5ra4HF4hrxjdvte8xBvMdJJESkoQNJC1"
);

const isDev = false;
const fetchURL = isDev
  ? "http://localhost:8080"
  : "https://dust-coin-toss-backend.herokuapp.com";

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
  if (!document.cookie.split("signature=")[1]) {
    location.reload();

    return;
  }

  const response = await fetch(`${fetchURL}/api/cointoss`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization:
        "Bearer " + document.cookie.split("signature=")[1].split(";")[0],
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

  const tokenAddress = "DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ";
  const tokenPublicKey = new anchor.web3.PublicKey(tokenAddress);

  if (!signTransaction) throw new WalletNotConnectedError();

  const dust = new splToken.Token(
    connection,
    tokenPublicKey,
    splToken.TOKEN_PROGRAM_ID,
    fakeWallet
  );

  let transaction = undefined as unknown as anchor.web3.Transaction;
  try {
    const senderAcct = await dust.getOrCreateAssociatedAccountInfo(
      publicKey as anchor.web3.PublicKey
    );

    const houseRecipentAcct = await dust.getOrCreateAssociatedAccountInfo(
      house
    );

    transaction = new anchor.web3.Transaction({
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    }).add(
      splToken.Token.createTransferInstruction(
        splToken.TOKEN_PROGRAM_ID,
        senderAcct.address,
        houseRecipentAcct.address,
        publicKey as anchor.web3.PublicKey,
        [],
        selectedData.amount * anchor.web3.LAMPORTS_PER_SOL
      ),
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
  if (!document.cookie.split("signature=")[1]) {
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
          "Bearer " + document.cookie.split("signature=")[1].split(";")[0],
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
  if (!document.cookie.split("signature=")[1]) {
    location.reload();

    return;
  }

  const response = await fetch(`${fetchURL}/api/cointoss/${gameData.gameId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization:
        "Bearer " + document.cookie.split("signature=")[1].split(";")[0],
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

  if (!document.cookie.split("signature=")[1]) {
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
          "Bearer " + document.cookie.split("signature=")[1].split(";")[0],
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
          "Bearer " + document.cookie.split("signature=")[1].split(";")[0],
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

export {
  initData,
  handleToss,
  handleGame,
  generateTransaction,
  handleFinish,
  CollectWinnings,
};
