# Pet Sitting: LoadUp Front-End Assessment

A pet-sitting booking app built as a monorepo: a **React** web app and a **React Native** app that share one TypeScript package for design tokens, domain types, the mock database and form logic. It is front end only; there is no backend in this repo.

> **Status:** the booking form and admin page work on web and mobile alike: several pets per request, a click-only date picker, a start-to-end time picker that only offers 2 to 8 hours in half-hour steps, all-client-side validation and a live itemized price. Submitting saves through the mock API, which refuses a pet's overlapping bookings, and the admin page lists each day's bookings grouped by start time, with the day's earnings. See [Mobile](#mobile-matching-the-web-app) for how the phone version maps onto the web one.

## Quick start

Requires Node `^22.13`, `^24.3` or `>=26` (`.nvmrc` pins 22). Node 23 isn't supported by React Native 0.86, Vitest 5 or ESLint 10.

```bash
npm install
npm run web       # web app at http://localhost:5173
npm run ios       # mobile app in the iOS Simulator, via Expo Go
npm run android   # mobile app in an Android emulator, via Expo Go
npm run mobile    # Expo dev server only; scan the QR code with Expo Go on a phone
```

```bash
npm run verify    # typecheck + lint + format check + unit tests (shared and mobile) + web build
npm run test:e2e  # Playwright E2E tests (first time: cd web && npx playwright install chromium)
```

## Repo layout

```text
shared/                  @pet-sitting/shared: platform-agnostic code used by both apps
  src/booking-form/      useBookingForm.ts (React Hook Form), bookingFormSchema.ts (validation), serviceTimeOptions.ts (the time picker's lists)
  src/date-time/         localDateTime.ts: the date and time formats bookings use, for date-fns
  src/design-tokens/     designTokens.ts: colors, spacing, radius, type scale
  src/domain/            bookingDomain.ts: data types and business rules
  src/mock-database/     mockDatabase.ts: the mock backend's data, plus tests for the seed
  src/pricing/           pricingEngine.ts: the itemized quote, plus its tests
  src/mock-api/          mockApi.ts: the mock backend's endpoints (create and list bookings), plus tests
  src/booking-schedule/  bookingSchedule.ts: the admin schedule (group by start time, load a day)
web/                     @pet-sitting/web: React, Vite, MUI, Tailwind
  src/WebApp.tsx         root component: MUI theme and providers
  src/pages/             Web*Page.tsx
  src/booking-form/      the booking form's inputs and price summary (Web*Field.tsx, WebPriceSummary.tsx)
  src/components/        WebDatePicker.tsx (used by the form and the admin page), WebNavBar.tsx
  src/theme/             webTheme.ts (MUI), tailwind.css
  tailwind.config.ts     Tailwind theme built from the shared tokens
  e2e/                   Playwright tests
mobile/                  @pet-sitting/mobile: React Native, Expo, React Native Paper
  src/MobileApp.tsx      root component: Paper theme, providers and the two tabs
  src/screens/           Mobile*Screen.tsx
  src/booking-form/      the booking form's inputs and price summary (Mobile*Field.tsx, MobilePriceSummary.tsx)
  src/components/        MobileDatePicker.tsx (used by the form and the admin screen)
  src/theme/             mobileTheme.ts (Paper)
  src/__tests__/         Jest + React Native Testing Library tests
```

### Which app am I in?

The file name tells you, without looking at the path:

- **Platform prefixes.** A web file with a mobile counterpart starts with `Web`/`web`, and the mobile one with `Mobile`/`mobile`: `WebApp.tsx` and `MobileApp.tsx`, `webTheme.ts` and `mobileTheme.ts`.
- **Pages vs. screens.** Web has pages (`pages/WebBookingPage.tsx`), mobile has screens (`screens/MobileBookingScreen.tsx`).
- **Shared code has no prefix** and is imported by package name, so the import line says it's shared: `import { useBookingForm } from '@pet-sitting/shared/booking-form'`. The public modules are listed under `exports` in `shared/package.json`.
- **No `index.ts` barrels**, so source files don't share names. The only generic names are the entry points the tools expect (`web/src/main.tsx`, `mobile/index.ts`) and config files like `package.json`.
- **ESLint guards the boundary.** Code in `shared/` can't import `react-dom`, `react-native`, MUI, Paper or Expo, or use browser-only globals like `window`.

## Booking form: React Hook Form in `shared/`

