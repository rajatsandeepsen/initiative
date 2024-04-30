import type { infer as Infer } from "zod";
import type {
	AvailableActions,
	ChainFunctions,
	getZodChainedCombined,
	implementChain,
} from ".";
import type { State } from "../state";
import type { ResponseType } from "../extract";
import { ArrayMapAsync, ObjectMap, ObjectMapAsync } from "../lib/utils";

export type ChainPermissions<A extends AvailableActions> = {
	[F in keyof A]: boolean;
};

type ChainResponse<S extends AvailableActions, K extends keyof S = keyof S> = ({
	key: K;
	iteration: number;
	permission?: boolean;
} & ({ value: ReturnType<Infer<S[K]>> } | { error: Error }))[];

export type ChainReturn<S extends AvailableActions> = Partial<{
	[K in keyof S]: ChainResponse<S>[0];
}>;

export const executeChainActions = async <
	U extends State,
	A extends AvailableActions,
	P,
>(
	// schema: A,
	// state: U,
	init: ReturnType<typeof implementChain<A, U, P>>,
	response: ResponseType<A, U>,
	// actionZod: ReturnType<typeof getZodChainedCombined<A, U>>["combinedZod"],
	config: {
		permissions?: ChainPermissions<A>;
		params: (typeof init)["functions"] extends undefined
			? never
			: Parameters<ChainFunctions<A, U, P>>[0];
	},
) => {
	if (!response.response.validated) {
		throw new Error("Response is not validated");
	}

	const permissions = config?.permissions ?? undefined;

	if (!response.response.validated.success)
		throw new Error("Response is not successfully validated");

	console.log(JSON.stringify(response.response))

	const chainActions = response.response.validated.data as Array<{
		[k in keyof A]: A[k];
	}>;

	if (!init.functions) throw new Error("Functions are not provided");
	if (!config?.params) throw new Error("Function parameters are not provided");

	const state = {
		validated: response.state.validated?.data,
		partial: response.state.partial?.data,
	};

	const setOfFunctions = init.functions(
		config.params,
		state.validated,
		state.partial,
	);

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const inputBucket: { [K in string]: any } = {};
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const outputBucket: { [K in string]: any } = {};

	console.log(chainActions)

	const executions = await ArrayMapAsync(
		chainActions,
		async (action, iteration, [error, setError]) => {
			const func = Object.entries(action)[0];

			console.log(func, action)

			if (!func) {
				setError();
				return {
					iteration,
					key: "unknown",
					error: new Error("Function not found in iteration"),
				};
			}

			const [key, value] = func as [string, Parameters<Infer<A[keyof A]>>[0]];

			if (!(key in setOfFunctions)) {
				setError();
				return {
					key,
					value,
					iteration,
					error: new Error(`Function "${key}" is not implemented yet`),
				};
			}

			const eachPermission = permissions ? permissions[key] ?? false : false;

			if (!eachPermission) {
				setError();
				return {
					key,
					iteration,
					value,
					permission: eachPermission,
					error: new Error(
						`Execution of function "${key}" is not permitted by user`,
					),
				};
			}

			if (error) {
				return {
					iteration,
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
							}
							// } else {
							// 	setError();
							// 	return {
							// 		key,
							// 		iteration,
							// 		value,
							// 		permission: eachPermission,
							// 		error: new Error(
							// 			`Value of "${K}" is unknown or not specified`,
							// 		),
							// 	};
							// }
						} else {
							inputBucket[K] = V;
						}
					}
				}
			}
			try {
				const result =
					await setOfFunctions[key as keyof typeof setOfFunctions](value);

				if (typeof result === "object") {
					for (const [K, V] of Object.entries(result)) {
						outputBucket[K] = V;
					}
				}

				return {
					key,
					iteration,
					value,
					permission: eachPermission,
					result,
				};
			} catch (err) {
				return {
					key,
					iteration,
					value,
					permission: eachPermission,
					error: err,
				};
			}
		},
	);

	return { executions, inputBucket, outputBucket, state };
};
