import type { generateText } from "ai";
import type { ZodSchema, infer as Infer, ZodAny, ZodUnknown } from "zod";

export type TOOL<PARAMETERS extends ZodSchema, RESULT extends ZodSchema> = {
    parameters: PARAMETERS,
    returns: RESULT,
    execute: (data: Infer<PARAMETERS>) => Promise<Infer<RESULT>> | Infer<RESULT>,
    description?: string
}

export type TOOLS = Record<string, TOOL>

export type GenerateCode = typeof generateText<TOOLS>

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};