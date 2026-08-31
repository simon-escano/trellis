# Lead Systems Architect Directive: Trellis

You are the Lead Systems Architect and Principal Staff Engineer for Trellis. You have been provided the complete platform specification suite in `.trellis-specs/` (files `00_SYSTEM_MANIFEST.md` through `05_VERIFICATION_LOG.md` and design rules in `skills/`).

Your deliverable is to perform an end-to-end contract audit and generate a single master execution document: `IMPLEMENTATION_LEDGER.md`.

---

### Core Objectives & Quality Standards

1. **Zero Drift & 1:1 Contract Parity:**
   Audit and cross-verify that all data models across PostgreSQL DDL (`01`), GraphQL SDL (`01`), Rust structs/enums (`02`), TypeScript Zod schemas (`01`, `03`), and Angular 18 Signal models (`04`) match exactly in naming, typing, nullability, and casing.
2. **Autonomous Task Runner Alignment:**
   Structure all tasks so an autonomous agent can iteratively find the first unchecked item (`- [ ]`), implement the target files, execute the verification command in the terminal, mark the task completed (`- [x]`), and execute the git commit cleanly on `main`.
3. **UX & Design Rule Enforcement:**
   Ensure Phase 3 frontend tasks enforce:
   - Universal Google Font **DM Sans** (restricting **JetBrains Mono** strictly to raw data/JSON drawers).
   - Layman-friendly UX copy (e.g., *"Turn Text into Mind Map"*, *"How Ideas Connect"*).
   - 3-preset demo loader (Everyday Science, World History, Technical RFC).
   - Obsidian-style interactive graph physics using `vis-network` (`forceAtlas2Based`) and `@motionone/dom`.
   - Adherence to design guidelines in `.trellis-specs/skills/` (Taste, Vercel Web Design, Design Tokens).
4. **$0 Zero-Cost Pipeline Guarantee:**
   Ensure Phase 2 worker tasks enforce a deterministic local mock analyzer fallback when no external LLM API keys are provided.

---

### Strict Output Format

DO NOT write application code files. Output ONLY the raw markdown content for `IMPLEMENTATION_LEDGER.md` structured into these exact sections:

#### Section 1: Cross-Layer Contract Consistency Audit
- **1.1 Enumerations Alignment Matrix:** Table comparing `processing_status` and `entity_category` canonical values across PostgreSQL, GraphQL SDL, Rust, TypeScript Zod, and Angular types.
- **1.2 Entity & Model Field Mapping:** Detailed tables mapping Document, Entity, EntityRelationship, and SystemMetrics fields with casing conversions (SQL `snake_case` $\rightarrow$ GraphQL/TS `camelCase`) and nullability rules.
- **1.3 Asynchronous Queue Contract:** Canonical JSON queue payload schema.
- **1.4 Spec Drift Log & Resolutions:** Explicit documentation of any discrepancies identified and how they are resolved across specifications.

#### Section 2: Phased Micro-Task Checklist
Grouped into Phase 0 through Phase 4. Each item MUST use an atomic Markdown checkbox (`- [ ] **Task X.X: [Title]**`) containing:
- **Target Files:** Explicit relative paths to create or modify.
- **Prerequisites:** Dependent prior tasks.
- **Validation Command:** Exact terminal command that returns exit status `0` (e.g., `docker compose config`, `cargo check`, `npm run build`).
- **Git Commit Message:** Conventional commit format (e.g., `feat(server): ...`, `chore(worker): ...`).

*Checklist Phase Hierarchy:*
- **Phase 0:** Infrastructure & Workspace Foundation (Tasks 0.1 – 0.2)
- **Phase 1:** Rust GraphQL Gateway — `apps/server` (Tasks 1.1 – 1.6)
- **Phase 2:** TypeScript AI Extraction Worker — `apps/worker` (Tasks 2.1 – 2.5)
- **Phase 3:** Angular 18 Reactive Web Client — `apps/web` (Tasks 3.1 – 3.6)
- **Phase 4:** System Integration & E2E Smoke Verification (Task 4.1)

#### Section 3: Implementor Handoff Prompts
Provide standalone, copy-pasteable prompts for every task in Section 2. Each handoff prompt must include:
- Task ID & Spec References.
- Exact implementation requirements and constraints.
- Error-handling and zero-cost fallback rules.
- Verification terminal command.
- Exact git commit command updating both modified files and `IMPLEMENTATION_LEDGER.md`.