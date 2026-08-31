## 1. Cleanup workflow

- [ ] 1.1 Add a scheduled (weekly cron) + `workflow_dispatch`-triggerable cleanup workflow for `finops-backend` and `finops-frontend`
- [ ] 1.2 Delete untagged image versions unconditionally
- [ ] 1.3 Keep only the most recent N (default 20) commit-SHA-tagged images per package
- [ ] 1.4 Always exclude semver release tags and `latest` from deletion
- [ ] 1.5 Scope the workflow's token to `packages: write` only, and log deleted/kept versions in the run output

## 2. Documentation

- [ ] 2.1 Document the retention policy and rationale in the README
