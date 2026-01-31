import os
from typing import Optional, Any

from PyQt5.QtWidgets import (
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QSplitter,
    QListWidget,
    QListWidgetItem,
    QPushButton,
    QLabel,
    QTableWidget,
    QTableWidgetItem,
    QTabWidget,
    QGroupBox,
    QFormLayout,
    QScrollArea,
    QFileDialog,
    QMessageBox,
    QFrame,
    QSizePolicy,
    QApplication,
    QProgressBar,
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QFont

from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import matplotlib

matplotlib.use("Qt5Agg")

from desktop.api_client import ApiClient


class WorkerThread(QThread):
    result = pyqtSignal(object)
    error = pyqtSignal(str)

    def __init__(self, func, *args, **kwargs):
        super().__init__()
        self.func = func
        self.args = args
        self.kwargs = kwargs

    def run(self):
        try:
            r = self.func(*self.args, **self.kwargs)
            self.result.emit(r)
        except Exception as e:
            self.error.emit(str(e))


class MplCanvas(FigureCanvas):
    def __init__(self, parent=None, width=5, height=4, dpi=100):
        self.fig = Figure(figsize=(width, height), dpi=dpi)
        super().__init__(self.fig)
        self.setParent(parent)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.updateGeometry()

    def clear(self):
        self.fig.clear()

    def draw_pie(self, labels, sizes, title="Type distribution"):
        self.fig.clear()
        ax = self.fig.add_subplot(111)
        if not labels or not sizes:
            ax.text(0.5, 0.5, "No data", ha="center", va="center")
        else:
            ax.pie(sizes, labels=labels, autopct="%1.1f%%", startangle=90)
        ax.set_title(title)
        self.fig.tight_layout()
        self.draw()

    def draw_bars(self, labels, values, title="", ylabel=""):
        self.fig.clear()
        ax = self.fig.add_subplot(111)
        if not labels or not values:
            ax.text(0.5, 0.5, "No data", ha="center", va="center")
        else:
            x = range(len(labels))
            ax.bar(x, values, tick_label=labels)
        ax.set_ylabel(ylabel)
        ax.set_title(title)
        self.fig.tight_layout()
        self.draw()


class MainWindow(QMainWindow):
    def __init__(self, client: ApiClient):
        super().__init__()
        self.client = client
        self._datasets: list[dict] = []
        self._selected_id: Optional[str] = None
        self._selected_dataset: Optional[dict] = None
        self._summary: Optional[dict] = None
        self.setMinimumSize(900, 600)
        self.resize(1100, 700)
        central = QWidget()
        self.setCentralWidget(central)
        layout = QHBoxLayout(central)
        layout.setContentsMargins(8, 8, 8, 8)
        left = QFrame()
        left.setFrameStyle(QFrame.StyledPanel)
        left.setMinimumWidth(240)
        left.setMaximumWidth(320)
        left_layout = QVBoxLayout(left)
        left_layout.addWidget(QLabel("Dataset history"))
        self.dataset_list = QListWidget()
        self.dataset_list.setMinimumHeight(200)
        self.dataset_list.currentItemChanged.connect(self._on_dataset_selected)
        left_layout.addWidget(self.dataset_list)

        upload_btn = QPushButton("Upload CSV")
        upload_btn.clicked.connect(self._on_upload)
        left_layout.addWidget(upload_btn)
        left_layout.addStretch()
        layout.addWidget(left)
        right = QWidget()
        right_layout = QVBoxLayout(right)
        btn_row = QHBoxLayout()
        self.pdf_btn = QPushButton("Download PDF report")
        self.pdf_btn.clicked.connect(self._on_pdf)
        self.pdf_btn.setEnabled(False)
        btn_row.addWidget(self.pdf_btn)
        self.pin_btn = QPushButton("Pin / Unpin")
        self.pin_btn.clicked.connect(self._on_pin_clicked)
        self.pin_btn.setEnabled(False)
        btn_row.addWidget(self.pin_btn)
        self.delete_btn = QPushButton("Delete dataset")
        self.delete_btn.clicked.connect(self._on_delete_clicked)
        self.delete_btn.setEnabled(False)
        btn_row.addWidget(self.delete_btn)
        btn_row.addStretch()
        right_layout.addLayout(btn_row)
        self.tabs = QTabWidget()
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(
            ["Name", "Type", "Flowrate", "Pressure", "Temperature"]
        )
        self.tabs.addTab(self.table, "Data table")
        summary_w = QScrollArea()
        summary_w.setWidgetResizable(True)
        self.summary_widget = QWidget()
        self.summary_layout = QFormLayout(self.summary_widget)
        summary_w.setWidget(self.summary_widget)
        self.tabs.addTab(summary_w, "Summary")
        charts_w = QWidget()
        charts_layout = QVBoxLayout(charts_w)
        self.chart_pie = MplCanvas(self, width=5, height=4)
        charts_layout.addWidget(QLabel("Equipment type distribution"))
        charts_layout.addWidget(self.chart_pie)
        self.chart_bars = MplCanvas(self, width=5, height=3)
        charts_layout.addWidget(QLabel("Averages (Flowrate, Pressure, Temperature)"))
        charts_layout.addWidget(self.chart_bars)
        self.tabs.addTab(charts_w, "Charts")

        right_layout.addWidget(self.tabs)
        layout.addWidget(right, 1)

        self._progress = QProgressBar()
        self._progress.setMaximum(0)
        self._progress.setVisible(False)
        right_layout.addWidget(self._progress)

        self._load_datasets()

    def _update_pin_button_text(self):
        if self._selected_dataset and self._selected_dataset.get("pinned"):
            self.pin_btn.setText("Unpin")
        else:
            self.pin_btn.setText("Pin / Unpin")

    def _set_busy(self, busy: bool):
        self._progress.setVisible(busy)
        self.dataset_list.setEnabled(not busy)
        has_sel = bool(self._selected_id)
        self.pdf_btn.setEnabled(not busy and has_sel)
        self.pin_btn.setEnabled(not busy and has_sel)
        self.delete_btn.setEnabled(not busy and has_sel)

    def _load_datasets(self):
        self._set_busy(True)
        t = WorkerThread(self._fetch_datasets)
        t.result.connect(self._on_datasets_loaded)
        t.error.connect(self._on_error)
        t.finished.connect(lambda: self._set_busy(False))
        t.start()
        self._thread = t

    def _fetch_datasets(self):
        ok, data = self.client.list_datasets()
        if not ok:
            raise RuntimeError(data)
        return data

    def _on_datasets_loaded(self, data: list):
        self._datasets = data or []
        self.dataset_list.clear()
        for ds in self._datasets:
            name = ds.get("name", "?")
            if ds.get("pinned"):
                name = "📌 " + name
            item = QListWidgetItem(name)
            item.setData(Qt.UserRole, ds.get("id"))
            self.dataset_list.addItem(item)
        self._set_busy(False)
        if self._datasets and not self._selected_id:
            self.dataset_list.setCurrentRow(0)

    def _on_error(self, msg: str):
        self._set_busy(False)
        QMessageBox.warning(self, "Error", msg)

    def _on_dataset_selected(self, current: Optional[QListWidgetItem], previous):
        if not current:
            self._selected_id = None
            self._selected_dataset = None
            self._summary = None
            self._refresh_content()
            self.pdf_btn.setEnabled(False)
            self.pin_btn.setEnabled(False)
            self.delete_btn.setEnabled(False)
            self._update_pin_button_text()
            return
        self._selected_id = current.data(Qt.UserRole)
        self._set_busy(True)
        t = WorkerThread(self._fetch_dataset_and_summary, self._selected_id)
        t.result.connect(self._on_dataset_loaded)
        t.error.connect(self._on_error)
        t.finished.connect(lambda: self._set_busy(False))
        t.start()
        self._thread = t

    def _fetch_dataset_and_summary(self, dataset_id: str):
        ok1, data1 = self.client.get_dataset(dataset_id)
        if not ok1:
            raise RuntimeError(data1)
        ok2, data2 = self.client.get_summary(dataset_id)
        if not ok2:
            data2 = {}
        return (data1, data2)

    def _on_dataset_loaded(self, payload: tuple):
        self._selected_dataset, self._summary = payload
        self._refresh_content()
        self._set_busy(False)
        self.pdf_btn.setEnabled(True)
        self.pin_btn.setEnabled(True)
        self.delete_btn.setEnabled(True)
        self._update_pin_button_text()

    def _refresh_content(self):
        self.table.setRowCount(0)
        if self._selected_dataset and self._selected_dataset.get("equipment"):
            eq_list = self._selected_dataset["equipment"]
            self.table.setRowCount(len(eq_list))
            for i, eq in enumerate(eq_list):
                self.table.setItem(i, 0, QTableWidgetItem(str(eq.get("equipmentName", ""))))
                self.table.setItem(i, 1, QTableWidgetItem(str(eq.get("equipmentType", ""))))
                self.table.setItem(i, 2, QTableWidgetItem(str(eq.get("flowrate", ""))))
                self.table.setItem(i, 3, QTableWidgetItem(str(eq.get("pressure", ""))))
                self.table.setItem(i, 4, QTableWidgetItem(str(eq.get("temperature", ""))))
        while self.summary_layout.rowCount():
            self.summary_layout.removeRow(0)
        if self._summary:
            self.summary_layout.addRow("Total equipment:", QLabel(str(self._summary.get("totalEquipment", ""))))
            self.summary_layout.addRow("Avg flowrate:", QLabel(str(self._summary.get("avgFlowrate", ""))))
            self.summary_layout.addRow("Avg pressure:", QLabel(str(self._summary.get("avgPressure", ""))))
            self.summary_layout.addRow("Avg temperature:", QLabel(str(self._summary.get("avgTemperature", ""))))
            td = self._summary.get("typeDistribution") or {}
            self.summary_layout.addRow("Type distribution:", QLabel(str(td)))
        if self._summary:
            td = self._summary.get("typeDistribution") or {}
            labels = list(td.keys())
            sizes = list(td.values())
            self.chart_pie.draw_pie(labels, sizes)
            self.chart_bars.draw_bars(
                ["Flowrate", "Pressure", "Temperature"],
                [
                    self._summary.get("avgFlowrate", 0),
                    self._summary.get("avgPressure", 0),
                    self._summary.get("avgTemperature", 0),
                ],
                title="Averages",
                ylabel="Value",
            )
        else:
            self.chart_pie.draw_pie([], [], "Type distribution")
            self.chart_bars.draw_bars([], [], "Averages", "Value")

    def _on_pin_clicked(self):
        did = self._selected_id
        if not did:
            return
        ds = next((d for d in self._datasets if str(d.get("id")) == str(did)), None)
        new_pinned = not (ds and ds.get("pinned"))
        self._set_busy(True)
        t = WorkerThread(self.client.toggle_pin, did, new_pinned)
        t.result.connect(lambda ok_data: self._on_pin_done(ok_data))
        t.error.connect(self._on_error)
        t.finished.connect(lambda: self._set_busy(False))
        t.start()
        self._thread = t

    def _on_pin_done(self, ok_data):
        if isinstance(ok_data, tuple) and len(ok_data) == 2:
            ok, data = ok_data
            if ok:
                self._load_datasets()
                if self._selected_dataset:
                    self._selected_dataset["pinned"] = data.get("pinned", False)
                    self._refresh_content()
                    self._update_pin_button_text()
        self._set_busy(False)

    def _on_delete_clicked(self):
        did = self._selected_id
        if not did:
            return
        reply = QMessageBox.question(
            self,
            "Delete dataset",
            "Delete this dataset?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No,
        )
        if reply != QMessageBox.Yes:
            return
        self._set_busy(True)
        t = WorkerThread(self.client.delete_dataset, did)
        t.result.connect(lambda ok_msg: self._on_delete_done(ok_msg))
        t.error.connect(self._on_error)
        t.finished.connect(lambda: self._set_busy(False))
        t.start()
        self._thread = t

    def _on_delete_done(self, ok_msg):
        if isinstance(ok_msg, tuple) and len(ok_msg) == 2:
            ok, msg = ok_msg
            if ok:
                self._selected_id = None
                self._selected_dataset = None
                self._summary = None
                self._load_datasets()
                self._refresh_content()
                self.pdf_btn.setEnabled(False)
                self.pin_btn.setEnabled(False)
                self.delete_btn.setEnabled(False)
        self._set_busy(False)

    def _on_upload(self):
        path, _ = QFileDialog.getOpenFileName(
            self,
            "Select CSV file",
            "",
            "CSV (*.csv);;All files (*)",
        )
        if not path:
            return
        self._set_busy(True)
        t = WorkerThread(self.client.upload_csv, path)
        t.result.connect(self._on_upload_done)
        t.error.connect(self._on_error)
        t.finished.connect(lambda: self._set_busy(False))
        t.start()
        self._thread = t

    def _on_upload_done(self, ok_data):
        if isinstance(ok_data, tuple) and len(ok_data) == 2:
            ok, data = ok_data
            if ok:
                self._load_datasets()
                if isinstance(data, dict) and data.get("id"):
                    for i in range(self.dataset_list.count()):
                        item = self.dataset_list.item(i)
                        if item and item.data(Qt.UserRole) == data.get("id"):
                            self.dataset_list.setCurrentRow(i)
                            break
        self._set_busy(False)

    def _on_pdf(self):
        if not self._selected_id:
            return
        path, _ = QFileDialog.getSaveFileName(
            self,
            "Save PDF report",
            "",
            "PDF (*.pdf);;All files (*)",
        )
        if not path:
            return
        if not path.endswith(".pdf"):
            path += ".pdf"
        self._set_busy(True)
        t = WorkerThread(self.client.download_report_pdf, self._selected_id, path)
        t.result.connect(self._on_pdf_done)
        t.error.connect(self._on_error)
        t.finished.connect(lambda: self._set_busy(False))
        t.start()
        self._thread = t

    def _on_pdf_done(self, ok_msg):
        if isinstance(ok_msg, tuple) and len(ok_msg) == 2:
            ok, msg = ok_msg
            if ok:
                QMessageBox.information(self, "Report", f"Saved to {msg}")
        self._set_busy(False)
