/**
 * Username validation and moderation utilities.
 *
 * Usage (frontend + backend):
 *   import { validateUsername, normalizeForModeration, generateUsernameSuggestions }
 *     from '@/utils/usernameValidation';
 */

import {
  BLOCKED_TERMS,
  KEYBOARD_MASH_PATTERNS,
  LEET_MAP,
  PROTECTED_TERMS,
} from '@/constants/blockedUsernames';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  /** User-safe message — never exposes which term triggered rejection. */
  error?: string;
  /** Internal reason code (for logging / metrics — do not send to clients). */
  reason?: 'format' | 'content' | 'protected' | 'spam' | 'taken';
}

// ---------------------------------------------------------------------------
// Format rule (mirrors the DB-level USERNAME_REGEX)
// ---------------------------------------------------------------------------
export const USERNAME_FORMAT_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;

// ---------------------------------------------------------------------------
// normalizeForModeration
//
// Produces a lowercase, separator-stripped, leet-decoded string used
// exclusively for blocked-term matching.  The original format is preserved
// for display and storage purposes.
// ---------------------------------------------------------------------------
export function normalizeForModeration(username: string): string {
  let s = username.toLowerCase();

  // Replace leet-speak characters before stripping separators so that
  // patterns like "sh!t" → "shit" are caught.
  s = s
    .split('')
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join('');

  // Strip separators and whitespace
  s = s.replace(/[._\-\s]+/g, '');

  return s;
}

// ---------------------------------------------------------------------------
// containsBlockedTerm
//
// Returns true if `normalized` (already processed by normalizeForModeration)
// contains any entry from BLOCKED_TERMS.
// ---------------------------------------------------------------------------
export function containsBlockedTerm(normalized: string): boolean {
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

// ---------------------------------------------------------------------------
// containsProtectedTerm
//
// Returns true if `normalized` contains any platform-reserved word.
// ---------------------------------------------------------------------------
export function containsProtectedTerm(normalized: string): boolean {
  return PROTECTED_TERMS.some((term) => normalized.includes(term));
}

// ---------------------------------------------------------------------------
// isSpammy
//
// Detects low-quality / gibberish usernames.
// Runs on the raw (non-normalised) lowercase value so that separator-
// heavy patterns are caught before stripping.
// ---------------------------------------------------------------------------
export function isSpammy(username: string): boolean {
  const lower = username.toLowerCase();

  // 5+ consecutive identical characters: aaaaa, 11111
  if (/(.)\1{4,}/.test(lower)) return true;

  // 6+ consecutive digits: 123456, 999999
  if (/\d{6,}/.test(lower)) return true;

  // Username is exclusively digits
  if (/^\d+$/.test(lower)) return true;

  // Keyboard mash patterns
  if (KEYBOARD_MASH_PATTERNS.some((re) => re.test(lower))) return true;

  return false;
}

// ---------------------------------------------------------------------------
// validateUsername
//
// Main entry point.  Runs every check in order and returns a result
// suitable for both frontend display and backend enforcement.
//
// Checks three surfaces:
//   1. Original value  (format + spam)
//   2. Lowercase original (protected-term match)
//   3. Normalised value (bypass-resistant blocked-term match)
// ---------------------------------------------------------------------------
export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { valid: false, error: 'Username is required', reason: 'format' };
  }

  const trimmed = username.trim();

  // ── 1. Length & character set ──────────────────────────────────────────
  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'Username must be at least 3 characters',
      reason: 'format',
    };
  }
  if (trimmed.length > 20) {
    return {
      valid: false,
      error: 'Username must be 20 characters or fewer',
      reason: 'format',
    };
  }
  if (!USERNAME_FORMAT_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Username may only contain letters, numbers, underscores, and periods',
      reason: 'format',
    };
  }
  if (/^[._]/.test(trimmed) || /[._]$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Username cannot start or end with a period or underscore',
      reason: 'format',
    };
  }
  if (/[._]{2,}/.test(trimmed)) {
    return {
      valid: false,
      error: 'Username cannot contain consecutive periods or underscores',
      reason: 'format',
    };
  }

  // ── 2. Spam / low-quality ──────────────────────────────────────────────
  if (isSpammy(trimmed)) {
    return {
      valid: false,
      error: 'Choose a different username',
      reason: 'spam',
    };
  }

  // ── 3. Normalise for content checks ────────────────────────────────────
  const normalized = normalizeForModeration(trimmed);
  // Also check the plain lowercase (catches non-leet versions without stripping dots)
  const lower = trimmed.toLowerCase();

  // ── 4. Protected / impersonation ──────────────────────────────────────
  if (containsProtectedTerm(normalized) || containsProtectedTerm(lower.replace(/[._]/g, ''))) {
    return {
      valid: false,
      error: 'Username is unavailable',
      reason: 'protected',
    };
  }

  // ── 5. Content moderation ──────────────────────────────────────────────
  if (containsBlockedTerm(normalized)) {
    return {
      valid: false,
      error: 'Username contains restricted language',
      reason: 'content',
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// generateUsernameSuggestions
//
// When a preferred username is unavailable (taken), suggests alternatives.
// Does NOT check DB availability — the caller must verify suggestions.
// ---------------------------------------------------------------------------
export function generateUsernameSuggestions(base: string): string[] {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);

  const year = new Date().getFullYear().toString().slice(-2);
  const rand2 = () => Math.floor(10 + Math.random() * 90).toString();

  const candidates = [
    `${clean}${rand2()}`,
    `${clean}_${rand2()}`,
    `${clean}${year}`,
    `${clean}_trader`,
    `trader_${clean}`,
    `${clean}_pro`,
  ];

  // Filter out any candidates that fail validation
  return candidates
    .filter((s) => s.length >= 3 && s.length <= 20 && validateUsername(s).valid)
    .slice(0, 3);
}
