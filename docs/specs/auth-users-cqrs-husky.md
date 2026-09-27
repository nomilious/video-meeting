# Separate Auth and Users with CQRS and enforce commit checks

Status: draft synthesized from the conversation. Issue tracker configuration and
confirmation of the proposed testing boundaries are pending.

## Problem Statement

Auth combines authentication with user persistence, making changes to either
responsibility harder to isolate. Developers need to separate these concerns
without breaking registration, login, protected endpoints, or existing accounts.

The previous pre-commit hook formats selected staged files and stages them again,
but does not run lint or tests. Developers need commits to be blocked when these
checks fail.

## Solution

Keep password hashing, credential checks, JWT generation, and JWT validation in
Auth. Put user creation and lookup in Users. Connect these modules through explicit
CQRS commands and queries while preserving the existing HTTP API.

Replace the formatting hook with Husky. Before a commit, run the project's lint
checks and frontend and backend tests, stopping on failure. Verify the refactor
against a green baseline and after each completed step.

## User Stories

1. As a developer, I want Auth to own token generation, so that token policy stays in one module.
2. As a developer, I want Auth to validate tokens, so that protected endpoints use consistent authentication.
3. As a developer, I want Auth to hash and check passwords, so that credential handling stays centralized.
4. As a developer, I want Users to create users, so that persistence belongs to the user module.
5. As a developer, I want Users to find users by email, so that login does not query user storage directly.
6. As a developer, I want Users to find users by ID, so that token validation can check whether the user exists.
7. As a developer, I want user writes expressed as commands, so that mutations are explicit.
8. As a developer, I want user reads expressed as queries, so that reads and writes have distinct contracts.
9. As a new user, I want registration to return a token, so that I can immediately access my account.
10. As a registered user, I want login to keep working, so that the refactor does not change my access.
11. As a user, I want duplicate email registration rejected, so that account identity remains unique.
12. As a user, I want invalid and expired credentials rejected, so that my account stays protected.
13. As an existing user, I want legacy password compatibility preserved, so that I can continue signing in.
14. As a user, I want my meetings to remain isolated from other accounts, so that the refactor preserves privacy.
15. As a frontend developer, I want the API contract preserved, so that existing consumers keep working.
16. As a developer, I want tests green before refactoring, so that I have a reliable baseline.
17. As a developer, I want tests run after each completed step, so that regressions are caught promptly.
18. As a developer, I want lint run before every commit, so that invalid code cannot pass the local commit gate.
19. As a developer, I want frontend and backend tests run before every commit, so that both sides are checked.
20. As a developer, I want any failed check to stop the commit, so that failures cannot be silently ignored.
21. As a developer, I want the hook to preserve staging, so that a partial commit includes only my selected changes.
22. As a contributor, I want dependency installation to activate Husky, so that commit checks are configured consistently.
23. As a contributor, I want test database and browser requirements documented, so that I can run the same checks locally.

## Implementation Decisions

- Use the existing FastAPI, async SQLAlchemy, PostgreSQL, npm, and uv architecture.
- Auth owns authentication HTTP endpoints, password hashing and verification, token
  issuance, and token validation. It does not perform user persistence operations.
- Users owns persistence through an immutable `CreateUserCommand` and immutable
  `FindUserByEmailQuery` and `FindUserByIdQuery` contracts with separate handlers.
- Auth invokes the handlers directly. CQRS does not require a message bus, event
  sourcing, or separate read and write databases for this scope.
- The creation command receives an email and a prepared password hash. Queries
  return a user or no result. Users does not depend on Auth.
- User creation owns commit and rollback. The existing unique email constraint
  protects against concurrent duplicate registration.
- Users reports duplicate creation with `UserAlreadyExistsError`; Auth translates
  this to HTTP 409 using the existing error message.
- Preserve `POST /auth/register` with HTTP 201 and a `gvtToken`,
  `POST /auth/login` with HTTP 200 and a `gvtToken`, and
  `GET /auth/me` with the existing ID and email response.
- Preserve email normalization, registration password validation, bcrypt execution
  outside the event loop, legacy bcrypt truncation during login, and JWT lifetime.
- Preserve protected meeting endpoints and backend owner isolation. No database
  migration or frontend contract change is required.
- Remove the old formatting hook. Install Husky as an npm development dependency
  and activate it through the npm `prepare` lifecycle.
- Husky runs `npm run lint`, followed by `npm test`, stopping on failure.
- Reuse the existing lint checks: frontend TypeScript checking and backend Ruff.
  The root test command runs the existing frontend test, followed by backend pytest.
- The new hook does not format files or add files to staging.
- Backend integration tests require an exported `TEST_DATABASE_URL` for a dedicated,
  migrated PostgreSQL database. Preserve the existing skip behavior when it is absent.
- Document the module boundaries, hook behavior, Python dependencies, Chromium,
  and dedicated test database requirements.

## Testing Decisions

- Test externally observable behavior rather than filenames, imports, or handler
  implementation details. Prefer existing boundaries over new test infrastructure.
- Proposed primary backend boundary: the FastAPI HTTP API exercised against a
  dedicated PostgreSQL database. Cover registration, duplicate email, login,
  invalid and expired tokens, identity responses, and protected meeting isolation.
- Reuse the existing migration checks for a fresh database and the previous schema,
  including legacy account login. Reuse the existing configuration test.
- Retain the focused Users integration check for creation, lookup, missing users,
  concurrent duplicate email creation, and usable sessions after a conflict.
- Reuse the existing frontend browser test for authentication, meeting states,
  duplicate submissions, and cancellation during navigation.
- Proposed tooling boundary: invoke the installed Husky pre-commit entry point
  without creating a commit. Verify lint and both test suites run successfully.
  Check nonzero exits from lint and tests stop the hook, with tests not invoked
  after a lint failure.
- Run all existing tests before refactoring and after every completed step. Use a
  dedicated migrated PostgreSQL database to avoid integration-test skips during
  refactoring validation. Never use a production database for these checks.
- Confirm these testing boundaries with the user before publishing the spec.

## Out of Scope

- Additional user CRUD endpoints, profile management, roles, password reset,
  refresh tokens, logout changes, or OAuth integrations.
- Message brokers, asynchronous command delivery, event sourcing, or separate
  persistence models for reads and writes.
- Database schema changes, frontend redesign, and unrelated refactoring.
- New CI workflows, deployment changes, automatic formatting, or automatic staging.
- Automatic provisioning of a PostgreSQL database on every commit or a new policy
  requiring integration tests when no test database is configured.
- Installation of Codex skills and plugin management; those were separate tasks.

## Further Notes

The requested implementation has already been committed in two logical changes:
`bef90f7` for the Auth/Users refactor and `1d12915` for Husky checks. This spec records
that agreed scope rather than proposing a second implementation.

The baseline was four passing backend tests and one passing frontend test. After
the refactor, five backend tests and one frontend test passed without skips;
lint also passed. Husky was checked for successful execution and failure handling.

Before publication, configure the project's issue tracker and triage vocabulary
through `/setup-matt-pocock-skills`, confirm the testing boundaries, and publish
with the `ready-for-agent` label. The draft has not been published.
