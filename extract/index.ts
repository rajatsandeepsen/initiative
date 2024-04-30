import type {
  BaseLanguageModel,
  BaseLanguageModelCallOptions,
} from "langchain/base_language";
import type { PromptTemplate } from "langchain/prompts";
import type { infer as Infer, ZodObject } from "zod";
import type { Schema, getZodCombined, implement } from "../actions";
import { defaultPrompt } from "../lib/prompt";
import { stateDescription, stringZod } from "../lib/utils";
import {
  rawSafeParseState,
  safeParse,
  safeParseState,
} from "../lib/validation";
import type { State, StateToValues } from "../state";
import type {
  AvailableActions,
  getZodChainedCombined,
  implementChain,
} from "./../chain";

export type ResponseType<S extends Schema, U extends State> = {
  input: string;
  prompt: string;
  state: {
    raw: Partial<Infer<ZodObject<U>>>;
    partial?: ReturnType<typeof rawSafeParseState<U>>;
    validated?: ReturnType<typeof safeParseState>;
  };
  response: {
    raw: string;
    validated?: ReturnType<typeof safeParse<S>>;
  };
};

export const createExtraction = async <
  U extends State,
  A extends AvailableActions,
  S extends Schema,
  P
>(
  // schema: A | S,
  // state: U,
  llm: BaseLanguageModel,
  init: ReturnType<typeof implement<U, S, P> | typeof implementChain<A, U, P>>,
  zod: Pick<
    ReturnType<
      typeof getZodCombined<S, U> | typeof getZodChainedCombined<A, U>
    >,
    "combinedZod" | "stateZod" | "rawStateZod"
  >,
  prompt: PromptTemplate = defaultPrompt
) => {
  const { type_description, format_instructions } = init;

  const { combinedZod, stateZod, rawStateZod } = zod;

  type InvokeConfig = {
    state?: Partial<StateToValues<U>>;
    invokeOptions?: BaseLanguageModelCallOptions | undefined;
  };

  const invoke = async (
    Input: string,
    config?: InvokeConfig
  ): Promise<ResponseType<S, U>> => {

    const validatedState = safeParseState<U>(stateZod, config?.state);
    const rawValidated = rawSafeParseState<U>(rawStateZod, config?.state);

    const state_description = validatedState?.data
      ? stateDescription(validatedState.data as object, "", ", ")
      : "";

    const promptText = await prompt.invoke({
      type_description,
      state_description,
      format_instructions,
      input_prompt: Input,
    });

    const response = await llm.invoke(promptText.value, config?.invokeOptions)
    // const response = (await chainedMessages.pipe(llm).invoke(
    //   {
    //     system_message: new SystemMessage(system_message),
    //     example_message: exampleChat,
    //     last_message: new HumanMessage(promptText.value),
    //   },
    //   invokeOptions
    // )) as string;

    const validated = safeParse<S>(combinedZod, response);
    const partial = validated.json ?? validated.data
    console.log(stringZod(combinedZod, "hererehrehreh"))
    return {
      input: Input,
      prompt: promptText.value,
      response: {
        raw: response,
        validated: {
          ...validated, 
          data: partial
        },
      },
      state: {
        raw: config?.state ?? {},
        partial: rawValidated,
        validated: validatedState,
      },
    };
  };

  return { invoke };
};
