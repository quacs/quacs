# Return true this is a scheduled run and it is Fridays(5) and the current hour is 23
# Or return true if this was a push event and a file in the scrapers folder changed
if ([ "$GITHUB_EVENT_NAME" = "schedule" ] && date +DOW:%u-HOUR:%H | grep -q "DOW:5-HOUR:23") \
|| ([ "$GITHUB_EVENT_NAME" = "push" ] && git diff --name-only HEAD^ HEAD | grep -q "^scrapers/") \
; then
  exit 0
fi
exit 1
