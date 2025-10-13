## Security guidance for PlumbingPOC

This file documents a few practical steps and guidelines to protect secrets and reduce the risk of leaking API keys (OpenAI, Gemini, Twilio, Resend, etc.).

1) .env handling (local only)

- Keep sensitive keys out of the repository. The repository's `.gitignore` already contains `.env*` and `!.env.example` so example files are tracked but real secrets are not.
- Never commit real `.env` files. Use environment variables in CI and deployment platforms (Netlify, Vercel, etc.) or a secrets manager.

2) If you accidentally committed a secret

- Rotate the secret immediately in the provider console (OpenAI, Gemini, Twilio, Resend). Treat the key as compromised.
- Remove the secret from the repo in a non-destructive way:

  ```bash
  # remove file from index but keep locally
  git rm --cached .env
  git commit -m "chore: remove .env from repo"
  git push
  ```

- If the secret was included in past commits, consider a history purge (e.g. `git filter-repo`) and coordinate with your team. See the note below for suggested commands.

3) Quick commands to locate possible leaked keys in history

```bash
# Search for literal occurrences of common secret names
git log -S 'OPENAI_API_KEY' --source --all
git grep -n "OPENAI_API_KEY" $(git rev-list --all)
``` 

If you find evidence of a leaked key in history, rotate the key before rewriting history. Rewriting history is disruptive; preferred flow is rotation + removal from tip (see above). If you must rewrite history, `git filter-repo` is recommended over `filter-branch`.

4) Pre-commit hooks and developer setup

- This repo includes a versioned Git hook in `.githooks/pre-commit` that blocks commits that attempt to add or modify `.env*` files. To enable it locally, run:

```bash
bash scripts/setup-git-hooks.sh
```

- The setup script sets your `core.hooksPath` to `.githooks` so the hook will run automatically for commits.

5) CI and real-AI tests

- By default, tests should not use real AI provider keys. Gate real-AI integration tests behind an environment variable such as `RUN_REAL_AI=true`. CI should not set this variable unless explicitly configured.

6) Rotating an OpenAI key (example)

1. Go to https://platform.openai.com/account/api-keys
2. Revoke the old key and create a new one
3. Update your deployment environment variables (Netlify / Vercel / CI secret store)
4. Remove any local `.env` copies or move them to a secure vault

7) If you need help

If you'd like, I can help: 1) scan Git history for secrets, 2) prepare a safe `git filter-repo` script, and 3) add a GitHub Actions secret-rotation reminder. Ask me to proceed and I'll prepare the changes.

---

Appendix: example commands for history rewrite (use only after rotation and team coordination):

```bash
# Install git-filter-repo if needed, then:
# WARNING: this rewrites history. Coordinate with all collaborators.
git clone --mirror <repo-url> repo.git
cd repo.git
git filter-repo --invert-paths --path .env
git push --force
```
