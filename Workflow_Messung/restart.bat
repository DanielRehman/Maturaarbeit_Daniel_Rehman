@echo off
setlocal
cd /d "%~dp0"

set PORT=3000
if exist ".env" (
  for /f "usebackq tokens=1,2 delims==" %%A in (".env") do (
    if /i "%%A"=="PORT" set PORT=%%B
  )
)

echo === Neustart: Workflow Messung ===
echo Port: %PORT%
echo.

echo Stoppe laufende Anwendung auf Port %PORT%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Write-Host ('Stoppe PID ' + $_); Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

timeout /t 2 /nobreak >nul

if not exist "data" mkdir "data"

if not exist "node_modules\.bin\tsx.cmd" (
  echo Abhaengigkeiten fehlen. Installiere mit npm install...
  call npm install
  if errorlevel 1 exit /b 1
)

if not exist "aufgaben_generator\dist\generate_task.js" (
  echo Aufgaben-Generator wurde noch nicht gebaut.
  call node_modules\.bin\tsc.cmd -p aufgaben_generator\tsconfig.json
  if errorlevel 1 exit /b 1
)

echo.
echo Starte Workflow Messung.
echo Browser: http://localhost:%PORT%
echo Zum Stoppen dieses Fensters: Ctrl+C
echo.

call npm run dev
