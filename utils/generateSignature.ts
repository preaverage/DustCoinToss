import { GenerateSignatureProps } from "./interfaces";

let oneTimeCode: string = "";
const isDev = process.env.NEXT_PUBLIC_IS_DEV;

const fetchURL = isDev ? "http://localhost:8080" : process.env.API_URL;

const generateSignature = async ({
  publicKey,
  signMessage,
}: GenerateSignatureProps) => {
  if (
    document.cookie &&
    (document.cookie.match(
      /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
    ) || [, null])[1] !== undefined &&
    (document.cookie.match(
      /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
    ) || [, null])[1] === publicKey?.toString()
  ) {
    return (document.cookie.match(
      /^(?:.*;)?\s*game-signature\s*=\s*([^;]+)(?:.*)?$/
    ) || [, null])[1];
  }

  if (signMessage) {
    let randomString;
    if (oneTimeCode === "") {
      randomString = crypto.randomUUID().toString().substring(0, 6);
      if (oneTimeCode === "") oneTimeCode = randomString;
    }

    try {
      const response = await signMessage(
        new TextEncoder().encode(
          `I am signing a one time nonce for Solana Coin Toss. (${
            oneTimeCode ? oneTimeCode : randomString
          })`
        )
      );

      const fetchResponse = await (
        await fetch(`${fetchURL}/api/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: publicKey?.toString(),
            signature: oneTimeCode ? oneTimeCode : randomString,
          }),
          mode: "cors",
        })
      ).json();

      const expirationTime = new Date(
        new Date().getTime() + 1000 * 60 * 10
      ).toUTCString();

      document.cookie = `game-signature=${fetchResponse.token}; expires=${expirationTime};`;
      document.cookie = `game-wallet=${publicKey?.toString()}; expires=${expirationTime};`;

      return response;
    } catch {
      return undefined;
    }
  } else {
    return undefined;
  }
};

export default generateSignature;
