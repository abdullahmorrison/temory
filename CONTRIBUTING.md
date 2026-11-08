# Contributing

Thanks for your interest in Personal CRM. Bug reports, ideas, and code are all welcome.

## Reporting bugs

Search the [existing issues](https://github.com/abdullahmorrison/personal-crm/issues) first. If it's new, open an issue with:

- what you did
- what you expected
- what happened instead
- your device and browser, if it's a display problem

Screenshots help.

## Suggesting features

Open an issue describing the problem you want solved, not just the solution. Saying how you'd use it helps decide whether it fits the app.

Issue titles follow the same [Conventional Commits](https://www.conventionalcommits.org) style as commits, e.g. `feat(people): add a graph view of who knows whom`. The issue forms prefill the type.

## Making changes

Keep each change focused on one thing. Before committing, run the checks:

    npm run lint
    npm run typecheck
    npm test

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org):

    <type>(<optional scope>): <summary>

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Add `!` after the type for a breaking change.

Examples:

    feat(journal): suggest names while typing a mention
    fix: keep solo moments in the journal feed
    docs: explain closeness tiers

## Getting help

Open an issue with your question.
