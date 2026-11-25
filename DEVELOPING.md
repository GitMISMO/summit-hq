# Working on Summit HQ

Summit HQ is where MISMO plans its Summits: the schedule, the Run of Show tasks, the hotel resume and specs, General Sessions, the Workshop, People (speakers, the Board, the MISMO Team, sponsors, prospects), the trunk, registration and Help. It lives at **resources.mismo.org/summit-hq/**, and its owner is Jonna Critchley. Read this file first, then the **Help** tab inside the page (the `app-help` section of `index.html`). Help is the user guide and must be updated with every change people would notice.

## What Is Where

| File | What it is |
| --- | --- |
| `index.html` | The whole app in one file (about 32,000 lines): every tab, its styles and its script. It is edited directly; there is no build step. |
| `speaker.html` | The public form a speaker opens from their speaker email to send their bio and headshot. |
| `travel.html` | The public form the MISMO Team uses to send their travel dates. |
| `board.html` | The public page where a Board member answers In Person or Virtual. |
| `champion.html` | The public page where a Champion asks for some of their complimentary registrations as virtual (from the button in their code email). |
| `speaker-endpoint.txt`, `travel-endpoint.txt`, `champion-endpoint.txt` | The Power Automate addresses the public forms post to. They are public by design: a form answer only counts once Summit HQ matches its code to a real person. |
| `lib/` | Big helpers loaded only when used: the Word export (`docx.js`), the PDF reader (`pdfjs-*`), and the bio file reader (`biotext.js`). |
| `tests/` | The automatic checks (see below). |
| `CHANGELOG.md` | One line per change people would notice, newest first. Add a line with every upload. |

## Where the Data Lives

- No summit data is in this public repository. All of it is in the **private** repository `GitMISMO/summit-hq-data`, reached only through Perry's **save relay** under the project key `summit-hq`, after the shared resources.mismo.org sign-in (`/assets/session.js`).
- The page reaches data through `window.claude.use('db')`, a Firestore-like door (`doc().get/set`, `collection().onSnapshot`) built on the relay near the top of `index.html` (`window.__hqRelay`). The comment block there explains how documents are filed into relay files (tasks and notes together, people spread over four files, one file per headshot, big plans split into parts).
- **Saving never overwrites a teammate.** Every save sends the version it read; if someone saved in between, only the fields changed here are re-applied on top of theirs.
- **Nothing saves before its own data has loaded**, so an empty-looking tab can never wipe real data.
- **Every summit is kept on its own.** Anything per summit is keyed by the summit's id (`nola`, `slc`, `bethesda` and so on); a person's progress is in `st[<summit>]`. Past Summits keeps a finished summit's Run of Show. New features must work the same way, so they carry to each new summit and can be looked back on.
- **Undo** at the foot of the left menu (`window.__hqUndo`) is one timeline for the whole page: a tab calls `register(src, fn)` once and `record(src, label)` for each step it keeps. Every part people edit must join it, or the button is greyed out after a change there (Amy hit this on Champion Codes, Nov 16). General Sessions and the Workshop keep the running order before each change (`gs`, `wk`); Champion Codes keeps the changed boxes of one row (`champ`, shown on Registration).
- **Backup** at the foot of the left menu downloads everything as one file, or writes a backup file back. Removed records are retired (`gone:true`, kept), not deleted.

## How It Connects

Every connection is written down in the **MISMO Connections Map** (Claude Doc `UcBYh3aakukXcjYvjnWBY7`). Read it before changing a connection and update it in the same session. In short:

- **Summit HQ writes feeds that Power Automate flows read** (`feeds/…` in the relay): queued emails (`speaker-email`), weekly follow-ups (`speaker-reminders`), Bernie's new speakers (`speaker-adds`) and Board list (`board-notify`), open tasks (`tasks`), the registrant list for sponsors with its finished email in Kelly's wording from `sponsor-email/main` (`sponsor-list`; the flow records each Friday sent in `sponsor-list-sent`), the speaker email map (`speaker-mail-map`), the error log (`health-log`), and the public agenda for the website (`website-agenda`: each summit's General Sessions and Workshop running order with speakers' names, titles, companies and headshot files; only the segments marked On Website (each segment's `web`), never emails or notes; nothing marked takes the summit's entry out; and, with Show on the Website Agenda on for a summit on the Schedule (`schedule/web-grid`), `grid`: the whole week's public sessions from `__resumeFunctions` with id, day, date, start/end (24-hour, local), type, title, room and status; a standing item's start/end are its own Starts/Ends (`tStart`/`tEnd` in the summit's `sessEdits`) when set, otherwise its block's hours (breakfast 7:30 to 9:00), e.g. Winter 2027's Workshop is 13:30 to 17:00 (CN-012). GitMISMO.github.io's `summit-agenda/build-agenda.mjs` copies it into `agenda.json`; every push that changes `data/feed-website-agenda.json` runs summit-hq-data's `.github/workflows/website-agenda-kick.yml`, which waits 60 seconds and starts that job with the `AGENDA_DISPATCH_TOKEN` secret (Actions read/write on GitMISMO.github.io only, renewed yearly by Jonna)). Each flow notes what it sent in a matching `…-sent` feed so nothing goes twice.
- **Champion Codes** (`champion-codes/<summit>`, `champion-codes/settings`) writes `feeds/champion-form` (who each form link belongs to and Bernie's note), which the Champion Virtual Requests flow reads; the flow writes `feeds/champion-answers`.
- **Flows write answers back:** speaker form answers (`si-<code>`), emailed bios and headshots (`sm-<code>`, `speaker-mail-in`), travel and Board answers (`team-travel-answers`), and the Sponsorship Portal's applications (`portal-applications`, read only here).
- **Summit HQ reads** Leadership HQ's leaders (`elections-hq/data/leaders`, `gtype: board`, read-only, needs Leadership HQ access) for the Board card: members whose term covers the summit's first day, merged with the emails and roles already on the card (`syncBoardRoster`, upcoming summits only). Summit HQ also reads Member 360's organization list (lenders) and its current Champions (`data/champions`, matched to `orgsdata` for Aptify ID and Primary, Alternate and Marketing contacts) for Champion Codes and the MMS's facilitator list (`/mms/facilitators.json`, names only, published by the MMS).
- Summit HQ cannot send email itself. Every email goes through a flow, and nothing goes to a list without a preview first. Test emails go to Jonna only.
- The flows are in Jonna's Power Automate (environment `Default-867e5d11-…`), all named `Summit HQ - …`. Help section 14, Emails That Send on Their Own, lists each one, when it runs and who gets it.

## Champion Codes

Registration › Champion Codes replaces the Summit Codes - MISMO Champions Smartsheet. Each summit's codes are in `champion-codes/<summit>` (one row a Champion, keyed `c<Aptify ID>`), with the wording, Live switch and city in `champion-codes/settings`. The current Champions (Chair, Executive, Associate) come from Member 360's `data/champions`, matched by name to `orgsdata` for the Aptify ID and the Primary, Alternate and Marketing contacts; this runs when someone with Member 360 access opens Summit HQ. A summit's list opens the Monday after the summit before it, carrying each Champion's last code, and Bernie gets the list; a new Champion or a level change sends him a note. Confirm & Send queues the Champion's branded code email (as Kelly) on `feeds/speaker-email`. The email's button opens `champion.html`, which posts to the Summit HQ - Champion Virtual Requests flow (`champion-endpoint.txt`); that flow saves to `feeds/champion-answers` and emails Bernie in the words and addresses Summit HQ keeps in `feeds/champion-form`. Used counts come from `feeds/registration-pull`: the SummitHQ_Registration report's `campaign_code` column (from Aptify's RegistrationsByDiscount__mba, joined on OrderDetailID); a Champion's virtual code is the one on their row or their code with a V on the end. Until Live is on, every Champion and Bernie email goes to Jonna only, marked [Test]. Every send re-reads the saved row and stops (nothing queued) if the code is empty or an address is not an email address or contains a code (`badTo`).

**Comp Codes** on People (`compCodes()`, card `codesOpen`, and `v2Codes` on a person's panel) only reads: sponsor codes from the portal rows (`compCode`, `numComps`), Champion codes from `window.__champions.rows`, and who registered with each from `window.__champions.registrants` (the Friday report's campaign code column). Companies are matched by name with suffixes dropped (`coKey`). Speakers have no comp code.

## TrackPod Scanner Sheet

`lib/tp-template.xlsx` is TrackPod's import template (Jonna's 2026 Spring copy with the example rows, her phone and email, and file metadata taken out). `trackpodFile()` on People unzips it in the page, replaces row 2 of Client and Event and the data rows of Sessions with inline-string cells that keep the template's style ids, updates the Scan Directions dropdown range, and zips it back (stored). Which sessions are scanned, their codes (`TP_STEM` + year) and descriptions (`TP_DESC`) are in the page. The Client row's phone and email come from `trackpod/settings` (`client`) in Summit HQ's data, never the repo.

## System Health

**System Health** in the left menu shows saving, storage, every incoming feed and the email flows, and when each last ran. An error catcher in the page `<head>` (`window.__hqErr`) records every error to `feeds/health-log`. The **Summit HQ - Daily Health Check** flow reads that log and the email feeds every day at 12:13 PM Mountain and emails Jonna only when something is wrong.

## Making a Change

1. Start from the live copy: `git fetch` and work on `origin/main`. Never upload an older copy over a newer one.
2. Edit `index.html` (and Help in the same file).
3. Add or extend a check in `tests/run.js` for the feature, then run `npm install` once and `npm test` (all checks must pass). One check by name: `node tests/run.js "people"`.
4. Add a line to `CHANGELOG.md`.
5. Upload through GitHub (github.com/GitMISMO/summit-hq, Add file › Upload files, commit to main).
6. **Publishing is automatic.** The Summit HQ Checks and Publish workflow (`.github/workflows/checks.yml`) runs the checks on every upload and publishes the site only if they pass; if one fails, the site stays on the version before and GitHub emails the uploader. Emergency only: Actions › Summit HQ Checks and Publish › Run workflow › Skip the checks.
7. Uploading a test change and the feature it tests as two separate commits runs the checks twice; make sure each commit passes on its own.

## The Checks

`tests/harness.js` opens the page in a headless browser against a pretend sign-in and a pretend relay (with real version conflicts), with sample data and the clock fixed at November 1, 2026. Nothing real is read or changed. `tests/run.js` holds the checks: scripts parse, every tab opens, saving and merging, per-summit details, Past Summits, the Board and Team emails, System Health, the error log, outside files cannot run, the speaker automations, travel answers, the People page (one row a person, the right-hand panel, pages, and merging the same person, headshot download), the weekly Aptify registration email, the sponsors' weekly list (wording and sent record), and Champion Codes (from Member 360 to Bernie's note, the code email, a virtual request, codes used).

## Rules

- **Don't break what's in place, and don't email anyone without Jonna's OK.** The speaker emails, weekly follow-ups and Bernie's lists are live automations.
- **Stay in your lane:** edit only Summit HQ. If another system needs something, put it where that system already reads, or tell Jonna which system's Claude needs to change.
- **Never put a token, key or password** in the page, the repo or a doc. Jonna signs in herself.
- **Browser tab icon:** every page (`index.html` and the four public forms) has exactly one icon line in `<head>`, pointing at the shared mismo.org icon: `<link rel="icon" type="image/png" sizes="48x48" href="https://resources.mismo.org/assets/favicon-48x48.png">` (CN-030). Never a copy of the image here and never an app-specific icon; a check in `tests/run.js` keeps it that way.
- **Back button:** the shared `/assets/back.js` (loaded right after `session.js`) makes each left-menu page a step in the browser's history. Summit HQ registers its layers right after it, bottom first: the right-hand panel (`body.paneon`), a card on top of it (`body.sheeton`) and the drawers (`#drawer-host .drawer`, `#rs-drawer-host .drawer`); Back closes each with Escape, so it behaves exactly like Escape. A new panel or drawer that Escape closes needs a `MismoBack.layer` line too. A page button outside the left menu carries `data-back-page="<name>"` and `aria-current` while its page shows, as Help's `#help-btn` does (CN-033). Check 31 tests it.
- **Page style:** MISMO navy and sky, Title Case headings and buttons, squared-off buttons and tags (never pill shapes; circles are fine), no monospace type, no big empty spaces, plain words.
- **People page:** one list, one row a person whatever their roles; a person opens in the right-hand panel (the shared `window.__pane`, which overlays the page and widens with the expand button); edits save as you type. The older People cards are still built, hidden, because the menus open them in the panel. Keep them working.
- **Who does what:** Amy places speakers on sessions and gets bios and headshots in; Jonna owns the agenda, the schedule and General Sessions; Vanessa puts speakers on the event app; Bernie registers people and sets up the Champions' codes in Aptify; the sponsors' weekly list and the Champions' code emails go out as Kelly.

## Registration Desk (Nov 19, 2026)

`?desk` opens Summit HQ as Bernie's Registration Desk (`#app-desk`, script "REGISTRATION DESK"): only the Desk and The Trunk in the menu, `body.desk-mode`. Bernie (bjordan@mba.org) opening Summit HQ is sent there; `?full` keeps all of Summit HQ. The page gate allows bjordan, jcritchley, amoses and kbradshaw (@mismo.org or @mba.org); the data itself is Summit HQ's, as everywhere else.

- People exposes `window.__desk` (speakers, board, team and their Registered marks: speaker step `reg`, `board/<summit>.reg`, `team-travel/<summit>.ppl[id].reg`).
- Sponsors are read live from the Sponsorship Portal (`/sponsorship/data/applications`, the viewer's sign-in) and never written. Bernie's entries go to `feeds/desk-sponsor` (`entries[<portal record id>] = {appNo, company, invoiceNumber, invoiceDate, compCode, numComps, to, codeSentAt, codeSentTo, codeSentBy, followUps:[{on,by,at}], paymentReceivedDate, amountPaid, by, at}`; the paid date is for payments that never reach MISMO Money, entered only on Pending Payment sponsors, and the portal marks the record Paid from it); the Sponsorship Portal's Claude applies them to its records. The sponsor code email (wording and Test/Live in `desk/settings`: `{sponLive, tpl}`) goes through the speaker-email queue as Kelly, cc Bernie; only Jonna can switch it Live.
- The Champion Codes card (`#rg-champ`) moves into `#dk-champ-slot` while the Desk shows (`hq:tab` event from `show()`), and back to Registration; codes and sends are editable only while it sits on the Desk.
- Styles: every `#app-reg` rule is written `:is(#app-reg,#app-desk)` so the Desk wears the Registration look.
