# CLAUDE.md

Project-local Claude skills are installed under `.claude/skills/`.

## Design Skills

- Use `.claude/skills/frontend-design` for production frontend pages, UI components, React/Vue/HTML layouts, visual polish, typography, color systems, motion, and anti-generic design direction.
- Use `.claude/skills/claude-design` for broader high-fidelity design artifacts: landing pages, prototypes, decks, posters, visual explorations, brand-driven HTML artifacts, and multiple style directions.
- Use `.claude/skills/landing-page-design` for conversion-focused landing pages: hero structure, CTA hierarchy, above-the-fold messaging, social proof, mobile reading flow, and CRO checks.
- Use `.claude/skills/awwwards-landing-page` only when the user explicitly wants an elaborate animated landing-page template or Awwwards-style direction.

## Local Safety

- Do not run template setup commands from `awwwards-landing-page` directly in the repository root unless the user explicitly asks for that exact operation.
- If using that template, prefer a new subdirectory or a temporary working directory first, then port the useful parts into the existing app.
- Do not remove `.git`, overwrite project structure, or clone into `.` without explicit user approval.

## Suggested Workflow

1. For any landing page request, load `frontend-design` plus `landing-page-design`.
2. For broad or ambiguous creative direction, also load `claude-design` and present distinct visual directions before implementation.
3. For elaborate animated pages, review `awwwards-landing-page` as a reference, then adapt safely to the current project stack.
