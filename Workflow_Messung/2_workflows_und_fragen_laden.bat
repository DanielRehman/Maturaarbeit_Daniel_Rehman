@echo off
setlocal
cd /d "%~dp0"

echo === Schritt 2: Workflows und Fragen laden ===
echo.

call initialisiere_workflows.bat
if errorlevel 1 exit /b 1

call importiere_fragensets.bat
if errorlevel 1 exit /b 1

echo.
echo Schritt 2 abgeschlossen.
pause
