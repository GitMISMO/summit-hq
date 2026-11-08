# Summit HQ Change Log

One line per change people would notice, newest first. Before October 27, 2026 changes were uploaded without descriptions; the page has been in use since September 26, 2026.

## 2026-11-08

- Registration list to sponsors: Fridays at noon Eastern from week 7 through the Friday before the Summit (was Mondays), and live for sponsors (was test mode)
- Registration loads itself every Friday: the SummitHQ_Registration report is emailed from Aptify at 6 AM Eastern, the Summit HQ - Registration Weekly Pull flow saves it, and Summit HQ takes it in; System Health shows when it last came. A week already loaded or typed by hand is left as it was
- Schedule: facilitator choices come from the MMS's facilitator list instead of the Initiative Hub's

## 2026-11-07

- Speaker steps: Registered now comes before On the Event App
- The first speaker step is now called Placed on a Session (it was Added to the Agenda)
- Sponsors: an On the Event App step for Vanessa, and a Sponsors File under Downloads
- Next Step: a speaker whose bio and headshot are in, or whose speaker email went, is no longer shown as needing to be asked for them
- General Sessions and the Workshop: Show on the Website Agenda writes the running order and speakers for the website to read
- Sponsors go on the agenda automatically; no Mark on the Agenda step
- Change log and how-it-works guide (DEVELOPING.md) added to the repository
- Added to the agenda ticks itself once a speaker is on a session; the agenda stays Jonna's
- Putting a speaker on a session is Amy's step
- The new People page is the People page; the old one is gone
- Merging: the latest invitation wins, and a real email replaces a non-email
- New People page: speaker faces open on the right, pages instead of one long scroll, merge the same person
- New People page keeps the dark band on top; Chase email and Only What's Outstanding taken off
- New People page: a Master List of Speakers box
- The new People page, behind Try the New People Page: one list of everyone, each person in the right-hand panel, Hotel Nights

## 2026-11-06

- Summit HQ goes live only after its checks pass
- Help: the Summit HQ Daily Health Check flow
- Security: a bio file sent in from outside can no longer run inside Summit HQ; email previews locked down
- Run the Summit HQ checks after every upload
- System Health: watches saving, storage and the email flows, catches every error into a team log; package.json for the checks
- Help: Vanessa no longer gets the sponsor logo request
- Every summit kept on its own: session details per summit, Past Summits record of the Run of Show, Board roster per summit, sponsors matched by date, full backup, trunk save fix
- Each summit's speaker email starts from the last summit's saved wording, dates moved
- Rooms by night: say rooms, show who is in them
- MISMO Team: no room question, everyone with dates gets a room
- MISMO Team: travel dates only, preview before sending, check boxes for Bernie, auto guest rooms on the Resume
- Board card: check boxes on each row for Notify Bernie
- Notify Bernie: pick the board members to send him
- Board ask: meeting day and time from the Schedule; add Alexandra Brinton and Michael Briggs
- Board: ask In Person or Virtual by email, answers mark the Board card

## 2026-11-05

- Saves merge into the newest copy instead of overwriting teammates' changes
- Emailed speaker files: note photos that could not be read
- Speakers who email their bio and headshot: map for the inbox flow, apply emailed files
- Speaker email: Save button that sticks, per-speaker saved email, unsaved-changes prompt

## 2026-11-04

- Speaker email button: use the Member 360 email button
- Smaller email button with room around it; drop Welcome back
- Returning speakers asked only for an update; turn off the speaker email per speaker
- Speakers can drop in a bio file; review, copy and use it on People
- Bio file reader for the speaker form and People
- Speaker email sends itself once a speaker is in a session; Send a Test to Me
- Speaker emails and follow-ups go out from Amy
- Lender list: try again if Member 360 was not ready
- Lender marks: an exact non-lender match in Member 360 wins over a similar bank name

## 2026-11-03

- Warmer weekly follow-up wording
- Speaker emails: choose who, weekly follow-ups with on/off, Amy and Jonna copied, bio button, speaker breakfast
- Speaker email reads the link and rate the way the Resume holds them
- Speaker email links and bio/headshot form, bulk send and reminders, Master List search, edit prospects, Workshop page

## 2026-11-02

- Sponsor list feed: add In-Person or Virtual per person

## 2026-11-01

- Hold in Place: the week as columns of session tiles
- Record rails: edit right in the Overview boxes
- Record rails: calmer, laid out like the CMS company panel
- Fix blank pages: close the Run of Show holder div
- Record rails: MMS-style wide panels for tasks, agenda items and sessions
- Schedule: Fixed set pieces read their rooms from the grid, no hotel typed in
- Planning Meeting: drag any task to any week via a pop-up week strip
- Run of Show: Planning Meeting board, full-width calendar, notes row, Add A Summit button
- Resume: side-panel boxes use the page's type, no typewriter font

## 2026-10-31

