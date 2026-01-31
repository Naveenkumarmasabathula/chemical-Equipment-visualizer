import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Flowable,
)
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF


class DrawingFlowable(Flowable):
    def __init__(self, drawing: Drawing):
        self.drawing = drawing
        self.width = drawing.width
        self.height = drawing.height

    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)

    def draw(self):
        renderPDF.draw(self.drawing, self.canv, 0, 0)


def _make_type_distribution_chart(stats: dict, width: float = 4.5 * inch, height: float = 2.5 * inch) -> Drawing | None:
    dist = stats.get("typeDistribution") or {}
    if not dist:
        return None
    names = list(dist.keys())[:10]
    values = [dist.get(n, 0) for n in names]
    if not values:
        return None
    drawing = Drawing(width, height)
    chart = VerticalBarChart()
    chart.x = 50
    chart.y = 30
    chart.width = width - 80
    chart.height = height - 60
    chart.data = [values]
    chart.categoryAxis.categoryNames = [n[:12] for n in names]
    chart.categoryAxis.labels.angle = 45
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.valueMin = 0
    chart.bars[0].fillColor = colors.HexColor("#2563eb")
    drawing.add(chart)
    return drawing


def _make_averages_chart(stats: dict, width: float = 4.5 * inch, height: float = 2.2 * inch) -> Drawing | None:
    avg_f = stats.get("avgFlowrate") or 0
    avg_p = stats.get("avgPressure") or 0
    avg_t = stats.get("avgTemperature") or 0
    drawing = Drawing(width, height)
    chart = VerticalBarChart()
    chart.x = 50
    chart.y = 25
    chart.width = width - 80
    chart.height = height - 55
    chart.data = [[avg_f, avg_p, avg_t]]
    chart.categoryAxis.categoryNames = ["Flowrate\n(m³/h)", "Pressure\n(bar)", "Temperature\n(°C)"]
    chart.categoryAxis.labels.fontSize = 8
    chart.valueAxis.valueMin = 0
    chart.bars[0].fillColor = colors.HexColor("#0ea5e9")
    drawing.add(chart)
    return drawing


def _make_pie_chart(stats: dict, width: float = 2.8 * inch, height: float = 2.2 * inch) -> Drawing | None:
    dist = stats.get("typeDistribution") or {}
    if not dist:
        return None
    labels = list(dist.keys())[:8]
    data = [float(dist.get(n, 0)) for n in labels]
    if not data or sum(data) == 0:
        return None
    drawing = Drawing(width, height)
    pie = Pie()
    pie.x = 20
    pie.y = 20
    pie.width = width - 50
    pie.height = height - 50
    pie.data = data
    pie.labels = [n[:10] for n in labels]
    pie.slices.strokeWidth = 0.5
    pie.slices.fontSize = 7
    colors_list = [
        colors.HexColor("#2563eb"),
        colors.HexColor("#0ea5e9"),
        colors.HexColor("#10b981"),
        colors.HexColor("#f59e0b"),
        colors.HexColor("#8b5cf6"),
        colors.HexColor("#ec4899"),
        colors.HexColor("#6366f1"),
        colors.HexColor("#14b8a6"),
    ]
    for i in range(len(pie.data)):
        pie.slices[i].fillColor = colors_list[i % len(colors_list)]
    drawing.add(pie)
    return drawing


def generate_dataset_pdf(dataset: dict, stats: dict | None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        alignment=TA_CENTER,
        spaceAfter=6,
        fontSize=18,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        spaceAfter=20,
        fontSize=10,
        textColor=colors.grey,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        spaceBefore=14,
        spaceAfter=8,
        fontSize=12,
    )
    story = []
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Equipment Dataset Report", title_style))
    story.append(Paragraph(f"<i>{dataset.get('name', 'N/A')}</i>", subtitle_style))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("1. Dataset Overview", section_style))
    info_data = [
        ["Dataset name", dataset.get("name", "N/A")],
        ["Uploaded", dataset.get("uploadedAt", "—")],
        ["Total records", str(dataset.get("totalCount", 0))],
        ["Avg flowrate (m³/h)", f"{dataset.get('avgFlowrate', 0):.2f}"],
        ["Avg pressure (bar)", f"{dataset.get('avgPressure', 0):.2f}"],
        ["Avg temperature (°C)", f"{dataset.get('avgTemperature', 0):.2f}"],
    ]
    info_table = Table(info_data, colWidths=[2 * inch, 3.5 * inch])
    info_table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(info_table)
    story.append(Spacer(1, 0.2 * inch))
    if stats:
        story.append(Paragraph("2. Summary Statistics", section_style))
        story.append(
            Paragraph(
                f"Total equipment: <b>{stats.get('totalEquipment', 0)}</b> &nbsp;|&nbsp; "
                f"Avg flowrate: <b>{stats.get('avgFlowrate', 0):.2f}</b> m³/h &nbsp;|&nbsp; "
                f"Avg pressure: <b>{stats.get('avgPressure', 0):.2f}</b> bar &nbsp;|&nbsp; "
                f"Avg temperature: <b>{stats.get('avgTemperature', 0):.2f}</b> °C",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("3. Charts", section_style))
        type_chart = _make_type_distribution_chart(stats)
        if type_chart:
            flowable = DrawingFlowable(type_chart)
            story.append(Paragraph("<b>Equipment count by type</b>", ParagraphStyle("ChartTitle", parent=styles["Normal"], fontSize=9, spaceAfter=4)))
            story.append(flowable)
            story.append(Spacer(1, 0.15 * inch))
        avg_chart = _make_averages_chart(stats)
        if avg_chart:
            flowable = DrawingFlowable(avg_chart)
            story.append(Paragraph("<b>Average parameters</b>", ParagraphStyle("ChartTitle", parent=styles["Normal"], fontSize=9, spaceAfter=4)))
            story.append(flowable)
            story.append(Spacer(1, 0.15 * inch))
        pie_chart = _make_pie_chart(stats)
        if pie_chart:
            flowable = DrawingFlowable(pie_chart)
            story.append(Paragraph("<b>Type distribution (pie)</b>", ParagraphStyle("ChartTitle", parent=styles["Normal"], fontSize=9, spaceAfter=4)))
            story.append(flowable)
            story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("4. Equipment Data" if stats else "2. Equipment Data", section_style))
    equipment = dataset.get("equipment", [])
    if equipment:
        headers = ["Equipment Name", "Type", "Flowrate", "Pressure", "Temp"]
        data = [headers]
        for eq in equipment[:150]:
            data.append([
                (eq.get("equipmentName") or "")[:28],
                (eq.get("equipmentType") or "")[:16],
                str(round(eq.get("flowrate", 0), 2)),
                str(round(eq.get("pressure", 0), 2)),
                str(round(eq.get("temperature", 0), 2)),
            ])
        if len(equipment) > 150:
            data.append([f"... and {len(equipment) - 150} more rows", "", "", "", ""])
        col_widths = [2.2 * inch, 1.3 * inch, 0.75 * inch, 0.75 * inch, 0.7 * inch]
        t = Table(data, colWidths=col_widths, repeatRows=1)
        t.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ])
        )
        story.append(t)
    else:
        story.append(Paragraph("No equipment data.", styles["Normal"]))

    story.append(Spacer(1, 0.3 * inch))
    story.append(
        Paragraph(
            "<i>Chemical Equipment Parameter Visualizer — Report generated from uploaded dataset.</i>",
            ParagraphStyle("Footer", parent=styles["Normal"], alignment=TA_CENTER, fontSize=8, textColor=colors.grey),
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
