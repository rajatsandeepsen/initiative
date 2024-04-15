import type { ZodSchema, infer as Infer, ZodObject } from "zod"

export type State = Record<string, ZodSchema>

export type StateToValues<U extends State> = Infer<ZodObject<U>>