# 04_STEP_ANGULAR_UI.md — Phase 3: Angular 18 Standalone Dashboard

## 1. Objective & Deliverables
Implement a Single-Page Application in `apps/web` using **Angular 18** (Standalone Components), **Apollo Angular**, **Tailwind CSS**, and **Angular Signals**. The dashboard features an obsidian dark theme, the Google Font **DM Sans**, micro-animations via `@motionone/dom`, a fast document ingestion drawer, real-time processing status tracking, and an interactive knowledge graph entity inspector.

---

## 2. Directory Structure (`apps/web`)

```text
apps/web/
├── package.json
├── angular.json
├── tailwind.config.js
├── src/
    ├── index.html                     # Loads 'DM Sans' and 'JetBrains Mono'
    ├── styles.css                     # Tailwind directives, custom scrollbars, dark base
    ├── main.ts                        # Application bootstrap & Apollo Client provider
    ├── app/
        ├── app.config.ts              # Application providers & GraphQL URI config
        ├── app.component.ts           # Root layout shell with navbar & split panels
        ├── core/
        │   ├── models/
        │   │   └── document.model.ts  # TypeScript types matching GraphQL SDL
        │   ├── services/
        │   │   ├── graphql.service.ts # Apollo queries & mutations
        │   │   └── state.service.ts   # Angular Signals global state manager
        │   └── animation/
        │       └── motion.utils.ts    # @motionone/dom spring & fade helpers
        └── components/
            ├── navbar/                # Brand, system metrics pill, and quick trigger
            ├── ingest-modal/          # Paste/upload RFC form with client validation
            ├── document-list/         # Left rail list with reactive status badges
            ├── document-viewer/       # Center panel: summary, metadata, raw content
            ├── entity-inspector/      # Right rail: categorized entity tags & confidence
            └── relationship-graph/    # Interactive directional connection cards

```

---

## 3. Dependency Manifest (`package.json`)

```json
{
  "name": "trellis-web",
  "version": "0.1.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/compiler": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/platform-browser": "^18.0.0",
    "@angular/platform-browser-dynamic": "^18.0.0",
    "@angular/router": "^18.0.0",
    "@apollo/client": "^3.10.4",
    "@motionone/dom": "^10.16.2",
    "apollo-angular": "^6.0.0",
    "graphql": "^16.8.1",
    "graphql-tag": "^2.12.6",
    "lucide-angular": "^0.395.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.3"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^18.0.0",
    "@angular/cli": "^18.0.0",
    "@angular/compiler-cli": "^18.0.0",
    "@types/node": "^18.18.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "~5.4.2"
  }
}

```

---

## 4. Implementation Steps

### Step 4.1: Fonts, Tailwind, & Base Theme

1. In `src/index.html`, load `DM Sans` (weights 400, 500, 700) and `JetBrains Mono` from Google Fonts.
2. In `tailwind.config.js`, configure font families and the dark color palette:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        trellis: {
          950: '#070A0F',
          900: '#0D1420',
          850: '#111A29',
          800: '#1E293B',
          700: '#334155',
          accent: '#00E599',
          cyan: '#38BDF8',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      }
    },
  },
  plugins: [],
}

```



### Step 4.2: Apollo GraphQL Setup (`src/app/app.config.ts`)

1. Provide `Apollo` client targeting `http://localhost:8080/graphql` with `InMemoryCache`.
2. Configure polling policies for smooth optimistic updates.

### Step 4.3: Reactive Signals State Manager (`src/app/core/services/state.service.ts`)

1. Define reactive signals:
* `documents = signal<Document[]>([])`
* `selectedDocumentId = signal<string | null>(null)`
* `metrics = signal<SystemMetrics>({ total: 0, processed: 0, queued: 0, failed: 0 })`
* `isLoading = signal<boolean>(false)`


2. Define computed signal:
* `activeDocument = computed(() => this.documents().find(d => d.id === this.selectedDocumentId()))`


3. Expose action methods: `loadDocuments()`, `selectDocument(id: string)`, and `triggerIngestion(title, content)`.

### Step 4.4: Component Implementation

1. **Navbar & System Status (`navbar.component.ts`):** Displays brand typography, live system metric pills (Total / Queued / Ready), and the `+ Ingest Spec` action trigger.
2. **Document Ingest Modal (`ingest-modal.component.ts`):** A sleek glassmorphic modal with a textarea for raw specs, quick sample insertion ("Insert Demo Architecture Spec"), and validation error states.
3. **Document Left Rail (`document-list.component.ts`):**
* Interactive list showing document titles, relative timestamps, and status badges.
* `QUEUED` $\rightarrow$ Amber pulse badge; `PROCESSING` $\rightarrow$ Blue animated spinner; `COMPLETED` $\rightarrow$ Green badge.


4. **Detail Workspace (`document-viewer.component.ts`):**
* High-contrast markdown summary block with clear headings.
* Collapsible drawer for raw input spec text.


5. **Knowledge Graph & Inspector (`entity-inspector.component.ts` & `relationship-graph.component.ts`):**
* Filterable chips categorized by `SERVICE`, `SYSTEM`, `DATA_MODEL`, `INFRASTRUCTURE`.
* Directional relationship flow cards: `[Source Service] ──( RELATION )──► [Target Service]`.



### Step 4.5: Micro-Animations (`src/app/core/animation/motion.utils.ts`)

1. Wrap `@motionone/dom` functions to apply spring entrance animations when selecting documents:
```typescript
import { animate, spring } from "@motionone/dom";

export function animateCardEntry(selector: string) {
  animate(
    selector,
    { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] },
    { duration: 0.35, easing: spring({ stiffness: 300, damping: 20 }) }
  );
}

```



---

## 5. Verification & Smoke Test Checklist

Execute these terminal commands to verify Phase 3:

```bash
# 1. Start Angular dev server
cd apps/web
npm start

# 2. Open browser at http://localhost:4200
# 3. Verify UI checks:
# - Typography renders with Google Font 'DM Sans'.
# - Documents list fetches data from Rust server (localhost:8080/graphql).
# - Clicking "+ Ingest Spec" opens modal, submits mutation, and adds pending document to sidebar.
# - Selecting a completed document reveals executive summary and animated entity/relationship cards.

```

---

## 6. Git Commit Checkpoints

Execute these commits locally in sequence during Phase 3:

1. `chore(web): scaffold angular 18 standalone project with tailwind and dm sans`
2. `feat(web): configure apollo graphql client and reactive signals state service`
3. `feat(web): build glassmorphic layout, document sidebar, and status badges`
4. `feat(web): implement document viewer, entity inspector, and motion animations`