```text
shared/src/booking-form/bookingFormSchema.ts     zod schema: every field rule, including date and time
  └─ shared/src/booking-form/useBookingForm.ts   useForm() with zodResolver, defaults, cross-field re-checks
       ├─ web/                                    MUI inputs, each bound with <Controller />
       └─ mobile/                                 React Native Paper inputs, each bound with <Controller />
```

- **One hook, two UIs.** React Hook Form's core doesn't depend on the DOM, so `useBookingForm()` lives in `shared/` and returns the usual `useForm` object (`control`, `handleSubmit`, `formState`, ...). Each app binds its own inputs with `<Controller />`: React Native has no DOM inputs for `register`, and MUI's selects and pickers are controlled components too.
- **One schema for the apps and the mock API.** The rules are a zod schema, connected with `zodResolver`. The mock API can parse requests with the same schema, so it re-checks exactly what the apps check.
- **Two types.** `BookingFormValues` is what the form holds while someone edits it (a pet's `animalType` can be `null`). `BookingRequest` is what `handleSubmit` receives once the form is valid (names trimmed, every animal chosen).
- **Several pets per request.** `pets` is an array handled with React Hook Form's `useFieldArray`, which `useBookingForm()` returns as `pets`. All the pets share one date and time. Listing the same pet (name + animal type) twice is an error.
- **When errors show.** With `mode: 'onTouched'`, a field is checked when the user leaves it, then on every change. Closing a picker counts as leaving it. Submit stays disabled until every input is filled in and valid (`formState.isValid`, which checks the whole schema on every change). Whether a start time has passed depends on the date, so the hook re-checks the time when the date changes.
- **Date and time: two inputs.** The form holds `serviceDate` (`'YYYY-MM-DD'`) and `serviceTime` (`{ startTime, endTime }`, each `'HH:mm'`) as strings. There's no hours field: the hours come from the start and end time (`hoursBetween`), and the schema checks the 2 hour minimum and 8 hour maximum on `serviceTime`.
- **Web pickers.** The date uses MUI X's `DatePicker` with its field set to read-only, so there's no typing, and clicking anywhere on it opens the calendar. MUI X's time-range picker is a paid (Pro) component, so `WebServiceTimeField` is a read-only `TextField` that opens a popover with a Start column (every half hour) and an End column that lists only the times 2 to 8 hours after the start, every half hour, stopping at closing. So a length outside the limits can't be picked; the schema's 2 and 8 hour errors are a safety net. All date and time work uses [date-fns](https://date-fns.org/), which runs the same on web and React Native. Pickers return `Date` objects: store them with `format(date, DATE_FORMAT)` or `format(date, TIME_FORMAT)`, and read the strings back with `parse`. The format constants come from `@pet-sitting/shared/date-time`.
- **Import date-fns one function at a time** (`import { format } from 'date-fns/format'`). Metro doesn't tree-shake: a single `import { format } from 'date-fns'` added 215 modules and about 200 KB to the iOS bundle. ESLint blocks the root import.

## Pricing

`shared/src/pricing/pricingEngine.ts` turns the pets and the hours into an itemized quote, in integer cents, from the `pricingRules` rate card. `useBookingQuote()` in `shared/` keeps it live as pets and times change.

- **The $20 base charge is per request, not per pet.** One pet or twenty, it's charged once.
- **Each pet is itemized, not written as an equation**: its hours and its hourly rate on separate lines under its name, with its subtotal beside it.
- **The total always shows a price.** Until a time is picked it's the base charge alone, and each pet reads "Choose a time"; the pets are added as soon as there's a time.
- The live price reads the rate card straight from the seed data; the mock API prices saved bookings from the same rate card.

## Mock API and the admin page

`shared/src/mock-api/mockApi.ts` stands in for the backend. Its functions are async with about 300 ms of latency, so the apps call it as they would a server, and it reads and writes an in-memory copy of the seed data.

- **`createBooking(request, timeZone)`** checks the request again with the form's schema, finds or creates the customer and pets (same names, ignoring case, per the assumptions below), and saves the submission as one booking (one appointment) holding all its pets. It refuses the whole request if any pet has a confirmed booking that overlaps the new time (back to back is fine, cancelled bookings don't count), and the form shows the reason.
- **One submission, one appointment.** A booking lists its pets (`petIds`), and its price itemizes them: the $20 base once, then each pet's hourly charge, adding up to the total the form showed.
- **`listBookings(date)`** returns a day's bookings with their customers and pets.
- **Saved until the page reloads.** The two pages are routes in one app (React Router), so moving between them keeps the saved bookings; a reload starts again from the seed.

