export type LinkedinBrand = "corvo_labs" | "lower_db";

export const LINKEDIN_BRAND_LABEL: Record<LinkedinBrand, string> = {
  corvo_labs: "Corvo Labs",
  lower_db: "the lower dB",
};

/** Compact label for calendar chips */
export const LINKEDIN_BRAND_SHORT: Record<LinkedinBrand, string> = {
  corvo_labs: "Corvo",
  lower_db: "lower dB",
};

export function resolveLinkedinBrand(
  value: LinkedinBrand | undefined
): LinkedinBrand {
  return value ?? "corvo_labs";
}

export function formatLinkedinBrandLabel(brand: LinkedinBrand | undefined): string {
  return LINKEDIN_BRAND_LABEL[resolveLinkedinBrand(brand)];
}

export function formatLinkedinBrandShort(brand: LinkedinBrand | undefined): string {
  return LINKEDIN_BRAND_SHORT[resolveLinkedinBrand(brand)];
}
