# DevRecruit AI Constitution

<!--
Sync Impact Report

- Version change: none → 1.0.0
- Modified principles: (initial ratification) — Principles I–V added
- Added sections: Constraints & Technology Standards; Development Workflow & Quality Gates
- Removed sections: none
 - Templates requiring updates:
 - .specify/templates/plan-template.md ✅ updated
 - .specify/templates/spec-template.md ⚠ pending review
 - .specify/templates/tasks-template.md ⚠ pending review
 - .specify/templates/commands/ (no files present) ⚠ none found
 - Follow-up TODOs:
 - TODO(RATIFICATION_DATE): original adoption date unknown — please fill
 - Confirm maintainers required for amendment approvals (names/roles)
-->

## Core Principles

### I. AI Safety & Deterministic Validation

All AI-generated artifacts (quizzes, questions, sample answers, code snippets) MUST be validated by automated schema checks
and deterministic rules before persistence or production exposure. Validation includes: schema conformance (Zod), profanity
filtering, prompt-injection protections, and explicit sampling/seed practices to reduce nondeterminism in assessments.

Rationale: AI outputs are probabilistic. Requiring deterministic validation prevents malformed or unsafe quiz content from
reaching candidates and enables reliable grading and analytics.

### II. Test-First & Schema Safety (NON-NEGOTIABLE)

New features and changes that affect data shapes, APIs, or AI output formats MUST be accompanied by failing tests that codify
the expected behavior before implementation (red → green workflow). All persisted shapes MUST have Zod schemas and end-to-end
contract tests where applicable.

Rationale: The project relies on structured AI outputs and database contracts; test-first prevents regressions and preserves
consumer expectations (APIs, DB, UI).

### III. Security & Data Isolation

All user data MUST be protected via Row Level Security (RLS) and least-privilege server actions. Interview access MUST use
cryptographically secure tokens. Secrets and service keys MUST never be checked into the repository. Authentication and
authorization checks MUST run server-side for all write/read operations.

Rationale: The platform stores candidate data and assessment artifacts; strong defaults for data protection are required by law
and by customer trust.

### IV. Versioning, Change Management & Backward Compatibility

Public contracts (API request/response, database schemas, persisted quiz formats) MUST follow semantic versioning. Any breaking
change to contracts requires a MAJOR version bump and a migration plan documented in the spec. Minor changes (new optional
fields, non-breaking additions) increment MINOR. Clarifications and wording fixes are PATCH.

Rationale: Clear versioning prevents silent breakage for integrators and enables safe rollouts and migrations.

### V. Accessibility, UX Consistency & Design Tokens

Application UI MUST be accessible and theme-aware. Design tokens and color variables used in CSS files MUST be specified in
OKLCH format (see project styling guidelines). Tailwind utilities (v4) and Radix primitives MUST be used for consistent
component behavior and accessibility.

Rationale: Accessibility and consistent design prevent discrimination, improve usability, and lower maintenance cost.

## Constraints & Technology Standards

This project is opinionated about its stack and low-level rules. Conformance to these standards is REQUIRED unless a
documented exception is approved by maintainers.

- Frontend: Next.js (App Router) with React and TypeScript — prefer server components and server actions where appropriate.
- Styling: Tailwind CSS v4.x utility classes for layout; all color values in CSS files MUST use OKLCH form (e.g., oklch(0.7 0.1 200)). Use Tailwind classes in TSX for convenience but keep CSS tokens in OKLCH.
- Forms & Validation: React Hook Form + Zod for validation and resolver-based form handling.
- AI Integration: Use Groq/`@ai-sdk/groq` and the local AI service wrappers in `lib/services/ai-service.ts`. All AI calls MUST include input sanitization and schema validation of the response.
- Backend: Supabase for database and auth; enforce RLS for all user data.
- Logging & Observability: Structured logs and basic metrics around AI generation latency, failure rate, and token usage.

## Development Workflow & Quality Gates

- Pull Requests: All changes MUST be in a named feature branch and include an associated spec or task when the change is more than trivial.
- Reviews: At least one approving review from a maintainer is REQUIRED for non-trivial changes. Security and schema changes REQUIRE an additional reviewer with DB/infra knowledge.
- CI: Every PR MUST pass lint, typecheck, and the test suite. The repository's quality gates are: Build: PASS, Lint/Typecheck: PASS, Tests: PASS (happy path + at least one edge case for changed behavior).
- Release: Tag releases that change public contracts with semantic versions and include migration notes in the release body.

## Governance

Amendments: Any amendment to this constitution is proposed as a documentation PR that links to a migration plan (if required)
and a spec that explains the need and impact. Approval requires two maintainers or one maintainer + one security/infra owner.

Versioning Rules:

- MAJOR: Backwards incompatible governance change or principle removal/redefinition.
- MINOR: Addition of a principle or material expansion of guidance.
- PATCH: Clarifications, typos, non-substantive language changes.

Compliance Review: Every quarter the maintainers will run a lightweight compliance audit. The `Constitution Check` step in the
project plan (see `.specify/templates/plan-template.md`) MUST be completed before major milestones.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): fill with original adoption date | **Last Amended**: 2025-10-29
