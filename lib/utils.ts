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
  return `${title}${Object.values(state).join(sep)}\n`
};

type objectFunc<V,T extends object, K extends keyof T> =  ([key, value]:[K, T[K]]) => [K, V]

export const ObjectMap = <T extends object, V>(obj: T, func: objectFunc<V, T, keyof T>) => {
  const newObject = {} as Record<keyof T, V>
  for (const [key, value] of Object.entries(obj)) {
    const [newKey, newValue] = func([key as keyof T, value])
    newObject[newKey] = newValue
  }
  return newObject
}