@echo off
rem Full series: ALL bench tasks (enumerated from bench\fixtures\) in one configuration.
rem Usage: run-all.bat <A|B> <run-number>
rem Example: run-all.bat A 1
rem Model: default of run-task.ps1 (bench standard model, see EXPERIMENTS.md).
if "%~2"=="" (
  echo Usage: run-all.bat ^<A or B^> ^<run number^>
  echo Example: run-all.bat A 1
  exit /b 1
)
for /d %%D in ("%~dp0fixtures\*") do (
  echo.
  echo ===== Task %%~nxD, config %1, run %2 =====
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-task.ps1" -Task %%~nxD -Config %1 -Run %2
)
echo.
echo Series done. Results: bench\results\  Run dirs: bench-runs\
