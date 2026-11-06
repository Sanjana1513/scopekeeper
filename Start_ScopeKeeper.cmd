@echo off
setlocal
cd /d "%~dp0"
py -3 app.py
if errorlevel 1 (
  echo ScopeKeeper could not start. Review the error above.
  pause
)
