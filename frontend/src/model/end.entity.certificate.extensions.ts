export const keyUsageOptions = [
  {
    value: "digitalSignature",
    label: "Digital Signature",
    description: "Sign documents and verify identity",
  },
  {
    value: "nonRepudiation",
    label: "Non-Repudiation",
    description: "Prevent denial of actions",
  },
  {
    value: "keyEncipherment",
    label: "Key Encipherment",
    description: "Encrypt symmetric keys",
  },
  {
    value: "dataEncipherment",
    label: "Data Encipherment",
    description: "Encrypt data directly",
  },
  {
    value: "keyAgreement",
    label: "Key Agreement",
    description: "Key exchange protocols",
  },
  // {
  //   value: "keyCertSign",
  //   label: "Certificate Signing",
  //   description: "Sign other certificates",
  // },
  // {
  //   value: "cRLSign",
  //   label: "CRL Signing",
  //   description: "Sign certificate revocation lists",
  // },
  // {
  //   value: "encipherOnly",
  //   label: "Encipher Only",
  //   description: "Only for encryption in key agreement",
  // },
  // {
  //   value: "decipherOnly",
  //   label: "Decipher Only",
  //   description: "Only for decryption in key agreement",
  // },
];

// Extended Key Usage options
export const extendedKeyUsageOptions = [
  {
    value: "serverAuth",
    label: "Server Authentication",
    description: "TLS/SSL server certificates",
  },
  {
    value: "clientAuth",
    label: "Client Authentication",
    description: "TLS/SSL client certificates",
  },
  {
    value: "codeSigning",
    label: "Code Signing",
    description: "Sign software and code",
  },
  {
    value: "emailProtection",
    label: "Email Protection",
    description: "S/MIME email encryption/signing",
  },
  {
    value: "timeStamping",
    label: "Time Stamping",
    description: "Trusted timestamping services",
  },
  // {
  //   value: "OCSPSigning",
  //   label: "OCSP Signing",
  //   description: "Sign OCSP responses",
  // },
  // {
  //   value: "msCodeInd",
  //   label: "Microsoft Individual Code Signing",
  //   description: "Microsoft code signing for individuals",
  // },
  // {
  //   value: "msCodeCom",
  //   label: "Microsoft Commercial Code Signing",
  //   description: "Microsoft code signing for commercial use",
  // },
  // {
  //   value: "msCTLSign",
  //   label: "Microsoft Trust List Signing",
  //   description: "Sign Microsoft Certificate Trust Lists",
  // },
  // {
  //   value: "msEFS",
  //   label: "Microsoft EFS",
  //   description: "Encrypting File System",
  // },
];
