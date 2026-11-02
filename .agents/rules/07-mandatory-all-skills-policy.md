---
trigger: always_on
---

# Mandatory All-Skills Enforcement Policy

## 1. Absolute Policy: All Skills Must Be Inspected & Considered
For EVERY new prompt, request, instruction, task, bug fix, feature, code change, audit, refactoring, documentation update, or implementation task:
**YOU MUST INSPECT, READ, AND CONSIDER EVERY SKILL AVAILABLE IN THE TAPZIO SKILLS LIBRARY (`.agents/skills/`) BEFORE STARTING THE TASK.**

No exceptions:
- Do not skip skills because a task appears simple.
- Do not assume a skill is irrelevant without inspecting it.
- Do not use only the first few skills.
- Do not ignore imported skills.
- Do not start implementation before completing the skill review.
- Do not replace skill instructions with unverified assumptions.

---

## 2. Mandatory Task Startup Procedure
At the beginning of EVERY new task (including follow-up user prompts):
1. **Locate**: Locate the complete `.agents/skills/` directory on disk.
2. **Discover**: Identify every available `SKILL.md` across all skill folders.
3. **Read**: Read the complete contents of every skill in the library.
4. **Inspect**: Inspect relevant supporting references, checklists, and instructions.
5. **Map**: Identify specific requirements from all skills that apply to the current task.
6. **Reconcile**: Identify any overlapping or conflicting instructions across skills.
7. **Synthesize**: Establish the engineering approach using the complete skill library.
8. **Execute**: Only then begin the requested implementation or modifications.

---

## 3. Skills Compliance Checklist
Every task must record a compliance checklist covering all discovered skills:
- Skill name
- File location
- Read status (`READ` / `INACCESSIBLE`)
- Relevant instructions identified
- Applicability to current task (`APPLICABLE` / `NOT APPLICABLE`)
- How applicable guidance will be followed
- Explicit architectural reason if a particular procedure does not apply

---

## 4. Conflict Resolution Hierarchy
If skill instructions conflict:
1. **System & Security Mandates**: High-priority security (RLS, token encryption, DPDP Act privacy, auth boundaries) strictly governs.
2. **Approved Product Requirements**: Tapzio's approved scope in `docs/PRODUCT_REQUIREMENTS.md` (e.g. Phase 2 payments deferral, multi-business support, 4-tier plan matrix).
3. **Permanent Engineering Standards**: Rules in `AGENTS.md` (NPM exclusively, Brand only from config, zero dynamic hot path on `/p/[slug]`, worker decoupling).
4. **Specialist Skill Reconciliation**: Resolve specialized recommendations explicitly and record any trade-offs in `docs/DECISIONS.md`.

---

## 5. Skills Library Integrity
- Never delete existing skills.
- Never rename skills without updating all references.
- Never create duplicate skills.
- Keep all skills discoverable and validate YAML frontmatter in `SKILL.md`.
- Keep `skills-lock.json` and `docs/ANTIGRAVITY_SKILLS_REGISTRY.md` synchronized with physical disk contents.

---

## 6. Final Task Reporting Format
Every response must include a Skills Compliance Summary stating:
- **Total skills discovered**: Number of skills in `.agents/skills/`.
- **Total skills read**: Number of skills read and inspected.
- **Total skills considered**: Number of skills evaluated for relevance.
- **Relevant skills applied**: Specific skills whose guidelines govern the task execution.
- **Inaccessible skills**: Zero (or report any read failures explicitly).
- **Unresolved conflicts**: Zero (or documented resolutions).

