---
name: U-Guardian
description: A graphite wallet workspace with warm orange actions and a sage companion.
colors:
  orange: "#ff994d"
  orange-hover: "#ffb070"
  orange-text: "#ffb781"
  graphite: "#111318"
  surface: "#1c1e25"
  ivory: "#f5f1e9"
  muted: "#afb0b7"
  action-ink: "#211b16"
  divider: "#34363d"
  field: "#15171d"
  composer: "#25272e"
  warm-inset: "#30261f"
  focus: "#ffad70"
  error: "#ffb39c"
  leaf: "#d8e8b3"
  visor: "#24483b"
  face-light: "#fcfbe9"
typography:
  display:
    fontFamily: 'Manrope, "Leelawadee UI", Tahoma, sans-serif'
    fontSize: "clamp(28px, 3.5vw, 40px)"
    fontWeight: 550
    lineHeight: 1.25
    letterSpacing: "-1.5px"
  wordmark:
    fontFamily: 'Manrope, "Leelawadee UI", Tahoma, sans-serif'
    fontSize: "23px"
    fontWeight: 750
    letterSpacing: "-1px"
  title:
    fontFamily: 'Manrope, "Leelawadee UI", Tahoma, sans-serif'
    fontSize: "27px"
    fontWeight: 550
    letterSpacing: "-0.9px"
  body:
    fontFamily: 'Manrope, "Leelawadee UI", Tahoma, sans-serif'
    fontSize: "14px"
    lineHeight: 1.7
  quantity:
    fontFamily: 'Manrope, "Leelawadee UI", Tahoma, sans-serif'
    fontSize: "25px"
    fontWeight: 550
    letterSpacing: "-0.7px"
  label:
    fontFamily: 'Manrope, "Leelawadee UI", Tahoma, sans-serif'
    fontSize: "12px"
rounded:
  badge: "6px"
  navigation: "8px"
  field: "9px"
  control: "10px"
  inset: "12px"
  composer: "18px"
  mobile-panel: "20px"
  panel: "24px"
spacing:
  tight: "8px"
  compact: "12px"
  content: "16px"
  section: "24px"
  dialog: "32px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.control}"
    padding: "11px 16px"
  button-primary-hover:
    backgroundColor: "{colors.orange-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.control}"
    padding: "11px 16px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.orange-text}"
    padding: "10px 0"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.field}"
    padding: "11px 13px"
  composer:
    backgroundColor: "{colors.composer}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.composer}"
    padding: "16px"
  wallet-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.panel}"
    padding: "40px 44px 28px"
  settings-navigation:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.navigation}"
    padding: "8px 12px"
  watch-proposal:
    backgroundColor: "{colors.warm-inset}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.inset}"
    padding: "18px"
---

# Design System: U-Guardian

## Overview

**Creative North Star: "The companion beside your wallet"**

A graphite workspace uses warm orange actions and ivory text to make wallet information clear and approachable. The user-authorized U-topia palette reference informs the color direction; an original shield wordmark, single-wallet composition and retained sage geometric robot give U-Guardian its own expression. This documents the implemented local code-led redesign, with no approved image comp or generated imagery.

Dark tonal layers and generous space frame exact quantities and plain-language explanations. The companion brings personality through a gentle float and written state-linked expressions. Dialogs focus chat and configuration on the same page, with restrained entrances and reduced-motion support.

**Key Characteristics:**
- Graphite surfaces, orange actions with dark text, and ivory reading text.
- Self-hosted Manrope with Thai system fallbacks.
- An original shield wordmark and retained sage CSS companion.
- Exact quantities, explicit states, expandable evidence and confirmation actions.
- Bounded dialogs with sticky controls and keyboard focus return.

## Colors

### Primary

Warm orange marks primary actions, the shield, unread indicators and small structural accents. Lighter orange carries links and selected navigation. Primary buttons use dark action ink for readable contrast; ivory is the main reading color on graphite surfaces.

### Secondary

Sage leaf and forest visor colors are retained within the geometric mascot. Decorative asset monograms use warm orange tones, with a cool blue treatment for USDC. These marks identify rows visually and are hidden from assistive technology; the adjacent asset name carries meaning.

### Neutral

