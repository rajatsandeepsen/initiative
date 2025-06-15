import type { CoreMessage, Schema } from 'ai';
import type { z } from 'zod';

type Parameters = z.ZodTypeAny | Schema<any>;
type Returns = Parameters;

export type inferParameters<PARAMETERS extends Parameters> =
  PARAMETERS extends Schema<any>
    ? PARAMETERS['_type']
    : PARAMETERS extends z.ZodTypeAny
    ? z.infer<PARAMETERS>
    : never;

export interface ToolExecutionOptions {
  /**
   * The ID of the tool call. You can use it e.g. when sending tool-call related information with stream data.
   */
  toolCallId: string;

  /**
   * Messages that were sent to the language model to initiate the response that contained the tool call.
   * The messages **do not** include the system prompt nor the assistant response that contained the tool call.
   */
  messages: CoreMessage[];

  /**
   * An optional abort signal that indicates that the overall operation should be aborted.
   */
  abortSignal?: AbortSignal;
}

/**
A tool contains the description and the schema of the input that the tool expects.
This enables the language model to generate the input.

The tool can also contain an optional execute function for the actual execution function of the tool.
 */
export type CodeTool<
  PARAMETERS extends Parameters = any,
  RETURNS extends Returns = any,
  RESULT = any,
> = {
  /**
The schema of the input that the tool expects. The language model will use this to generate the input.
It is also used to validate the output of the language model.
Use descriptions to make the input understandable for the language model.
   */
  parameters: PARAMETERS;

  returns: RETURNS;

  /**
An optional description of what the tool does. Will be used by the language model to decide whether to use the tool.
   */
  description?: string;

  /**
An async function that is called with the arguments from the tool call and produces a result.
If not provided, the tool will not be executed automatically.

@args is the input of the tool call.
@options.abortSignal is a signal that can be used to abort the tool call.
   */
  execute: (
    args: inferParameters<PARAMETERS>,
    options: ToolExecutionOptions,
  ) => PromiseLike<inferParameters<RETURNS>>;
}

/**
Helper function for inferring the execute args of a tool.
 */
// Note: special type inference is needed for the execute function args to make sure they are inferred correctly.

export function codeTool<PARAMETERS extends Parameters, RETURNS extends Returns>(
  tool: CodeTool<PARAMETERS, RETURNS>,
): CodeTool<PARAMETERS, RETURNS> {
  return tool;
}
