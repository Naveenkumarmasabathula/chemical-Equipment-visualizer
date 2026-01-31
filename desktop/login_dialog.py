from PyQt5.QtWidgets import (
    QDialog,
    QFormLayout,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QLabel,
    QHBoxLayout,
    QMessageBox,
    QWidget,
)
from PyQt5.QtCore import Qt


class LoginDialog(QDialog):
    def __init__(self, api_client, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.setWindowTitle("Chemical Equipment Visualizer — Login")
        self.setMinimumWidth(320)
        layout = QVBoxLayout(self)

        title = QLabel("Sign in")
        title.setStyleSheet("font-size: 14pt; font-weight: bold;")
        layout.addWidget(title)

        form = QFormLayout()
        self.username_edit = QLineEdit()
        self.username_edit.setPlaceholderText("admin")
        self.username_edit.setText("admin")
        form.addRow("Username:", self.username_edit)

        self.password_edit = QLineEdit()
        self.password_edit.setEchoMode(QLineEdit.Password)
        self.password_edit.setPlaceholderText("admin")
        self.password_edit.setText("admin")
        form.addRow("Password:", self.password_edit)

        layout.addLayout(form)

        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        self.login_btn = QPushButton("Login")
        self.login_btn.setDefault(True)
        self.login_btn.clicked.connect(self._on_login)
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.clicked.connect(self.reject)
        btn_layout.addWidget(self.cancel_btn)
        btn_layout.addWidget(self.login_btn)
        layout.addLayout(btn_layout)
        layout.addStretch()

    def _on_login(self):
        username = self.username_edit.text().strip()
        password = self.password_edit.text()
        if not username or not password:
            QMessageBox.warning(self, "Login", "Please enter username and password.")
            return
        self.login_btn.setEnabled(False)
        ok, msg = self.api_client.login(username, password)
        self.login_btn.setEnabled(True)
        if ok:
            self.accept()
        else:
            QMessageBox.warning(self, "Login failed", str(msg))

    def get_username(self):
        return self.username_edit.text().strip()