- Help: the lib folder and load safety
- Check for changes only on the page in front of you (14 to 3 checks a minute)
- Lighter page: Word export and PDF reader load only when used (4.2 MB to 1.6 MB)
- Load safety: nothing saves before its own data has loaded (Resume, People, Registration, General Sessions, floor plans, email queues)
- Fix: Schedule and Trunk never save before their data has loaded
- Schedule: Enlarge button opens the week full screen
- Hotel Specs: Ready lines take you to their spot on the page
- Hotel Specs: one Ready ring and a bar for each measure
- Meeting Notes: sticky notes grow to show all their text
- Save or discard: closing a panel or task with unsaved changes asks first
- Trunk: tasks on the road open their detail over the page
- Hotel Specs: per-meal window (sponsor, headcount, paste the menu); set-up notes can be marked done; Resume functions collapse again
- Hotel Specs: Contract, Floor Plan & Capacities at the top opposite the title
- Help: Bernie's speakers come from the morning list; old per-speaker flow and SharePoint list retired
- Hotel Specs: rail tiles keep their own height on smaller screens
- Hotel Specs live rail (headcounts, questions, set-up notes); lunch only for Newcomer; Help person-by-person guides
- Trunk review flow, packing list PDF; Hotel Specs rail; Resume section cards and editor width
- Hotel Specs: The Hotel at a Glance - readiness rings, day picker, meals timeline, room map
- Trunk: Pack the Trunk - drag or tap each line into an illustrated trunk
- Run of Show: Hotel Specs, People and Trunk cards off (they are in the menu)
- Schedule: scaled week leaves room for its scrollbar
- Schedule: the week scales to fit small screens instead of scrolling
- Resume function editor: live page as it prints, section cards with icons, one-tap usual lines, no typewriter font
- Pages: titles back on People, Hotel Specs, Trunk; Trunk band; fix People toolbar
- Menu in three groups; People, Hotel Specs, Trunk as pages; speaker wall; Lineup; grid find and fit
- Panel headers: readable line under the title, close button on navy
- Plus-up: cards lead with their number, navy panel headers with where a task stands
- Plus-up: cards lift and light up, grid sessions as soft tiles, Resume page fixes
- Resume plus-up: the page on the desk, readiness and Fill Next
- Save on the right-hand panels where there is something to type
- Travel email: the Member 360 button
- Help: the countdown, the Road to the Summit and The Day
- Plus-up: full-width bands in one row, People band, readable pickers
- Plus-up: navy figure bands on Schedule, General Sessions, Resume, Hotel Specs; The Day ribbon
- Run of Show plus-up: live countdown, plan ring, the Road to the Summit
- People: Confirmed Speakers; travel form reads its address from travel-endpoint.txt
- People: MISMO Team at the Summit card, travel form, dates to the Resume; staff off Bernie's speaker list
- People: speakers added go on a morning list for Bernie to register
- People: Speaker Email — one button, editable template, branded, graphic attached

## 2026-10-30

- Registration: Title column in the registrant lists, typed titles kept and sent to sponsors

## 2026-10-29

- Plain wording in place of Claude in on-page messages
- People: Speaker Prospects beside On This Summit
- Speaker Prospects; People sessions reach General Sessions; Sponsored by on segments
- Floor plan: several pages and PDFs, with Add pages
- Help: New Summit Sponsor email to Rosalyn
- Registration: carry job title through to the sponsors' weekly list
- Board card: in person or virtual, a tally, and the in-person count drives the Board meeting headcount
- Board email: send the list as a whole table so the card keeps its shape

## 2026-10-28

- Help: Board Members to Register email
- People: speakers only, Master List of Speakers, simple sponsor card, Board card with Notify Bernie
- Confirmed counts only workgroups a chair survey went out for
- Chair Survey: All Good confirms the placement; lock icon replaces can't move
- General Sessions: sponsors and board out of Presenters; GS and Registration headers match at every window size
- Registration and General Sessions headers match the other tabs; week stands out; Help updated
- Feeds for the Monday task email and the sponsor registration list
- Help tab: how Summit HQ works, at the foot of the left menu
- On This Summit: Speakers grouped above Sponsors
- Jenny Moss removed from the default staff rooming and VIP lists
- No pill shapes: square-cornered buttons, tags and chips across Summit HQ
- General Sessions: wider start and end time boxes
- New General Sessions tab: Tuesday running order, drag-in presenters, lender highlighting
- Event app step now belongs to Vanessa Rios (Dillon removed)

## 2026-10-27

- Portal sponsors: an Added to the Agenda button, no registration step
- Sponsors register with portal comp codes, not through Bernie
- Portal stamp shows the last check and how many changes it found
- Portal copy always wins over the old Sept 30 sponsors document
- Hotel Specs read the portal's day; General Sessions room at top; Link hours fill their box; portal stamp

## 2026-09-29

- Dark mode in Deep Circuit, and the teal specs colour now Pixel Stream

## 2026-09-28

- Facilitator pickers use the shared list, with walk-ons
- Top bar: the shared account bubble, as in the Sponsorship Portal
- Use the shared sign-in and refusal screens; restore the no-flash check
- Sign-in card: fixed navy button, no subtext, two stray closing tags removed
- Decide whether anyone is signed in before the page paints

## 2026-09-26

- Summit HQ moved from Claude to resources.mismo.org/summit-hq/, with the shared sign-in and the save relay
