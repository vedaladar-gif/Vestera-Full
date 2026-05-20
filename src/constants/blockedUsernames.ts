/**
 * Username moderation constants.
 *
 * BLOCKED_TERMS   – content that is never allowed in a username (substring match
 *                   against the normalised form, see usernameValidation.ts).
 * PROTECTED_TERMS – platform-identity words; users cannot contain these.
 * KEYBOARD_MASH_PATTERNS – regex patterns that detect gibberish / spam strings.
 */

// ---------------------------------------------------------------------------
// LEET-SPEAK SUBSTITUTION MAP
// Applied during normalisation before every content check.
// ---------------------------------------------------------------------------
export const LEET_MAP: Record<string, string> = {
  '4': 'a', '@': 'a',
  '3': 'e',
  '1': 'i', '!': 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't',
  '6': 'g', '9': 'g',
  '8': 'b',
  '2': 'z',
};

// ---------------------------------------------------------------------------
// BLOCKED TERMS
// Checked as substrings against the normalised username.
// Terms are lowercase base forms; leet-speak variants are caught by LEET_MAP.
// ---------------------------------------------------------------------------
export const BLOCKED_TERMS: readonly string[] = [
  // ── Profanity ──────────────────────────────────────────────────────────
  'fuck', 'fvck', 'phuck',
  'shit', 'shyt',
  'cunt',
  'bitch',
  'asshole', 'jackass', 'dumbass', 'fatass', 'smartass', 'badass',
  'bastard',
  'dickhead', 'dickface',
  'cocksucker', 'cocksuck',
  'motherfuck', 'mofo',
  'piss',
  'prick',
  'douche',
  'turd',
  'wanker', 'wank',

  // ── Slurs (racial / ethnic / gender / orientation) ────────────────────
  'nigga', 'nigger', 'nigg',
  'chink',
  'spick', 'spic',
  'kike',
  'wetback',
  'gook',
  'beaner',
  'cracker',
  'coon',
  'towelhead', 'raghead',
  'retard', 'retarded',
  'tranny', 'trannie',
  'faggot', 'fagot',
  'dyke',

  // ── Sexual / explicit ─────────────────────────────────────────────────
  'porn', 'porno', 'xporn',
  'nude', 'nudes', 'naked',
  'boobs', 'boob',
  'tits', 'titty', 'titties',
  'penis', 'vagina', 'vulva',
  'masturbat',
  'dildo',
  'blowjob', 'handjob',
  'cumshot', 'cumslut',
  'jizz',
  'horny',
  'erect',
  'slut',
  'whore',
  'hooker',
  'prostitut',
  'onlyfans',
  'sexting',
  'sexting',
  'camgirl', 'camboy',
  'creampie',
  'milf',
  'boner',
  'hardon',
  'nympho',
  'sextoy',

  // ── Hate speech / extremism ───────────────────────────────────────────
  'nazi', 'naz1',
  'hitler',
  'kkk',
  'jihad',
  'terrorist', 'terrorism',
  'supremacist',
  'genocide',
  'ethnic',        // only blocked here to catch 'ethniccleansing' patterns
  'lynching', 'lynch',
  'rapist',
  'shooter',
  'bomber',
  'pedophile', 'paedophile', 'pedo', 'paedo',
  'groomer',

  // ── Self-harm / crisis ────────────────────────────────────────────────
  'selfharm', 'self_harm',
  'killme',
  'killyourself',
  'kys',
  'suicid',

  // ── Drug explicit ─────────────────────────────────────────────────────
  'cocaine', 'cocain',
  'heroin',
  'methhead', 'methdealer',
  'fentanyl',
  'crackhead', 'crackdealer',
  'drugdealer', 'drugking',
  'cartel',

  // ── Vulgar insults ────────────────────────────────────────────────────
  'scumbag',
  'sleazeball',
  'pervert', 'perv',
  'degenerate',
];

// ---------------------------------------------------------------------------
// PROTECTED TERMS
// Platform-identity words that could cause impersonation confusion.
// Checked as substrings against the normalised username.
// ---------------------------------------------------------------------------
export const PROTECTED_TERMS: readonly string[] = [
  'admin', 'administrator',
  'moderator', 'modteam',
  'support', 'helpdesk',
  'official',
  'owner',
  'staff',
  'system', 'sysop',
  'vestera', 'vesteraadmin', 'vesterastaff', 'vesterateam', 'vesteraofficial',
  'automod', 'modbot',
  'security',
  'trustandsafety',
  'bot',
];

// ---------------------------------------------------------------------------
// SPAM / KEYBOARD-MASH PATTERNS
// Applied to the original (un-normalised) username.
// ---------------------------------------------------------------------------
export const KEYBOARD_MASH_PATTERNS: readonly RegExp[] = [
  /qwert/i,
  /asdfg/i,
  /zxcvb/i,
  /qazwsx/i,
  /qweasd/i,
  /asdfjkl/i,
];
