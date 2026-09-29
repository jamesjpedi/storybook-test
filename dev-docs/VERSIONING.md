# Versioning, releases, and promotion

This design system follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html), [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Azure Boards work-item linking (`AB#12345`).

Do **not** edit `package.json` `"version"` by hand or create `v*` tags by hand. Use `npm run release`. Azure Pipelines enforces the same promotion flow and publishes `v*` tags to Azure Artifacts.

**`development` is never versioned.** Do not run `npm run release` there and do not merge `development` into `qa` or `master`.

## Promotion flow

```text
feature / bugfix / …
        ↓ PR
   development          ← no package version changes
        ↓ cherry-pick onto a branch created from qa
   qa/<slug>            ← merge this branch only to qa
        ↓ PR
        qa              ← npm run release → 1.0.0-qa.N
        ↓ cherry-pick onto a branch created from master
   release:<slug>       ← npm run release → 1.0.0-<slug>.N; merge only to master
        ↓ PR
      master            ← npm run release → 1.0.0
```

| Branch           | Package version     | Git tag                 | How it is created                                                                                              |
| ---------------- | ------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `development`    | unchanged           | none                    | Feature PRs only. No `npm run release`.                                                                        |
| `qa/<slug>`      | inherited from `qa` | none until merged to qa | `git checkout qa && git switch -c qa/<slug>`, then cherry-pick from `development`. Merge **only** to `qa`.     |
| `qa`             | `1.0.0-qa.N`        | `v1.0.0-qa.N`           | After the cherry-pick PR lands, run `npm run release`.                                                         |
| `release:<slug>` | `1.0.0-<slug>.N`    | `v1.0.0-<slug>.N`       | `git checkout master && git switch -c release:<slug>`, then cherry-pick from `qa`. Merge **only** to `master`. |
| `master`         | `1.0.0`             | `v1.0.0`                | After the release PR lands, run `npm run release`.                                                             |

`release/<slug>` is accepted as well as `release:<slug>`. `qa:<slug>` is accepted as well as `qa/<slug>`. The slug must start with a letter and use only letters, digits, and hyphens (`sprint-12`, `some-test-or-version`).

`main` is treated as an alias of `master`.

Skipping a lane is rejected:

- `development` cannot merge to `qa` or `master`
- `qa` cannot merge to `master`
- Feature branches cannot merge to `qa` or `master`
- `qa/<slug>` cannot merge to `development` or `master`
- `release:<slug>` cannot merge to `development` or `qa`

## Version rules

- **MAJOR** — `BREAKING CHANGE:` footer or `feat!:` / `fix!:` (public API incompatible change)
- **MINOR** — `feat:` (compatible addition)
- **PATCH** — `fix:`, `perf:`, or other releasable changes when there is no `feat` / breaking change

On `qa`:

- First cut: `npm run release` infers MAJOR/MINOR/PATCH from commits since the last **production** tag, then writes `X.Y.Z-qa.1`
- Further cuts on the same core: `X.Y.Z-qa.2`, `.3`, …
- To start at a specific core (typical for the first public `1.0.0`): `npm run release -- --release-as 1.0.0`

On `release:<slug>` (same prerelease rules as `qa`):

- After cherry-picking `qa`, `1.0.0-qa.N` → `1.0.0-<slug>.1`
- Further cuts on that branch: `1.0.0-<slug>.2`, …
- Run `npm run release` on this branch **before** opening the PR to `master`

On `master`:

- `1.0.0-<slug>.N` → `1.0.0` (prerelease identifiers stripped)

`0.0.0` means “never released”. The first qa cut without `--release-as` follows SemVer from `0.0.0` (a `feat` becomes `0.1.0-qa.1`).

## Commands

| Script                         | What it does                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `npm run release`              | Bump `package.json`, write changelog files, commit `chore(release): <version>`, annotated `v*` tag |
| `npm run release -- --dry-run` | Print the next version and changelog; write nothing                                                |
| `npm run release -- --push`    | Same as `release`, then `git push --follow-tags`                                                   |
| `npm run version:check`        | Confirm the current branch’s version and promotion path are legal                                  |
| `npm run version:check:ci`     | Same rules using Azure DevOps PR/branch/tag env vars                                               |
| `npm run test:versioning`      | Unit tests for bump, flow, changelog, Azure Boards linking, and CI checks                          |

The working tree must be clean. Run `npm run release` from `qa`, a `release:<slug>` branch, or `master` only — never from `development`.

After a local release without `--push`:

```bash
git push --follow-tags
```

## Changelog

Each release:

1. Prepends a Keep a Changelog section to [`CHANGELOG.md`](../CHANGELOG.md)
2. Writes `src/docs/changelog/versions/<version>.md` for the Storybook Changelog page

Every user-facing line includes:

- The Conventional Commit subject
- Azure Boards ids as `AB#12345` with a link to the work item
- The commit **author name**

A **Contributors** section lists unique authors for that version.

Story links use:

1. `AZURE_DEVOPS_STORY_URL` if set (placeholders `{organization}` / `{org}`, `{project}`, `{id}`)
2. Otherwise org/project inferred from `origin` (`dev.azure.com` or `*.visualstudio.com`)
3. Otherwise `AZURE_DEVOPS_ORG` and `AZURE_DEVOPS_PROJECT`

If none of those are available, `AB#12345` is still written, without a URL, and the command prints a warning.

## Git commits

Commitlint extends Conventional Commits and requires an Azure Boards id on user-facing types.

```text
feat: add outlined Button

AB#12345
```

```text
fix: restore Data Grid keyboard focus

AB#12346
```

| Type                                            | Story id (`AB#12345`) | Appears in changelog |
| ----------------------------------------------- | --------------------- | -------------------- |
| `feat`, `fix`, `perf`, `refactor`               | **Required**          | Yes                  |
| `docs`, `style`, `test`, `build`, `ci`, `chore` | Optional              | No                   |
| `chore(release): 1.0.0-qa.1`                    | Generated; skipped    | No                   |

Put `AB#12345` in the **body or footer** so the header stays within 100 characters.

Azure DevOps squash/merge PR titles must also be Conventional Commits with `AB#` when the type is `feat` / `fix` / `perf` / `refactor`.

## Branch and push checks

Husky `pre-push` and Azure Pipelines `check-flow --ci` enforce:

| Push                             | Allowed?                    |
| -------------------------------- | --------------------------- |
| working branch → `development`   | Yes                         |
| `qa/<slug>` → `qa`               | Yes                         |
| `release:<slug>` → `master`      | Yes                         |
| `development` → `qa`             | **No**                      |
| `qa` → `master`                  | **No**                      |
| working branch → `qa` / `master` | **No**                      |
| `qa/<slug>` → `master`           | **No**                      |
| `release:<slug>` → `qa`          | **No**                      |
| `master` → `development`         | Yes (sync after production) |

`qa/<slug>` must be created from `qa`. `release:<slug>` must be created from `master` (checked with `git merge-base --is-ancestor` when those refs exist).

Tags must be `vX.Y.Z`, `vX.Y.Z-qa.N`, or `vX.Y.Z-<release-slug>.N`.

## Daily workflow

1. Branch from **latest `development`**. Commit with Conventional Commits and `AB#` ids. PR into **`development` only**.
2. To ship to QA:
   ```bash
   git fetch origin
   git switch qa
   git pull
   git switch -c qa/sprint-12
   git cherry-pick <commits-from-development>
   git push -u origin qa/sprint-12
   ```
   Open a PR **into `qa` only**. After merge, on `qa`: `npm run release` (optionally `--release-as 1.0.0` the first time).
3. To ship to production:
   ```bash
   git fetch origin
   git switch master
   git pull
   git switch -c release:sprint-12
   git cherry-pick <commits-from-qa>
   npm run release
   git push -u origin release:sprint-12 --follow-tags
   ```
   Open a PR **into `master` only**. After merge, on `master`: `npm run release`.

Hotfixes follow the same path. Do not commit directly to `master` or merge `qa` into `master`.

## Azure DevOps

[azure-pipelines.yml](../azure-pipelines.yml) runs the same promotion rules as the local hooks:

| Trigger                                                      | What runs                                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| PRs into `development`, `qa`, `master` / `main`              | Commitlint, `check-flow --ci` (source → target), versioning tests, library + Storybook builds |
| Pushes to `development`, `qa`, `qa/*`, `release/*`, `master` | `check-flow --ci`, versioning tests, builds                                                   |
| `v*` tags from `npm run release`                             | Same checks, plus publish to Azure Artifacts with dist-tag `qa`, `<slug>`, or `latest`        |

`check-flow --ci` uses `SYSTEM_PULLREQUEST_SOURCEBRANCH` / `SYSTEM_PULLREQUEST_TARGETBRANCH` on PRs and `BUILD_SOURCEBRANCH` on branch and tag builds. Direct `development` → `qa` or `qa` → `master` PRs fail. Tag builds fail if the tag is not `v` + `package.json` version.

Recommended **branch policies** (repo settings, not this YAML):

| Branch        | PRs required | Allowed source of the PR        |
| ------------- | ------------ | ------------------------------- |
| `development` | Yes          | Working branches                |
| `qa`          | Yes          | `qa/<slug>` or `qa:<slug>` only |
| `master`      | Yes          | `release:<slug>` only           |

## Troubleshooting

| Error                                                             | What to do                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Do not cut versions on development`                              | Branch from `qa`, cherry-pick, merge to `qa`, then `npm run release` on `qa`.           |
| `Production releases must start from a release:<slug> prerelease` | Cut `1.0.0-<slug>.N` on the release branch before merging to `master`.                  |
| `must be created from qa` / `must be created from master`         | Recreate the branch from the correct base, then cherry-pick.                            |
| `feat/fix/... must include an Azure Boards id`                    | Add `AB#12345` to the commit body.                                                      |
| `Refusing to push … → …`                                          | Use `qa/<slug>` → `qa` and `release:<slug>` → `master` only.                            |
| `Tag v… does not match package.json`                              | Create tags with `npm run release`, not by hand.                                        |
| `Tag v… already exists`                                           | Fetch tags (`git fetch --tags`) or increment by running release only after new commits. |
| Story ids have no links                                           | Set `AZURE_DEVOPS_ORG` and `AZURE_DEVOPS_PROJECT`, or point `origin` at Azure DevOps.   |
