export const VALID_CLIENTS = ["claude", "cline", "roo-cline"] as const
export type ValidClient = (typeof VALID_CLIENTS)[number]