The admin page (`/admin?date=YYYY-MM-DD`, default today) shows the day's total earnings on the title's line, right-aligned (confirmed bookings only: a cancelled booking earns nothing), then one card per start time, earliest first, titled like "3 appointments starting at 7:00 AM", with each appointment under the customer's name: its times, hours and number of pets, every pet with its charge, the base charge and the total. Cancelled bookings are listed with a "Cancelled" tag. Days change with the same `WebDatePicker` the form uses (past dates allowed here) or the previous and next buttons, and the date lives in the URL so the browser's back button steps through days. The grouping (`groupByStartTime`), the day's earnings (`dayEarningsCents`) and loading (`useDaySchedule`) are in `shared/`, ready for the mobile admin screen.

## Mobile: matching the web app

The mobile app does everything the web app does, with the same shared hook, schema, time lists, pricing, mock API and schedule. Only the inputs and layout are platform code.

| Web                                                  | Mobile                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Nav bar with "Book a sitter" and "Admin" tabs         | Paper `BottomNavigation` with the same two tabs (no navigation library needed)                          |
| `WebDatePicker`: MUI X, read-only, opens on any click | `MobileDatePicker`: a read-only field that opens `react-native-paper-dates` on any tap                  |
| Time popover with Start and End columns               | A Paper modal with the same two columns, from the same `serviceTimeOptions.ts`                          |
| Animal type as a select                               | Animal type as segmented buttons (one tap on a phone)                                                   |
| Success message links to `/admin?date=…`              | Success banner's "See the day's bookings" opens the Admin tab on that date                             |
| Admin page reloads on each visit                      | The Admin tab remounts each time it opens, so it shows bookings made since                              |

- **Both tabs stay mounted**, so a half-filled form survives a look at the schedule. The mock API's saved bookings live as long as the app runs.
- **Text that both apps show comes from `shared/`**: `displayTime`, `formatHours`, `formatCents` and `formatNameList`. `formatNameList` exists because `Intl.ListFormat` isn't in every React Native JavaScript engine.
- Paper's icons come from `@expo/vector-icons`.

## Styling: shared tokens, platform themes

```text
shared/src/design-tokens/designTokens.ts     hex colors and unitless numbers
  ├─ web/src/theme/webTheme.ts               MUI theme
  ├─ web/tailwind.config.ts                  Tailwind classes: bg-primary, p-md, rounded-card, text-body
  └─ mobile/src/theme/mobileTheme.ts         React Native Paper (Material Design 3) theme
```

- **Tokens** (in `shared/`) define what things look like: colors, spacing, radius and font sizes. They're plain values without units: web reads them as CSS pixels (converted to rem for text) and React Native as density-independent pixels.
- **Themes** (in each app) decide how each platform applies them. Web uses system fonts, sentence-case buttons and a higher-contrast input border. Mobile keeps Paper's Material Design 3 type scale and replaces Paper's default purple tints.
- **Colors** come from goloadup.com's CSS: brand teal `#4ed3cf` and lime `#ccff00`. The brand teal is too light for text (1.8:1 on white), so `primary` is a darker teal, `#087a77` (5.2:1), which passes WCAG AA. Color roles use Material Design 3 names (`primary`, `onPrimary`, `surface`, `outline`, ...). Paper uses these names directly, and they map onto MUI's palette.

### Tailwind v3.4 alongside MUI

- **Version.** LoadUp's partner portal (order.goloadup.com/partner) ships Tailwind 3.4, so this repo uses the same version line. Tailwind 3 reads a TypeScript config file, which lets `tailwind.config.ts` import the shared tokens directly.
- **Token classes.** `theme.extend` adds classes named after the tokens (`bg-primary`, `text-on-surface-variant`, `p-md`, `rounded-pill`, `text-body-small`) and keeps all of Tailwind's defaults (`p-4`, `text-sm`, ...).
- **No preflight.** MUI's `<CssBaseline />` already resets browser styles, so Tailwind's reset is turned off.
- **Which styles win.** `<StyledEngineProvider enableCssLayer>` puts all of MUI's styles in a CSS cascade layer (`@layer mui`). Tailwind's classes aren't in a layer, and unlayered CSS beats layered CSS regardless of specificity. So `className="rounded-pill"` on a MUI `Button` just works, without `!important`. The older workaround, `important: '#root'`, misses MUI dialogs and menus because they render outside `#root`. The E2E smoke test checks the override.
- **Editor help.** The recommended Tailwind CSS IntelliSense extension (`.vscode/extensions.json`) autocompletes the token classes and shows the CSS behind each one.

