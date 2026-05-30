@echo off
setlocal
cd /d "%~dp0"

echo === Schritt 3: Optionale Runs und Statistik laden ===
echo.
echo Dieser Schritt ist optional und gross.
echo Wenn nur neue Tests gemacht werden sollen, kann dieser Schritt uebersprungen werden.
echo.
set /p confirm=Historische Runs wirklich importieren? YES eingeben:
if /i not "%confirm%"=="YES" (
  echo Uebersprungen.
  pause
  exit /b 0
)

call importiere_optionale_runs.bat
