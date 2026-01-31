#!/usr/bin/env bash
# Build desktop executable from project root. Requires: pip install pyinstaller, desktop deps
set -e
pip install pyinstaller -q
pip install -r desktop/requirements.txt -q
pyinstaller desktop/main.spec
echo
echo "Build output: dist/ChemicalEquipmentVisualizer (or .exe on Windows)"
echo "Upload this file to GitHub Releases for download."
