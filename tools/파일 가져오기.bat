@echo off
chcp 65001 >nul
cd /d "%~dp0.."
python -m pip install --quiet pillow
python tools\files_import.py
pause
