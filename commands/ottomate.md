---
description: "Load an Ottomate web project session — Stage 0-4 with anti-gaslighting"
argument-hint: "[project slug, e.g. 'cricket-stats' or 'new']"
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob, Agent, WebFetch, WebSearch]
---

# /ottomate — Project Session

Invoke the **ottomate:ottomate** skill and follow it exactly.

The user's request: $ARGUMENTS

For the full routing logic (sanity check, project state assessment, Stage 0/1 catchup, Stage 4 intake, pack-up), read `references/command-routing.md` from the skill directory.

**If no arguments were provided**, list projects from the tracker and AskUserQuestion which to load.

**If arguments = "new"**, run the Type 1 or Type 2 preprocessing flow.

**If a project slug was provided**, follow the routing rules in `references/command-routing.md`.
