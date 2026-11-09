<h1><img src="docs/logo.svg" alt="" height="40" align="absmiddle"> Temory</h1>

[![Project Status: WIP](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)
[![CI](https://github.com/abdullahmorrison/personal-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/abdullahmorrison/personal-crm/actions/workflows/ci.yml)

A journal for the people in your life. Log notable moments with friends and family, see everyone you know grouped by how close you are, and look back on how each relationship has grown.

## Why

Most CRMs are built for sales: contacts, deals, follow-up reminders. This one is for your own relationships. The goal is to be intentional about them: notice who you're close to, who you're drifting from, and what each person brings to your life. The history of moments you build up along the way is a bonus.

## Getting started

Requires [Node.js](https://nodejs.org) 22 or later.

```sh
git clone https://github.com/abdullahmorrison/personal-crm.git
cd personal-crm
npm install
npm run dev
```

Then open http://localhost:3000.

### Forgotten passwords

There's no reset by email yet. On the server, set a new one from the command line; it also signs that account out everywhere:

```sh
node scripts/reset-password.mts someone@example.com
```

In the Docker image, run it with `docker exec -it <container> node scripts/reset-password.mts someone@example.com`.

## Support

Found a bug or have a question? [Open an issue](https://github.com/abdullahmorrison/personal-crm/issues).

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to report bugs, suggest features, and write commits.
