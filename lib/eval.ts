import type { TOOLS } from "../type"

export const createEvaluationGround = (tools: TOOLS, code: string) => {
  // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
  const data = Object.entries(tools).reduce((acc, [key, value]) => ({ ...acc, [key]: value.execute }), {})

  return () => new Function(code).apply(data, [])
}