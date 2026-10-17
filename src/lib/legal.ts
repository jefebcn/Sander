import { CONTACT_EMAIL } from "@/lib/contact"

/**
 * The one address shown on the legal pages (Privacy Policy and Terms).
 * They used to disagree (a personal Gmail on /privacy, legal@sander.app on
 * /terms); both now read this, set to the address /privacy already used and
 * that lib/contact uses for account deletion requests. To change it, change
 * it here.
 */
export const LEGAL_EMAIL = CONTACT_EMAIL
