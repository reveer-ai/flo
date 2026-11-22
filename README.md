# flo

flo will handle the entire workflow for developing agentic software.

It's early: flo ships one skill, `flo-review`, which has your coding assistant get a fresh agent to review its work before handing it to you.

## Install the skills

You need Node 22 or later. In your project's root, run:

```bash
npx flo-ai init
```

It copies flo's skills into `.agents/skills/`, where Codex and OpenCode find them. If your project has a `.claude/skills/` folder, it also links each skill there for Claude Code. It never creates `.claude/skills/` itself.

Run it again to update the skills to the latest flo. It replaces flo's skills with fresh copies, so don't edit them: put project-specific instructions in your own `AGENTS.md` or `CLAUDE.md` instead. Other skills in those folders are left alone.

## Other commands

```bash
npx flo-ai --version
```

```bash
npx flo-ai --help
```

The package is **`flo-ai`**, and the command it installs is `flo`. The npm package named `flo` is unrelated, so `npx flo` won't run this.

## License

MIT
