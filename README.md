# Pet Sitting: LoadUp Front-End Assessment

A pet-sitting booking app, as a website and as a phone app. Customers book a sitter for one or more pets and see the price as they go. An admin page lists each day's bookings and what the day earns.

## Running the project

You need [Node.js](https://nodejs.org/) 22, 24 or newer (version 23 won't work). To run the phone app, install the free **Expo Go** app on your phone, or use the iOS Simulator (Xcode) or an Android emulator.

Install everything once:

```bash
npm install
```

Then start whichever app you want to use:

```bash
npm run web       # the website, at http://localhost:5173
npm run ios       # the phone app in the iOS Simulator
npm run android   # the phone app in an Android emulator
npm run mobile    # the phone app on your own phone: scan the QR code with Expo Go
```

To run the checks and tests:

```bash
npm run verify    # code checks, unit tests and phone app tests
npm run test:e2e  # website tests, in the background (needs the one-time download below)
```

### Watching the website tests

1. Download Playwright's browser (first time only):

   ```bash
   cd web
   npx playwright install
   ```

2. Start the test viewer from the `web` folder:

   ```bash
   npx playwright test --ui-port=8080
   ```

3. Open http://localhost:8080 in your browser.
4. Press ▶ to run the tests.
5. Click a test, then one of its steps (from `page.goto` on) to see the page before and after that step.
6. Press Ctrl+C in the terminal when you're done.

To watch in a real browser window instead, run this from the `web` folder. `SLOW_MO` is the pause between steps in milliseconds; leave it out for full speed:

```bash
SLOW_MO=500 npx playwright test --headed --workers=1
```

The tests start the website themselves. The date is always October 1, 2026, and animations are off, so the tests behave the same every day.

## Limitations

- **The website and the phone app don't share bookings.** Each keeps its own list, so a booking made on the website won't show up on the phone app's admin page, and the other way around. Sharing them would need a real server that both apps talk to.
- **Bookings aren't saved.** There's no server or database, only built-in sample data. Anything you book lasts until you reload the website or restart the phone app, and then it's back to the sample data.
- **The sample bookings are in late September and October 2026.** The admin page opens on today's date; pick 3, 5 or 10 October 2026 to see them.
- **No accounts or sign-in.** Customers are recognized by first and last name, and anyone can open the admin page.
- **No payments, and no sitters.** A booking is confirmed as soon as it's made; there's no checkout and no choosing or scheduling of sitters.
- **Bookings are between 7:00 AM and 9:00 PM,** from 2 to 8 hours long, starting and ending on the hour or half hour.
- **Times follow the device's time zone.** The app assumes people book from where their pets are.
- **The phone app has been tried on the iOS Simulator only,** not on an Android device or emulator.

## AI usage

The assessment allows AI tools if their use is documented. The prompts that built the app are logged verbatim under [Prompts](#prompts), each with its use case and what the AI did.

| Tool                                       | What it helped with                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code (desktop app, Claude Opus 5.5) | Researching the role and assessment, the monorepo boilerplate, the shared logic, the web and mobile apps, their tests, and this README |

**Decisions I made:**

- A monorepo with a `shared/` package for web and mobile (Prompt 1)
- MUI on web, React Native Paper on mobile, shared design tokens, Tailwind on web (Prompt 1)
- Front end only, with a JSON mock database; account for same-day bookings; 2 of each animal (Prompt 1)
- React Hook Form, and bookings with a start time as well as a date (Prompt 2)
- Several pets per request; exactly two "when" inputs; the $20 base once per request; itemized charges; front-end-only validation (Prompt 4)
- An admin page grouped by start time with day switching, easy switching between pages, and a working submit (Prompt 6)
- Submit disabled until the form is complete, and the total always showing a price (Prompt 5)
- The day's total earnings beside the admin title (Prompt 8)
- A mobile app matching the web app (Prompt 9)

**Corrections I made to AI output:**

- Replaced hand-written date helpers with date-fns (Prompt 3)
- The time picker offers only valid lengths, in 30-minute steps, instead of listing every length and showing errors (Prompt 5)
- One submission is one appointment, not one booking per pet (Prompt 7)

## Prompts

### Prompt 1: Starting context and monorepo setup

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** the initial repo: root config, `shared/`, `web/`, `mobile/` and this README

_Verbatim, typos included. A `\` at the end of a line only keeps the original line break when the Markdown renders._

> I have a take home assessment to complete for a company called goloadup. Before we start coding anything, I want you to understand some things about this position first.
>
> The company url is here: <https://goloadup.com/>\
> The position requirements are here: <https://careers.goloadup.com/jobs/691160-front-end-engineer>.\
> The assessment requirements are here: <https://docs.google.com/document/d/1AbCMEyZ80FQdf0d1XPsVmPmjyc0TG4F0E45IU0yOGwQ/edit?tab=t.0>
>
> I have already met with the Director of Engineering. He cares strongly about my ability with React and React Native, so this is my chance to show him my strengths in those areas. I have been authorized to use claude code, but it is required in the assessment document that I document all of my use of AI in this project. I am aslo supposed to document what tools, what they helped with, and where I made my own decisions or corrections.
>
> There are some key takeaways from the conversation I had with the Director of Engineering.\
> 1: He cares about maintaining shared logic between the React and React Native application. I know that this can be done using a monorepo. I will be using AI to set up the boiler plate for the monorepo.\
> 2: Please make the monorepo easy to read. I don't want to have to look at the file path to determine if I'm working on the main app for the mobile app or the web side. I want all shared logic to be structured under a shared folder, so create a the file path with a file that assumes the form logic will be shared between the react and react native apps.\
> 3: If I misheard him, this is on me, but I'm pretty positive he said they use MUI which is also my preferred front end component library for react. The component library for React Native that will closely match this is React Native Paper. I would like to define platform agnostic design tokens  at the monorepo level, while maintaining platform specific styling at the platform level.\
> 4: The Director of Engineering mentioned that they use tailwind for their CSS. I want to incorporate this in my assessment repo as a way for me to learn more about it while I do this assessment.\
> 5: I have lot of local projects with backend work in it. I want to ignore examples in my local repos for this assessment. For the purposes of this assessment, we will create a mock database that is a simple JSON object. I don't want any backend logic in this repo, it is strictly to be front end for both React and React Native.  \
> 6: please make sure all of the backend values are accounted for. The assessment explains a simple assessment, but there are some gotchas. For instance, the time constraint says "2 to 8 hours" , but it does not mention the constraint of booking multiple pets for the same day.  Example: I have 2 dogs, and I have 3 appointments for the same day all for 2 hours, clearly one of those dogs needs to be returned prior to completing the 3rd appointment. For simplicity sake, let's make sure we have 2 of each animal.
>
> I want you to create a section "Prompts" in the README.md file that I created. I want you to put this prompt into the README.md. Under this prompt, I want you to create a Use Case explanation that this is for starting context, initial write to README.md, and to set up the repo to work as I have specified.

#### Use Case

This prompt covers three things: starting context, the initial write to README.md, and setting up the repo to work as I specified.

- **Starting context:** the company, the role, the assessment requirements and what the Director of Engineering cares about, so later prompts can build on them.
- **Initial write to README.md:** creates this Prompts log (the assessment requires documenting AI use) and the README around it.
- **Repo setup:** a front-end-only monorepo with `web/` (React, MUI, Tailwind), `mobile/` (React Native, React Native Paper) and `shared/` (design tokens, domain types, the mock JSON database and the shared booking-form hook).

#### What the AI did

- Read the assessment doc, the job posting and goloadup.com. Pulled LoadUp's brand colors from the site's CSS and checked them against WCAG contrast.
- Checked current versions on npm and chose a compatible set: Expo SDK 57 (React Native 0.86, React 19.2.3), MUI 9, React Native Paper 5, Tailwind 3.4, Vite 8, Vitest 5, Playwright 1.63 and TypeScript 6.0 (the newest version typescript-eslint supports). Pinned one React version across web, mobile and shared so the monorepo loads a single copy of React.
- Wrote the npm-workspaces monorepo:
  - root config: TypeScript, ESLint with the `shared/` platform guard, Prettier, GitHub Actions CI;
  - `shared/`: design tokens, domain types and rules, the mock database with seed-data tests, and a starting `useBookingForm` hook;
  - `web/`: Vite, the MUI theme and Tailwind config built from the tokens, a starter page and a Playwright smoke test;
  - `mobile/`: Expo's blank TypeScript template moved to `src/MobileApp.tsx`, the Paper theme built from the tokens, and a starter screen.
- Ran these checks, all passing: typecheck in all three packages, lint, format check, 5 unit tests, the web production build, the E2E smoke test, an iOS Metro bundle, `expo-doctor` (21/21 checks), and the mobile starter in the iOS Simulator via Expo Go.
- Found that this machine's default Node (23.5) is outside the supported ranges, and ran everything with Node 22.15.
- Left the feature work to be written by hand: the pricing engine, mock API, form validation and live quote, the booking and admin pages and screens, and their tests.

### Prompt 2: React Hook Form, and date and time

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `shared/src/booking-form/` (`useBookingForm.ts` rewritten; `bookingFormSchema.ts` and its test added), `shared/src/date-time/` (new), `shared/src/domain/bookingDomain.ts`, `shared/src/mock-database/` (seed and its test), the starter page and screen, `web/playwright.config.ts`, the E2E test, the `package.json` files and this README

_Verbatim._

> The form needs to use react hook form: https://react-hook-form.com/
>
> I want the form to account for date and time.

#### Use Case

Two changes to the shared booking-form logic: build it on React Hook Form, and have each booking capture a start time as well as a date. Real start times also sharpen the same-day gotcha from Prompt 1: instead of a daily hour limit per pet, the rule becomes "a pet's bookings can't overlap".

#### What the AI did

- Installed React Hook Form 7.89 in `shared/` and both apps (hoisted to one copy, like React), plus zod 4 and `@hookform/resolvers` in `shared/`.
- **Chose zod for validation**, which the prompt didn't ask for: a schema in `shared/` plugs into React Hook Form through `zodResolver`, and the mock API can reuse it to re-check requests. React Hook Form's built-in `rules` would also work, but only inside the form. Cost: about 37 KB gzipped on the web bundle, together with React Hook Form.
- Rewrote `useBookingForm` on `useForm`: default values, `mode: 'onTouched'`, and a subscription that re-checks the start time when the date or the number of hours changes.
- Added `bookingFormSchema.ts`: required fields, names up to 50 characters, whole hours from 2 to 8, real calendar dates from today on, half-hour start times inside service hours (07:00–21:00), and no start time that has already passed. The cross-field checks use zod's `when` option, so they run while other fields are still empty.
- Added `date-time/localDateTime.ts`: helpers for date and time strings, a time-overlap check, and the device's time zone.
- Changed the data model: bookings gained `startTime`, `endTime` and `timeZone`, and the 8-hours-per-pet-per-day rule became "a pet's confirmed bookings can't overlap". Updated the seed (times on every booking, plus a rebooking after a cancellation: 9 bookings) and its tests.
- Fixed the E2E browser's time zone to `America/New_York`, so date and time tests behave the same everywhere.
- Ran all checks, all passing: typecheck, lint, format check, 24 unit tests, the web build, the E2E test, and the mobile starter in the iOS Simulator (React Hook Form and `Intl` time zones both work on Hermes).
- Left the form inputs (including date and time pickers), the live quote and submit to be written by hand.

### Prompt 3: date-fns for dates and times

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `shared/src/date-time/localDateTime.ts` and its test (rewritten), `shared/src/booking-form/bookingFormSchema.ts`, `shared/src/mock-database/mockDatabase.test.ts`, `shared/src/domain/bookingDomain.ts` (comments), the starter page and screen, the E2E test, `eslint.config.js`, the three `package.json` files and this README

_Verbatim._

> For dates and times, I'd prefer to use date-fns https://date-fns.org/. It works well with both react and react native apps. It should replace the common functions you created.

#### Use Case

A correction to the AI's work from Prompt 2: replace its hand-written date and time helpers with date-fns, a well-known library that works the same in React and React Native.

#### What the AI did

- Installed date-fns 4.4 in `shared/`, `web/` and `mobile/` (one hoisted copy).
- Removed the hand-written helpers (`toLocalDateString`, `toLocalTimeString`, `isCalendarDate`, `isTimeOfDay`, `timeToMinutes`, `minutesToTime`, `addHours`, `timeRangesOverlap`) and moved their callers to date-fns: `format`, `parse`, `isValid`, `addHours`, `subHours`, `isBefore`, `isAfter`, `startOfToday`, `getMinutes`, and `areIntervalsOverlapping` for the no-double-booking check.
- Kept a small `localDateTime.ts` on top of date-fns:
  - `DATE_FORMAT` and `TIME_FORMAT`, the formats bookings store;
  - `parseDateTime`, which turns a booking's date and time strings into a `Date`;
  - `matchesFormat`, because date-fns `isMatch` is lenient (it accepts `'9:30'` and `'2026-1-5'`): it parses with date-fns and requires the result to format back to the same string, so stored values stay exact;
  - `getDeviceTimeZone`, which stays on `Intl` because date-fns can't detect the device's time zone (its `@date-fns/tz` package calculates in a zone you pass in).
- Measured the cost of importing from `'date-fns'` in the mobile app: one such import added 215 modules and about 200 KB to the iOS bundle, because Metro doesn't tree-shake. Every import now uses the function's own path (`'date-fns/format'`), and a new ESLint rule blocks the root import in all three packages.
- Made the starter page and screen show today's date through date-fns. The E2E test fixes the browser clock with `page.clock` (along with the time zone), which is the pattern for testing date rules.
- Ran all checks, all passing: typecheck, lint, format check, 20 unit tests, the web build, the E2E test, `expo-doctor` (21/21), and the mobile starter in the iOS Simulator (date-fns works on Hermes).

### Prompt 4: The web booking form

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `shared/src/booking-form/` (schema, hook and tests reworked for several pets and a time range), `shared/src/pricing/` (new), `shared/src/date-time/localDateTime.ts` and its test, `shared/src/domain/bookingDomain.ts` (animal labels), `web/src/booking-form/` (new), `web/src/pages/WebBookingPage.tsx` (new, replacing the starter page), `web/src/WebApp.tsx`, `web/e2e/webBookingPage.spec.ts` (new, replacing the smoke test), the mobile starter screen (one line), the `package.json` files and this README

_Verbatim.

> I need you to only create the web form in this repo. Here are the requirements:
> https://docs.google.com/document/d/1AbCMEyZ80FQdf0d1XPsVmPmjyc0TG4F0E45IU0yOGwQ/edit?tab=t.0
>
> Please try to keep backend changes to a minimum. This is a front end only test, so I want
> validation to be completely on the front end. Do not worry about overlapping edge cases after
> submitting the form. That will be handled next.
>
> There are a few things in the requirements that are a gotcha and are not blatantly spelled out:
>
> Multiple pets on one form. The document says to include the animal name and animal type.
> Assume a user has two dogs, named Oscar and Sulley. The user should be able to add multiple pets to the same form.
> Date and time are two inputs only: one for the date and one for the time.
> Date: clicking anywhere on the date field (the date text OR the calendar icon) should open the date picker. The user should not be able to type into the field from the keyboard.
> Time: the 2-hour minimum and 8-hour maximum are handled within the time picker itself (the user picks a start and end time in that one input), not as a separate hours input alongside a separate start-time input.
> If the user selects anything over 8 hours, disable the submit button and show an error. Ifvthe user selects anything under 2 hours, disable the submit button and show the correct
> error message.
> Total pay. Show a total pay at the bottom of the page that updates whenever a pet is added.
> The $20 base pay is not per animal. It is charged once per sitter request, so whether the
> user has 1 animal or 20, they are only charged $20 once.
> The breakdown under each animal's name should not be a math equation. Simply itemize the
> charges, for example:
> 8 hours
> $20 per hour

#### Use Case

Build the web booking form, front end only, and handle the requirements that the assessment doesn't spell out: several pets on one request, exactly two inputs for when (a date picker that can't be typed in, and one time input that covers start and end and holds the 2 to 8 hour limits), submit disabled with the right error outside those limits, and a live total that charges the $20 base once per request and itemizes each pet. Overlapping bookings after submit are left for the next prompt.

#### What the AI did

- Reworked the shared schema and hook: `pets` became an array (React Hook Form `useFieldArray`, with a duplicate-pet check), and `hoursRequested` + `startTime` became one `serviceTime` field (`{ startTime, endTime }`) whose hours come from the two times. Its errors are checked in order and only the first shows: missing, format, half-hour start, service hours, end before start, under 2 hours, over 8 hours, whole hours. Added `hoursBetween` (date-fns `differenceInMinutes`) to `localDateTime.ts`.
- Added the pricing engine in `shared/src/pricing/` (base charge once per request, each pet at its animal's hourly rate, integer cents) with unit tests, and `useBookingQuote()`, which gives no price until the time covers 2 to 8 whole hours. For now the page reads the rate card straight from the mock database; there is no mock API call.
- Installed `@mui/x-date-pickers` (it was on disk but not in `package.json`) and `@mui/icons-material` in `web/`, and built `WebBookingPage` from four components in `web/src/booking-form/`: the date field, the time-range field, the pet rows and the price summary.
- **Date field:** found that a read-only MUI X field cancels its own click, so it opens the calendar on mousedown (plus Enter and Space for keyboard users).
- **Time field:** MUI X's time-range picker is a paid (Pro) component, so this is a read-only `TextField` that opens a popover with Start and End columns. Changing the start keeps the same number of hours when they still fit. Start times that have already passed today are disabled.
- Replaced the starter page and smoke test with 4 E2E tests. Found that the date picker ignores a click made during its opening animation (stock MUI behavior, only reachable at test speed), so the tests run with reduced motion.
- Changed one line of the mobile starter screen, which read the removed `hoursRequested` field. The mobile booking screen is not built.
- Ran all checks, all passing: typecheck, lint, format check, 28 unit tests, the web build and the 4 E2E tests. Checked the page in screenshots at desktop and phone widths, which showed a price for an invalid 9-hour booking; changed the quote to wait for a valid time.

### Prompt 5: Only valid times, and submit only when complete

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `shared/src/booking-form/` (schema, hook and schema tests), `shared/src/pricing/` (engine and tests), `shared/src/domain/bookingDomain.ts`, `shared/src/mock-database/mockDatabase.test.ts`, `web/src/booking-form/WebServiceTimeField.tsx`, `web/src/booking-form/WebPriceSummary.tsx`, `web/src/pages/WebBookingPage.tsx`, `web/e2e/webBookingPage.spec.ts` and this README

_Verbatim._

> The end times should filter out any hours that are outside of the 2 to 8 hours away from the start time, so the user cannot select under 2 hours or over 8 hours. The start times and end times should be in increments of 30 minutes. This should allow you to remove the dash for the total, as the user should not be able to select outside of the 2 to 8 hour window.
>
> Submission should be disabled until all of the inputs in the form are filled out.

#### Use Case

A correction to Prompt 4's time picker: instead of listing every length and showing an error for the wrong ones, only offer end times 2 to 8 hours after the start, every 30 minutes. With no invalid lengths to price, the total no longer needs a dash. Also, submit stays disabled until the whole form is filled in.

#### What the AI did

- **Time picker:** the End column now lists every half hour from 2 to 8 hours after the start, stopping at closing (9:00 PM), and the Start column stops at 7:00 PM, the last start that leaves 2 hours. A new E2E test found that starts from 4:00 PM on had no end times at all: start + 8 hours wrapped past midnight (6:00 PM + 8 hours became `'02:00'`), and the code compared the times as strings. It now compares them as dates.
- **Half hours:** `startTimeStepMinutes` became `timeStepMinutes` and applies to end times too, the schema dropped "Choose whole hours" and checks that both times are on the hour or half hour, and the pricing engine prices half hours (rounded to whole cents). Kept the schema's 2 and 8 hour errors as a safety net for data that doesn't come from the picker.
- **Total:** always a price. The pricing engine takes `hours: null` before a time is picked, which leaves every pet unpriced, so the total is the $20 base; each pet shows "Choose a time" and no subtotal until then.
- **Submit:** disabled while `formState.isValid` is false, so any empty or invalid input (including a new, empty pet row) keeps it disabled. Error messages still wait until the user leaves a field.
- Rewrote the time and submit E2E tests (now 5), and added unit tests for half-hour prices, the base-only total, and end times off the half hour.
- Ran all checks, all passing: typecheck, lint, format check, 30 unit tests, the web build and the 5 E2E tests.

### Prompt 6: Saving bookings, and the admin page

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `shared/src/mock-api/` and `shared/src/booking-schedule/` (new, with tests), `shared/src/date-time/localDateTime.ts` and its test (`displayTime`), `shared/package.json`, `web/src/components/` (new: `WebDatePicker.tsx`, `WebNavBar.tsx`), `web/src/booking-form/WebServiceDateField.tsx` and `WebServiceTimeField.tsx`, `web/src/pages/WebAdminPage.tsx` (new), `web/src/pages/WebBookingPage.tsx`, `web/src/WebApp.tsx`, `web/e2e/` (new admin spec and shared form helpers), `web/package.json` and this README

_Verbatim._

> Now we need to add the admin page. We need to ensure that the submission button works, and actually writes to the backend.  Make sure that you can easily switch over from the form to the admin page.
>
> Make sure the admin page lists bookings by day, starting with the earliest to latest according to the beginning time. If several bookings start at the same time, make sure they are listed together under the same time frame. For instance, booking 1, 2, and 3 all start at 7:00 AM, the Header of the card should be x appoints starting at  7:00 AM.
>
> For the admin page, we want to be able to switch between days, we can easily reuse the date picker component from the form for this.

#### Use Case

Make submit save the request to the (mock) backend, add the admin page that lists a day's bookings grouped by start time, and make it easy to move between the form and the admin page. The admin page reuses the form's date picker to change days.

#### What the AI did

- **Mock API** (`shared/src/mock-api/`): `createBooking` and `listBookings` over an in-memory copy of the seed, with simulated latency. `createBooking` re-checks the request with the form's schema, reuses matching customers and pets, saves one booking per pet with a price snapshot (the $20 base on the first pet's booking only), and refuses the request if any pet's confirmed booking overlaps it. Overlaps had been left for "next" in Prompt 4; the AI included them here because a working submit writes bookings, and the seed's same-day bookings would otherwise be double-booked.
- **Schedule** (`shared/src/booking-schedule/`): `groupByStartTime` (earliest first, bookings that start together in one group) and `useDaySchedule`, which loads a day and ignores a slow answer for a day the user has left. Rewrote the hook once because React's lint rule forbids resetting state inside an effect.
- **Web:** installed React Router 7 (version 8 needs React 19.2.7, and the repo pins 19.2.3 for Expo), added a nav bar with "Book a sitter" and "Admin" tabs, and wired the form's submit to `createBooking`: "Booking…" while saving, a success message with a link to that day on the admin page, or the server's reason in an error message with the form kept as it was.
- **Date picker reuse:** moved the click-only picker into `web/src/components/WebDatePicker.tsx`; the form's date field wraps it for React Hook Form, and the admin page uses it directly (past dates allowed), plus previous and next day buttons. The date is in the URL (`/admin?date=2026-10-03`).
- **Admin page:** one card per start time titled "N appointments starting at 7:00 AM" ("1 appointment" when single), with each booking's pet, owner, times, hours and price, and a "Cancelled" tag where needed. Cancelled bookings count toward the card title.
- Added unit tests for the mock API and grouping (41 in total) and 4 admin E2E tests (9 in total), moving the form-filling steps into `web/e2e/bookingFormHelpers.ts`.
- Ran all checks, all passing: typecheck, lint, format check, 41 unit tests, the web build and 9 E2E tests. Checked the admin page in screenshots at desktop and phone widths. The build warns that the JavaScript bundle is over 500 KB (about 860 KB, mostly MUI and its date pickers); loading each page separately would shrink it, and hasn't been done.

### Prompt 7: One submission is one appointment

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `shared/src/domain/bookingDomain.ts`, `shared/src/mock-database/` (seed and its test), `shared/src/mock-api/` (API and tests), `shared/src/booking-schedule/` (grouping and tests), `web/src/pages/WebAdminPage.tsx`, `web/e2e/webAdminPage.spec.ts` and this README

_Verbatim._

> One submission should equal one appointment. I created 1 appointment for four pets, and when I navigate to the admin portion of this, I see 4 appointments starting at 8:30 AM. That should be 1 appointment starting at 8:30 AM with the appointment including the 4 pets under the 1 person's name.

#### Use Case

A correction to Prompt 6: the AI saved each pet as its own booking, so one submission for four pets showed as four appointments. One submission should be one appointment, listed once under the customer's name with all its pets.

#### What the AI did

- **Data model:** a booking is now one appointment. `petId` became `petIds` (every pet in the submission), and the price snapshot became one base charge plus one line per pet (`pets: [{ petId, hourlyRateCents, subtotalCents }]`). Converted the 9 seed bookings (each still has one pet) and added a seed test that every price adds up.
- **Mock API:** `createBooking` saves one booking and returns it; the overlap check looks at every pet in each existing booking. `listBookings` returns each booking with all its pets.
- **Admin page:** each appointment is one entry under the customer's name, showing its times, hours and number of pets, then each pet with its charge, the base charge and the total. The card title counts appointments, so the four-pet submission reads "1 appointment starting at 8:30 AM".
- Left the seed as it was: Jordan Rivera's two dogs at 9:00 on 3 October are two separate bookings made minutes apart, so they still show as 2 appointments.
- Updated the unit tests (43) and the admin E2E tests; one E2E test now books the four-pet scenario from this prompt. Ran all checks, all passing: typecheck, lint, format check, 43 unit tests, the web build and 9 E2E tests. Checked the admin page in a screenshot.

### Prompt 8: The day's total earnings

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `shared/src/booking-schedule/` (`dayEarningsCents` and tests), `web/src/pages/WebAdminPage.tsx`, `web/e2e/webAdminPage.spec.ts` and this README

_Verbatim._

> We should have a total earnings for the day at the top of the page that displays right aligned to the "Bookings" title.

#### Use Case

Show what the selected day earns at the top of the admin page, on the same line as the "Bookings" title and aligned to the right.

#### What the AI did

- Added `dayEarningsCents` in `shared/src/booking-schedule/`: the sum of the day's confirmed bookings' totals. **Chose to leave cancelled bookings out**, which the prompt didn't specify, since a cancelled booking earns nothing: 10 October shows $180, not $320.
- Put the amount beside the title on the admin page, with "Total earnings" under it, lined up with the date under the title. It shows "…" while the day loads and $0 on a day without bookings.
- Added 3 unit tests (46 in total) and E2E checks for the amount on several days (including after a new booking) and for its position: the same line as the title, at the schedule's right edge. Ran all checks, all passing: typecheck, lint, format check, 46 unit tests, the web build and 9 E2E tests. Checked the header in screenshots at desktop and phone widths.

### Prompt 9: Mobile matches web

- **Tool:** Claude Code (desktop app), Claude Opus 5.5
- **Date:** 2026-09-28
- **Files written:** `mobile/src/` (new: `MobileApp.tsx` rewritten, `screens/MobileBookingScreen.tsx`, `screens/MobileAdminScreen.tsx`, `booking-form/`, `components/MobileDatePicker.tsx`, `__tests__/`, `test-utils/`; the starter screen deleted), `mobile/jest.config.js`, `mobile/jest.setup.ts`, `mobile/tsconfig.json`, `mobile/package.json`, `shared/src/booking-form/serviceTimeOptions.ts` and its test (moved from the web time field), `shared/src/date-time/localDateTime.ts` (`formatHours`), `shared/src/domain/bookingDomain.ts` and a new test (`formatNameList`), `shared/package.json`, the web files that now use the shared helpers, the root `package.json` (React override), `package-lock.json` and this README

_Verbatim._

> Next, I want mobile to match the web functionality.

#### Use Case

Bring the React Native app up to the web app: the same booking form (several pets, tap-only date, start-to-end time, live price, submit only when complete) and the same admin schedule (grouped by start time, day switching, earnings), with easy switching between the two.

#### What the AI did

- **Shared first:** moved the time picker's lists (`startTimeOptions`, `endTimeOptions`, keeping the length when the start changes, passed start times) from the web component into `shared/src/booking-form/serviceTimeOptions.ts` with tests, and added `formatHours` and `formatNameList`, so both apps show the same choices and text. The web app uses them too.
- **Mobile screens** with React Native Paper: `MobileBookingScreen` (name fields, pet blocks with segmented animal-type buttons, `MobileDatePicker`, a two-column time modal, the price summary, a success banner that opens the day on the Admin tab, the server's error kept on the form) and `MobileAdminScreen` (earnings beside the title, the date picker with previous and next buttons, cards per start time with each appointment itemized). Two tabs with Paper's `BottomNavigation`; the Admin tab remounts each time it opens so new bookings show.
- **New dependencies:** `react-native-paper-dates` (a Paper-styled calendar in plain JavaScript, so it runs in Expo Go) and `@expo/vector-icons` (Paper's icons) in the app; Jest 29, jest-expo, React Native Testing Library 14 and `test-renderer` for tests. `npm audit` reports 10 moderate advisories, all from Expo's own tooling (`xcode` → `uuid`) and present before this prompt.
- **Found and fixed:** installing the mobile packages let npm put React 19.3.0 at the root while react-dom stayed 19.2.3, which stopped the web app from starting (the E2E tests caught it). Added a root `overrides` entry that pins `react` and `react-dom` to 19.2.3, as the README already promised.
- **Mobile tests (9):** each web E2E test has a mobile counterpart. Getting them to run needed: compiling `react-native-paper-dates`' ES-module color packages in Jest, the safe-area library's Jest mock, sending layout events (the calendar and Paper's tab bar do nothing until measured), explicit accessibility labels on the name fields and tabs (which also helps VoiceOver), and `"types": ["jest"]` in the mobile tsconfig, because TypeScript 6 no longer loads `@types` packages on its own.
- Ran all checks, all passing: typecheck, lint, format check, 54 shared unit tests, 9 mobile tests, the web build and 9 web E2E tests. Ran the app in the iOS Simulator (iPhone 17 Pro, Expo Go) and screenshotted the booking and admin screens. The admin screenshot needed the app to start on that tab at a seeded date, a temporary change that was reverted.
