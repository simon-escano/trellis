You are the Lead Systems Architect for Trellis. You have been provided all files in `.trellis-specs/` (00 through 05).

Your mission:
1. Cross-Audit Contracts: Verify that the PostgreSQL types (01), GraphQL SDL (01), Rust models (02), TypeScript Zod schemas (01, 03), and Angular interfaces (04) match 1:1 with zero naming, type, or casing discrepancies.
2. Output a single master tracking file: `IMPLEMENTATION_LEDGER.md`.

DO NOT write application code files. Output ONLY the complete markdown content for `IMPLEMENTATION_LEDGER.md` following this structure:
- Section 1: Contract Consistency Audit (Confirm matching fields or flag mismatches).
- Section 2: Phased Micro-Task Checklist (Grouped by Phase 1 to Phase 4, where each task includes: Target File, Prerequisites, Validation Command, and Exact Git Commit Message).
- Section 3: Implementor Handoff Prompts (Pre-written copy-paste prompts for the coding model for every single step).