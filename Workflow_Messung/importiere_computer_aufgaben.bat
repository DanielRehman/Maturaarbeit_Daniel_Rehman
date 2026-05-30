@echo off
setlocal
cd /d "%~dp0"

echo === Import computer-auswertbarer Aufgaben ===
echo.

if not exist "aufgaben_generator\dist\generate_task.js" (
  echo Baue Aufgaben-Generator...
  call npx tsc -p aufgaben_generator\tsconfig.json
  if errorlevel 1 exit /b 1
)

node scripts\import-computer-aufgaben-kern.js
if errorlevel 1 exit /b 1

node scripts\import-computer-aufgaben-schwierigkeit.js
if errorlevel 1 exit /b 1

echo.
echo Import abgeschlossen.
pause

