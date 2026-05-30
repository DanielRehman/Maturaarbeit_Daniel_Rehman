@echo off
setlocal
cd /d "%~dp0"

echo === Setup: Workflow Messung ===
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo FEHLER: Node.js wurde nicht gefunden.
  echo Bitte Node.js installieren und setup.bat erneut starten.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo FEHLER: npm wurde nicht gefunden.
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo .env wurde aus .env.example erstellt.
  echo Bitte API-Keys eintragen, bevor neue KI-Laeufe gestartet werden.
)

if not exist "data" mkdir "data"

echo.
echo Installiere Abhaengigkeiten...
call npm install
if errorlevel 1 exit /b 1

echo.
echo Baue Aufgaben-Generator...
call node_modules\.bin\tsc.cmd -p aufgaben_generator\tsconfig.json
if errorlevel 1 exit /b 1

echo.
echo Baue Anwendung...
call npm run build
if errorlevel 1 exit /b 1

echo.
echo Setup abgeschlossen.
echo Starten mit restart.bat
echo.
pause
