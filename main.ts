import { z } from "zod"
import { etool, generateCode } from "./index"
import { model } from "./model"

let balance = 30
const history = [
    { amount: 20, to: "Alice" },
    { amount: 10, from: "Bob" },
]

const tools = ({
    getBalance: etool({
        description: "get balance of the user",
        parameters: z.object({}),
        execute: async () => {
            return balance
        },
        returns: z.number()
    }),
    sentMoney: etool({
        description: "send money to the user",
        parameters: z.object({ amount: z.number(), receiver: z.string() }),
        execute: async ({ amount, receiver }) => {
            if (balance < amount) {
                throw new Error("Insufficient balance")
            }
            balance -= amount

            history.push({ amount, to: receiver })
        },
        returns: z.void()
    }),
    getHistory: etool({
        description: "get history of transactions",
        parameters: z.unknown(),
        execute: async () => {
            return history
        },
        returns: z.array(
            z.object({ amount: z.number(), to: z.string() })
                .or(z.object({ amount: z.number(), from: z.string() })))
    })
})

const result = await generateCode({
    model,
    system: "You are a banking app",
    tools: tools,
    prompt: "Get history and find amount i got from Bob, then send that amount to Bob. Then again get history and balance",
})

console.log("Code:\n", result.code)
console.log("Output:\n", result.execute())