Graphite surrounds the lighter surface used by wallet and dialogs. Recessed fields and composer darken their immediate surroundings. Warm inset surfaces group user messages, watch proposals and alerts. Muted text carries support copy, and fine dividers separate holdings and settings. Errors pair peach text with readable explanations; they never depend on color alone.

**The Written State Rule.** Pair operational colors and mascot expressions with readable state text.

## Typography

Manrope is self-hosted at `public/fonts/manrope-variable.ttf`, preloaded in the page and declared with weights (200–800), `font-display: swap` and no synthetic styles. Its SIL Open Font License is retained at `public/fonts/OFL-Manrope.txt`. Leelawadee UI, Tahoma and sans-serif provide Thai fallback. Wordmarks and interface text share this family.

The wallet title uses the display role, becoming (27px) on mobile. Settings titles use the title role, becoming (24px); section titles are (18px). The host wordmark becomes (19px) on mobile; chat uses (18px), weight (650), becoming (17px) on mobile. Exact quantities use tabular numerals and the quantity role, becoming (21px) on mobile. Asset names use (16px), then (14px); supporting metadata generally uses (11–13px).

Chat paragraphs use (14px) with line height (1.9) across desktop and mobile. The empty-chat greeting uses (30px), becoming (25px) on mobile. Settings inputs use (16px), as does the mobile composer. Thai wallet and Settings headings remove negative tracking and use line height (1.5); Thai settings navigation and phase text receive larger text. The Thai empty-chat greeting removes negative tracking and uses line height (1.6). Diagnostic JSON uses a monospace stack and remains secondary to ordinary reading text.

## Layout

Lists use divider-separated rows within shared surfaces. The current wallet sits in a centered container with maximum width (900px), horizontal inset (32px), and wallet padding from its component token. The header has maximum width (1240px). At the shell breakpoint (620px), the wallet container inset becomes (16px), card padding becomes (58px 22px 24px), and freshness and refresh stack. The extra top padding reserves space for the perched launcher's label and the wrapped bilingual title/status row. Surface-specific geometry belongs in the surface brief.

Settings has maximum width (680px), viewport gutters totaling (32px), maximum height (88dvh), and padding (0 32px 32px). Its heading and horizontal section shortcuts stay sticky while the same dialog scrolls. On mobile, padding becomes (0 20px 24px) and maximum height (92dvh). Shortcuts scroll to existing sections and open the goals or matching disclosure when needed.

Chat has maximum width (720px), viewport gutters totaling (32px), height capped at the smaller of (740px) and (90dvh), and inner padding (0 28px 24px). At (520px), it uses (92dvh) height and padding (0 18px 18px). A fixed header and bottom composer frame the independently scrolling conversation. A centered mascot and greeting fill the empty state and disappear once messages exist. Options open from an ellipsis into a bounded popover; watches and Debug occupy separate scrolling panels inside the same dialog. Native dialogs lock background page scrolling. Settings keeps sticky controls; chat keeps its header outside the scrolling panels.

## Elevation & Depth

The wallet uses a soft ambient shadow over graphite; dialogs use stronger elevation with a dark translucent, blurred backdrop. Fine borders retain clear edges. The companion uses local inset shading and a contact shadow; the transparent launcher has no separate panel shadow. Decorative circular outlines behind the companion provide a restrained spatial accent. Exact shadow and motion values live in `.impeccable/design.json`.

The wallet enters over (650ms), asset rows over (450ms) with a stagger, Settings over (360ms), chat and simulated alerts over (400ms), and messages over (300ms). The perched companion floats on a (5s) cycle and waves on hover. Fine-pointer movement shifts only decorative arcs; values do not tilt with the pointer. Reduced-motion preferences disable animations, transitions and smooth scrolling in both shell and widget.

## Shapes

Rounded rectangular panels use the panel radius and become more compact on mobile. Fields, controls, disclosures and composer use progressively broader curves; the header Settings control is pill-shaped. Asset monograms and state dots are circular. The original shield is an authored outline SVG. The CSS companion retains its rounded sage body, forest visor, eyes, mouth, leaf antenna, hands and feet. Voice, send, stop and close use authored outline SVGs.

## Components

### Buttons and inputs

