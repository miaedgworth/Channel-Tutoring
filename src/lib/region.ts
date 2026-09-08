// Channel Tutoring (Guernsey) and Nines Tutoring (Switzerland) run from this
// same codebase as two separate deployments, distinguished only by the
// NEXT_PUBLIC_REGION env var set on each Vercel project. Everything that
// differs between the two businesses — brand name, currency, legal
// jurisdiction, contact details — is centralised here so the rest of the
// app never hardcodes one region's details.
export type RegionId = "GG" | "CH";

export const REGION: RegionId = process.env.NEXT_PUBLIC_REGION === "CH" ? "CH" : "GG";

interface RegionConfig {
  id: RegionId;
  brandName: string;
  tagline: string;
  country: string;
  domain: string;
  supportEmail: string;
  logoSrc: string;
  logoAlt: string;
  currency: "GBP" | "CHF";
  currencyLocale: string;
  dateLocale: string;
  timeZone: string;
  legalEntityLine: string;
  governingLawLine: string;
  dataProtectionLine: string;
  bankAccountLine: string;
  // "DBS check" is specifically British terminology (Disclosure and
  // Barring Service) — Switzerland's equivalent is a criminal record
  // extract, so this is worded generically for CH rather than reusing the
  // UK-specific term.
  criminalRecordCheckLabel: string;
}

export const REGIONS: Record<RegionId, RegionConfig> = {
  GG: {
    id: "GG",
    brandName: "Channel Tutoring",
    tagline: "GCSE & A-Level Tutors in Guernsey",
    country: "Guernsey",
    domain: "www.channeltutoring.com",
    supportEmail: "info@channeltutoring.com",
    logoSrc: "/logo-icon.png",
    logoAlt: "Channel Tutoring",
    currency: "GBP",
    currencyLocale: "en-GB",
    dateLocale: "en-GB",
    // Guernsey follows the same GMT/BST clock changes as the UK and has no
    // IANA zone of its own, so "Europe/London" is the correct stand-in.
    timeZone: "Europe/London",
    legalEntityLine: "Channel Tutoring, Guernsey",
    governingLawLine: "the laws of Guernsey",
    dataProtectionLine: "the Guernsey Data Protection Law, 2017",
    bankAccountLine: "UK bank account",
    criminalRecordCheckLabel: "DBS check",
  },
  CH: {
    id: "CH",
    brandName: "Nines Tutoring",
    tagline: "GCSE & A-Level Tutors in Switzerland",
    country: "Switzerland",
    domain: "www.ninestutoring.ch",
    supportEmail: "info@ninestutoring.ch",
    // Placeholder — reuses Channel Tutoring's logo file until Mia supplies
    // Nines Tutoring branded artwork (see the setup guide).
    logoSrc: "/logo-icon.png",
    logoAlt: "Nines Tutoring",
    currency: "CHF",
    // "en-CH" (not "fr-CH") deliberately — the Swiss site's copy is English
    // for now (see AGENTS.md/session notes on the French rollout being a
    // later phase), so dates/currency should read in English too, just
    // with Swiss formatting conventions (CHF, apostrophe thousands sep).
    // Revisit once French copy ships.
    currencyLocale: "en-CH",
    dateLocale: "en-CH",
    timeZone: "Europe/Zurich",
    // Placeholders — Mia needs to confirm the actual registered entity name
    // and get these three lines checked by a Swiss lawyer before launch.
    legalEntityLine: "Nines Tutoring, Switzerland",
    governingLawLine: "Swiss law",
    dataProtectionLine: "the Swiss Federal Act on Data Protection (FADP)",
    bankAccountLine: "Swiss bank account (IBAN)",
    criminalRecordCheckLabel: "criminal record check",
  },
};

export const region = REGIONS[REGION];
