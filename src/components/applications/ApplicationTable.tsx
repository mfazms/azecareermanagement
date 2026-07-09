"use client";

import { useState, useEffect } from "react";
import type { Application, ApplicationStatus } from "@/types";
import { APPLICATION_STATUSES } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  ExternalLink,
  Trash2,
  Calendar,
  ArrowUpDown,
  FileText,
} from "lucide-react";

interface ApplicationTableProps {
  applications: Application[];
  onAdd: () => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
}

function getStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case "Saved":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Applied":
    case "Administrasi":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Tes Online":
    case "Tes Psikotes":
    case "Tes Tulis":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Wawancara HR":
    case "Tes Technical":
    case "Wawancara User/Technical":
    case "Presentasi Pitch Deck":
    case "FGD / LGD":
    case "Wawancara Final":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Medical Check Up":
    case "Offering Letter":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "On Hold":
      return "bg-orange-50 text-orange-600 border-orange-200";
    case "Ghosted":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function getPriorityDot(priority?: string): string {
  switch (priority) {
    case "High":
      return "bg-red-400";
    case "Medium":
      return "bg-amber-400";
    case "Low":
      return "bg-green-400";
    default:
      return "";
  }
}

export default function ApplicationTable({
  applications,
  onAdd,
  onEdit,
  onDelete,
}: ApplicationTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  
  const [sortField, setSortField] = useState<"dateApplied" | "dateUpdated" | "company">("dateUpdated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, monthFilter, companyFilter, positionFilter, jobTypeFilter, locationFilter, sortField, sortDir]);

  // Extract unique values for filters
  const getMonthYear = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  };
  
  const uniqueCompanies = Array.from(new Set(applications.map((a) => a.company))).sort();
  const uniquePositions = Array.from(new Set(applications.map((a) => a.position))).sort();
  const uniqueMonths = Array.from(new Set(applications.map((a) => getMonthYear(a.dateApplied)))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const filtered = applications
    .filter((app) => {
      const matchSearch =
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.position.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || app.status === statusFilter;
      const matchMonth = monthFilter === "all" || getMonthYear(app.dateApplied) === monthFilter;
      const matchCompany = companyFilter === "all" || app.company === companyFilter;
      const matchPosition = positionFilter === "all" || app.position === positionFilter;
      const matchJobType = jobTypeFilter === "all" || app.jobType === jobTypeFilter;
      const matchLocation = locationFilter === "all" || app.workArrangement === locationFilter;
      
      return matchSearch && matchStatus && matchMonth && matchCompany && matchPosition && matchJobType && matchLocation;
    })
    .sort((a, b) => {
      let valA: string, valB: string;
      if (sortField === "company") {
        valA = a.company.toLowerCase();
        valB = b.company.toLowerCase();
      } else {
        valA = a[sortField] || "";
        valB = b[sortField] || "";
      }
      if (sortDir === "asc") return valA.localeCompare(valB);
      return valB.localeCompare(valA);
    });

  const toggleSort = (field: "dateApplied" | "dateUpdated" | "company") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setMonthFilter("all");
    setCompanyFilter("all");
    setPositionFilter("all");
    setJobTypeFilter("all");
    setLocationFilter("all");
  };

  const hasActiveFilters = 
    statusFilter !== "all" || monthFilter !== "all" || companyFilter !== "all" || 
    positionFilter !== "all" || jobTypeFilter !== "all" || locationFilter !== "all";

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Toolbar - Top Row (Search & Action) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input
            placeholder="Search company or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 w-full rounded-xl bg-white border-[#D1D1D6] shadow-sm focus:border-[#0071E3] focus:ring-blue-500/20 text-[#1D1D1F] transition-all"
          />
        </div>

        <Button
          onClick={onAdd}
          className="h-11 w-full sm:w-auto px-6 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-lg shadow-blue-500/15 transition-all cursor-pointer font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Application
        </Button>
      </div>

      {/* Toolbar - Bottom Row (Filters) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[145px] h-9 rounded-lg bg-white border-[#E8E8ED] text-xs">
            <div className="flex items-center gap-1 overflow-hidden text-left w-full">
              <span className="text-[#86868B] shrink-0">Status:</span>
              <SelectValue placeholder="All" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All</SelectItem>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={monthFilter} onValueChange={(v) => setMonthFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#E8E8ED] text-xs">
            <div className="flex items-center gap-1 overflow-hidden text-left w-full">
              <span className="text-[#86868B] shrink-0">Month:</span>
              <SelectValue placeholder="All" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All</SelectItem>
            {uniqueMonths.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={companyFilter} onValueChange={(v) => setCompanyFilter(v ?? "all")}>
          <SelectTrigger className="w-[145px] h-9 rounded-lg bg-white border-[#E8E8ED] text-xs">
            <div className="flex items-center gap-1 overflow-hidden text-left w-full">
              <span className="text-[#86868B] shrink-0">Company:</span>
              <SelectValue placeholder="All" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All</SelectItem>
            {uniqueCompanies.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={positionFilter} onValueChange={(v) => setPositionFilter(v ?? "all")}>
          <SelectTrigger className="w-[145px] h-9 rounded-lg bg-white border-[#E8E8ED] text-xs">
            <div className="flex items-center gap-1 overflow-hidden text-left w-full">
              <span className="text-[#86868B] shrink-0">Position:</span>
              <SelectValue placeholder="All" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All</SelectItem>
            {uniquePositions.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={jobTypeFilter} onValueChange={(v) => setJobTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-[145px] h-9 rounded-lg bg-white border-[#E8E8ED] text-xs">
            <div className="flex items-center gap-1 overflow-hidden text-left w-full">
              <span className="text-[#86868B] shrink-0">Type:</span>
              <SelectValue placeholder="All" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Fulltime">Fulltime</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="Internship">Internship</SelectItem>
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg bg-white border-[#E8E8ED] text-xs">
            <div className="flex items-center gap-1 overflow-hidden text-left w-full">
              <span className="text-[#86868B] shrink-0">Location:</span>
              <SelectValue placeholder="All" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="WFO">WFO</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="h-9 px-3 text-xs text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E8E8ED] rounded-lg cursor-pointer transition-colors ml-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E8ED] shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-[#C7C7CC]" />
            </div>
            <p className="text-[#1D1D1F] font-medium mb-1">
              {applications.length === 0
                ? "No applications yet"
                : "No results found"}
            </p>
            <p className="text-sm text-[#86868B]">
              {applications.length === 0
                ? "Click \"Add Application\" to start tracking"
                : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E8E8ED] hover:bg-transparent">
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("company")}
                  >
                    <div className="flex items-center gap-1">
                      Company
                      <ArrowUpDown className="w-3 h-3 text-[#C7C7CC]" />
                    </div>
                  </TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("dateApplied")}
                  >
                    <div className="flex items-center gap-1">
                      Date Applied
                      <ArrowUpDown className="w-3 h-3 text-[#C7C7CC]" />
                    </div>
                  </TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((app) => (
                  <TableRow
                    key={app.id}
                    className="group border-[#F5F5F7] cursor-pointer hover:bg-blue-50/40 hover:shadow-[inset_3px_0_0_0_#0071E3] transition-all duration-300"
                    onClick={() => onEdit(app)}
                  >
                    <TableCell className="font-medium text-[#1D1D1F]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 group-hover:text-[#0071E3] transition-colors duration-300">
                          {app.priority && (
                            <div
                              className={`w-2 h-2 rounded-full ${getPriorityDot(
                                app.priority
                              )}`}
                              title={`Priority: ${app.priority}`}
                            />
                          )}
                          {app.company}
                        </div>
                        {app.location && (
                          <span className="text-xs text-[#86868B] font-normal">{app.location}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#86868B]">
                      <div className="flex flex-col gap-1">
                        <span>{app.position}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {app.jobType && (
                            <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-none">
                              {app.jobType}
                            </Badge>
                          )}
                          {app.workArrangement && (
                            <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-none">
                              {app.workArrangement}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(app.status)} text-xs font-medium rounded-lg px-2.5 py-0.5`}
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#86868B] text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(app.dateApplied).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#86868B] text-sm">
                      <div className="flex items-center gap-1.5">
                        {app.cvFileName ? (
                          <span className="flex items-center gap-1 text-[#0071E3]">
                            <FileText className="w-3.5 h-3.5" />
                            {app.cvVersion || "CV"}
                          </span>
                        ) : (
                          app.cvVersion || "—"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {app.jobLink && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-[#0071E3] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(app.jobLink, "_blank");
                            }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(app.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#86868B]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} applications
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs px-3 rounded-lg border-[#E8E8ED]"
              >
                Previous
              </Button>
              <div className="flex items-center justify-center min-w-[32px] text-xs font-medium text-[#1D1D1F]">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs px-3 rounded-lg border-[#E8E8ED]"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
