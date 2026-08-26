#!/data/data/com.termux/files/usr/bin/bash

cd ~/agrofuture2050

while true
do
  curl -s \
    -H "Authorization: Bearer AgroFutureReminder2026X9" \
    http://localhost:3000/api/reminders/run \
    >> reminder-cron.log

  echo >> reminder-cron.log

  sleep 86400
done
