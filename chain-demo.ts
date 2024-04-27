import { TogetherAI } from "@langchain/community/llms/togetherai";
import { z } from "zod";
import {
  type AvailableActions,
  executeChainActions,
  getZodChainedCombined,
  implementChain,
} from "./chain";
import { reExecuteChainActions } from "./chain/re-execute";
import { createExtraction } from "./extract";
import { chainedActionPrompt } from "./lib/prompt";
import { stringZod } from "./lib/utils";
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
    .returns(z.object({ email: z.string(), name: z.string() })),
  sentEmailToUser: z
    .function()
    .describe(
      "When action is requisting to sent an email to someone. Pass name of user as param."
    )
    .args(z.object({ email: z.string(), text: z.string(), subject: z.string() }))
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
    .object({
      name: z.string(),
      email: z.string(),
    })
    .transform(
      (x) =>
        `User selected/mensioned a contact from list, with name: ${x.name} and email: ${x.email}`
    ),
} satisfies State;

type FuncParam = {
  ctx: object;
  extra: object;
};

const materials = getZodChainedCombined(Schema, userState);

// console.log(stringZod(materials.combinedZod ?? z.any(), "RawState"));

const init = implementChain(Schema, userState, materials, {
  functions: (x: FuncParam, y, z) => ({
    searchUserWithName: async ({ name }) => ({ email: `${name}@gmail.com`, name: name }),
    sentEmailToUser: async ({ email, text, subject }) =>
      `Senting email to ${email}, with subject: ${subject} at ${(new Date()).toLocaleString()}`,
    createSummary: async ({ text }) => {
      console.log("extra data", x, y, z);
      return { text: `Summary of ${text}` };
    },
  }),
  examples: [
    {
      Input: "Find user Rajat",
      Output: [{ searchUserWithName: { name: "Rajat" } }],
    },
    {
      Input: "Sent casual 'hello' email to guy named Alex",
      Output: [
        { searchUserWithName: { name: "Alex" } },
        { sentEmailToUser: { email: "unknown", text: "hello", subject: "Casual Talk" } },
      ],
    },
    {
      Input: "Sent 'Hi' email to this guy with subject: recent updates about work",
      State: {
        userSelectedContact: {
          name: "Rahul",
          email: "rahul@gmail.com",
        }
      },
      Output: [{ sentEmailToUser: { email: "rahul@gmail.com", text: "Hi", subject: "updates about work" } }],
    },
    {
      Input: "Create summary of BlockChain and Sent email to abcd@example.com",
      Output: [
        { createSummary: { text: "BlockChain" } },
        { sentEmailToUser: { email: "abcd@example.com", text: "unknown", subject: "Summary of BlockChain" } },
      ],
    },
  ],
});

const chain = await createExtraction(
  model,
  init,
  materials,
  chainedActionPrompt
);

const res = await chain.invoke(
  "sent a summary of 'health care' to her on email",
  {
    state: {
      userSelectedContact:{
        email: "Diane@gmail.com",
        name: "Diane"
      }
    }
  }
);

// console.log(res.response);

// const res = {
//   input: "find Diane, and sent a summary of 'health care' to her on email",
//   response: {
//     raw: '\n<json>[{"searchUserWithName":{"name":"Diane"}},{"createSummary":{"text":"health care"}},{"sentEmailToUser":{"email":"unknown","text":"unknown"}}]</json>',
//     validated: {
//       data: [
//         { searchUserWithName: { name: "Diane" } },
//         { createSummary: { text: "health care" } },
//         { sentEmailToUser: { email: "unknown", text: "unknown" } },
//       ],
//       json: [
//         { searchUserWithName: { name: "Diane" } },
//         { createSummary: { text: "health care" } },
//         { sentEmailToUser: { email: "unknown", text: "unknown" } },
//       ],
//       success: true,
//     },
//   },
//   state: {
//     raw: { userSelectedContact: "Diane" },
//     partial: { data: { userSelectedContact: "Diane" }, success: true },
//     validated: {
//       data: {
//         userSelectedContact: "User selected a contact named Diane from list",
//       },
//       success: true,
//     },
//   },
// };

const previous = await executeChainActions(
  init,
  res,
  {
    permissions: {
      searchUserWithName: false,
      createSummary: false,
      sentEmailToUser: false,
    },
    params: {
      ctx: {},
      extra: {},
    },
  }
);

console.log(previous);


const newResponse = await reExecuteChainActions(
  init,
  previous,
  {
    permissions: {
      searchUserWithName: true,
      createSummary: false,
      sentEmailToUser: false,
    },
    params: {
      ctx: {},
      extra: {},
    },
  }
);

console.log(newResponse);