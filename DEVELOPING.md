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
- **Backup** at the foot of the left menu downloads everything as one file, or writes a backup file back. Removed records are retired (`gone:true`, kept), not deleted.

## How It Connects

Every connection is written down in the **MISMO Connections Map** (Claude Doc `UcBYh3aakukXcjYvjnWBY7`). Read it before changing a connection and update it in the same session. In short:

- **Summit HQ writes feeds that Power Automate flows read** (`feeds/…` in the relay): queued emails (`speaker-email`), weekly follow-ups (`speaker-reminders`), Bernie's new speakers (`speaker-adds`) and Board list (`board-notify`), open tasks (`tasks`), the registrant list for sponsors with its finished email in Kelly's wording from `sponsor-email/main` (`sponsor-list`; the flow records each Friday sent in `sponsor-list-sent`), the speaker email map (`speaker-mail-map`), the error log (`health-log`), and the public agenda for the website (`website-agenda`: each summit's General Sessions and Workshop running order with speakers' names, titles, companies and headshot files; written only when Show on the Website Agenda is on, never emails or notes). Each flow notes what it sent in a matching `…-sent` feed so nothing goes twice.
- **Champion Codes** (`champion-codes/<summit>`, `champion-codes/settings`) writes `feeds/champion-form` (who each form link belongs to and Bernie's note), which the Champion Virtual Requests flow reads; the flow writes `feeds/champion-answers`.
- **Flows write answers back:** speaker form answers (`si-<code>`), emailed bios and headshots (`sm-<code>`, `speaker-mail-in`), travel and Board answers (`team-travel-answers`), and the Sponsorship Portal's applications (`portal-applications`, read only here).
- **Summit HQ reads** Member 360's organization list (lenders) and its current Champions (`data/champions`, matched to `orgsdata` for Aptify ID and Primary, Alternate and Marketing contacts) for Champion Codes and the MMS's facilitator list (`/mms/facilitators.json`, names only, published by the MMS).
- Summit HQ cannot send email itself. Every email goes through a flow, and nothing goes to a list without a preview first. Test emails go to Jonna only.
- The flows are in Jonna's Power Automate (environment `Default-867e5d11-…`), all named `Summit HQ - …`. Help section 14, Emails That Send on Their Own, lists each one, when it runs and who gets it.

## Champion Codes

Registration › Champion Codes replaces the Summit Codes - MISMO Champions Smartsheet. Each summit's codes are in `champion-codes/<summit>` (one row a Champion, keyed `c<Aptify ID>`), with the wording, Live switch and city in `champion-codes/settings`. The current Champions (Chair, Executive, Associate) come from Member 360's `data/champions`, matched by name to `orgsdata` for the Aptify ID and the Primary, Alternate and Marketing contacts; this runs when someone with Member 360 access opens Summit HQ. A summit's list opens the Monday after the summit before it, carrying each Champion's last code, and Bernie gets the list; a new Champion or a level change sends him a note. Confirm & Send queues the Champion's branded code email (as Kelly) on `feeds/speaker-email`. The email's button opens `champion.html`, which posts to the Summit HQ - Champion Virtual Requests flow (`champion-endpoint.txt`); that flow saves to `feeds/champion-answers` and emails Bernie in the words and addresses Summit HQ keeps in `feeds/champion-form`. Used counts come from `feeds/registration-pull` once its CSV has a campaign code column. Until Live is on, every Champion and Bernie email goes to Jonna only, marked [Test].

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
- **Page style:** MISMO navy and sky, Title Case headings and buttons, squared-off buttons and tags (never pill shapes; circles are fine), no monospace type, no big empty spaces, plain words.
- **People page:** one list, one row a person whatever their roles; a person opens in the right-hand panel (the shared `window.__pane`, which overlays the page and widens with the expand button); edits save as you type. The older People cards are still built, hidden, because the menus open them in the panel. Keep them working.
- **Who does what:** Amy places speakers on sessions and gets bios and headshots in; Jonna owns the agenda, the schedule and General Sessions; Vanessa puts speakers on the event app; Bernie registers people and sets up the Champions' codes in Aptify; the sponsors' weekly list and the Champions' code emails go out as Kelly.
