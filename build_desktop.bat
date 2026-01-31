@echo off
REM Build desktop .exe from project root. Requires: pip install pyinstaller, desktop deps
pip install pyinstaller -q
pip install -r desktop/requirements.txt -q
pyinstaller desktop/main.spec
echo.
echo Build output: dist\ChemicalEquipmentVisualizer.exe
echo Upload this file to GitHub Releases for download.
