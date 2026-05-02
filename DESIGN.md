# Design System

## Color Palette

OKLCH-based. Restrained strategy: light base + one primary accent.

### Backgrounds
| Token | Value | Use |
|-------|-------|-----|
| bg-page | oklch(0.98 0.003 260) | Page background |
| bg-surface | oklch(1 0.002 260) | Card/panel surface |
| bg-muted | oklch(0.95 0.004 260) | Sidebar, muted areas |

### Text
| Token | Value | Use |
|-------|-------|-----|
| text-primary | oklch(0.15 0.006 260) | Headings |
| text-secondary | oklch(0.40 0.008 260) | Body |
| text-muted | oklch(0.58 0.007 260) | Labels |

### Accent
| Token | Value | Use |
|-------|-------|-----|
| accent | oklch(0.55 0.18 250) | Primary actions, countdown |
| accent-soft | oklch(0.55 0.18 250 / 0.1) | Tags, highlights |

### Semantic
| Token | Value | Use |
|-------|-------|-----|
| success | oklch(0.60 0.15 155) | Correct, completed |
| warning | oklch(0.70 0.15 75) | Countdown urgency |
| error | oklch(0.55 0.18 25) | Wrong, errors |

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | JetBrains Mono | 700 | 2rem |
| Heading | DM Sans | 700 | 1.25rem |
| Body | DM Sans | 400 | 0.9375rem |
| Label | JetBrains Mono | 500 | 0.75rem |

## Layout

- Sidebar: 240px fixed (desktop), bottom nav (mobile)
- Content max-width: 720px
- Card radius: 12px
- Grid gap: 12px

## Motion

- Transitions: 200ms ease-out
- No bounce, no elastic
