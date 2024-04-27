import type { Example } from "../actions";
import { prepareExample, prepareChatFromExample } from "../lib/prompt";
import { type State, StateToValues } from "../state";
import type { AvailableActions, ChainExample, ChainFunctions, getZodChainedCombined } from "./chained";
import { infer as Infer, ZodObject } from "zod";


export const implementChain = <A extends AvailableActions, U extends State, P>(
  schema: A,
  state: U,
  materials: ReturnType<typeof getZodChainedCombined<A, U>>,
  config: {
    functions: ChainFunctions<A, U, P>;
    examples?: ChainExample<A, U>;
    typeName?: string;
  }
) => {
  const { type_description, stateZod } = materials;

  const format_instructions = prepareExample(
    (config.examples ?? []) as Example,
    stateZod,
    "State: "
  );

  // const exampleChat = prepareChatFromExample(
  //   (config.examples ?? []) as Example
  // );

  return {
    type_description,
    format_instructions,
    // exampleChat,
    functions: config.functions,
  };
};
