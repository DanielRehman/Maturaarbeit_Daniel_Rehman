@echo off
setlocal
cd /d "%~dp0"

echo === Importiere Fragensets und Checkpoints ===
echo.

if not exist "dist\server.js" (
  call npm run build
  if errorlevel 1 exit /b 1
)

node scripts\import-sql.js sql_imports\02_fragensets_und_checkpoints.sql
if errorlevel 1 exit /b 1

echo.
echo Fragensets und Checkpoints wurden importiert.
pause
