// import { GenerateSignatureProps } from "./interfaces";

// let oneTimeCode: string = "";
// const isDev = false;

// const generateSignature = async ({
//   publicKey,
//   signMessage,
// }: GenerateSignatureProps) => {
//   if (
//     document.cookie &&
//     document.cookie.split("signature=")[1].split(";")[0] !== undefined &&
//     document.cookie.split("wallet=")[1] === publicKey?.toString()
//   ) {
//     return document.cookie.split("signature=")[1].split(";")[0];
//   }

//   if (signMessage) {
//     let randomString;
//     if (oneTimeCode === "") {
//       randomString = crypto.randomUUID().toString().substring(0, 6);
//       if (oneTimeCode === "") oneTimeCode = randomString;
//     }

//     try {
//       const response = await signMessage(
//         new TextEncoder().encode(
//           `I am signing a one time nonce for Dust Coin Toss. (${
//             oneTimeCode ? oneTimeCode : randomString
//           })`
//         )
//       );

//       const fetchURL = isDev
//         ? "http://localhost:8080"
//         : "https://dust-coin-toss-backend.herokuapp.com";

//       const fetchResponse = await (
//         await fetch(`${fetchURL}/api/auth`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             wallet: publicKey?.toString(),
//             signature: oneTimeCode ? oneTimeCode : randomString,
//           }),
//           mode: "cors",
//         })
//       ).json();

//       const expirationTime = new Date(
//         new Date().getTime() + 1000 * 60 * 60
//       ).toUTCString();

//       document.cookie = `signature=${fetchResponse.token}; expires=${expirationTime};`;
//       document.cookie = `wallet=${publicKey?.toString()}; expires=${expirationTime};`;

//       return response;
//     } catch {
//       return undefined;
//     }
//   } else {
//     return undefined;
//   }
// };

// export default generateSignature;
