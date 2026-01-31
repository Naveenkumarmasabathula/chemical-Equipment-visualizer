import { Card, CardContent } from "@/components/ui/card";
import { 
  Gauge, 
  Thermometer, 
  Droplets, 
  Activity
} from "lucide-react";
import type { SummaryStats as SummaryStatsType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SummaryStatsProps {
  stats: SummaryStatsType | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  range?: { min: number; max: number };
  colorClass?: string;
  testId: string;
}

function StatCard({ title, value, unit, icon, range, colorClass = "text-primary", testId }: StatCardProps) {
  return (
    <Card data-testid={testId} className="min-w-0">
      <CardContent className="p-4 sm:p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 sm:space-y-2 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate" data-testid={`${testId}-title`}>{title}</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className={cn("text-2xl sm:text-3xl font-bold tracking-tight", colorClass)} data-testid={`${testId}-value`}>
                {typeof value === "number" ? value.toFixed(2) : value}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">{unit}</span>
            </div>
            {range && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap" data-testid={`${testId}-range`}>
                <span>Min: {range.min.toFixed(1)}</span>
                <span className="text-border">|</span>
                <span>Max: {range.max.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 sm:p-3 rounded-lg bg-muted/50 shrink-0", colorClass.replace("text-", "bg-").replace("primary", "primary/10").replace("accent", "accent/10"))}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton({ testId }: { testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-40 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryStats({ stats, isLoading }: SummaryStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="summary-stats-loading">
        <StatCardSkeleton testId="skeleton-stat-total" />
        <StatCardSkeleton testId="skeleton-stat-flowrate" />
        <StatCardSkeleton testId="skeleton-stat-pressure" />
        <StatCardSkeleton testId="skeleton-stat-temperature" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="summary-stats-empty">
        <StatCard
          title="Total Equipment"
          value="--"
          unit="units"
          icon={<Activity className="w-5 h-5 text-primary" />}
          colorClass="text-primary"
          testId="stat-card-total-empty"
        />
        <StatCard
          title="Average Flowrate"
          value="--"
          unit="m³/h"
          icon={<Droplets className="w-5 h-5 text-blue-500" />}
          colorClass="text-blue-500"
          testId="stat-card-flowrate-empty"
        />
        <StatCard
          title="Average Pressure"
          value="--"
          unit="bar"
          icon={<Gauge className="w-5 h-5 text-accent" />}
          colorClass="text-accent"
          testId="stat-card-pressure-empty"
        />
        <StatCard
          title="Average Temperature"
          value="--"
          unit="°C"
          icon={<Thermometer className="w-5 h-5 text-orange-500" />}
          colorClass="text-orange-500"
          testId="stat-card-temperature-empty"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="summary-stats">
      <StatCard
        title="Total Equipment"
        value={stats.totalEquipment}
        unit="units"
        icon={<Activity className="w-5 h-5 text-primary" />}
        colorClass="text-primary"
        testId="stat-card-total"
      />
      <StatCard
        title="Average Flowrate"
        value={stats.avgFlowrate}
        unit="m³/h"
        icon={<Droplets className="w-5 h-5 text-blue-500" />}
        range={stats.flowrateRange}
        colorClass="text-blue-500"
        testId="stat-card-flowrate"
      />
      <StatCard
        title="Average Pressure"
        value={stats.avgPressure}
        unit="bar"
        icon={<Gauge className="w-5 h-5 text-accent" />}
        range={stats.pressureRange}
        colorClass="text-accent"
        testId="stat-card-pressure"
      />
      <StatCard
        title="Average Temperature"
        value={stats.avgTemperature}
        unit="°C"
        icon={<Thermometer className="w-5 h-5 text-orange-500" />}
        range={stats.temperatureRange}
        colorClass="text-orange-500"
        testId="stat-card-temperature"
      />
    </div>
  );
}
