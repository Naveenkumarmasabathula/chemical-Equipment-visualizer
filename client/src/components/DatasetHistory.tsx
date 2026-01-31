import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  History,
  FileSpreadsheet,
  Hash,
  ChevronRight,
  Trash2,
  Clock,
  Pin,
  PinOff,
} from "lucide-react";
import type { Dataset } from "@shared/schema";
import { cn } from "@/lib/utils";

interface DatasetHistoryProps {
  datasets: Dataset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

const itemMetaClass = "text-[8.25px] text-muted-foreground sm:text-[9px]";
const itemBadgeClass = "shrink-0 px-1.5 py-0 text-[7.5px] font-normal leading-tight sm:text-[9px]";
const iconBtnClass = "h-8 w-8 shrink-0 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0";

function DatasetItem({
  dataset,
  isSelected,
  onSelect,
  onPin,
  onRequestDelete,
}: {
  dataset: Dataset;
  isSelected: boolean;
  onSelect: () => void;
  onPin?: () => void;
  onRequestDelete?: () => void;
}) {
  const pinned = !!dataset.pinned;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex w-full min-w-0 rounded-lg border p-3 transition-all duration-200",
        "cursor-pointer select-none outline-none hover:bg-muted/50",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isSelected
          ? "min-h-[88px] border-primary/30 bg-primary/5 sm:min-h-[84px]"
          : "min-h-[80px] border-transparent sm:min-h-[76px]"
      )}
      data-testid={`dataset-item-${dataset.id}`}
      aria-pressed={isSelected}
      aria-label={`Select dataset ${dataset.name}`}
    >
      <div className="flex w-full min-w-0 items-start gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors",
            isSelected ? "bg-primary/10" : "bg-muted"
          )}
          aria-hidden
        >
          <FileSpreadsheet
            className={cn(
              "h-3.5 w-3.5 sm:h-4 sm:w-4",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="break-words text-[9px] font-medium leading-tight text-foreground sm:text-[10.5px]"
              data-testid={`text-dataset-name-${dataset.id}`}
            >
              {dataset.name}
            </span>
            {pinned && (
              <Badge variant="outline" className={cn(itemBadgeClass, "gap-1")}>
                <Pin className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                Pinned
              </Badge>
            )}
            {isSelected && (
              <Badge variant="secondary" className={itemBadgeClass}>
                Active
              </Badge>
            )}
          </div>
          <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-0.5", itemMetaClass)}>
            <span className="inline-flex items-center gap-1">
              <Hash className="h-2.5 w-2.5 shrink-0 sm:h-[9px] sm:w-[9px]" aria-hidden />
              {dataset.totalCount} items
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 shrink-0 sm:h-[9px] sm:w-[9px]" aria-hidden />
              {formatDate(dataset.uploadedAt)}
            </span>
          </div>
          <div
            className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5", itemMetaClass)}
            aria-label={`Flow ${dataset.avgFlowrate.toFixed(1)}, Pressure ${dataset.avgPressure.toFixed(1)}, Temperature ${dataset.avgTemperature.toFixed(1)}`}
          >
            <span data-testid={`text-flow-${dataset.id}`}>Flow: {dataset.avgFlowrate.toFixed(1)}</span>
            <span className="text-border" aria-hidden>|</span>
            <span data-testid={`text-press-${dataset.id}`}>Press: {dataset.avgPressure.toFixed(1)}</span>
            <span className="text-border" aria-hidden>|</span>
            <span data-testid={`text-temp-${dataset.id}`}>Temp: {dataset.avgTemperature.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-1.5">
          {onPin && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(iconBtnClass, pinned && "text-primary")}
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              title={pinned ? "Unpin from top" : "Pin to top"}
              aria-label={pinned ? "Unpin dataset" : "Pin dataset to top"}
              data-testid={`button-pin-${dataset.id}`}
            >
              {pinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
          {onRequestDelete && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(iconBtnClass, "text-muted-foreground hover:text-destructive")}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete();
              }}
              title="Delete dataset"
              aria-label={`Delete dataset ${dataset.name}`}
              data-testid={`button-delete-${dataset.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-primary" : "text-muted-foreground")}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

function DatasetItemSkeleton({ index }: { index: number }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-transparent p-3" data-testid={`skeleton-dataset-${index}`}>
      <div className="h-9 w-9 shrink-0 rounded-md bg-muted animate-pulse sm:h-8 sm:w-8" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded bg-muted animate-pulse sm:h-4" />
        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        <div className="h-3 w-full max-w-[180px] rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function DatasetHistory({
  datasets,
  selectedId,
  onSelect,
  onDelete,
  onPin,
  isLoading,
}: DatasetHistoryProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const datasetToDelete = deleteConfirmId
    ? datasets.find((d) => d.id === deleteConfirmId)
    : null;

  const handleConfirmDelete = () => {
    if (deleteConfirmId && onDelete) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <Card className="h-full min-w-0 overflow-hidden">
        <CardHeader className="space-y-1 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle
              className="flex items-center gap-2 truncate text-sm font-semibold sm:text-base"
              data-testid="text-history-title"
            >
              <History className="h-4 w-4 shrink-0 text-muted-foreground" />
              Dataset History
            </CardTitle>
            <Badge
              variant="outline"
              className="shrink-0 px-2 py-0.5 text-xs font-normal"
              data-testid="badge-dataset-count"
            >
              {datasets.length}/5
            </Badge>
          </div>
          <p
            className="text-xs text-muted-foreground"
            data-testid="text-history-description"
          >
            Last 5 datasets • Pin to keep at top
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[320px] sm:h-[380px] md:h-[440px]">
            <div className="min-w-0 space-y-4 px-4 pb-6 pt-1 sm:px-5 sm:pb-8 sm:pt-2">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <DatasetItemSkeleton key={i} index={i} />
                  ))}
                </div>
              ) : datasets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p
                    className="font-medium text-sm text-foreground"
                    data-testid="text-no-datasets"
                  >
                    No datasets yet
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Upload a CSV file to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pr-4 sm:pr-6">
                  {datasets.map((dataset) => (
                    <DatasetItem
                      key={dataset.id}
                      dataset={dataset}
                      isSelected={dataset.id === selectedId}
                      onSelect={() => onSelect(dataset.id)}
                      onPin={onPin ? () => onPin(dataset.id) : undefined}
                      onRequestDelete={
                        onDelete
                          ? () => setDeleteConfirmId(dataset.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirmDelete();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold sm:text-lg">Delete dataset?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              This will permanently remove &quot;{datasetToDelete?.name ?? "this dataset"}&quot; and all its equipment data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className="min-h-[44px] w-full sm:w-auto sm:min-h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="min-h-[44px] w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto sm:min-h-9"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
