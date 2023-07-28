import * as anchor from "@project-serum/anchor";

export interface PageProps {
  clickEvent?: () => void;
  isLoaded: boolean;
}

export interface ButtonProps {
  side?: string;
  amount?: number;
  selected: string | number;
  select: (val: string | number | undefined) => void;
}

export interface HREFProps {
  href: string;
  src: string;
}

export interface GenerateSignatureProps {
  publicKey: anchor.web3.PublicKey | null;
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined;
}

export interface HandleTossProps {
  selectedData: {
    side: string;
    amount: number;
  };
}

export interface GameDataProps {
  gameId?: string;
  side?: string;
  amount?: number;
  won?: boolean;
  status?: string;
  signature?: string;
  transaction?: any;
}

export interface HandleTossReturnProps {
  gameData: GameDataProps;
}

export interface GenerateTransactionProps {
  publicKey: anchor.web3.PublicKey | null;
  selectedData: {
    side: string;
    amount: number;
  };
  responseData: HandleTossReturnProps["gameData"];
  connection: anchor.web3.Connection;
  signTransaction:
    | ((
        transaction: anchor.web3.Transaction
      ) => Promise<anchor.web3.Transaction>)
    | undefined;
}

export interface HandleGameProps {
  responseData: HandleTossReturnProps["gameData"];
  sentTransaction: string;
}

export interface TossingProps {
  gameData: GameDataProps;
  selectedData: {
    side: string;
    amount: number;
  };
  isTxComplete: boolean;
  connection: anchor.web3.Connection;
  close: () => void;
}

export interface HandleFinishProps {
  gameData: GameDataProps;
}

export interface CollectWinningsProps {
  gameData: GameDataProps;
  connection: anchor.web3.Connection;
  sendTransaction: (
    transaction: anchor.web3.Transaction,
    connection: anchor.web3.Connection,
    options?: anchor.web3.SendOptions | undefined
  ) => Promise<string>;
}
