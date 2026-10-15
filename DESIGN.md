---
name: U-Guardian
description: A warm wallet companion with an expressive geometric robot.
colors:
  forest-ink: "#203d34"
  forest-action: "#285946"
  muted-ink: "#59685f"
  shell-ivory: "#f2f3e9"
  paper: "#fffefa"
  sage-action: "#edf1e3"
  field: "#f3f4ec"
  divider: "#e3e7dd"
  shell-divider: "#dce1d1"
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
  title:
    fontFamily: "Leelawadee UI, Tahoma, sans-serif"
    fontSize: "24px"
    fontWeight: 500
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
    backgroundColor: "transparent"
    textColor: "#28513e"
    rounded: "{rounded.action}"
    padding: "4px 0"
  button-outline:
    backgroundColor: "transparent"
    textColor: "#28513e"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  composer:
    backgroundColor: "{colors.field}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.field}"
    padding: "9px 10px 9px 16px"
  companion-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.panel}"
    padding: "22px 26px"
  wallet-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.panel}"
    padding: "36px"
---

# Design System: U-Guardian

## Overview

**Creative North Star: "The companion beside your wallet"**

An approachable geometric robot sits within a calm daylight workspace. Warm ivory, forest ink and sage preserve the established identity; quiet space gives the mascot a recognizable presence while Thai explanations and evidence remain easy to read. This is descriptive language for the shipped world, not a separately approved concept.

The wallet is a quiet paper surface, while chat and settings use focused dialogs. The mascot lends personality to the entry point and pairs its expression with written operational status inside chat. Reusable visual decisions are recorded here; the single-page composition and interaction contract live in the surface brief.

**Key Characteristics:**
- Warm ivory surfaces with forest controls and sage emphasis.
- Thai-first interface text with restrained serif wordmarks.
- A geometric robot whose expression accompanies written status.
- Quiet dividers, expandable evidence and explicit review actions.

Recorded from the shipped index, shell and widget sources. This code-led refinement preserves the existing identity and uses no generated assets or approved image comp.

## Colors

The restrained palette connects the wallet, companion and settings.

### Primary

Forest action marks voice, send and confirmation. Forest ink carries copy; the visor supports light eyes and mouth. The custom element retains internal ink, accent and paper variables, without establishing a released integration theme API.

### Secondary

Sage action supports proposals and notifications. Leaf models the mascot rather than implying a success or risk score.

### Neutral

Shell ivory surrounds paper cards and dialogs. Field tint groups the composer and raw evidence. Shell dividers separate holdings and settings sections; the lighter widget divider separates conversation and watch content. Muted ink carries support copy. Terracotta focus outlines and text-backed error surfaces communicate interaction and failure.

**The Written State Rule.** Operational state is expressed in text alongside mascot changes; color and expression do not carry the message alone.

## Typography

Georgia supplies Latin wordmarks; Leelawadee UI with Tahoma and sans-serif fallbacks carries Thai interface text. There is no font-download dependency.

Wallet and settings titles use the title role. The wallet title becomes (21px) on small screens; settings section titles are (18px). Chat body uses the body role with message line height (1.8). Supporting text is generally (13–14px); task labels use the label role. The host wordmark is (26px), becoming (23px) on mobile; the chat wordmark uses the frontmatter role. Asset quantities use tabular numerals, (18px) on desktop and (16px) on mobile. Settings inputs are (16px), as is the mobile composer.

Compact provenance and tool traces remain secondary metadata. The dormant welcome headline styles are not part of the visible hierarchy.

## Layout

Paper surfaces use generous internal spacing; lists use repeated divider-separated rows rather than independent tiles. Dialogs bound long workflows with internal scrolling and keep their close controls in sticky headings. Chat and settings lock background page scrolling while open.

The current wallet surface uses a centered container with maximum width (740px), desktop horizontal inset (28px), and card padding (36px). At the shell breakpoint (620px), the inset becomes (16px) and card padding (24px 20px); the refresh action stacks below the freshness note. See the surface brief for the mascot's edge placement.

