import type { infer as Infer } from "zod";
import type { ResponseType } from "../extract";
import { ArrayMapAsync } from "../lib/utils";
import type { State } from "../state";
import type { AvailableActions, ChainFunctions } from "./chained";
import type { executeChainActions } from "./execute";
import type { implementChain } from "./implement";

type Execution<
U extends State,
A extends AvailableActions,
P>
= Awaited<ReturnType<typeof executeChainActions<State, AvailableActions, {}>>>

export const reExecuteChainActions = async <
  U extends State,
  A extends AvailableActions,
  P
>(
  init: ReturnType<typeof implementChain<A, U, P>>,
  previous: Execution<U,A,P>,
  config: {
    permissions: Record<string, boolean>;
    params: (typeof init)["functions"] extends undefined
      ? never
      : Parameters<ChainFunctions<A, U, P>>[0];
  }
):Promise<Execution<U,A,P>> => {
  const permissions = config?.permissions ?? undefined;

  if (!init.functions) throw new Error("Functions are not provided");
  if (!config?.params) throw new Error("Function parameters are not provided");

  const setOfFunctions = init.functions(
    config.params,
    previous.state.validated,
    previous.state.partial
  );

  const inputBucket = previous.inputBucket;
  const outputBucket = previous.outputBucket;

  const executions = await ArrayMapAsync(
    previous.executions,
    async (execute, i, [err, setError]) => {
      if (execute.result) return execute;

      const { key, value } = execute as unknown as {key: string, value: Parameters<Infer<A[keyof A]>>}

      if (!key || !value) {
        setError();
        return {
          iteration:i,
          key: "unknown",
          error: new Error("Function not found in iteration"),
        };
      }

      if (!(key in setOfFunctions)) {
        setError();
        return {
          key,
          value,
          iteration: i,
          error: new Error(`Function "${key}" is not implemented yet`),
        };
      }

      const eachPermission = permissions ? permissions[key] ?? false : false;

      if (!eachPermission) {
        setError();
        return {
          key,
          iteration: i,
          value,
          permission: eachPermission,
          error: new Error(
            `Execution of function "${key}" is not permitted by user`
          ),
        };
      }

      if (err) {
        return {
          iteration: i,
          key,
          value,
          permission: eachPermission,
          error: new Error("Error detected in previous action"),
        };
      }

      if (typeof value === "object") {
        for (const [K, V] of Object.entries(value)) {
          if (typeof V === "string") {
            if (V === "unknown") {
              if (outputBucket[K]) {
                value[K as keyof typeof value] = outputBucket[K];
              } else if (inputBucket[K]) {
                value[K as keyof typeof value] = inputBucket[K];
              } else {
                setError();
                return {
                  key,
                  iteration:i,
                  value,
                  permission: eachPermission,
                  error: new Error(
                    `Value of "${K}" is unknown or not specified`
                  ),
                };
              }
            } else {
              inputBucket[K] = V;
            }
          }
        }
      }

      const result = await setOfFunctions[key as keyof typeof setOfFunctions](
        value
      );

      if (typeof result === "object") {
        for (const [K, V] of Object.entries(result)) {
          outputBucket[K] = V;
        }
      }

      return {
        key,
        iteration:i,
        value,
        permission: eachPermission,
        result,
      };
    }
  );

    return {
        executions,
        inputBucket,
        outputBucket,
        state: previous.state,
    };
};
