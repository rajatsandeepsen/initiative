import { generateText } from "ai"
import { newSystemPrompt } from "./lib/prompt"
import type { GenerateCode, Prettify, TOOL, TOOLS } from "./type"
import { createEvaluationGround } from "./lib/eval"
import type { AnyZodObject, ZodAny, ZodSchema } from "zod"

const regex = /```js\n([\s\S]*?)\n```/g
const thisKeyWord = "listOfFunctions"

type RT = Omit<Awaited<ReturnType<typeof generateText>>, "toolResults">


export const generateCode = async <P extends ZodSchema, R extends ZodSchema>({
    tools, system, ...rest

}: Parameters<GenerateCode>[0] & { tools: TOOLS }): Promise<Prettify<RT & { code: string, execute: (() => unknown) } >> => {

    const systemNew = newSystemPrompt(system ?? "Follow the instructions and write code for the prompt", tools, thisKeyWord)

    const result = await generateText({
        ...rest,
        toolChoice: "none",
        system: systemNew
    })

    result.text

    const codeBlock = result.text.match(regex)

    if (!codeBlock) {
        throw new Error("No code block found")
    }

    const code = codeBlock[0].replace(/```js\n|```/g, "").replaceAll(thisKeyWord, "this")

    const evalCode = createEvaluationGround(tools, code)

    return {
        ...result,
        code,
        execute: evalCode,
    }
}


export const etool = <PARAMETERS extends ZodSchema, RESULT extends ZodSchema>(tool: TOOL<PARAMETERS, RESULT>) => {
    return tool
}