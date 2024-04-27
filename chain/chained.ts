import type {
  infer as Infer,
  ZodEffects,
  ZodFunction,
  ZodOptional,
  ZodSchema,
  ZodTransformer,
  ZodTypeAny,
  input as Input,
  ZodObject,
  output as Output,
} from "zod";
import { z } from "zod";
import { printNode, zodToTs } from "zod-to-ts";
import { ObjectMap, wrapType } from "../lib/utils";
import type { State, StateToValues } from "../state";
import type { AsyncFunction, ToAsyncFunction } from "../type";

export type AvailableActions = Record<
  string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ZodFunction<any, any>
>;

export type ActionZodData<A extends AvailableActions> = {
  [K in keyof A]: {
    key: K;
    value: A[K];
    args: Input<A[K]>;
    returns: Output<A[K]>;
  };
};

export const getZodChainedCombined = <
  S extends AvailableActions,
  U extends State
>(
  schema: S,
  state?: U
) => {
  const AvailableActions: string[] = [];
  const RecordOfActionsType: string[] = [];
  type ActionZodValue = [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]];
  const actionZodValue = [] as unknown as ActionZodValue;

  const actionZodData = ObjectMap(schema, ([K, V]) => {
    const zodValue = (V._def.args ?? z.any())._def?.items[0] as ZodSchema;

    actionZodValue.push(
      z.object({
        [K]: zodValue,
      })
    );

    const { node: type } = zodToTs(zodValue, K as string);
    const typeString = printNode(type);
    const description = V._def.description;

    RecordOfActionsType.push(
      `${description ? `\n// ${description}\n` : ""}type ${String(K)} = ${typeString}`
    );
    AvailableActions.push(K as string);

    return [
      K,
      {
        args: V._def.args,
        returns: V._def.returns,
        // value: V,
        key: K,
      },
    ];
  }) as ActionZodData<S>

  // for (const [key, value] of Object.entries(schema)) {
  //   const zodValue = (value._def.args ?? z.any())._def?.items[0] as ZodSchema;
  //   // actions[key] = zodValue;

  //   actionZodValue.push(
  //     z.object({
  //       [key]: zodValue,
  //     })
  //   );

  //   const { node: type } = zodToTs(zodValue, key);
  //   const typeString = printNode(type);
  //   const description = value._def.description;
  // }

  // state zod creation
  const stateZod = state ? z.object(state).partial().optional() : undefined;
  const stateWithOutTransform = state
    ? ObjectMap(z.object(state)._def.shape(), ([k, v]) => {
        if ("innerType" in v && typeof v.innerType === "function")
          return [k, v.innerType()];

        return [k, v];
      })
    : undefined;

  const rawStateZod = stateWithOutTransform
    ? z.object(stateWithOutTransform).partial().optional()
    : undefined;

  // Type definitions
  const AvailableActionsType = `type AvailableActions = ${AvailableActions.map(
    (x) => `{${x}: ${x}}`
  ).join(" | ")}`;
  const ChainedActionsType = "type OutputActions = Array<AvailableActions>";

  const final_type = `${RecordOfActionsType.join("\n")}

${AvailableActionsType}

${ChainedActionsType}`;

  const type_description = wrapType(final_type);
  const combinedZod = z.array(z.union(actionZodValue));

  return {
    combinedZod,
    type_description,
    RecordOfActionsType,
    AvailableActionsType,
    ChainedActionsType,
    stateZod,
    rawStateZod,
    actionZodData,
  };
};

export type ChainFunctions<A extends AvailableActions, U extends State, P> = (
  param: P,
  state?: Partial<StateToValues<U>>,
  rawState?: Partial<Input<ZodObject<U>>>
) => { [K in keyof A]: ToAsyncFunction<Infer<A[K]>> };

export type ChainExample<A extends AvailableActions, U extends State> = {
  Input: string;
  State?: Partial<Input<ZodObject<U>>>;
  Output: Array<Partial<GetFirstParamFunction<A>>>;
}[];

export type GetFirstParamFunction<A extends AvailableActions> = {
  [k in keyof A]: Infer<A[k]["_def"]["args"]>[0];
};