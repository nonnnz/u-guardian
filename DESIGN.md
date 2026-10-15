---
name: U-Guardian
description: A warm wallet companion with an expressive geometric robot.
colors:
  forest-ink: "#203d34"
  forest-action: "#285946"
  muted-ink: "#59685f"
  shell-ivory: "#f2f3e9"
  paper: "#fffefa"
  settings-paper: "#f6f6f0"
  sage: "#eaf0e3"
  sage-action: "#edf1e3"
  field: "#f3f4ec"
  divider: "#e3e7dd"
  leaf: "#d8e8b3"
  visor: "#24483b"
  face-light: "#fcfbe9"
  focus: "#9a5635"
typography:
  wordmark:
    fontFamily: "Georgia, serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Leelawadee UI, Tahoma, sans-serif"
    fontSize: "27px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Leelawadee UI, Tahoma, sans-serif"
    fontSize: "15px"
    lineHeight: 1.65
  label:
    fontFamily: "Leelawadee UI, Tahoma, sans-serif"
    fontSize: "12px"
rounded:
  control: "8px"
  action: "9px"
  field: "12px"
  panel: "16px"
spacing:
  tight: "8px"
  control: "10px"
  compact: "12px"
  content: "16px"
  section: "18px"
  panel: "24px"
components:
  button-primary:
    backgroundColor: "{colors.forest-action}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "11px 16px"
  button-report:
    backgroundColor: "{colors.sage-action}"
    textColor: "#28513e"
    rounded: "{rounded.action}"
    padding: "10px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "#28513e"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  composer:
    backgroundColor: "{colors.field}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.field}"
    padding: "9px 10px 9px 16px"
  companion-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.panel}"
    padding: "24px 30px 20px"
---

# Design System: U-Guardian

## Overview

**Creative North Star: "The companion beside your wallet"**

An approachable geometric robot sits within a calm daylight workspace. Warm ivory, forest ink and sage preserve the established identity; quiet space gives the mascot a recognizable presence while Thai explanations and evidence remain easy to read. This is descriptive language for the shipped world, not a separately approved concept.

The welcoming mascot becomes a small operational companion once a conversation begins. The existing connection and financial tools retain their denser field-journal layout at `settings.html`.

**Key Characteristics:**
- Warm ivory surfaces with forest controls and sage emphasis.
- Thai-first interface text with restrained serif wordmarks.
- A geometric robot whose expression accompanies written status.
- Quiet dividers, expandable evidence and explicit review actions.

Recorded from the shipped index, shell and widget sources, embed example, retained settings stylesheet, and review screenshots. This code-led build has no approved image comp. Route strategy lives in the companion surface brief.

## Colors

The restrained palette carries continuity between minimal host and embedded companion.

### Primary

Forest action marks voice, send and confirmation. Forest ink carries copy; the visor supports light eyes and mouth. Hosts can override widget ink, accent and surface through `--guardian-ink`, `--guardian-accent` and `--guardian-surface`.

### Secondary

Sage supports report actions, proposals and notifications. Leaf models the mascot, rather than implying a success or risk score.

### Neutral

Shell ivory surrounds the paper panel. Field tint groups the composer and raw evidence; dividers separate messages and watch information. Muted ink carries support copy. Settings paper preserves the tools-page ground. Terracotta focus outlines and text-backed error surfaces communicate interaction and failure.

**The Written State Rule.** Operational state is expressed in text alongside mascot changes; color and expression do not carry the message alone.

## Typography

Georgia supplies Latin wordmarks; Leelawadee UI with Tahoma and sans-serif fallbacks carries Thai interface text. The retained settings stack also includes Noto Sans Thai. There is no font-download dependency.

The widget headline steps from (27px) to (24px) on small screens; body is (15px), welcome support (14px), and task labels (12px). Message paragraphs use line spacing (1.8). Compact provenance and tool traces are secondary metadata, not a model for essential instructions. The mobile composer is (16px). Host wordmark sizes are (26px), then (23px) on mobile; the widget wordmark is the smaller frontmatter role.

