// src/constants/theme.ts

export const Colors = {
  // ── Backgrounds — lifted and warmer ──────────────────────────────────────
  background:  '#2c5b8e',   // was #0D1B2A — slightly warmer, less black
  navy:        '#3b669d',   // was #162032 — more visible, warmer blue
  card:        '#234065',   // was #1A2840 — noticeably lighter, feels alive
  surface:     '#243D5C',   // was #1F2F45 — brighter surface layer
  cardHover:   '#2A4668',   // was #1e3050 — rich mid-blue hover

  // ── Gold — richer, more saturated, happier ────────────────────────────────
  gold:        '#e3b345',   // was #C9A84C — deeper, more saturated
  goldLight:   '#ffd364',   // was #E8C97A — brighter, sunnier
  goldPale:    '#FBE9A0',   // was #F5E8C5 — warmer pale
  goldMuted:   'rgba(212,168,67,0.18)',  // slightly stronger muted
  goldBorder:  'rgba(212,168,67,0.32)',  // more visible borders

  // ── Green — more vivid, alive ─────────────────────────────────────────────
  green:       '#52C97E',   // was #4CAF7A — brighter, more vivid
  greenMuted:  'rgba(82,201,126,0.22)',

  // ── Accent colours — new warm tones for visual happiness ─────────────────
  amber:       '#E8A020',   // warm amber for special highlights
  teal:        '#38B2AC',   // cool teal accent

  // ── Alerts ────────────────────────────────────────────────────────────────
  red:         '#F05252',   // was #E53E3E — slightly softer red

  // ── Text — brighter, higher contrast ─────────────────────────────────────
  textPrimary:   '#F0F7FF',   // was #EDF2F7 — cooler white, crisper
  textSecondary: '#9DB4CC',   // was #8FA0B8 — lifted, more readable
  textMuted:     '#5A7A99',   // was #4A6080 — more visible muted

  // ── Borders — more visible, feels less flat ───────────────────────────────
  borderSoft:    'rgba(255,255,255,0.09)',
  borderMedium:  'rgba(255,255,255,0.16)',  
} as const;

export const Spacing  = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32 } as const;
export const Radius   = { sm:8, md:12, lg:16, xl:20, xxl:24, full:999 } as const;
export const FontSize = { xs:10, sm:12, md:14, base:15, lg:16, xl:18, xxl:20, xxxl:24, display:36, hero:48 } as const;