Chat has maximum width (620px), height (90dvh), and content padding from the companion-panel token. At the widget breakpoint (520px), padding becomes (16px) and height (92dvh). The compact status stage uses a (70px) character column from the first opening. Conversation scroll height is capped at (34dvh), becoming (32dvh) on small screens. Suggestions and voice controls wrap.

Settings has maximum width (600px), height (88dvh), and padding (28px), becoming (92dvh) and (22px) at the shell mobile breakpoint. Its sticky heading compensates for that padding. Both dialogs retain a (28px) total minimum viewport gutter.

## Elevation & Depth

Depth comes from tonal surfaces, fine borders and whitespace at rest. The wallet is unshadowed. Modal dialogs add a diffuse shadow and translucent forest backdrop; the robot uses inset shading and a soft contact shadow. The perched launcher is transparent and unshadowed. Exact shadows and motion are in `.impeccable/design.json`.

**The Quiet Surface Rule.** Keep the wallet flat; use modal elevation for focused work and local shading for the character.

## Shapes

Controls have gently rounded corners, fields and proposals a broader curve, and cards and dialogs use the panel radius. Settings inputs use a small (7px) radius. The CSS robot has a rounded body, visor, two eyes, mouth, leaf antenna, hands and feet. It uses no raster asset. Authored outline SVG icons accompany voice, send, stop and close.

## Components

### Buttons and composer

Forest filled voice and send controls carry immediate actions. Report is a quiet text action within the compact status stage. Suggestions and shell controls use thin borders. Hover generally applies brightness (.96); shell outline hover also uses sage. Focus outlines are terracotta (3px), offset (4px). Disabled controls reduce opacity and show a waiting cursor.

The composer places a labeled, vertically resizable textarea beside send. Settings controls and shell buttons have a minimum height (44px). Mobile suggestions have minimum height (42px), voice (46px), and quiet icon buttons a minimum square (44px). Preserve the text alternative to voice.

### Wallet and settings

Holdings use divider-separated rows with asset name at left and exact quantities aligned right. Written DEMO/LIVE status sits beside the wallet heading; freshness and error text accompany refresh. Settings uses labeled controls, section dividers and provider disclosures. Goals and asset identity matching are additional disclosures in the same dialog.

### Companion and voice

The perched mascot is a button that opens chat. Inside chat, the smaller mascot and report action request a briefing. Idle eyes blink; thinking eyes move laterally, listening raises a hand and widens eyes, speaking animates the mouth, and error narrows eyes. Loading and transcribing have distinct status text. Reduced-motion preference disables widget animation and transitions.

Voice is push-to-talk: click to start, then click to stop and send, with automatic recording limit (25 seconds). Permission, configuration, transcription and playback failures have visible errors. Users can request playback, stop it, or enable automatic reading; successful voice transcription enables read-aloud. Closing chat stops voice and preserves its conversation.

### Conversation and watch review

Messages are divided rows with indented user text. Responses may expose expandable evidence, raw data and a playback action. Watch proposals show criteria, monitoring scope and explicit confirmation. Rules and alerts sit under a count-bearing disclosure with a stop/remove action for rules. A briefing automatically acknowledges the snapshot; opening chat clears the unread launcher dot. The dot is also represented in the launcher's accessible name.

Chat opens with focus in the composer; close and Escape return focus to the mascot launcher. Settings returns focus to its opening button. Native modal dialogs retain focus and block background interactions.

## Do's and Don'ts

### Do:
- Do preserve warm ivory, forest and sage across wallet, chat and settings.
- Do pair mascot state with readable operational status.
- Do keep voice user initiated and preserve the text alternative.
- Do keep evidence and monitoring limits near the relevant action.
- Do keep close controls available while dialog content scrolls.

### Don't:
- Don't use the mascot's expression as a claim that a wallet is safe.
- Don't turn demo data, missing evidence or unavailable monitoring into certainty.
- Don't promote compact diagnostic typography into primary reading text.
- Don't reuse dormant welcome, launcher or multi-column styles as current design guidance.