Orange filled actions use dark labels; shell hover lightens orange and widget hover increases brightness. Outline controls retain an ivory label and a fine border, with a darker raised hover surface. Text actions use lighter orange and underlining. Focus-visible rings are (2px), offset (4px). Disabled controls reduce opacity and show a waiting cursor; active buttons move slightly downward.

Settings inputs have minimum height (46px), dark fill and visible borders. The bottom composer stacks a non-resizable textarea above an icon microphone, optional stop control and circular (42px) send button. Its raised graphite fill, broad corners and orange focus border distinguish writing from reading; focus adds no glow. The textarea uses (15px), then (16px) on mobile. Shell controls and standard quiet icons use (44px) minimum targets; answer playback uses (36px) width and (40px) height. Suggested questions appear as simple stacked options within a disclosure.

### Wallet and settings

Asset rows pair decorative monograms and names with right-aligned exact quantities. Written DEMO/LIVE status accompanies the title; freshness, unknown data and errors remain visible beside refresh. Settings uses labeled controls, provider disclosures, explicit save/test actions, goals and asset identity matching. Selected section shortcuts use a warm dark fill, orange label and `aria-current`; they are scrolling navigation within one dialog.

### Companion and voice

The perched mascot opens chat. The empty-chat mascot and the briefing action in the options menu request a briefing. Idle eyes blink, thinking eyes move laterally, listening raises a hand and widens eyes, speaking animates the mouth, and error narrows eyes. Loading and transcribing also have written status. The launcher label remains readable beneath its feet; unread updates also change its accessible name.

Voice begins on user action: start recording, then stop and send, with a (25-second) automatic limit. Recording, transcription and playback errors preserve the text alternative. Playback can be requested or stopped; successful voice transcription enables read-aloud. Closing chat stops voice and keeps the conversation. Chat normally focuses the composer, or the active Debug panel or Back to chat button on reopen. Escape first closes an open options menu and restores its summary focus; otherwise it closes chat and returns focus to the launcher. Settings returns focus to its opening button.

### Conversation, watch review and simulated calls

Assistant responses are plain reading blocks; user messages use right-aligned warm bubbles with a small trailing corner. Each answer has a speaker icon and one Sources & details disclosure containing all evidence and tool traces; it is omitted when neither exists. Watch proposals remain visible in the conversation with criteria, scope and explicit confirmation. The ellipsis menu contains briefing, Your watches with a count, Suggested questions, read-aloud, Debug and provider provenance. Your watches opens a separate panel with Back to chat, monitoring scope, rules, alerts and stop/remove controls. The shared error alert sits above all panels so failures stay visible; retrying a failed removal clears the error and a successful retry restores idle status. A briefing acknowledges the snapshot; opening chat clears the unread launcher dot.

Simulated in-app calls use a bounded scrolling surface at bottom right with orange Answer and quiet Dismiss controls. Copy states that no real call occurs. Answer opens chat and may read the alert when voice is configured; arrival does not autoplay. Existing native dialogs retain focus priority. Mobile alerts sit within (16px) gutters.

### Debug

An opt-in checkbox in the options menu reveals Chat / Debug tabs in the same dialog. Selected tabs use an orange underline. Debug uses expandable requests and timestamped events with wrapped monospace JSON, pending/error/empty text, and a clear action. It retains the latest four requests in browser memory; disabling it clears the logs and returns to Chat. Arrow keys and Home/End switch tabs with explicit selected state.

## Do's and Don'ts

### Do:
- Do preserve graphite surfaces, orange actions with dark text, and ivory reading text across all views.
- Do keep the original shield and the retained sage mascot distinct from the palette reference.
- Do pair mascot state with readable operational status.
- Do preserve exact wallet quantities and decorative-only asset monograms.
- Do keep evidence, monitoring limits and confirmation near the relevant action.
- Do retain sticky close controls, keyboard focus return and reduced-motion support.
- Do preserve mobile heading clearance for both English and Thai.

### Don't:
- Don't use the mascot's expression as a claim that a wallet is safe.
- Don't turn demo data, missing evidence or unavailable monitoring into certainty.
- Don't tilt financial values with pointer movement or make motion required to understand a state.
- Don't replace the same-dialog Settings shortcuts with separate screens without a new product decision.
- Don't promote diagnostic typography into primary reading text or crowd the default chat with secondary controls.
