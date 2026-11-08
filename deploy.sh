#!/bin/sh
# Build site/index.html from src/ and deploy to Cloud Run.
# Bump VERSION first for any user-visible change.
set -e
cd "$(dirname "$0")"
for t in tests/*.test.js; do   # any failing test stops the deploy
  out=$(node "$t" 2>&1) || { echo "$out"; echo "TEST FAILED: $t"; exit 1; }
  echo "$out" | tail -1
done
python3 -I build.py src/patent-bar-trainer.html site/index.html
gcloud run deploy patent-bar-trainer --source site --region=us-central1 \
  --project=velocity-tracker-njprice2 --allow-unauthenticated --quiet
curl -s -o /dev/null -w "patent.printthejoints.com -> %{http_code}\n" https://patent.printthejoints.com/
