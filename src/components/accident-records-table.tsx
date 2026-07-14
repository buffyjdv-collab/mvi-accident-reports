'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AccidentReport } from '@/lib/report-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  Trash2,
  Printer,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Pencil,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import ImageLightbox from '@/components/image-lightbox';

interface AccidentRecordsTableProps {
  refreshTrigger: number;
  onPrintReport: (report: AccidentReport) => void;
  onEditReport: (report: AccidentReport) => void;
}

const PAGE_SIZE = 10;

function ViewFieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-sm text-slate-900">{value || '\u2014'}</span>
    </div>
  );
}

export default function AccidentRecordsTable({
  refreshTrigger,
  onPrintReport,
  onEditReport,
}: AccidentRecordsTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  // Filter dropdowns: by year (derived from accidentDate) and by district.
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');

  const [viewReport, setViewReport] = useState<AccidentReport | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; name: string } | null>(null);
  // Tracks which action a user tried to perform without permission, so we can
  // surface the "Administrator Approval Required" dialog.
  const [lockedAction, setLockedAction] = useState<string | null>(null);

  // Derive per-action permission flags. ADMINs always have full access.
  const isAdmin = user?.role === 'ADMIN';
  const canView = isAdmin || !!user?.canViewReports;
  const canEdit = isAdmin || !!user?.canEditReports;
  const canPrint = isAdmin || !!user?.canPrintReports;
  const canDelete = isAdmin || !!user?.canDeleteReports;
  // True when the user cannot view reports at all (either known client-side
  // or returned as a 403 from the API). Replaces the table with a notice.
  const viewDenied = (!!user && !canView) || lockedAction === 'view reports';

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (res.status === 401) {
        setReports([]);
        return;
      }
      // 403 = administrator has revoked the user's view permission. Surface
      // the "Administrator Approval Required" panel instead of an error toast.
      if (res.status === 403) {
        setReports([]);
        setLockedAction('view reports');
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.error || errData.hint || `Server error (${res.status})`;
        throw new Error(msg);
      }
      const data: AccidentReport[] = await res.json();
      setReports(data);
    } catch (error) {
      toast({
        title: 'Database Error',
        description: error instanceof Error ? error.message : 'Failed to load reports',
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // If we already know the user can't view, don't bother hitting the API —
    // just surface the permission-denied panel.
    if (user && !canView) {
      setLoading(false);
      return;
    }
    fetchReports();
  }, [fetchReports, refreshTrigger, user, canView]);

  const handleDelete = async () => {
    if (!deleteReportId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${deleteReportId}`, { method: 'DELETE' });
      // 403 = administrator has revoked delete permission since the page loaded.
      if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        setDeleteReportId(null);
        setLockedAction(err.action || 'delete reports');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete report');
      }
      toast({ title: 'Report Deleted', description: 'The report has been successfully deleted.' });
      setReports((prev) => prev.filter((r) => r.id !== deleteReportId));
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteReportId(null);
    }
  };

  // Derive the list of distinct years (from accidentDate) and districts
  // present in the loaded reports, so the filter dropdowns only offer values
  // that actually exist. Years are sorted descending.
  const availableYears: string[] = Array.from(
    new Set(
      reports
        .map((r) => (r.accidentDate ? String(r.accidentDate).slice(0, 4) : ''))
        .filter((y) => y && /^\d{4}$/.test(y))
    )
  ).sort((a, b) => Number(b) - Number(a));

  const availableDistricts: string[] = Array.from(
    new Set(reports.map((r) => r.district).filter((d): d is string => !!d))
  ).sort((a, b) => a.localeCompare(b));

  const filtered = reports.filter((r) => {
    // Year filter: match the year portion of accidentDate (YYYY-MM-DD or similar).
    if (filterYear !== 'all') {
      const year = r.accidentDate ? String(r.accidentDate).slice(0, 4) : '';
      if (year !== filterYear) return false;
    }
    // District filter.
    if (filterDistrict !== 'all') {
      if ((r.district || '') !== filterDistrict) return false;
    }
    // Free-text search.
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.crimeNo.toLowerCase().includes(term) ||
      r.policeStation.toLowerCase().includes(term) ||
      (r.regNo && r.regNo.toLowerCase().includes(term)) ||
      (r.ownerName && r.ownerName.toLowerCase().includes(term)) ||
      (r.driverName && r.driverName.toLowerCase().includes(term))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortField] ?? '';
    const bVal = (b as Record<string, unknown>)[sortField] ?? '';
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-slate-400 text-xs">
      {sortField === field ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u21C5'}
    </span>
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {viewDenied ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-amber-300 bg-amber-50/50 rounded-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4">
            <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Administrator Approval Required
          </h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md">
            You do not have permission to view accident reports. Please
            contact an administrator to request access.
          </p>
        </div>
      ) : (
        <>
      {/* Search & Filters & Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Crime No, PS, Reg No..."
              className="pl-9 border-slate-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-slate-600 bg-slate-100">
              {filtered.length} report{filtered.length !== 1 ? 's' : ''}
            </Badge>
            {isAdmin && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Admin View — All users
              </Badge>
            )}
          </div>
        </div>
        {/* Filter dropdowns: by year and by district. Only shown when there is
            at least one value to filter by. Resetting to "all" clears the filter. */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Filter:
            </span>
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={filterYear}
              onValueChange={(value) => {
                setFilterYear(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="border-slate-300 h-9">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-52">
            <Select
              value={filterDistrict}
              onValueChange={(value) => {
                setFilterDistrict(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="border-slate-300 h-9">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {availableDistricts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(filterYear !== 'all' || filterDistrict !== 'all') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700 h-9"
              onClick={() => {
                setFilterYear('all');
                setFilterDistrict('all');
                setCurrentPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <span className="ml-3 text-slate-500">Loading reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FileText className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">No reports found</p>
          <p className="text-sm">
            {searchTerm ? 'Try adjusting your search terms.' : 'Create a new report to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead
                      className="cursor-pointer select-none font-semibold text-slate-700"
                      onClick={() => handleSort('crimeNo')}
                    >
                      Crime No <SortIcon field="crimeNo" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none font-semibold text-slate-700"
                      onClick={() => handleSort('policeStation')}
                    >
                      Police Station <SortIcon field="policeStation" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none font-semibold text-slate-700"
                      onClick={() => handleSort('district')}
                    >
                      District <SortIcon field="district" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none font-semibold text-slate-700"
                      onClick={() => handleSort('accidentDate')}
                    >
                      Accident Date <SortIcon field="accidentDate" />
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">Vehicle Reg No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Owner</TableHead>
                    <TableHead className="font-semibold text-slate-700">Driver</TableHead>
                    {isAdmin && (
                      <TableHead className="font-semibold text-slate-700">Author</TableHead>
                    )}
                    <TableHead
                      className="cursor-pointer select-none font-semibold text-slate-700"
                      onClick={() => handleSort('createdAt')}
                    >
                      Created <SortIcon field="createdAt" />
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((report) => (
                    <TableRow key={report.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-800">
                        {report.crimeNo}
                      </TableCell>
                      <TableCell className="text-slate-600">{report.policeStation}</TableCell>
                      <TableCell className="text-slate-600">{report.district || '—'}</TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(report.accidentDate)}
                      </TableCell>
                      <TableCell className="text-slate-600">{report.regNo || '\u2014'}</TableCell>
                      <TableCell className="text-slate-600 max-w-[150px] truncate">
                        {report.ownerName || '\u2014'}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-[150px] truncate">
                        {report.driverName || '\u2014'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-slate-600">
                          {report.user ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{report.user.name}</span>
                              <span className="text-xs text-slate-400">{report.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{'\u2014'}</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-slate-600 text-xs">
                        {formatDateTime(report.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                canView
                                  ? setViewReport(report)
                                  : setLockedAction('view reports')
                              }
                              className={!canView ? 'text-slate-400' : ''}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                              {!canView && <Lock className="h-3 w-3 ml-auto text-slate-400" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                canEdit
                                  ? onEditReport(report)
                                  : setLockedAction('edit reports')
                              }
                              className={!canEdit ? 'text-slate-400' : ''}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                              {!canEdit && <Lock className="h-3 w-3 ml-auto text-slate-400" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                canPrint
                                  ? onPrintReport(report)
                                  : setLockedAction('print reports')
                              }
                              className={!canPrint ? 'text-slate-400' : ''}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                              {!canPrint && <Lock className="h-3 w-3 ml-auto text-slate-400" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                canDelete
                                  ? setDeleteReportId(report.id)
                                  : setLockedAction('delete reports')
                              }
                              className={
                                canDelete
                                  ? 'text-red-600 focus:text-red-600'
                                  : 'text-slate-400'
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                              {!canDelete && <Lock className="h-3 w-3 ml-auto text-slate-400" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev !== undefined && page - prev > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-2 py-1 text-slate-400 text-sm">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? 'bg-slate-800 text-white'
                              : 'border-slate-300'
                          }
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
        </>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              Report Details — Crime No: {viewReport?.crimeNo}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Detailed view of the accident inspection report
            </DialogDescription>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4 mt-2">
              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  Header
                </h3>
                <ViewFieldRow label="Crime No" value={viewReport.crimeNo} />
                <ViewFieldRow label="Section" value={viewReport.section} />
                <ViewFieldRow label="District" value={viewReport.district} />
                <ViewFieldRow label="Police Station" value={viewReport.policeStation} />
                {isAdmin && viewReport.user && (
                  <ViewFieldRow label="Author" value={`${viewReport.user.name} (${viewReport.user.email})`} />
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  Requisition &amp; Receipt
                </h3>
                <ViewFieldRow label="1. Officer Name" value={viewReport.officerName} />
                <ViewFieldRow label="Officer Address" value={viewReport.officerAddress} />
                <ViewFieldRow label="2. Receipt Date" value={viewReport.receiptDate} />
                <ViewFieldRow label="Receipt Details" value={viewReport.receiptDetails} />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  Accident Details
                </h3>
                <ViewFieldRow label="3. Accident Date" value={viewReport.accidentDate} />
                <ViewFieldRow label="Accident Time" value={viewReport.accidentTime} />
                <ViewFieldRow label="Accident Place" value={viewReport.accidentPlace} />
                <ViewFieldRow label="4. Road Description" value={viewReport.roadDescription} />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  Vehicle Details
                </h3>
                <ViewFieldRow label="5. Chassis No" value={viewReport.chassisNo} />
                <ViewFieldRow label="Registration No" value={viewReport.regNo} />
                <ViewFieldRow label="Class of Vehicle" value={viewReport.vehicleClass} />
                <ViewFieldRow label="Make/Model" value={viewReport.vehicleMake} />
                <ViewFieldRow label="Year of Manufacture" value={viewReport.vehicleYear} />
                <ViewFieldRow label="6. Inspection Date" value={viewReport.inspectionDate} />
                <ViewFieldRow label="Inspection Time" value={viewReport.inspectionTime} />
                <ViewFieldRow label="Inspection Place" value={viewReport.inspectionPlace} />
                <ViewFieldRow label="7. Last Inspection" value={viewReport.lastInspectionDate} />
                <ViewFieldRow label="Fitness cert Expiry" value={viewReport.fitnessCertExpiryDate} />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  Damages &amp; Brakes
                </h3>
                <ViewFieldRow label="8. Damages" value={viewReport.damagesDetails} />
                <ViewFieldRow label="9a. Foot Brake" value={viewReport.footBrakeEfficiency} />
                <ViewFieldRow label="9b. Parking Brake" value={viewReport.parkingBrakeEfficiency} />
                <ViewFieldRow label="9c. Even Action" value={viewReport.brakeEvenAction} />
                <ViewFieldRow label="10. Hydraulic" value={viewReport.hydraulicFluidLeak} />
                <ViewFieldRow label="10. Mechanical" value={viewReport.mechanicalLackLubrication} />
                <ViewFieldRow label="11. Parking Brake Failure" value={viewReport.parkingBrakeLackLubrication} />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  Steering, Tyres &amp; Documents
                </h3>
                <ViewFieldRow label="12. Steering Backlash" value={viewReport.steeringBacklash} />
                <ViewFieldRow label="13. Tyre Condition" value={viewReport.tyreCondition} />
                <ViewFieldRow label="14. Permit Validity" value={viewReport.permitValidity} />
                <ViewFieldRow label="15. Insurance Expiry" value={viewReport.insuranceExpiryDate} />
                {viewReport.insuranceExpiryDate && viewReport.insuranceExpiryDate !== 'Not Produced' && viewReport.insuranceExpiryDate !== 'IC Not Produced' && viewReport.insuranceExpiryDate !== 'Not Applicable' && (
                  <>
                    <ViewFieldRow label="Insurance Company" value={viewReport.insuranceCompany} />
                    <ViewFieldRow label="Policy No" value={viewReport.insurancePolicyNo} />
                  </>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  People
                </h3>
                <ViewFieldRow label="16. Owner" value={viewReport.ownerName} />
                <ViewFieldRow label="Owner Address" value={viewReport.ownerAddress} />
                <ViewFieldRow label="17. Driver" value={viewReport.driverName} />
                <ViewFieldRow label="Driver Address" value={viewReport.driverAddress} />
                <ViewFieldRow label="18. Licence Details" value={viewReport.driverLicenceDetails} />
                {viewReport.driverLicenceDetails === 'Valid' && (
                  <>
                    <ViewFieldRow label="DL Number" value={viewReport.driverLicenceNo} />
                    <ViewFieldRow label="Valid Upto" value={viewReport.driverLicenceValidUpto} />
                  </>
                )}
                <ViewFieldRow label="19. Involved Persons" value={viewReport.involvedPersonDetails} />
                <ViewFieldRow label="20. Legal Heirs" value={viewReport.legalHeirsDetails} />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  Conclusion
                </h3>
                <ViewFieldRow label="21. Mechanical Defects" value={viewReport.mechanicalDefectsOpinion} />
                <ViewFieldRow label="22. Trade Plate" value={viewReport.tradePlateDetails} />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                  VCR &amp; Copy
                </h3>
                <ViewFieldRow label="VCR No" value={viewReport.vcrNo} />
                <ViewFieldRow label="VCR Date" value={viewReport.vcrDate} />
                <ViewFieldRow label="Copy To" value={viewReport.copyTo} />
              </div>

              {/* Accident Photos */}
              {(viewReport.image1 || viewReport.image2) && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                    Accident Photos
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {viewReport.image1 && (
                      <button
                        type="button"
                        onClick={() => setLightboxImage({
                          src: viewReport.image1!,
                          alt: 'Accident photo 1',
                          name: `crime-${viewReport.crimeNo}-photo-1.jpg`,
                        })}
                        className="group relative border border-slate-300 rounded-lg overflow-hidden hover:ring-2 hover:ring-slate-400 transition-all"
                      >
                        { }
                        <img
                          src={viewReport.image1}
                          alt="Accident photo 1"
                          className="w-full h-32 object-cover"
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded transition-opacity">
                            Click to view
                          </span>
                        </span>
                      </button>
                    )}
                    {viewReport.image2 && (
                      <button
                        type="button"
                        onClick={() => setLightboxImage({
                          src: viewReport.image2!,
                          alt: 'Accident photo 2',
                          name: `crime-${viewReport.crimeNo}-photo-2.jpg`,
                        })}
                        className="group relative border border-slate-300 rounded-lg overflow-hidden hover:ring-2 hover:ring-slate-400 transition-all"
                      >
                        { }
                        <img
                          src={viewReport.image2}
                          alt="Accident photo 2"
                          className="w-full h-32 object-cover"
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded transition-opacity">
                            Click to view
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => {
                    onPrintReport(viewReport);
                    setViewReport(null);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReportId} onOpenChange={(open) => !open && setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Lightbox */}
      <ImageLightbox
        src={lightboxImage?.src ?? null}
        alt={lightboxImage?.alt ?? ''}
        open={!!lightboxImage}
        onOpenChange={(open) => !open && setLightboxImage(null)}
        downloadName={lightboxImage?.name}
      />

      {/* "Administrator Approval Required" notice — shown when a user
          attempts an action (edit / print / delete) they don't have
          permission for. */}
      <AlertDialog
        open={!!lockedAction && !viewDenied}
        onOpenChange={(open) => !open && setLockedAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Administrator Approval Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You do not have permission to {lockedAction}. Please contact an
              administrator to request access to this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setLockedAction(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
