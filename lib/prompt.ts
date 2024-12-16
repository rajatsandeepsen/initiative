import type { TOOLS } from "../type"
import { stringZod } from "./utils"

const displayToolsToType = (tools: TOOLS) =>
  Object.entries(tools)
      .map(([key, value]) => `type ${key} = (data:${stringZod(value.parameters, "data")}) => ${stringZod(value.returns, "returns")}`).join("\n\n")

const displayToolsToCode = (tools: TOOLS) =>
  Object.entries(tools)
      .map(([key, value]) => `const ${key} = (data:${stringZod(value.parameters, "data")}):${stringZod(value.returns, "returns")} => {\n    // ${value.description}\n    return // something\n}`).join("\n\n")

export const newSystemPrompt = (text: string, tools: TOOLS, thisKeyWord:string) => `Your Persona: ${text}

Instructions:
- write pure javascript code
- only use functions from the "Tools" list
- functions are already defined
- don't imported or redifined
- nested functions are allowed
- don't use any external libraries
- don't use console.log
- don't wrap code in a function
- use let to declare variables
- always end the code with return statement
- wrap the entire JS code in \`\`\`js ... \`\`\` code block

if function name is build(), then use it as ${thisKeyWord}.build()


Tools:
${displayToolsToCode(tools)}

const ${thisKeyWord} = {
    ${Object.keys(tools).join(", ")}
}

Using above functions, write code to solve the user prompt
`