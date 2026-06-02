# The Gunnison Democrat — Mailchimp Newsletter Template

A custom, email-safe newsletter template for the **Gunnison County Democratic Party**,
designed as a classic newspaper masthead — "The Gunnison Democrat."

![concept: newspaper masthead](https://img.shields.io/badge/style-newspaper%20masthead-102a54)

## Files

| File | Purpose |
|------|---------|
| `the-gunnison-democrat.html` | The Mailchimp template. Paste into Mailchimp as a **custom-coded template**. |

## What's inside

- **Newspaper masthead** — publisher logo, `EST. / VOL.` line, big serif nameplate, and a dateline ribbon that auto-fills the send date (`*|DATE:l, F j, Y|*`).
- **Lead story** — kicker, headline, byline, photo + caption, body, "Continue Reading" link.
- **Around the County** — a repeatable two-column article grid (Mailchimp `mc:repeatable`).
- **Mark Your Calendar** — navy events block with date chips for meetings/canvasses.
- **Get Involved** — bulletproof **Donate** (red) and **Volunteer** (navy) buttons.
- **Pull quote** — a framed quote to break up the page.
- **Footer** — social links + required Mailchimp legal merge tags (address, unsubscribe, update preferences, current year).

## Brand

| Token | Hex | Used for |
|-------|-----|----------|
| Navy (ink) | `#102a54` | Nameplate, rules, headers, footer, primary button |
| Republican-no, Democrat red | `#b3242b` | Kickers, accents, Donate button |
| Newsprint paper | `#fbfaf5` | Email background panel |
| Outer paper | `#e7e3d8` | Body background |
| Body text | `#2b281f` | Article copy |

Typography: **Playfair Display** (nameplate) with **Georgia** fallback, and **Source Sans 3**
with Arial fallback for body — so it still reads like a newspaper in clients that block web fonts (e.g. Outlook).

> The live brand colors were taken from the classic Democratic navy/red palette used on
> gunnisondemocrats.org. If you have exact brand hex values, swap them in the table above
> and search/replace the hex codes in the HTML.

## How to load it into Mailchimp

1. In Mailchimp, go to **Content → Email templates → Create Template**.
2. Choose **Code your own → Paste in code**.
3. Open `the-gunnison-democrat.html`, copy **all** of it, paste it in, and **Save**.
4. Name it **The Gunnison Democrat** and start a campaign from it.

### Editing content each issue
Blocks marked with `mc:edit` are editable directly in Mailchimp's visual builder
(lead story, images, events, quote, etc.). The article grid is `mc:repeatable`, so you
can duplicate it to add more stories.

### Images
- The masthead logo is already hosted on Mailchimp's CDN
  (`mcusercontent.com/.../b7f95ea7-...png`), which is ideal for deliverability.
- Article/lead photos currently use gray `placeholder` images — replace them with real photos
  (recommended widths: lead **552px**, article thumbnails **264px**).

### Merge tags already wired in
`*|MC_PREVIEW_TEXT|*`, `*|ARCHIVE|*`, `*|DATE:...|*`, `*|LIST:COMPANY|*`,
`*|HTML:LIST_ADDRESS_HTML|*`, `*|UPDATE_PROFILE|*`, `*|UNSUB|*`, `*|CURRENT_YEAR|*`.

## Before your first send
- [ ] Replace placeholder photos and "#" links with real URLs.
- [ ] Confirm the Donate button points at your ActBlue/processor URL.
- [ ] Set the Mailchimp **audience address** (required for the footer to comply with CAN-SPAM).
- [ ] Send a test and preview in Mailchimp's Inbox Preview (Gmail, Outlook, Apple Mail).
