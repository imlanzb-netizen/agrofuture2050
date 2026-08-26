#!/data/data/com.termux/files/usr/bin/bash

termux-job-scheduler \
  --script ~/agrofuture2050/scripts/run-reminders.sh \
  --period-ms 86400000 \
  --persisted true \
  --job-id 2050
