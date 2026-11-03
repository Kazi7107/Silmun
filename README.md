# Silmun website

Marketing site for Silmun (AI agents for ServiceNow).

## Layout

| Folder | What it is |
|---|---|
| `website/` | **The live site.** Plain HTML, CSS and JS. Edit these files directly. |
| `astro-backup/` | Earlier Astro version of the site plus the design handoff. Kept as a backup and reference; not deployed. |

## Working on another computer

Keep a normal local copy on each computer and sync through GitHub. Don't keep the repo in Google Drive, Dropbox or OneDrive.

First time on a computer:

```bash
git clone https://github.com/Kazi7107/Silmun.git
```

Every time you work:

```bash
git pull                       # get the latest before editing
# ...edit files...
git add -A
git commit -m "what changed"
git push                       # send it to GitHub
```

Always pull before you start and push when you finish, so the two computers never drift apart.
