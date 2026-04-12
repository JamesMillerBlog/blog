# Security Skill

Cross-tool skill for security auditing and vulnerability review.

## Review Scope

### Code Security
- SQL/NoSQL injection vulnerabilities
- XSS (Cross-Site Scripting)
- Authentication and authorisation flaws
- Input validation gaps
- Secure coding patterns

### Dependencies
- Known CVEs: `pnpm audit`
- Outdated packages with security patches
- Supply chain risks

### Configuration
- Environment variable exposure
- API key handling
- CORS policies
- Security headers

## Severity Levels

| Level | Meaning |
|-------|---------|
| **Critical** | Immediate action — RCE, auth bypass, data exposure |
| **High** | Fix soon — injection, XSS, CSRF |
| **Medium** | Next sprint — outdated deps, missing headers |
| **Low** | Consider — best practice deviations |

## Workflow

1. Scan dependencies: `pnpm audit`
2. Review code for common vulnerability patterns
3. Check security-related configurations
4. Report findings with severity and fix recommendation

## Output Format

```
## Security Audit Report

### Critical
- [Issue] — Location — Fix

### High
...

### Medium
...

### Low
...
```

## Best Practices Checklist

- [ ] Input validation on all user-supplied data
- [ ] Parameterised queries (no string concatenation)
- [ ] Output encoding to prevent XSS
- [ ] No stack traces exposed in production errors
- [ ] HTTPS only for sensitive operations
- [ ] Environment variables for secrets (not hardcoded)
- [ ] `pnpm audit` passing
