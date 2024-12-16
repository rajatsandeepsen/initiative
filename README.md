# Initiative

#### Vercel AI-SDK extension for making coding decisions 

Use your zod schema to create set of tools and use it with any llm models on AI-SDK.

```bash
npm install initiative
```

## Usage

```bash
npm install initiative zod ai @ai-sdk/groq
```

### Create Model

```ts
import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({
	apiKey: proccess.env.GROQ_API_KEY,
});

export const model = groq('llama3-8b-8192')
```

### Lets build an AI banking app

```ts
import { z } from "zod"
import { etool, generateCode } from "initiative"
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
        execute: () => {
            return balance
        },
        returns: z.number()
    }),
    sentMoney: etool({
        description: "send money to the user",
        parameters: z.object({ amount: z.number(), receiver: z.string() }),
        execute: ({ amount, receiver }) => {
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
        parameters: z.object({}),
        execute: () => {
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
```

### Output

```json
{
  balance: 20,
  history: [
    {
      amount: 20,
      to: "Alice",
    }, {
      amount: 10,
      from: "Bob",
    }, {
      amount: 10,
      to: "Bob",
    }
  ],
}
```

### Code written by the AI

```ts
let history = this.getHistory({});
let amountGotFromBob = 0;
for (let transaction of history) {
    if (transaction.from === 'Bob') {
        amountGotFromBob += transaction.amount;
    }
}
if (amountGotFromBob > 0) {
    this.sentMoney({ amount: amountGotFromBob, receiver: 'Bob' });
}
let balance = this.getBalance({});
return { balance, history };
```

### Packages used under the hood

- [zod](https://zod.dev/) for schema validation
- [zod-to-ts](https://github.com/sachinraja/zod-to-ts) for converting zod schema to typescript