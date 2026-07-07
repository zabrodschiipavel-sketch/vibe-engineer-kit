@echo off
chcp 65001 >nul
rem Полная серия: все 5 задач в одной конфигурации: run-all.bat <A|B> <номер-прогона>
rem Пример: run-all.bat A 1
if "%~2"=="" (
  echo Использование: run-all.bat ^<A^|B^> ^<номер прогона^>
  echo Пример: run-all.bat A 1
  exit /b 1
)
for %%T in (01 02 03 04 05) do (
  echo.
  echo ===== Задача %%T, конфигурация %1, прогон %2 =====
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-task.ps1" -Task %%T -Config %1 -Run %2
)
echo.
echo Серия завершена. Результаты: bench\results\ , каталоги прогонов: bench-runs\
