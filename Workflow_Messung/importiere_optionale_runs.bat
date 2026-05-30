@echo off
setlocal
cd /d "%~dp0"

echo === Optionaler Import: Runs und Statistik ===
echo.
echo Diese Datei ist gross und importiert historische Runs, Scores und Paarbeziehungen.
echo.

if not exist "optionale_grosse_run_imports\optional_runs_und_statistik.sql" (
  echo Keine optionale Run-SQL-Datei gefunden.
  pause
  exit /b 1
)

if not exist "dist\server.js" (
  call npm run build
  if errorlevel 1 exit /b 1
)

node scripts\import-sql.js optionale_grosse_run_imports\optional_runs_und_statistik.sql
if errorlevel 1 exit /b 1

echo.
echo Runs und Statistik wurden importiert.
pause
