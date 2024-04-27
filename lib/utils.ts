import type { ZodSchema } from "zod";
import { printNode, zodToTs } from "zod-to-ts";

export const wrapType = (str: string, typeName?: string) => {
  return `\`\`\`TypeScript
  
${typeName ? `\t${typeName}: ` : ""}${str}
\`\`\``;
};

export const stateDescription = (
  state?: object,
  title = "Current State:",
  sep = "\n\t"
) => {
  if (!state) return "";
  return `${title}${Object.values(state).join(sep)}\n`;
};

type objectFunc<V, T extends object, K extends keyof T> = (
  [key, value]: [K, T[K]],
  i?: number
) => [K, V];

export const ObjectMap = <T extends object, V>(
  obj: T,
  func: objectFunc<V, T, keyof T>
) => {
  const newObject = {} as { [K in keyof T]: V };
  let i = 0;
  for (const [key, value] of Object.entries(obj)) {
    const [newKey, newValue] = func([key as keyof T, value], i);
    newObject[newKey] = newValue;

    i++;
  }
  return newObject;
};

export const stringZod = (zod: ZodSchema, K: string) => {
  const { node: type } = zodToTs(zod, K as string);
  const typeString = printNode(type);
  return typeString
};

type objectAsyncFunc<V, T extends object, K extends keyof T> = (
  [key, value]: [K, T[K]],
  i?: number
) => Promise<[K, V]>;

export const ObjectMapAsync = async <T extends object, V>(
  obj: T,
  func: objectAsyncFunc<V, T, keyof T>
) => {
  const newObject = {} as { [K in keyof T]: V };
  let i = 0;
  for (const [key, value] of Object.entries(obj)) {
    const [newKey, newValue] = await func([key as keyof T, value], i);
    newObject[newKey] = newValue;

    i++;
  }
  return newObject;
};

export const ArrayMapAsync = async <T, V>(
  arr: T[],
  func: (value: T, i: number, error:[boolean, () => void]) => Promise<V>
) => {
  const newArray = [] as V[];
  let i = 0;
  let error = false;
  const setError = () => {error = true};
  for (const value of arr) {
    const newValue = await func(value, i, [error, setError]);
    newArray.push(newValue);

    i++;
  }
  return newArray;
}