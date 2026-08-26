#!/data/data/com.termux/files/usr/bin/bash

curl -s \
  -H "Authorization: Bearer AgroFutureReminder2026X9" \
  http://localhost:3000/api/reminders/run \
  >> "$HOME/agrofuture2050/reminder-cron.log" 2>&1

echo "" >> "$HOME/agrofuture2050/reminder-cron.log"
