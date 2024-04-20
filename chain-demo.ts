import { TogetherAI } from "@langchain/community/llms/togetherai";
import { z } from "zod";
import {
  type AvailableActions,
  executeChainActions,
  getZodChainedCombined,
  implementChain,
  ChainReturn,
} from "./chain";
import { createExtraction } from "./extract";
import { chainedActionPrompt } from "./lib/prompt";
import type { State } from "./state";

const model = new TogetherAI({
  modelName: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  apiKey: process.env.API_KEY,
});

const Schema = {
  searchUserWithName: z
    .function()
    .describe("When action needs imformation of a user to continue in order. ")
    .args(z.object({ name: z.string() }))
    .returns(z.object({ email: z.string() })),
  sentEmailToUser: z
    .function()
    .describe(
      "When action is requisting to sent an email to someone. Pass name of user as param."
    )
    .args(z.object({ email: z.string(), text: z.string() }))
    .returns(z.string()),
  createSummary: z
    .function()
    .describe(
      "When action is requisting to create a summary of text. Pass text as param."
    )
    .args(z.object({ text: z.string() }))
    .returns(z.object({ text: z.string() })),
} satisfies AvailableActions;

const userState = {
  userSelectedContact: z
    .string()
    .transform((x) => `User selected a contact named ${x} from list`),
  userDragged: z.string().transform((x) => `User dragged ${x} out of the box`),
  userEvent: z
    .object({
      x: z.string(),
    })
    .transform((e) => e.x),
} satisfies State;

type FuncParam = {
  ctx: object;
  extra: object;
};

const materials = getZodChainedCombined(Schema, userState);

// console.log(JSON.stringify(materials.actionZodData, null, 2))

const init = implementChain(Schema, userState, materials, {
  functions: (x: FuncParam, y, z) => ({
    searchUserWithName: async ({ name }) => ({ email: `${name}@gmail.com` }),
    sentEmailToUser: async ({ email, text }) =>
      `Senting email to ${email}, with subject: ${text}`,
    createSummary: async ({ text }) => {
      console.log("extra data", x, y, z);
      return { text: `Summary of ${text}` };
    },
  }),
  examples: [
    {
      Input: "Find user Rajat",
      State: {
        userSelectedContact: "Rajat",
      },
      Output: [{ searchUserWithName: { name: "Rajat" } }],
    },
    {
      Input: "Sent email to guy named Alex",
      Output: [
        { searchUserWithName: { name: "Alex" } },
        { sentEmailToUser: { email: "unknown" } },
      ],
    },
    {
      Input: "Sent email to this guy",
      Output: [{ sentEmailToUser: { email: "unknown" } }],
    },
    {
      Input: "Create summary of BlockChain and Sent email to abcd@example.com",
      Output: [
        { createSummary: { text: "BlockChain" } },
        { sentEmailToUser: { email: "abcd@example.com", text: "unknown" } },
      ],
    },
  ],
});

const chain = await createExtraction(
  // Schema,
  // userState,
  model,
  init,
  {
    combinedZod: materials.combinedZod,
    stateZod: materials.stateZod,
    rawStateZod: materials.rawStateZod,
  },
  chainedActionPrompt
);

// const res = await chain.invoke(
//   "find Diane, and sent a summary of 'health care' to her on email",
//   {
//     state: {
//       userSelectedContact: "Diane"
//     },
//   },
// );

const res = {
  input: "find Diane, and sent a summary of 'health care' to her on email",
  response: {
    raw: '\n<json>[{"searchUserWithName":{"name":"Diane"}},{"createSummary":{"text":"health care"}},{"sentEmailToUser":{"email":"unknown","text":"unknown"}}]</json>',
    validated: {
      data: [
        { searchUserWithName: { name: "Diane" } },
        { createSummary: { text: "health care" } },
        { sentEmailToUser: { email: "unknown", text: "unknown" } },
      ],
      json: [
        { searchUserWithName: { name: "Diane" } },
        { createSummary: { text: "health care" } },
        { sentEmailToUser: { email: "unknown", text: "unknown" } },
      ],
      success: true,
    },
  },
  state: {
    raw: { userSelectedContact: "Diane" },
    partial: { data: { userSelectedContact: "Diane" }, success: true },
    validated: {
      data: {
        userSelectedContact: "User selected a contact named Diane from list",
      },
      success: true,
    },
  },
};

const x = await executeChainActions(
  // Schema,
  // userState,
  init,
  res,
  {
    permissions: {
      searchUserWithName: true,
      createSummary: true,
      sentEmailToUser: true
    },
    params: {
      ctx: {},
      extra: {},
    },
  }
);

console.log(x);


// type xxx = ChainReturn<typeof Schema>

// const xxx :xxx = {
  
// }