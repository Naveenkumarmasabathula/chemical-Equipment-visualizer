import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { FileUpload } from "@/components/FileUpload";
import { DataTable } from "@/components/DataTable";
import { Charts } from "@/components/Charts";
import { SummaryStats } from "@/components/SummaryStats";
import { DatasetHistory } from "@/components/DatasetHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, AUTH_STORAGE_KEY } from "@/lib/queryClient";
import { 
  Beaker, 
  LayoutDashboard, 
  Table2, 
  BarChart3,
  RefreshCw,
  FileDown,
  LogOut
} from "lucide-react";
import { useLocation } from "wouter";
import type { Dataset, DatasetWithEquipment, SummaryStats as SummaryStatsType } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { getAuthHeader, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<Dataset[]>({
    queryKey: ["/api/datasets"],
  });

  const { data: selectedDataset, isLoading: datasetLoading } = useQuery<DatasetWithEquipment>({
    queryKey: ["/api/datasets", selectedDatasetId],
    enabled: !!selectedDatasetId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<SummaryStatsType>({
    queryKey: ["/api/summary", selectedDatasetId],
    enabled: !!selectedDatasetId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        try {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
          window.location.href = "/login";
        } catch {}
        throw new Error("Session expired. Please sign in again.");
      }

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }
      
      try {
        return await response.json();
      } catch (e) {
        throw new Error("Invalid response from server");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
      setSelectedDatasetId(data.dataset.id);
      toast({
        title: "Upload successful",
        description: `${data.dataset.totalCount} equipment records processed`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/datasets/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
      if (selectedDatasetId === deletedId) {
        setSelectedDatasetId(datasets.length > 1 ? datasets.find(d => d.id !== deletedId)?.id || null : null);
      }
      toast({
        title: "Dataset deleted",
        description: "The dataset has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Could not delete the dataset",
        variant: "destructive",
      });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/datasets/${id}`, {});
      const data = await res.json();
      return data as { pinned: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
      toast({
        title: data.pinned ? "Dataset pinned" : "Dataset unpinned",
        description: data.pinned ? "Pinned datasets stay at the top" : "Dataset removed from top",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not update pin state",
        variant: "destructive",
      });
    },
  });

  const handleUpload = useCallback(
    async (file: File) => {
      await uploadMutation.mutateAsync(file);
    },
    [uploadMutation]
  );

  const handleSelectDataset = useCallback((id: string) => {
    setSelectedDatasetId(id);
  }, []);

  const handleDeleteDataset = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handlePinDataset = useCallback(
    (id: string) => {
      pinMutation.mutate(id);
    },
    [pinMutation]
  );

  const handleDownloadPdf = useCallback(() => {
    if (!selectedDatasetId) return;
    const url = `/api/datasets/${selectedDatasetId}/report.pdf`;
    const headers = getAuthHeader();
    fetch(url, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to generate PDF");
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `dataset_${selectedDatasetId}_report.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast({ title: "PDF downloaded", description: "Report saved" });
      })
      .catch(() => {
        toast({
          title: "PDF download failed",
          description: "Could not generate report",
          variant: "destructive",
        });
      });
  }, [selectedDatasetId, getAuthHeader, toast]);

  const handleLogout = useCallback(() => {
    logout();
    setLocation("/login");
  }, [logout, setLocation]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
    if (selectedDatasetId) {
      queryClient.invalidateQueries({ queryKey: ["/api/datasets", selectedDatasetId] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary", selectedDatasetId] });
    }
  }, [selectedDatasetId]);

  return (
    <div className="min-h-screen bg-background safe-area-padding" data-testid="dashboard-container">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-testid="header">
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 mx-auto max-w-[1600px]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-0.5 sm:p-1 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
              <img src="/static/favicon.png" alt="" className="w-[3.75rem] h-[3.75rem] sm:w-9 sm:h-9 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate" data-testid="text-app-title">
                Chemical Equipment Visualizer
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block truncate" data-testid="text-app-subtitle">
                Parameter analysis and visualization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {selectedDatasetId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-9 sm:w-9"
                onClick={handleDownloadPdf}
                title="Download PDF report"
              >
                <FileDown className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-9 sm:w-9"
              onClick={handleRefresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-9 sm:w-9" onClick={handleLogout} title="Log out">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-[1600px]" data-testid="main-content">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <aside className="lg:col-span-1 min-w-0 lg:min-w-[280px]" data-testid="sidebar">
            <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">
              <FileUpload
                onUpload={handleUpload}
                isUploading={uploadMutation.isPending}
              />
              <DatasetHistory
                datasets={datasets}
                selectedId={selectedDatasetId}
                onSelect={handleSelectDataset}
                onDelete={handleDeleteDataset}
                onPin={handlePinDataset}
                isLoading={datasetsLoading}
              />
            </div>
          </aside>

          <section className="lg:col-span-3 space-y-4 sm:space-y-6 min-w-0" data-testid="content-area">
            {!selectedDatasetId && !datasetsLoading && datasets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4" data-testid="empty-state">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
                  <Beaker className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2 px-2" data-testid="text-welcome-title">
                  Welcome to Chemical Equipment Visualizer
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md px-2" data-testid="text-welcome-description">
                  Upload a CSV file containing equipment data to get started. The file should include
                  columns for Equipment Name, Type, Flowrate, Pressure, and Temperature.
                </p>
              </div>
            ) : (
              <>
                <SummaryStats
                  stats={stats || null}
                  isLoading={statsLoading || datasetLoading}
                />

                <Tabs defaultValue="dashboard" className="w-full overflow-hidden" data-testid="main-tabs">
                  <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10 gap-1 p-1" data-testid="tabs-main">
                    <TabsTrigger value="dashboard" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-0" data-testid="tab-dashboard">
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="table" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-0" data-testid="tab-table">
                      <Table2 className="w-4 h-4 shrink-0" />
                      <span>Table</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-0" data-testid="tab-charts">
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      <span>Charts</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6" data-testid="tab-content-dashboard">
                    <Charts
                      equipment={selectedDataset?.equipment || []}
                      stats={stats || null}
                      isLoading={datasetLoading || statsLoading}
                    />
                    <DataTable
                      data={selectedDataset?.equipment || []}
                      isLoading={datasetLoading}
                    />
                  </TabsContent>

                  <TabsContent value="table" className="mt-4 sm:mt-6" data-testid="tab-content-table">
                    <DataTable
                      data={selectedDataset?.equipment || []}
                      isLoading={datasetLoading}
                    />
                  </TabsContent>

                  <TabsContent value="charts" className="mt-4 sm:mt-6" data-testid="tab-content-charts">
                    <Charts
                      equipment={selectedDataset?.equipment || []}
                      stats={stats || null}
                      isLoading={datasetLoading || statsLoading}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t mt-8 sm:mt-12" data-testid="footer">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-muted-foreground max-w-[1600px]">
          <p data-testid="text-footer-title">Chemical Equipment Parameter Visualizer</p>
          <p className="mt-1" data-testid="text-footer-description">Last 5 datasets are stored for analysis</p>
        </div>
      </footer>
    </div>
  );
}
