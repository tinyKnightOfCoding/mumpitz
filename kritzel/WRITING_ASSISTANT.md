# Story Forge — Project Summary

## Vision

A CLI tool for hobbyist fiction writers (fantasy/sci-fi) that acts as an AI-driven creative collaborator. The human is an **orchestrator** — providing intent, making key decisions, and reacting to AI-generated content. The AI does the heavy lifting: asking questions, generating artifacts, maintaining consistency, and managing the project structure.

---

## Core Concepts

### The Story Bible
A persistent, structured knowledge base derived from the user's ideas. The AI maintains it automatically in the background — the user never fills out a form. It is the source of truth for all consistency checks and generation. Artifacts have a canonicity state: **decided** (human confirmed) or **yolo'd** (AI assumed).

### The Agentic Loop
The core interaction cycle:

1. User drops a seed idea
2. AI generates a first-pass story bible stub
3. AI produces a prioritized question queue based on gaps and ambiguities
4. Each human answer (or yolo skip) triggers a bible update and potentially new questions
5. When sufficient context exists, AI generates prose artifacts (scenes, chapters)
6. Prose generation feeds back into the bible — new details get canonized
7. **Go to step 3** — the loop never truly ends

Each question comes with AI-generated suggestions. In **yolo mode**, the user skips a question and the AI makes a bold assumption and canonizes it, clearly marked as such.

### The Linter & Backlog
A background consistency checking process that runs whenever the bible changes. It checks all artifacts for contradictions, gaps, and conflicts. Findings become **backlog items** — they do not block the creative flow. Each finding includes AI-suggested resolutions. The backlog is a living artifact that accumulates the tension and open questions of the story over time.

---

## File & Folder Structure Convention

```
my-story/                  ← git repo (the whole project)
  bible/
    characters/            ← one markdown file per character
    lore/                  ← world-building, magic systems, history
    arcs/                  ← plot arcs and structure
  chapters/                ← manuscript files
  backlog.md               ← linter findings and open todos
  .index/                  ← gitignored embeddings cache
```

- **Markdown** for human-readable content with YAML frontmatter for structured metadata (status, tags, relationships)
- **JSON/YAML** for structured index data consumed by the AI
- Files should be genuinely readable in an IDE — the file structure is the UI for v1

---

## Tech Stack

| Concern | Choice |
|---|---|
| CLI framework | Commander.js |
| Terminal UI | Ink (React for the terminal) |
| Interactive prompts | Inquirer.js |
| Git integration | simple-git |
| Local vector search | Vectra |
| Embeddings + AI | Anthropic Node SDK (tool use) |
| Language | Node.js / TypeScript |

---

## AI Tool Design

The AI operates via tools rather than receiving the entire bible in context. Core tools:

- `read_bible_file` — load a specific artifact
- `search_bible` — semantic search over all bible content
- `update_bible` — write or update an artifact
- `add_backlog_item` — log a consistency finding or open question

Start with coarse-grained tools and refine based on experience. The tool design is the core engineering challenge.

---

## Git as Infrastructure

The git repo is an implementation detail hidden from the user, but doing a lot of work:

- Every AI interaction that updates the bible results in an automatic commit
- Yolo decisions are tagged distinctly in commit history
- The full history of story decisions is preserved and queryable
- Potential future feature: branching for alternate story directions

---

## Build Order (Recommended)

1. File structure convention and basic CLI scaffolding
2. Bible read/write tools and session loop
3. Interview/question flow with yolo mode
4. Prose generation from bible context
5. Linter and backlog (build once there is real content to check against)
6. Embeddings index and semantic search

---

## Open Questions

- How does the AI decide question priority and order — fixed funnel or idea-driven?
- What triggers the transition from "questioning" to "generating prose"?
- How does a session end — explicit command, inactivity, or AI-decided?
- How is the embeddings index kept in sync efficiently across long projects?