# Pet Sitting: LoadUp Front-End Assessment

A pet-sitting booking app built as a monorepo: a **React** web app and a **React Native** app that share one TypeScript package for design tokens, domain types, the mock database and form logic. It is front end only; there is no backend in this repo.

> **Status:** boilerplate. The monorepo, shared package, themes, mock database, test tooling and the shared booking-form logic (React Hook Form, with date and time) are set up and verified. The form UI, pricing engine, mock API and admin pages are next (see [Next steps](#next-steps)).

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
npm run verify    # typecheck + lint + format check + unit tests + web build
npm run test:e2e  # Playwright E2E tests (first time: cd web && npx playwright install chromium)
```

## Repo layout

```text
shared/                  @pet-sitting/shared: platform-agnostic code used by both apps
  src/booking-form/      useBookingForm.ts (React Hook Form) and bookingFormSchema.ts (validation)
  src/date-time/         localDateTime.ts: the date and time formats bookings use, for date-fns
  src/design-tokens/     designTokens.ts: colors, spacing, radius, type scale
  src/domain/            bookingDomain.ts: data types and business rules
  src/mock-database/     mockDatabase.ts: the mock backend's data, plus tests for the seed
web/                     @pet-sitting/web: React, Vite, MUI, Tailwind
  src/WebApp.tsx         root component: MUI theme and providers
  src/pages/             Web*Page.tsx
  src/theme/             webTheme.ts (MUI), tailwind.css
  tailwind.config.ts     Tailwind theme built from the shared tokens
  e2e/                   Playwright tests
mobile/                  @pet-sitting/mobile: React Native, Expo, React Native Paper
  src/MobileApp.tsx      root component: Paper theme and providers
  src/screens/           Mobile*Screen.tsx
  src/theme/             mobileTheme.ts (Paper)
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
- **Two types.** `BookingFormValues` is what the form holds while someone edits it (`animalType` can be `null`). `BookingRequest` is what `handleSubmit` receives once the form is valid (names trimmed, an animal chosen).
- **When errors show.** With `mode: 'onTouched'`, a field is checked when the user leaves it, then on every change. A start time's validity also depends on the date and the number of hours, so the hook re-checks it when either changes.
- **Date and time.** The form holds `serviceDate` (`'YYYY-MM-DD'`) and `startTime` (`'HH:mm'`) as strings. All date and time work uses [date-fns](https://date-fns.org/), which runs the same on web and React Native. Pickers return `Date` objects: store them with `format(date, DATE_FORMAT)` or `format(date, TIME_FORMAT)`, and read the strings back with `parse`. The format constants come from `@pet-sitting/shared/date-time`.
- **Import date-fns one function at a time** (`import { format } from 'date-fns/format'`). Metro doesn't tree-shake: a single `import { format } from 'date-fns'` added 215 modules and about 200 KB to the iOS bundle. ESLint blocks the root import.

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
| `bookings`     | `id`, `customerId`, `petId`, `serviceDate`, `startTime`, `endTime`, `timeZone`, `hoursRequested`, `price`, `status`, `createdAt`, `updatedAt` | Times are local `'HH:mm'` in the booking's IANA `timeZone`. `price` is a snapshot of the itemized quote. `status` is `confirmed` or `cancelled`. |

The seed has 3 customers, 2 dogs, 2 cats, 2 pigs and 9 bookings, including:

- **Jordan Rivera's 2 dogs with 3 two-hour bookings on 2026-10-03.** Both dogs are booked 09:00–11:00, then Biscuit again 11:00–13:00, starting the minute he's returned.
- **Miso booked 09:00–17:00 on 2026-10-05**, so another booking for Miso that day has to fit before 09:00 or after 17:00.
- **A cancellation** (Hamlet, 10:00–16:00 on 2026-10-10) that freed the slot for his 12:00–14:00 booking.

## Assumptions

Where the assessment is silent, these are the working assumptions. The data model reflects them.

1. **No double-booking a pet.** A pet can have several bookings on one date, but its confirmed bookings can't overlap: the pet is returned before its next booking starts. Back-to-back is fine (11:00–13:00 can follow 09:00–11:00), with no buffer in between. Only the mock API can check this, because it needs the existing bookings; date-fns `areIntervalsOverlapping` does the comparison.
2. **Service hours are 07:00–21:00** local time. A booking must start and end inside them, so it never runs past midnight, and it starts on the hour or half hour.
3. **Whole hours only**, from 2 to 8.
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
| Unit  | Vitest         | `shared/src/**/*.test.ts`  | The booking form's rules (against a fixed clock), the strict date and time format checks, and the mock database seed (2 of each animal, valid references, no double-booked pets). The pricing engine's tests go here. |
| E2E   | Playwright     | `web/e2e/`                 | Smoke test: tokens reach MUI and Tailwind, a Tailwind class overrides MUI, and React Hook Form runs. The browser's time zone is fixed to `America/New_York`. Booking form and admin page tests go here.     |
| CI    | GitHub Actions | `.github/workflows/ci.yml` | `npm run verify` plus the E2E tests on every push to `main` and every pull request.                                                                                                                        |

The mobile app is checked by the TypeScript typecheck, `npx expo-doctor` and an iOS bundle, and the starter screen has been run in the iOS Simulator.

## Next steps

- [ ] Pricing engine in `shared/`, with unit tests
- [ ] Mock API client in `shared/`: async calls with simulated latency against a copy of the mock database (quote, create booking, list bookings). Creating a booking should re-check the request with `bookingFormSchema`, reject a pet's overlapping bookings, and record `timeZone` from `getDeviceTimeZone()`
- [ ] Finish `useBookingForm`: a debounced live quote, and submit
- [ ] Web: routing, `WebBookingPage` (MUI inputs with `<Controller />`, including date and time pickers) and `WebAdminPage`
- [ ] Mobile: navigation, `MobileBookingScreen` (Paper inputs with `<Controller />`, including date and time pickers) and `MobileAdminScreen`
- [ ] E2E tests for the booking form and admin page
- [ ] Delete the starter page, starter screen and smoke test

## AI usage

The assessment allows AI tools as long as their use is documented. Every prompt is logged verbatim under [Prompts](#prompts), with its use case and what the AI did.

| Tool                                       | What it helped with                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code (desktop app, Claude Opus 5.5) | Researching the role and assessment, the monorepo boilerplate, the shared booking-form logic (React Hook Form, validation, dates and times), and drafting this README. |

**Decisions I made** (from my prompts):

- A monorepo with a `shared/` package, so web and mobile share logic (Prompt 1)
- MUI on web and React Native Paper on mobile, with platform-agnostic design tokens in `shared/` and platform-specific styling in each app (Prompt 1)
- Tailwind on the web app (Prompt 1)
- Front end only: the mock database is a JSON object, with no backend (Prompt 1)
- Account for the same-day booking gotcha, and seed 2 of each animal (Prompt 1)
- React Hook Form for the booking form (Prompt 2)
- Bookings have a start time as well as a date (Prompt 2)

**Corrections I made to AI output:**

- Replaced the AI's hand-written date and time helpers with date-fns (Prompt 3)

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
