@echo off
chcp 65001 >nul
rem Один прогон задачи стенда: run.bat <задача> <A|B> <номер-прогона>
rem Пример: run.bat 01 B 1
if "%~3"=="" (
  echo Использование: run.bat ^<задача 01-05^> ^<A^|B^> ^<номер прогона^>
  echo Пример: run.bat 01 B 1
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-task.ps1" -Task %1 -Config %2 -Run %3
