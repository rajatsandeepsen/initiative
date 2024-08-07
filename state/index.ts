import type { ZodSchema, infer as Infer, ZodObject, ZodEffects, ZodString, input as Input } from "zod"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type State = Record<string, ZodEffects<ZodSchema, string, any> | ZodString>

export type StateToValues<U extends State> = Input<ZodObject<U>>