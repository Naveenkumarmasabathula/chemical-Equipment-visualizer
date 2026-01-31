import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Equipment, SummaryStats } from "@shared/schema";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsProps {
  equipment: Equipment[];
  stats: SummaryStats | null;
  isLoading?: boolean;
}

const chartColors = {
  primary: "hsl(210, 90%, 45%)",
  primaryLight: "hsla(210, 90%, 45%, 0.2)",
  accent: "hsl(185, 70%, 42%)",
  accentLight: "hsla(185, 70%, 42%, 0.2)",
  success: "hsl(145, 65%, 42%)",
  successLight: "hsla(145, 65%, 42%, 0.2)",
  warning: "hsl(35, 90%, 55%)",
  warningLight: "hsla(35, 90%, 55%, 0.2)",
  purple: "hsl(280, 65%, 55%)",
  purpleLight: "hsla(280, 65%, 55%, 0.2)",
};

const pieColors = [
  "hsl(210, 90%, 45%)",
  "hsl(185, 70%, 42%)",
  "hsl(145, 65%, 42%)",
  "hsl(35, 90%, 55%)",
  "hsl(280, 65%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(250, 60%, 50%)",
  "hsl(170, 60%, 45%)",
];

export function Charts({ equipment, stats, isLoading }: ChartsProps) {
  const typeDistributionData = useMemo(() => {
    if (!stats?.typeDistribution) return null;

    const labels = Object.keys(stats.typeDistribution);
    const values = Object.values(stats.typeDistribution);

    return {
      labels,
      datasets: [
        {
          label: "Equipment Count",
          data: values,
          backgroundColor: labels.map((_, i) => pieColors[i % pieColors.length]),
          borderColor: labels.map((_, i) => pieColors[i % pieColors.length]),
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  const parameterTrendsData = useMemo(() => {
    if (!equipment.length) return null;

    const sortedEquipment = [...equipment].slice(0, 20);
    const labels = sortedEquipment.map((e) => e.equipmentName.slice(0, 12));

    return {
      labels,
      datasets: [
        {
          label: "Flowrate (m³/h)",
          data: sortedEquipment.map((e) => e.flowrate),
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primaryLight,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Pressure (bar)",
          data: sortedEquipment.map((e) => e.pressure),
          borderColor: chartColors.accent,
          backgroundColor: chartColors.accentLight,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [equipment]);

  const temperatureData = useMemo(() => {
    if (!equipment.length) return null;

    const sortedEquipment = [...equipment].slice(0, 20);
    const labels = sortedEquipment.map((e) => e.equipmentName.slice(0, 12));

    return {
      labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: sortedEquipment.map((e) => e.temperature),
          backgroundColor: chartColors.warning,
          borderColor: chartColors.warning,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [equipment]);

  const parameterDistributionData = useMemo(() => {
    if (!stats) return null;

    return {
      labels: ["Flowrate", "Pressure", "Temperature"],
      datasets: [
        {
          label: "Average Values",
          data: [stats.avgFlowrate, stats.avgPressure, stats.avgTemperature],
          backgroundColor: [chartColors.primary, chartColors.accent, chartColors.warning],
          borderWidth: 0,
        },
      ],
    };
  }, [stats]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
        },
      },
    },
  };

  const pieLegendFontSize = 10;
  const pieDoughnutOptions = {
    ...commonOptions,
    layout: {
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
    },
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: "bottom" as const,
        labels: {
          ...commonOptions.plugins.legend.labels,
          font: {
            family: "'Inter', sans-serif",
            size: pieLegendFontSize,
          },
          padding: 8,
        },
      },
      tooltip: {
        titleFont: { size: pieLegendFontSize },
        bodyFont: { size: pieLegendFontSize },
      },
    },
  };

  const xyScales = {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } },
    },
    y: {
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      beginAtZero: true,
    },
  };
  const lineOptions = { ...commonOptions, scales: xyScales };
  const barOptions = { ...commonOptions, scales: xyScales };


  if (isLoading) {
    return (
      <Card data-testid="charts-loading" className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Data Visualization</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="h-[220px] sm:h-[240px] lg:h-[280px] bg-muted rounded animate-pulse" data-testid="chart-skeleton" />
        </CardContent>
      </Card>
    );
  }

  if (!equipment.length || !stats) {
    return (
      <Card data-testid="charts-empty" className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Data Visualization</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="h-[220px] sm:h-[280px] flex items-center justify-center text-muted-foreground text-sm sm:text-base text-center px-4" data-testid="text-no-chart-data">
            Upload a CSV file to view charts
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="charts-container" className="min-w-0">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl" data-testid="text-charts-title">Data Visualization</CardTitle>
      </CardHeader>
      <CardContent className="pb-[19.2px] px-[9.6px] sm:px-[19.2px]">
        <Tabs defaultValue="distribution" className="w-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 mb-4 h-auto p-1" data-testid="tabs-charts">
            <TabsTrigger value="distribution" className="text-xs sm:text-sm min-h-[44px] sm:min-h-9 py-2" data-testid="tab-distribution">
              Type Distribution
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm min-h-[44px] sm:min-h-9 py-2" data-testid="tab-trends">
              Trends
            </TabsTrigger>
            <TabsTrigger value="temperature" className="text-xs sm:text-sm min-h-[44px] sm:min-h-9 py-2" data-testid="tab-temperature">
              Temperature
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm min-h-[44px] sm:min-h-9 py-2" data-testid="tab-comparison">
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="h-[260px] sm:h-[280px] lg:h-[320px] min-w-0 overflow-visible" data-testid="chart-pie">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3" data-testid="text-pie-title">
                  Equipment Type Distribution (Pie)
                </h4>
                {typeDistributionData && (
                  <Pie data={typeDistributionData} options={pieDoughnutOptions} />
                )}
              </div>
              <div className="h-[260px] sm:h-[280px] lg:h-[320px] min-w-0 overflow-visible" data-testid="chart-doughnut">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3" data-testid="text-doughnut-title">
                  Equipment Type Distribution (Doughnut)
                </h4>
                {typeDistributionData && (
                  <Doughnut data={typeDistributionData} options={pieDoughnutOptions} />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-0">
            <div className="h-[220px] sm:h-[240px] lg:h-[280px] min-w-0" data-testid="chart-line">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3" data-testid="text-trends-title">
                Flowrate & Pressure Trends (First 20 Equipment)
              </h4>
              {parameterTrendsData && (
                <Line data={parameterTrendsData} options={lineOptions} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="temperature" className="mt-0">
            <div className="h-[220px] sm:h-[240px] lg:h-[280px] min-w-0" data-testid="chart-bar-temperature">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3" data-testid="text-temperature-title">
                Temperature by Equipment (First 20)
              </h4>
              {temperatureData && <Bar data={temperatureData} options={barOptions} />}
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="h-[220px] sm:h-[240px] lg:h-[280px] min-w-0" data-testid="chart-bar-comparison">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3" data-testid="text-comparison-title">
                  Average Parameter Values
                </h4>
                {parameterDistributionData && (
                  <Bar data={parameterDistributionData} options={barOptions} />
                )}
              </div>
              <div className="h-[220px] sm:h-[240px] lg:h-[280px] min-w-0" data-testid="chart-bar-types">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3" data-testid="text-types-title">
                  Equipment Count by Type
                </h4>
                {typeDistributionData && (
                  <Bar
                    data={{
                      ...typeDistributionData,
                      datasets: [
                        {
                          ...typeDistributionData.datasets[0],
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={barOptions}
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
