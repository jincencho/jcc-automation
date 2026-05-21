@echo off
cd /d "c:\jincenchoproject"
echo Starting JCC Jincencho Daily Automation at 7 AM...
node scripts/daily_viral_task.js
echo Done!
pause
