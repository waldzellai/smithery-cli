export const VALID_CLIENTS = ["claude"] as const
export type ValidClient = (typeof VALID_CLIENTS)[number]
