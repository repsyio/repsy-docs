+++
title = "Understanding Public vs Private"
weight = 13
chapter = true
+++


### Understanding Public vs Private Repositories

Repsy repositories can be either private or public.  
Each visibility type serves different use cases depending on how you want others to access your packages.

Visibility only decides whether **anonymous** callers can read a repository. It does not restrict a repository to
specific users. See [Who Can Do What](#who-can-do-what) below.

### Private Repositories

Private is the default setting for all repositories created in Repsy.

- Requires authentication for both publishing and downloading: a signed-in user account or a deploy token
- Ideal for internal tools, private libraries, or CI/CD workflows
- Anonymous callers have no access

"Private" means **login required**, not "restricted to specific users". Every user account on the instance can read
and modify every private repository.

### Public Repositories

Public repositories allow open access for downloading packages.

- No authentication needed to download packages
- Publishing still requires authentication
- Suitable for open-source packages or publicly shared tools

Even when a repository is public, only authenticated users can publish or modify packages.

### Who Can Do What

Repsy has no per-repository owners or access lists. What a caller may do depends only on whether they are signed in,
and on their role:

| Caller | Public repository | Private repository |
| --- | --- | --- |
| Anonymous | Read | No access |
| Signed-in `USER` | Read and write | Read and write |
| `ADMIN` | Everything a `USER` can do, plus manage | Everything a `USER` can do, plus manage |

Every user account on the instance can read and modify every repository, including private ones, and can see their
names.

Only *manage* operations need the `ADMIN` role:

- Creating a repository
- Renaming a repository, or changing its description and settings (including its visibility)
- Deleting a repository
- Deleting a repository's artifacts and versions
- Managing a repository's deploy tokens
- Managing users

### Keeping Repositories Apart

If you need some repositories to stay hidden from some people, keep this model in mind:

- **Give CI jobs and external parties a deploy token, not a user account.** A deploy token is scoped to a single
  repository and can be read-only, so it gives access to that repository and nothing else. Anyone who can sign in
  can read every repository, so a user account is not a way to share just one.
- **Only create user accounts for people you trust with every repository on the instance.**
- **Run one Repsy instance per team** when repositories must be kept apart between teams.

### Switching Visibility

You can change a repository’s visibility at any time. This needs the `ADMIN` role:

- Go to the Repositories tab
- Open the more options menu (⋮) next to the repository
- Click Settings
- Toggle the Private setting on or off
- Save your changes

Changes apply immediately, and you can switch back anytime.
