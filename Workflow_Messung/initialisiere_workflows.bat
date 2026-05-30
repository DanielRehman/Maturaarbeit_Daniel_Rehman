@echo off
setlocal
cd /d "%~dp0"

echo === Initialisiere Workflows, Prompts und Modelle ===
echo.

if not exist "dist\server.js" (
  call npm run build
  if errorlevel 1 exit /b 1
)

node scripts\import-sql.js sql_imports\01_workflows_prompts_models.sql
if errorlevel 1 exit /b 1

echo.
echo Workflows, Prompts und Modelle wurden importiert.
pause
