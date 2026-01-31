# PyInstaller spec for Chemical Equipment Parameter Visualizer (desktop).
# Run from project root: pyinstaller desktop/main.spec
# Output: dist/ChemicalEquipmentVisualizer.exe (Windows) or dist/ChemicalEquipmentVisualizer (Linux/macOS)

# -*- mode: python ; coding: utf-8 -*-
import os

# Run from project root: pyinstaller desktop/main.spec
# Script path relative to cwd (project root); pathex so "from desktop.xxx" resolves
_spec_dir = os.path.dirname(os.path.abspath(SPEC))
_project_root = os.path.dirname(_spec_dir)

block_cipher = None

a = Analysis(
    [os.path.join(_spec_dir, 'main.py')],
    pathex=[_project_root],
    binaries=[],
    datas=[],
    hiddenimports=[
        'PyQt5.QtCore',
        'PyQt5.QtGui',
        'PyQt5.QtWidgets',
        'matplotlib',
        'matplotlib.backends.backend_qt5agg',
        'requests',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ChemicalEquipmentVisualizer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window (windowed app)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
