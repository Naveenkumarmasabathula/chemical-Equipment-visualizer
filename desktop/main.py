import sys
import os

_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont

from desktop.api_client import ApiClient
from desktop.login_dialog import LoginDialog
from desktop.main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Chemical Equipment Parameter Visualizer")
    app.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
    font = QFont()
    font.setPointSize(10)
    app.setFont(font)

    api_base = os.environ.get("API_BASE_URL", "http://localhost:8000/api")
    client = ApiClient(base_url=api_base)

    login = LoginDialog(client)
    if login.exec_() != LoginDialog.Accepted:
        sys.exit(0)

    window = MainWindow(client)
    window.setWindowTitle(f"Chemical Equipment Visualizer — {login.get_username()}")
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
