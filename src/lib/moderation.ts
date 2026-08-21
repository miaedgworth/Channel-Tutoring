const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\s-]?){7,}/;
const OFF_PLATFORM_RE =
  /\b(whatsapp|whats app|snapchat|snap chat|instagram|insta\b|telegram|my number|call me|text me|outside (the )?(app|platform|site))\b/i;

export function containsContactInfo(text: string): boolean {
  return EMAIL_RE.test(text) || PHONE_RE.test(text) || OFF_PLATFORM_RE.test(text);
}
