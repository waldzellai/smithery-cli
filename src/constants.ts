export const VALID_CLIENTS = ["claude", "cline"] as const
export type ValidClient = (typeof VALID_CLIENTS)[number]
