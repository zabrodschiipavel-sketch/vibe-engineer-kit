@echo off
rem Single bench task run: run.bat <task> <A|B> <run-number>
rem Example: run.bat 01 B 1
if "%~3"=="" (
  echo Usage: run.bat ^<task 01-05^> ^<A or B^> ^<run number^>
  echo Example: run.bat 01 B 1
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-task.ps1" -Task %1 -Config %2 -Run %3
