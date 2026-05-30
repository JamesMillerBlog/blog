# Security Skill

## Automated Scanning

Continuous security monitoring via GitHub workflows:
- **`codeql.yml`** — JavaScript/TypeScript static analysis (push to main, PRs)
- **`pr-security.yml`** — Dependency audit + secret scanning on all PRs
- **`security-audit.yml`** — Weekly comprehensive audit (semgrep SAST, trivy containers/IaC, zizmor GitHub Actions). Auto-triggers `ai-implement` issues for fixes.
- **`security-scorecard.yml`** — OSSF supply chain scorecard

See `docs/SECURITY_AUDIT.md` for structural concerns beyond automated scanning (AI prompt injection, MDX RCE, etc.).

## Manual Review Scope

When reviewing PRs or code in Claude/pi:
- **Code:** injection, XSS, auth flaws, input validation
- **Deps:** CVEs, supply chain risks (automated via pnpm audit)
- **Config:** env var exposure, API key handling, CORS, security headers
- **Git hooks:** prompt injection via `$DIFF` piped to LLM — staged content is developer-controlled and can contain adversarial text that manipulates Claude behavior even with `--allowedTools` restrictions

## Severity
| Level | Action |
|-------|--------|
| **Critical** | Immediate — RCE, auth bypass, data exposure |
| **High** | Fix soon — injection, XSS, CSRF |
| **Medium** | Next sprint — outdated deps, missing headers |
| **Low** | Best practice deviations |

## Output
```
## Security Audit Report
### Critical / High / Medium / Low
- [Issue] — Location — Fix
```
