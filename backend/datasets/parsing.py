import pandas as pd
import io
from typing import Any

EQUIPMENT_NAME_KEYS = ("Equipment Name", "equipment_name", "EquipmentName")
TYPE_KEYS = ("Type", "equipment_type", "EquipmentType")
FLOWRATE_KEYS = ("Flowrate", "flowrate")
PRESSURE_KEYS = ("Pressure", "pressure")
TEMPERATURE_KEYS = ("Temperature", "temperature")


def _find_column(df: pd.DataFrame, *keys: tuple[str, ...]) -> str | None:
    for key in keys:
        if key in df.columns:
            return key
    return None


def has_required_columns(df: pd.DataFrame) -> bool:
    has_name = _find_column(df, *EQUIPMENT_NAME_KEYS) is not None
    has_type = _find_column(df, *TYPE_KEYS) is not None
    return bool(has_name and has_type)


def parse_csv_with_headers(content: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[str]]:
    errors = []
    field_names = []
    
    try:
        df = pd.read_csv(
            io.StringIO(content),
            skipinitialspace=True,
            skip_blank_lines=True,
            on_bad_lines="skip",
        )
        df.columns = df.columns.str.strip()
        field_names = list(df.columns)
        
        if df.empty:
            return [], errors, field_names
        name_col = _find_column(df, *EQUIPMENT_NAME_KEYS)
        type_col = _find_column(df, *TYPE_KEYS)
        flowrate_col = _find_column(df, *FLOWRATE_KEYS)
        pressure_col = _find_column(df, *PRESSURE_KEYS)
        temp_col = _find_column(df, *TEMPERATURE_KEYS)
        
        if not name_col or not type_col:
            return [], errors, field_names
        rows = []
        for idx, row in df.iterrows():
            equipment_name = str(row[name_col]).strip() if pd.notna(row[name_col]) else ""
            equipment_type = str(row[type_col]).strip() if pd.notna(row[type_col]) else ""
            
            if not equipment_name or not equipment_type:
                errors.append({"row": idx + 2, "type": "missing_required"})
                continue
            flowrate = 0.0
            if flowrate_col and pd.notna(row[flowrate_col]):
                try:
                    flowrate = float(row[flowrate_col])
                    if pd.isna(flowrate):
                        flowrate = 0.0
                except (ValueError, TypeError):
                    flowrate = 0.0
            
            pressure = 0.0
            if pressure_col and pd.notna(row[pressure_col]):
                try:
                    pressure = float(row[pressure_col])
                    if pd.isna(pressure):
                        pressure = 0.0
                except (ValueError, TypeError):
                    pressure = 0.0
            
            temperature = 0.0
            if temp_col and pd.notna(row[temp_col]):
                try:
                    temperature = float(row[temp_col])
                    if pd.isna(temperature):
                        temperature = 0.0
                except (ValueError, TypeError):
                    temperature = 0.0
            
            rows.append({
                "equipmentName": equipment_name,
                "equipmentType": equipment_type,
                "flowrate": flowrate,
                "pressure": pressure,
                "temperature": temperature,
            })
        
        return rows, errors, field_names
        
    except pd.errors.EmptyDataError:
        return [], errors, field_names
    except Exception as e:
        errors.append({"row": 0, "type": "parse_error", "message": str(e)})
        return [], errors, field_names


def parse_csv(content: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rows, errors, _ = parse_csv_with_headers(content)
    return rows, errors
