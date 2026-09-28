# Versioning, releases, and promotion

This design system follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html), [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Azure Boards work-item linking (`AB#12345`).

Do **not** edit `package.json` `"version"` by hand or create `v*` tags by hand. Use `npm run release`. Azure Pipelines enforces the same promotion flow and publishes `v*` tags to Azure Artifacts.

## Promotion flow

Work moves in one direction:

```text
feature / bugfix / …  →  development  →  qa  →  master
```

| Branch        | Package version       | Git tag                | When to cut it                        |
| ------------- | --------------------- | ---------------------- | ------------------------------------- |
| `development` | `1.0.0-development.N` | `v1.0.0-development.N` | After merging work into `development` |
| `qa`          | `1.0.0-qa.N`          | `v1.0.0-qa.N`          | After promoting `development` → `qa`  |
| `master`      | `1.0.0`               | `v1.0.0`               | After promoting `qa` → `master`       |

`main` is treated as an alias of `master` so existing clones keep working. New production work uses `master`.

Skipping a lane is rejected:

- `development` cannot be released or pushed as production (`master` / `main`)
- `qa` cannot be cut from a stable or `development`-skipped version
- Feature branches cannot be pushed to `qa` or `master`

After a production release, merge `master` back into `development` (and `qa` if it must stay aligned) so the next cycle starts from `1.0.0`.

## Version rules

- **MAJOR** — `BREAKING CHANGE:` footer or `feat!:` / `fix!:` (public API incompatible change)
- **MINOR** — `feat:` (compatible addition)
- **PATCH** — `fix:`, `perf:`, or other releasable changes when there is no `feat` / breaking change

On `development`:

- First cut of a new core version: `npm run release` infers MAJOR/MINOR/PATCH from commits since the last **production** tag, then writes `X.Y.Z-development.1`
- Further cuts on the same core: `X.Y.Z-development.2`, `.3`, …
- To start at a specific core (typical for the first public `1.0.0`): `npm run release -- --release-as 1.0.0`

On `qa`:

- First promote of that core: `1.0.0-development.N` → `1.0.0-qa.1`
- Further QA builds of the same core: `1.0.0-qa.2`, …

On `master`:

- `1.0.0-qa.N` → `1.0.0` (prerelease identifiers stripped)

`0.0.0` means “never released”. The first development cut without `--release-as` follows SemVer from `0.0.0` (a `feat` becomes `0.1.0-development.1`).

## Commands

| Script                         | What it does                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `npm run release`              | Bump `package.json`, write changelog files, commit `chore(release): <version>`, annotated `v*` tag |
| `npm run release -- --dry-run` | Print the next version and changelog; write nothing                                                |
| `npm run release -- --push`    | Same as `release`, then `git push --follow-tags`                                                   |
| `npm run version:check`        | Confirm the current branch’s version is legal for that lane                                        |
| `npm run version:check:ci`     | Same rules using Azure DevOps PR/branch/tag env vars                                               |
| `npm run test:versioning`      | Unit tests for bump, flow, changelog, Azure Boards linking, and CI checks                          |

The working tree must be clean. Run from `development`, `qa`, or `master` only.

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
| `chore(release): 1.0.0-development.1`           | Generated; skipped    | No                   |

Put `AB#12345` in the **body or footer** so the header stays within 100 characters.

Azure DevOps squash/merge PR titles must also be Conventional Commits with `AB#` when the type is `feat` / `fix` / `perf` / `refactor`.

## Branch and push checks

Husky `pre-push` runs `scripts/versioning/check-flow.mjs --pre-push`.

| Push                              | Allowed?                    |
| --------------------------------- | --------------------------- |
| working branch → `development`    | Yes                         |
| `development` → `qa`              | Yes                         |
| `qa` → `master`                   | Yes                         |
| working branch → `qa` or `master` | **No**                      |
| `development` → `master`          | **No**                      |
| `master` → `development`          | Yes (sync after production) |

Tags that are not `vX.Y.Z`, `vX.Y.Z-development.N`, or `vX.Y.Z-qa.N` are rejected.

While a promotion PR is still open, `package.json` may still show the **previous** channel (for example `1.0.0-development.4` on `qa` until `npm run release` is run on `qa`). That pending state is allowed; skipping a channel is not.

Recommended working-branch names (not required by the hook): `feature/12345-short-description`, `bugfix/12345-short-description`.

## Daily workflow

1. Branch from **latest `development`**.
2. Commit with Conventional Commits and `AB#` ids.
3. Open a PR into **`development` only**.
4. On `development`: `npm run release` (optionally `--release-as 1.0.0` the first time).
5. Open a PR `development` → **`qa`**.
6. On `qa`: `npm run release`.
7. Open a PR `qa` → **`master`**.
8. On `master`: `npm run release`.
9. Merge `master` back to `development`.

Hotfixes follow the same path. Do not commit directly to `master` to skip QA.

## Azure DevOps

[azure-pipelines.yml](../azure-pipelines.yml) runs the same promotion rules as the local hooks:

| Trigger                                          | What runs                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| PRs into `development`, `qa`, `master` / `main`  | Commitlint, `check-flow --ci` (source → target), versioning tests, library + Storybook builds |
| Pushes to `development`, `qa`, `master` / `main` | `check-flow --ci` (branch vs `package.json`), versioning tests, builds                        |
| `v*` tags from `npm run release`                 | Same checks, plus publish to Azure Artifacts with dist-tag `development`, `qa`, or `latest`   |

`check-flow --ci` uses `SYSTEM_PULLREQUEST_SOURCEBRANCH` / `SYSTEM_PULLREQUEST_TARGETBRANCH` on PRs and `BUILD_SOURCEBRANCH` on branch and tag builds. Skip-lane PRs (`development` → `master`, feature → `qa`) fail. Tag builds fail if the tag is not `v` + `package.json` version.

Recommended **branch policies** (repo settings, not this YAML):

| Branch        | PRs required | Allowed source of the PR |
| ------------- | ------------ | ------------------------ |
| `development` | Yes          | Working branches         |
| `qa`          | Yes          | `development` only       |
| `master`      | Yes          | `qa` only                |

## Troubleshooting

| Error                                                  | What to do                                                                                    |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `QA releases must start from a development prerelease` | You are on `qa` with a stable or production version. Merge `development` first, then release. |
| `Production releases must start from a qa prerelease`  | Do not release `master` from `development`. Promote to `qa` and cut `x.y.z-qa.N` first.       |
| `feat/fix/... must include an Azure Boards id`         | Add `AB#12345` to the commit body.                                                            |
| `Refusing to push … → …`                               | The PR or push skipped a lane. Promote `development` → `qa` → `master` only.                  |
| `Tag v… does not match package.json`                   | Create tags with `npm run release`, not by hand.                                              |
| `Tag v… already exists`                                | Fetch tags (`git fetch --tags`) or increment by running release only after new commits.       |
| Story ids have no links                                | Set `AZURE_DEVOPS_ORG` and `AZURE_DEVOPS_PROJECT`, or point `origin` at Azure DevOps.         |
