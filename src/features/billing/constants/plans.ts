export type PlanId = "sandbox" | "startup" | "growth" | "embed";
export type BillingCycle = "monthly" | "annual";

export interface PlanDetails {
  price: number | "Custom";
  baseDocs: number;
  baseTokens: number;
  docRate: number;
  tokenRatePer100k: number;
  hasDocOverage: boolean;
  hasTokenOverage: boolean;
}

export const getPlanDetails = (
  planId: PlanId,
  cycle: BillingCycle,
): PlanDetails => {
  switch (planId) {
    case "sandbox":
      return {
        price: 0,
        baseDocs: 50,
        baseTokens: 30000,
        docRate: 3,
        tokenRatePer100k: 12,
        hasDocOverage: true,
        hasTokenOverage: true,
      };
    case "growth":
      return {
        price: cycle === "annual" ? 3600 : 4800,
        baseDocs: Infinity,
        baseTokens: 450000,
        docRate: 2.1,
        tokenRatePer100k: 8.4,
        hasDocOverage: false,
        hasTokenOverage: true,
      };
    case "embed":
      return {
        price: "Custom",
        baseDocs: Infinity,
        baseTokens: Infinity,
        docRate: 0,
        tokenRatePer100k: 0,
        hasDocOverage: false,
        hasTokenOverage: false,
      };
    case "startup":
    default:
      return {
        price: cycle === "annual" ? 1520 : 1900,
        baseDocs: 500,
        baseTokens: 150000,
        docRate: 3,
        tokenRatePer100k: 12,
        hasDocOverage: true,
        hasTokenOverage: true,
      };
  }
};
