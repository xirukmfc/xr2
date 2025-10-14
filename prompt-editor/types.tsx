export interface Variable {
  name: string
  type: "string" | "number" | "boolean" | "array"
  defaultValue?: string
  isDefined: boolean
}

export interface Version {
  id: string
  version: string
  status: "Active" | "Inactive" | "Draft"
  timestamp: string
  author: string
  updater?: string
  description: string
  requests: string
  successRate?: string
  systemPrompt: string
  userPrompt: string
  variables: Variable[]
}
