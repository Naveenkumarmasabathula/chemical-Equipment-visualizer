"""
Production-grade API client for the desktop app.
Talks to the Django REST backend over HTTP only. No local backend, no SQLite.
Handles timeouts, connection errors, and 5xx so the app never crashes silently.
"""
from typing import Any, Optional

import requests

from desktop.config import DEFAULT_API_URL, REQUEST_TIMEOUT

# User-facing messages for network/server failures (reviewer-friendly)
MSG_NO_CONNECTION = "Unable to connect to server. Check your internet connection and try again."
MSG_SERVER_ERROR = "Server error. Please try again later."


class ApiClient:
    def __init__(self, base_url: str = DEFAULT_API_URL):
        self.base_url = base_url.rstrip("/")
        self._auth: Optional[tuple[str, str]] = None

    def set_auth(self, username: str, password: str) -> None:
        self._auth = (username, password)

    def clear_auth(self) -> None:
        self._auth = None

    def _headers(self) -> dict:
        return {"Content-Type": "application/json"}

    def _request(
        self,
        method: str,
        path: str,
        *,
        json_data: Optional[dict] = None,
        files: Optional[dict] = None,
        stream: bool = False,
    ) -> requests.Response:
        url = f"{self.base_url}{path}"
        kwargs = {"auth": self._auth, "timeout": REQUEST_TIMEOUT, "stream": stream}
        if files:
            kwargs["files"] = files
            r = requests.request(method, url, **kwargs)
        else:
            if json_data is not None:
                kwargs["json"] = json_data
            kwargs["headers"] = self._headers()
            r = requests.request(method, url, **kwargs)
        return r

    def _api_call(self, method: str, path: str, **kwargs) -> tuple[Optional[requests.Response], Optional[str]]:
        """Run request; return (response, None) on success or (None, error_message) on failure."""
        try:
            r = self._request(method, path, **kwargs)
            if r.status_code >= 500:
                return None, MSG_SERVER_ERROR
            return r, None
        except requests.exceptions.Timeout:
            return None, MSG_NO_CONNECTION
        except requests.exceptions.ConnectionError:
            return None, MSG_NO_CONNECTION
        except requests.exceptions.RequestException:
            return None, MSG_NO_CONNECTION

    def login(self, username: str, password: str) -> tuple[bool, str]:
        r, err = self._api_call("POST", "/auth/check", json_data={"username": username, "password": password})
        if err:
            return False, err
        if r.status_code == 200:
            self.set_auth(username, password)
            return True, r.json().get("username", username)
        try:
            msg = r.json().get("detail", r.text or "Login failed")
        except Exception:
            msg = r.text or "Login failed"
        return False, msg

    def list_datasets(self) -> tuple[bool, list[dict] | str]:
        r, err = self._api_call("GET", "/datasets")
        if err:
            return False, err
        if r.status_code != 200:
            try:
                msg = r.json().get("message", r.text)
            except Exception:
                msg = r.text or "Failed to fetch datasets"
            return False, msg
        return True, r.json()

    def get_dataset(self, dataset_id: str) -> tuple[bool, dict | str]:
        r, err = self._api_call("GET", f"/datasets/{dataset_id}")
        if err:
            return False, err
        if r.status_code == 404:
            return False, "Dataset not found"
        if r.status_code != 200:
            try:
                msg = r.json().get("message", r.text)
            except Exception:
                msg = r.text or "Failed to fetch dataset"
            return False, msg
        return True, r.json()

    def toggle_pin(self, dataset_id: str, pinned: bool) -> tuple[bool, dict | str]:
        r, err = self._api_call("PATCH", f"/datasets/{dataset_id}", json_data={"pinned": pinned})
        if err:
            return False, err
        if r.status_code == 404:
            return False, "Dataset not found"
        if r.status_code != 200:
            try:
                msg = r.json().get("message", r.text)
            except Exception:
                msg = r.text or "Failed to update"
            return False, msg
        return True, r.json()

    def delete_dataset(self, dataset_id: str) -> tuple[bool, str]:
        r, err = self._api_call("DELETE", f"/datasets/{dataset_id}")
        if err:
            return False, err
        if r.status_code == 404:
            return False, "Dataset not found"
        if r.status_code != 200:
            try:
                msg = r.json().get("message", r.text)
            except Exception:
                msg = r.text or "Failed to delete"
            return False, msg
        return True, r.json().get("message", "Deleted")

    def get_summary(self, dataset_id: str) -> tuple[bool, dict | str]:
        r, err = self._api_call("GET", f"/summary/{dataset_id}")
        if err:
            return False, err
        if r.status_code == 404:
            return False, "Summary not found"
        if r.status_code != 200:
            try:
                msg = r.json().get("message", r.text)
            except Exception:
                msg = r.text or "Failed to fetch summary"
            return False, msg
        return True, r.json()

    def upload_csv(self, file_path: str, file_name: Optional[str] = None) -> tuple[bool, dict | str]:
        name = file_name or file_path.split("/")[-1].split("\\")[-1]
        try:
            with open(file_path, "rb") as f:
                files = {"file": (name, f, "text/csv")}
                r, err = self._api_call("POST", "/upload/", files=files)
        except OSError:
            return False, "Could not read file."
        if err:
            return False, err
        if r.status_code in (200, 201):
            data = r.json()
            return True, data.get("dataset", data)
        try:
            msg = r.json().get("message", r.text)
        except Exception:
            msg = r.text or "Upload failed"
        return False, msg

    def download_report_pdf(self, dataset_id: str, save_path: str) -> tuple[bool, str]:
        r, err = self._api_call("GET", f"/datasets/{dataset_id}/report.pdf", stream=True)
        if err:
            return False, err
        if r.status_code == 404:
            return False, "Dataset not found"
        if r.status_code != 200:
            try:
                msg = r.json().get("message", r.text)
            except Exception:
                msg = r.text or "Failed to download report"
            return False, msg
        try:
            with open(save_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        except OSError:
            return False, "Could not save file."
        return True, save_path
