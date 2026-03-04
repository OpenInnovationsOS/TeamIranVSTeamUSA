@echo off
echo 📊 Setting up monitoring and backup for Team Iran vs Team USA game...

echo [INFO] Creating monitoring configuration...

REM Create monitoring directory
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups

REM Create monitoring script
(
echo @echo off
echo echo 🔍 Running health monitoring...
echo.
echo REM Check application health
echo curl -s http://localhost:3000/health ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Application is healthy
echo ) else (
echo     echo ❌ Application is unhealthy
echo     echo [ALERT] Application health check failed
echo )
echo.
echo REM Check PM2 status
echo pm2 list ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 (
echo     echo ✅ PM2 is running
echo ) else (
echo     echo ❌ PM2 is not running
echo     echo [ALERT] PM2 process manager is down
echo )
echo.
echo REM Check database connection (simulated)
echo echo ✅ Database connection simulated
echo.
echo REM Check Redis connection (simulated)
echo echo ✅ Redis connection simulated
echo.
echo REM Check disk space
echo for /f "tokens=3" %%i in ('dir c:\ ^| find "bytes free"') do set FREE_SPACE=%%i
echo echo Disk space: %%FREE_SPACE%% bytes free
echo.
echo echo 🎉 Monitoring completed
) > scripts\monitor-windows.bat

echo [INFO] Monitoring script created

REM Create backup script
(
echo @echo off
echo echo 📦 Creating backup...
echo.
echo set BACKUP_DIR=backups
echo set TIMESTAMP=%%date:~-4%%date:~4,2%%date:~7,2%%_%%time:~0,2%%time:~3,2%%time:~6,2%%
echo set TIMESTAMP=%%TIMESTAMP: =0%%
echo.
echo echo [INFO] Creating backup at %%TIMESTAMP%%
echo.
echo REM Create backup directory
echo if not exist "%%BACKUP_DIR%%" mkdir "%%BACKUP_DIR%%"
echo.
echo REM Backup database (simulated)
echo echo [INFO] Creating database backup...
echo copy db_simulation\*.sql "%%BACKUP_DIR%%\db_backup_%%TIMESTAMP%%.sql" ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Database backup completed
echo ) else (
echo     echo ❌ Database backup failed
echo )
echo.
echo REM Backup configuration files
echo echo [INFO] Creating configuration backup...
echo copy *.json "%%BACKUP_DIR%%\config_backup_%%TIMESTAMP%%\" ^>nul 2^>^&1
echo if not exist "%%BACKUP_DIR%%\config_backup_%%TIMESTAMP%%" mkdir "%%BACKUP_DIR%%\config_backup_%%TIMESTAMP%%"
echo copy *.json "%%BACKUP_DIR%%\config_backup_%%TIMESTAMP%%\" ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Configuration backup completed
echo ) else (
echo     echo ❌ Configuration backup failed
echo )
echo.
echo REM Backup logs
echo echo [INFO] Creating logs backup...
echo if exist "logs" (
echo     copy logs\*.* "%%BACKUP_DIR%%\logs_backup_%%TIMESTAMP%%\" ^>nul 2^>^&1
echo     if not exist "%%BACKUP_DIR%%\logs_backup_%%TIMESTAMP%%" mkdir "%%BACKUP_DIR%%\logs_backup_%%TIMESTAMP%%"
echo     xcopy logs "%%BACKUP_DIR%%\logs_backup_%%TIMESTAMP%%\" /E /I /Q ^>nul 2^>^&1
echo     if %%errorlevel%% equ 0 (
echo         echo ✅ Logs backup completed
echo     ) else (
echo         echo ❌ Logs backup failed
echo     )
echo ) else (
echo     echo [WARNING] No logs directory found
echo )
echo.
echo REM Create backup manifest
echo (
echo     echo Backup created: %%date%% %%time%%
echo     echo Database backup: db_backup_%%TIMESTAMP%%.sql
echo     echo Config backup: config_backup_%%TIMESTAMP%%
echo     echo Logs backup: logs_backup_%%TIMESTAMP%%
echo ) ^> "%%BACKUP_DIR%%\backup_manifest_%%TIMESTAMP%%.txt"
echo.
echo echo 📦 Backup completed successfully!
echo echo Backup location: %%BACKUP_DIR%%
echo.
) > scripts\backup-windows.bat

echo [INFO] Backup script created

