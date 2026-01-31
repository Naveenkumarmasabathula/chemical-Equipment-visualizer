import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Equipment } from "@shared/schema";

interface DataTableProps {
  data: Equipment[];
  isLoading?: boolean;
}

type SortField = "equipmentName" | "equipmentType" | "flowrate" | "pressure" | "temperature";
type SortDirection = "asc" | "desc" | null;

const ITEMS_PER_PAGE = 10;

export function DataTable({ data, isLoading }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const equipmentTypes = useMemo(() => {
    const types = new Set(data.map((item) => item.equipmentType));
    return Array.from(types).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.equipmentName.toLowerCase().includes(term) ||
          item.equipmentType.toLowerCase().includes(term)
      );
    }

    if (typeFilter && typeFilter !== "all") {
      result = result.filter((item) => item.equipmentType === typeFilter);
    }

    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, typeFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-4 h-4 ml-1 text-primary" />;
    }
    return <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  const getTypeColor = (type: string): "default" | "secondary" | "outline" => {
    const hash = type.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors: ("default" | "secondary" | "outline")[] = ["default", "secondary", "outline"];
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="w-32 h-5 bg-muted rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" data-testid={`skeleton-row-${i}`} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <CardTitle className="text-lg sm:text-xl truncate" data-testid="text-table-title">
            Equipment Data
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-full min-h-[44px] sm:min-h-9"
                data-testid="input-search"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48 min-h-[44px] sm:min-h-9" data-testid="select-type-filter">
                <Filter className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-all-types">All Types</SelectItem>
                {equipmentTypes.map((type) => (
                  <SelectItem key={type} value={type} data-testid={`option-type-${type}`}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="rounded-md border overflow-x-auto overflow-y-hidden">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 font-semibold"
                    onClick={() => handleSort("equipmentName")}
                    data-testid="button-sort-name"
                  >
                    Equipment Name
                    {getSortIcon("equipmentName")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 font-semibold"
                    onClick={() => handleSort("equipmentType")}
                    data-testid="button-sort-type"
                  >
                    Type
                    {getSortIcon("equipmentType")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 ml-auto font-semibold"
                    onClick={() => handleSort("flowrate")}
                    data-testid="button-sort-flowrate"
                  >
                    Flowrate (m³/h)
                    {getSortIcon("flowrate")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 ml-auto font-semibold"
                    onClick={() => handleSort("pressure")}
                    data-testid="button-sort-pressure"
                  >
                    Pressure (bar)
                    {getSortIcon("pressure")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 ml-auto font-semibold"
                    onClick={() => handleSort("temperature")}
                    data-testid="button-sort-temperature"
                  >
                    Temperature (°C)
                    {getSortIcon("temperature")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p data-testid="text-no-results">No equipment found</p>
                      {searchTerm || typeFilter !== "all" ? (
                        <p className="text-sm">Try adjusting your filters</p>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    data-testid={`row-equipment-${index}`}
                  >
                    <TableCell className="font-medium" data-testid={`text-name-${index}`}>
                      {item.equipmentName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(item.equipmentType)} data-testid={`badge-type-${index}`}>
                        {item.equipmentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-flowrate-${index}`}>
                      {item.flowrate.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-pressure-${index}`}>
                      {item.pressure.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-temperature-${index}`}>
                      {item.temperature.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 px-3 sm:px-0">
            <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1" data-testid="text-pagination-info">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedData.length)} of {filteredAndSortedData.length}
            </p>
            <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
