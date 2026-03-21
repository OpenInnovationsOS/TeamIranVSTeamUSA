
@echo off
echo Running scheduled backup...
cd /d "%~dp0"
node scripts/backup.js full
echo Backup completed at %date% %time%
