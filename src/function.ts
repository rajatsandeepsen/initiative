import type { CodeTool } from "./tool";
import { validateCode } from "./validate";

// Creates a safe execution ground for the code
export const createFunction = (
  tools: Record<string, CodeTool>,
  code: string,
  rejectedWords: string[],
) => {
  const data = Object.entries(tools).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value.execute }),
    {},
  );

  return async (validate: boolean =  true) => {
    if (validate) {
      const foundRejectedWords = validateCode(rejectedWords, code);
      if (foundRejectedWords.length > 0)
        throw new Error(
          `Rejected Global variables/keywords are found in the code: ['${foundRejectedWords.join("', '")}']`,
        );
    }
    return await new Function(main(code)).apply(data, []);
  };
};

// Don't remove this.
// This is the only reason why async and sync function works inside `new Function()`
const main = (code: string) =>
  `const main = async () => {\n${code}\n}\nreturn main()`;
