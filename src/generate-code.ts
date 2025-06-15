import { newSystemPrompt } from './prompt';
import { createFunction } from './function';
import { generateText } from 'ai';
import type { CodeTool } from './tool';
import { globalPermission } from './validate';

const js_regex = /```js\n([\s\S]*?)\n```/g;
const json_regex = /```json\n([\s\S]*?)\n```/g;

const thisKeyWord = 'listOfFunctions';

type GenerateCodeParams = Omit<Parameters<typeof generateText>[0], 'tools'> & {
  tools: Record<string, CodeTool>;
  /**
  Optional configuration for global variables that can be used to control the execution environment.

  @property reject - Specifies the environments or variables to exclude. Can be:
    - "all": Reject all environments.
    - "browser": Reject browser-specific variables.
    - "node": Reject Node.js-specific variables.
    - An array of specific variables from SharedGlobalVariables, NodeVariables, or BrowserVariables.

  @property allow - Specifies the environments or variables to include. Can be:
    - "all": Allow all environments.
    - "browser": Allow browser-specific variables.
    - "node": Allow Node.js-specific variables.
    - An array of specific variables from SharedGlobalVariables, NodeVariables, or BrowserVariables.
  */
  globalVariables?: {
      /**
      * @default []
      */
    reject?: globalPermission
    /**
    * @default "all"
    */
    allow?: globalPermission
  }
};
type GenerateCodeReturns = Omit<
  Awaited<ReturnType<typeof generateText>>,
  'toolCalls' | 'toolResults' | 'steps'
> & { code: string; execute: () => Promise<unknown>; schema?: object };

/**
Generate code that can be executed, un-typed result but with JSON schema for a given prompt and tools using a language model.

This function does not stream the output.

@returns
A result object that contains the generated code, JSON schema, executable function, the finish reason, the token usage, and additional information.
 */
const generateCode = async ({
  tools,
  system,
  globalVariables,
  ...rest
}: GenerateCodeParams): Promise<GenerateCodeReturns> => {
  const systemNew = newSystemPrompt(
    system ?? 'Follow the instructions and write code for the prompt',
    tools,
    thisKeyWord,
  );

  const result = await generateText({
    ...rest,
    toolChoice: 'none',
    system: systemNew,
  });

  const codeBlock = result.text.match(js_regex);
  const jsonCodeBlock = result.text.match(json_regex);

  if (!codeBlock) {
    throw new Error('No code block found');
  }

  const code = codeBlock[0]
    .replace(/```js\n|```/g, '')
    .replaceAll(thisKeyWord, 'this');

  const evalCode = createFunction(tools, code);

  if (jsonCodeBlock) {
    try {
      const schema = JSON.parse(jsonCodeBlock[0].replace(/```json\n|```/g, ''));

      return {
        ...result,
        schema,
        code,
        execute: evalCode,
      };
    } catch (e) {}
  }

  return {
    ...result,
    schema: undefined,
    code,
    execute: evalCode,
  };
};

export { generateCode };
