const alwaysReject = [
  "globalThis", // Universal global object
  "global", // Node.js global object
  "exports", // Module exports
  "module", // Current module
  "require", // Import modules
]

type SharedGlobalVariables = typeof sharedGlobalVariables[number];
export const sharedGlobalVariables = [
  "console", // Logging and debugging
  "setTimeout", // Timer function
  "setInterval", // Timer function
  "clearTimeout", // Clears timeout
  "clearInterval", // Clears interval
  "Promise", // For asynchronous operations
  "Math", // Mathematical operations
  "JSON", // JSON parsing and stringifying
] as const;

type NodeVariables = typeof nodeVariables[number];
export const nodeVariables = [
  "__dirname", // Current directory path
  "__filename", // Current file path
  "process", // Node.js process object
  "Buffer", // Binary data handling
  "setImmediate", // Executes immediately after the event loop
] as const;

type BrowserVariables = typeof browserVariables[number];
export const browserVariables = [
  "window", // Global scope in browsers
  "document", // DOM manipulation
  "navigator", // Browser information
  "location", // URL manipulation
  "fetch", // HTTP requests
  "localStorage", // Persistent storage
  "sessionStorage", // Session-based storage
  "alert", // Displays alert boxes
  "history", // Browser history
] as const;

const allVariables = [
  ...sharedGlobalVariables,
  ...nodeVariables,
  ...browserVariables,
];

type GlobalVariables = (
  | SharedGlobalVariables
  | NodeVariables
  | BrowserVariables
  | (string & {})
)[];

export type GlobalPermission = "all" | "browser" | "node" | GlobalVariables;
const validPermissions = ["all", "browser", "node"];

export const getRejectedVariables = (
  allow: GlobalPermission,
  reject: GlobalPermission,
): GlobalVariables => {
  // Error: 'allow' and 'reject' cannot be the same string permission
  if (typeof reject === "string" && reject === allow) {
    throw new Error("Don't 'allow' and 'reject' same permission");
  }

  // Error: 'allow' or 'reject' must be valid permissions
  if (typeof allow === "string" && !validPermissions.includes(allow)) {
    throw new Error(`Invalid 'allow' permission: ${allow}`);
  }
  if (typeof reject === "string" && !validPermissions.includes(reject)) {
    throw new Error(`Invalid 'reject' permission: ${reject}`);
  }

  // Error: 'allow' or 'reject' arrays must contain valid variables
  if (
    Array.isArray(allow) && allow.length === 0
  ) {
    throw new Error("Invalid variable(s) in 'allow' array");
  }
  // if (
  //   Array.isArray(reject) && allow.length === 0
  // ) {
  //   throw new Error("Invalid variable(s) in 'reject' array");
  // }

  const allowedVariables =
    allow === "all"
      ? allVariables
      : typeof allow === "string"
        ? allow === "node"
          ? nodeVariables
          : browserVariables
        : allow;

  const rejectedVariables =
    reject === "all"
      ? allVariables
      : typeof reject === "string"
        ? reject === "node"
          ? nodeVariables
          : browserVariables
        : reject;

  return allVariables.filter(
    (variable: string) =>
      !(allowedVariables as string[]).includes(variable) ||
      (rejectedVariables as string[]).includes(variable),
  )
};

export const validateCode = (stringsArray:string[], code:string) => {
    const escapedStrings = stringsArray.map(str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const regexPattern = `\\b(${escapedStrings.join('|')})\\b`;

    const regex = new RegExp(regexPattern, 'g');

    const matches = code.match(regex);

    return matches || [];
}
