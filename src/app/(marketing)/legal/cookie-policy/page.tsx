import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="21 August 2026">
      <p>
        This policy explains how Channel Tutoring uses cookies and similar
        technologies on our website.
      </p>

      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. They help the site remember information about your visit,
        like your login session or preferences.
      </p>

      <h2>Essential cookies</h2>
      <p>
        These are necessary for the platform to work and can&apos;t be
        switched off. They include:
      </p>
      <ul>
        <li>Authentication cookies, to keep you logged in securely.</li>
        <li>Security cookies, such as CSRF protection tokens.</li>
        <li>A cookie to remember your cookie consent choice.</li>
      </ul>

      <h2>Optional analytics cookies</h2>
      <p>
        With your consent, we may use analytics cookies to understand how
        visitors use our site, so we can improve it. These do not identify
        you personally. You can accept or decline these when you first
        visit the site, via the cookie banner, and change your choice at
        any time by clearing your browser&apos;s cookies for this site.
      </p>

      <h2>Managing cookies</h2>
      <p>
        Most browsers let you view, manage, delete and block cookies for a
        website. Blocking essential cookies may prevent parts of the site
        (like logging in) from working properly.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about our use of cookies? Email{" "}
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>.
      </p>
    </LegalPage>
  );
}
