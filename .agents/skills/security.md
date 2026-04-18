# Security Skill

## Review Scope
- **Code:** injection, XSS, auth flaws, input validation
- **Deps:** `pnpm audit` for CVEs, supply chain risks
- **Config:** env var exposure, API key handling, CORS, security headers

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