## Mock database and data model

There is no server. `shared/src/mock-database/mockDatabase.ts` is a plain JSON object standing in for the backend's data store. Treat it as seed data: a mock API should copy it into memory and read and write the copy. Types and rules live in `shared/src/domain/bookingDomain.ts`.

| Collection     | Fields                                                                                                                                              | Notes                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pricingRules` | `currency`, `baseChargeCents`, `hourlyRateCents` per animal                                                                                         | The rate card lives with the data, not in the apps, so prices can change without a new mobile release. Money is in integer cents.                         |
| `customers`    | `id`, `firstName`, `lastName`, `createdAt`                                                                                                          |                                                                                                                                                            |
| `pets`         | `id`, `customerId`, `name`, `animalType`, `createdAt`                                                                                               |                                                                                                                                                            |
| `bookings`     | `id`, `customerId`, `petIds`, `serviceDate`, `startTime`, `endTime`, `timeZone`, `hoursRequested`, `price`, `status`, `createdAt`, `updatedAt` | One booking is one appointment: everything a customer booked in one submission, one or more pets. Times are local `'HH:mm'` in the booking's IANA `timeZone`. `price` is a snapshot of the itemized quote (base charge once, one line per pet). `status` is `confirmed` or `cancelled`. |

The seed has 3 customers, 2 dogs, 2 cats, 2 pigs and 9 bookings, including:

- **Jordan Rivera's 2 dogs with 3 two-hour bookings on 2026-10-03.** Both dogs are booked 09:00–11:00, then Biscuit again 11:00–13:00, starting the minute he's returned.
- **Miso booked 09:00–17:00 on 2026-10-05**, so another booking for Miso that day has to fit before 09:00 or after 17:00.
- **A cancellation** (Hamlet, 10:00–16:00 on 2026-10-10) that freed the slot for his 12:00–14:00 booking.

## Assumptions

Where the assessment is silent, these are the working assumptions. The data model reflects them.

1. **No double-booking a pet.** A pet can have several bookings on one date, but its confirmed bookings can't overlap: the pet is returned before its next booking starts. Back-to-back is fine (11:00–13:00 can follow 09:00–11:00), with no buffer in between. Only the mock API can check this, because it needs the existing bookings; date-fns `areIntervalsOverlapping` does the comparison.
2. **Service hours are 07:00–21:00** local time. A booking must start and end inside them, so it never runs past midnight, and it starts on the hour or half hour.
3. **Half-hour steps**: bookings start and end on the hour or half hour, and last from 2 to 8 hours (2, 2.5, ... 8).
4. **Dates and times are local to where the pet is.** They're stored as strings (`'YYYY-MM-DD'`, `'HH:mm'`) with that place's IANA time zone beside them, which is what turns them into an exact moment. A booking must start in the future: later today is fine. "Now" comes from the device's clock and time zone, assuming people book from where the pet is. Date strings are read with date-fns `parse`, never `new Date()`, which parses them as UTC midnight: the previous evening in US time zones.
5. **Identity without accounts.** The same first + last name (trimmed, case-insensitive) is the same customer, and a customer's pet is identified by name + animal type. In production these would be signed-in user and pet ids.
6. **Names are 1–50 characters** after trimming.
7. **Prices come from the (mock) server.** The rate card is in the database, money is stored in integer cents, and each booking keeps a snapshot of its price, so a later rate change doesn't alter past totals.
8. **Bookings are confirmed when created.** Cancelled bookings stay listed but free up their time slot.
9. **Out of scope:** sitter availability and assignment, payments, and authentication for the admin page.
10. **Seed dates are fixed** (September to October 2026, in `America/New_York`).

## Testing

| Layer | Tool           | Where                      | Covers now                                                                                                                                                                                                  |
| ----- | -------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit  | Vitest         | `shared/src/**/*.test.ts`  | The booking form's rules (against a fixed clock), the pricing engine (base charge once per request), the mock API (one booking per submission, overlap refusals, the itemized price), grouping by start time, the day's earnings, the strict date and time format checks, and the mock database seed (2 of each animal, valid references, prices that add up, no double-booked pets). |
| E2E   | Playwright     | `web/e2e/`                 | The booking form: the date opens from anywhere on the field and can't be typed in, the End column offers only 2 to 8 hours in half-hour steps and stops at closing, submit stays disabled until every input is filled in, the total for several pets charges the base once, and a complete request submits. The admin page: the day's earnings beside the title; grouping by start time, earliest first; switching days; a submitted request appearing on it; and an overlapping booking refused. The browser's time zone and clock are fixed, and reduced motion is on (the date picker ignores clicks during its opening animation, which only a test is fast enough to make). |
| Mobile | Jest (jest-expo) + React Native Testing Library | `mobile/src/__tests__/` | The same behaviors as the web E2E tests, on the phone: the tap-only date field, the time lists, live pricing, submit enabled only when complete, saving and the admin schedule (grouping, switching days, earnings, a four-pet appointment, an overlap refused). Helpers in `mobile/src/test-utils/` send the layout events that the calendar and Paper's tab bar wait for, since Jest has no layout engine. |
| CI    | GitHub Actions | `.github/workflows/ci.yml` | `npm run verify` plus the E2E tests on every push to `main` and every pull request.                                                                                                                        |

The mobile app is also checked by its TypeScript typecheck, and the booking and admin screens have been run in the iOS Simulator (iPhone 17 Pro) through Expo Go.

## Next steps

- [x] Pricing engine in `shared/`, with unit tests
- [x] Mock API in `shared/`: create and list bookings, with the schema re-check, overlap refusals and `timeZone`
- [x] Live quote in `useBookingForm` (`useBookingQuote`)
- [x] Submit: send the request through the mock API, and handle overlapping bookings for each pet
- [x] Web: `WebBookingPage` (MUI inputs with `<Controller />`, including date and time pickers)
- [x] Web: routing and `WebAdminPage`
- [x] Mobile: navigation, `MobileBookingScreen` (Paper inputs with `<Controller />`, including date and time pickers) and `MobileAdminScreen`
- [x] E2E tests for the booking form
- [x] E2E tests for the admin page
- [x] Delete the web starter page and smoke test
- [x] Delete the mobile starter screen

## AI usage

The assessment allows AI tools as long as their use is documented. Every prompt is logged verbatim under [Prompts](#prompts), with its use case and what the AI did.

| Tool                                       | What it helped with                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code (desktop app, Claude Opus 5.5) | Researching the role and assessment, the monorepo boilerplate, the shared booking-form logic (React Hook Form, validation, dates and times), the web booking form and pricing engine with their tests, and drafting this README. |

**Decisions I made** (from my prompts):

- A monorepo with a `shared/` package, so web and mobile share logic (Prompt 1)
- MUI on web and React Native Paper on mobile, with platform-agnostic design tokens in `shared/` and platform-specific styling in each app (Prompt 1)
- Tailwind on the web app (Prompt 1)
- Front end only: the mock database is a JSON object, with no backend (Prompt 1)
- Account for the same-day booking gotcha, and seed 2 of each animal (Prompt 1)
- React Hook Form for the booking form (Prompt 2)
- Bookings have a start time as well as a date (Prompt 2)
- Several pets on one request; exactly two inputs for when (a click-only date picker, and one time input for start and end, holding the 2 to 8 hour limits); submit disabled with a matching error outside 2 to 8 hours; the $20 base charged once per request; each pet's charges itemized rather than written as an equation; validation entirely on the front end (Prompt 4)
- End times limited to 2 to 8 hours after the start, so a wrong length can't be picked; start and end times every 30 minutes; the total always shows a price; submit disabled until every input is filled in (Prompt 5)
- An admin page listing each day's bookings, earliest start first, with bookings that start together in one card titled "x appointments starting at 7:00 AM"; days switched with the form's date picker; easy switching between the form and the admin page; submit writes to the (mock) backend (Prompt 6)

**Corrections I made to AI output:**

- Replaced the AI's hand-written date and time helpers with date-fns (Prompt 3)
- Replaced the AI's time picker, which listed every length and relied on errors, with one that only offers valid lengths; and asked for half-hour end times instead of whole hours (Prompt 5)
- Changed the AI's one-booking-per-pet design: one submission is one appointment, with all its pets under the customer's name (Prompt 7)
- The day's total earnings at the top of the admin page, right-aligned with the "Bookings" title (Prompt 8)
- The mobile app matching the web app's functionality (Prompt 9)

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
- Left the feature work (see [Next steps](#next-steps)) to be written by hand: the pricing engine, mock API, form validation and live quote, the booking and admin pages and screens, and their tests.

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
- Left the form inputs (including date and time pickers), the live quote and submit to be written by hand (see [Next steps](#next-steps)).

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
