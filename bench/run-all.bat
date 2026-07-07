@echo off
rem Full series: all 5 tasks in one configuration: run-all.bat <A|B> <run-number>
rem Example: run-all.bat A 1
if "%~2"=="" (
  echo Usage: run-all.bat ^<A or B^> ^<run number^>
  echo Example: run-all.bat A 1
  exit /b 1
)
for %%T in (01 02 03 04 05) do (
  echo.
  echo ===== Task %%T, config %1, run %2 =====
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-task.ps1" -Task %%T -Config %1 -Run %2
)
echo.
echo Series done. Results: bench\results\  Run dirs: bench-runs\