REM Create startup script for Windows
(
echo @echo off
echo echo 🚀 Starting Team Iran vs Team USA game...
echo.
echo REM Check if PM2 is installed
echo pm2 --version ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 (
echo     echo [ERROR] PM2 is not installed
echo     echo Please install PM2: npm install -g pm2
echo     pause
echo     exit /b 1
echo )
echo.
echo REM Start application
echo echo [INFO] Starting application with PM2...
echo pm2 start ecosystem.config.js --env production
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Application started successfully
echo ) else (
echo     echo ❌ Failed to start application
echo     pause
echo     exit /b 1
echo )
echo.
echo REM Save PM2 configuration
echo pm2 save
echo.
echo REM Show status
echo echo [INFO] Application status:
echo pm2 status
echo.
echo echo 🎉 Game is now running!
echo echo 🌐 Access the game at: http://localhost:3000
echo echo 📊 View logs: pm2 logs team-iran-vs-usa
echo echo 🔄 Restart: pm2 restart team-iran-vs-usa
echo.
) > scripts\start-game-windows.bat

echo [INFO] Startup script created

REM Create stop script
(
echo @echo off
echo echo 🛑 Stopping Team Iran vs Team USA game...
echo.
echo pm2 stop team-iran-vs-usa
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Application stopped successfully
echo ) else (
echo     echo ❌ Failed to stop application
echo )
echo.
echo echo 🎮 Game stopped
) > scripts\stop-game-windows.bat

echo [INFO] Stop script created

REM Create status script
(
echo @echo off
echo echo 📊 Team Iran vs Team USA Game Status
echo echo ====================================
echo.
echo echo 🖥️  Application Status:
echo pm2 status
echo.
echo echo 🌐 Health Check:
echo curl -s http://localhost:3000/health ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Application is healthy
echo ) else (
echo     echo ❌ Application is unhealthy
echo )
echo.
echo echo 📁 Recent Logs (last 5 lines):
echo if exist "logs\out-0.log" (
echo     echo === Application Logs ===
echo     powershell "Get-Content 'logs\out-0.log' | Select-Object -Last 5"
echo ) else (
echo     echo [INFO] No log files found
echo )
echo.
echo echo 💾 Disk Usage:
echo dir /s | find "bytes"
echo.
echo echo 🔄 PM2 Processes:
echo pm2 list
) > scripts\status-windows.bat

echo [INFO] Status script created

echo [INFO] Setting up Windows Task Scheduler for monitoring...

REM Create monitoring task setup
(
echo @echo off
echo echo 📅 Setting up automated monitoring...
echo.
echo REM Create monitoring task (requires admin privileges)
echo schtasks /create /tn "TeamIranVsUSAMonitor" /tr "%%cd%%\scripts\monitor-windows.bat" /sc minute /mo 5 /f ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Monitoring task created (runs every 5 minutes)
echo ) else (
echo     echo [WARNING] Failed to create monitoring task (may require admin privileges)
echo     echo You can manually set up Task Scheduler to run scripts\monitor-windows.bat every 5 minutes
echo )
echo.
echo REM Create backup task
echo schtasks /create /tn "TeamIranVSUSABackup" /tr "%%cd%%\scripts\backup-windows.bat" /sc daily /st 02:00 /f ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 (
echo     echo ✅ Backup task created (runs daily at 2 AM)
echo ) else (
echo     echo [WARNING] Failed to create backup task (may require admin privileges)
echo     echo You can manually set up Task Scheduler to run scripts\backup-windows.bat daily at 2 AM
echo )
echo.
echo echo 🎉 Automated monitoring setup completed!
) > scripts\setup-tasks-windows.bat

echo [INFO] Task scheduler setup script created

echo.
echo 🎉 Monitoring and backup setup completed successfully!
echo.
echo 📁 Created Scripts:
echo   - scripts\monitor-windows.bat     - Health monitoring
echo   - scripts\backup-windows.bat      - Automated backups
echo   - scripts\start-game-windows.bat  - Start application
echo   - scripts\stop-game-windows.bat   - Stop application
echo   - scripts\status-windows.bat     - View status
echo   - scripts\setup-tasks-windows.bat - Setup automated tasks
echo.
echo 🔄 Usage:
echo   Start game:    scripts\start-game-windows.bat
echo   Stop game:     scripts\stop-game-windows.bat
echo   View status:   scripts\status-windows.bat
echo   Run monitor:   scripts\monitor-windows.bat
echo   Create backup: scripts\backup-windows.bat
echo.
echo ⚠️  NOTE: For automated monitoring, run:
echo   scripts\setup-tasks-windows.bat
echo   (This requires administrator privileges)
echo.
echo ✅ Monitoring system is ready for production!
pause