## Layout

The demo workspace has a centered maximum width (1080px), wallet column (280px), flexible companion and gap (68px). At the host breakpoint (800px), the wallet narrows to (220px) and gap to (25px). At (620px), the companion comes first, wallet second; holdings form a horizontally scrollable row and the explanatory side note disappears.

Widget panel padding changes to (20px 17px 16px) at (520px). Suggestions and voice controls wrap. Conversation compacts the mascot stage into an (80px) leading column and hides the welcome headline. Conversation height is bounded at (390px), or (42vh) on small screens, with internal scrolling.

The embed example pairs host explanation with a companion column (440px), stacking at (800px). The custom element is a document-flow panel with a collapsed launcher; hosts decide placement. A wallet sidebar is a demo composition, not a rule for every host.

## Elevation & Depth

Depth comes mainly from tonal surfaces and whitespace. The panel is unshadowed. The robot uses inset shading and a soft ground shadow; the launcher uses an ambient shadow. Exact shadows and motion are in `.impeccable/design.json`.

**The Quiet Surface Rule.** Preserve tonal separation for the companion panel; reserve the observed shadows for the character and collapsed launcher.

## Shapes

Controls have gently rounded corners, fields and proposals a broader curve, and the companion a single soft panel. The CSS robot has a rounded body, visor, two eyes, mouth, leaf antenna, hands and feet. It uses no raster asset. Authored outline SVG icons accompany voice, send, stop and close.

## Components

### Buttons and composer

Forest filled voice and send controls carry immediate actions; sage report buttons are quieter. Suggestions and host refresh controls use thin borders. Widget hover applies brightness (.96); host outline hover uses sage. Widget and host focus outlines are terracotta (3px), offset (4px). Disabled controls reduce opacity and show a waiting cursor.

The composer places a labeled, vertically resizable textarea beside send. Mobile suggestions have minimum height (42px), voice (46px), and quiet icon buttons a minimum square (44px). Preserve the text alternative to voice.

### Companion and voice

The mascot button and report action request a briefing. Idle eyes blink, thinking eyes move laterally, listening raises a hand and widens eyes, speaking animates the mouth, and error narrows eyes. Loading and transcribing have distinct status text without extra character animations. Reduced-motion preference disables widget animation and transitions.

Voice is push-to-talk: click to start, then click to stop and send, with automatic recording limit (25 seconds). Permission, configuration, transcription and playback failures have visible errors. Users can request playback, stop it, or enable automatic reading; successful voice transcription enables read-aloud. It does not listen continuously.

### Conversation and watch review

Messages are divided rows with indented user text. Responses may expose expandable evidence, raw data and a playback action. Watch proposals show criteria, monitoring scope and explicit confirmation. Rules and alerts sit under a count-bearing disclosure with removal and acknowledgement controls.

Monitoring limits remain in the watch disclosure and proposal. Public-demo checks depend on an active visible browser document or host invocation; there is no provisioned background scheduler, SMS or Web Push. Collapse leaves the widget mounted and does not guarantee checks stop. Background polling preserves voice and typing controls; chat and briefings wait for any current check.

### Navigation and retained settings

Small host links lead to the embed example and `settings.html`. The latter preserves connection setup, source evidence, token matching, phone configuration and Fuji tools in the established field-journal surface. Preserve readable addresses and exact quantities, explicit demo/live labels, named dialogs, and review before consequential actions. Settings capability does not imply provisioned public-demo background monitoring.

## Do's and Don'ts

### Do:
- Do preserve warm ivory, forest and sage across host and companion surfaces.
- Do pair mascot state with readable operational status.
- Do keep voice user initiated and preserve the text alternative.
- Do keep evidence and monitoring limits near the relevant action.
- Do keep the mobile companion before the demo wallet.

### Don't:
- Don't use the mascot's expression as a claim that a wallet is safe.
- Don't turn demo data, missing evidence or unavailable monitoring into certainty.
- Don't replace the Shadow DOM boundary with host-dependent styling.
- Don't promote compact diagnostic typography into primary reading text.
