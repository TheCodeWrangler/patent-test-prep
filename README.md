# Patent Bar Trainer

Study app for the USPTO registration exam (patent bar): lessons, spaced-repetition
flashcards, an MPEP chapter map, a miss log, a mock-exam pacer and a 12-week plan.
Installable on Android as a web app; progress is saved in the browser.

**Live:** https://patent.printthejoints.com

## Layout

| Path | What it is |
|---|---|
| `src/patent-bar-trainer.html` | The app's content and logic (single file). Edit this. |
| `build.py` | Builds `site/index.html` from `src/`: adds the page skeleton, app-install tags, the visual skin, the version badge and the audio player. |
| `VERSION` | Shown in the app header. Bump it for every user-visible change; it also renames the offline cache so installed copies update. |
| `audio.json` | Where podcast episodes live: `{"base": "<url prefix>", "files": {"0": "ep0.m4a", ...}}`. Episodes without a file fall back to the NotebookLM link. |
| `src/assets/infographic.png` + `infographic.json` | The "Visual overview" card on the Learn page. The build makes the web-sized versions from the PNG; the JSON holds the title and the accuracy warning. |
| `src/practice/` | The Practice tab: `dates.js` (USPTO date rules), `drills.js` (deadline question generators), `trees.js` (decision trees and scenarios, each step cited to the MPEP), `practice.js`/`.css` (UI). |
| `tests/` | `node tests/<name>.test.js`. Checks the date engine against MPEP worked examples, fuzzes every drill generator, and walks every tree scenario. `deploy.sh` runs them first. |
| `site/` | What gets deployed: nginx config, Dockerfile, service worker, manifest, icons. `site/index.html` is generated. |

## Deploy

```sh
echo 1.2.0 > VERSION      # for a user-visible change
./deploy.sh               # builds, deploys to Cloud Run, checks the live URL
```

### Adding a scenario or tree

Add to `scenarios` in `src/practice/trees.js`: the fact pattern, the correct option index at each step (`path`), and a one-line `why`. Run `node tests/trees.test.js`, which fails if the path doesn't lead cleanly to an outcome.

### Replacing the infographic

1. Save the new image over `src/assets/infographic.png`.
2. Edit `infographic.json`: update the title, and change or clear the `warning` to match the new image.
3. Bump `VERSION` and run `./deploy.sh`.

Hosting: Cloud Run service `patent-bar-trainer` (us-central1, project
`velocity-tracker-njprice2`), mapped to `patent.printthejoints.com` via a CNAME to
`ghs.googlehosted.com` in the `printthejoints-com` Cloud DNS zone. The root
`printthejoints.com` is a separate service (`node-designer`) and is not touched by
this repo.
