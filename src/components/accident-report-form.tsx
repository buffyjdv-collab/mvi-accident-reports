'use client';

import React, { useState, useEffect } from 'react';
import { AccidentReport, AccidentReportFormData, getEmptyFormData, reportToFormData } from '@/lib/report-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  RotateCcw,
  FileText,
  ImagePlus,
  X,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { fileToCompressedDataUrl } from '@/lib/image-helper';
import {
  DISTRICT_NAMES,
  getDivisionsForDistrict,
  getStationsForDistrict,
} from '@/lib/telangana-data';

interface AccidentReportFormProps {
  onSubmitted: () => void;
  editReport?: AccidentReport | null;
  onEditCancel?: () => void;
}

// Helper: detect motorcycle / two-wheeler class
function isMotorcycleClass(vehicleClass: string | null | undefined): boolean {
  const v = (vehicleClass || '').toLowerCase().trim();
  return (
    v === 'motor cycle' ||
    v === 'motorcycle' ||
    v.includes('motor cycle') ||
    v.includes('motorcycle') ||
    v.includes('two wheeler') ||
    v === 'motor cycle (mc)' ||
    v === 'mc' ||
    v === 'm/c'
  );
}

// UCTD: Unable to Conduct Driving Test
// Long radio text shown at Sl No 9 (Condition of brakes) when the inspector could
// not conduct a driving test due to accident damage.
export const UCTD_BRAKE_TEXT =
  'Unable to conduct driving test due to Damages sustained by the vehicle due to Accident however i have throughly inspected the Braking System Adopted by the vehicle and found that the braking system was intact prior to the accedent';

export default function AccidentReportForm({ onSubmitted, editReport, onEditCancel }: AccidentReportFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  // ADMIN always has full access; otherwise check the per-user flag. This
  // covers both creating new reports (POST) and editing existing ones (PUT).
  const canEdit = user?.role === 'ADMIN' || !!user?.canEditReports;
  const [formData, setFormData] = useState<AccidentReportFormData>(getEmptyFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roadInspectionType, setRoadInspectionType] = useState<'police_station' | 'accident_site'>('police_station');
  const [insuranceType, setInsuranceType] = useState<'Valid' | 'Not Produced' | 'Not Applicable' | ''>('Valid');
  const [fitnessType, setFitnessType] = useState<'Select Date' | 'Not Produced' | 'Not Applicable'>('Select Date');
  const [permitType, setPermitType] = useState<'Select Date' | 'Not Produced' | 'Not Applicable'>('Select Date');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState<'image1' | 'image2' | null>(null);

  // Load edit report when provided
  useEffect(() => {
    if (editReport) {
      setFormData(reportToFormData(editReport));
      setEditingId(editReport.id);
      setRoadInspectionType(editReport.roadDescription?.includes('Inspected the vehicle at') ? 'police_station' : 'accident_site');
      const insDate = editReport.insuranceExpiryDate || '';
      setInsuranceType(insDate === 'IC Not Produced' ? 'Not Produced' : insDate === 'Not Applicable' ? 'Not Applicable' : insDate ? 'Valid' : 'Valid');
      const fcDate = editReport.fitnessCertExpiryDate || '';
      setFitnessType(fcDate === 'FC Not Produced' ? 'Not Produced' : fcDate === 'Not Applicable' ? 'Not Applicable' : 'Select Date');
      const pvDate = editReport.permitValidity || '';
      setPermitType(pvDate === 'Permit Not Produced' || pvDate === 'Not Produced' ? 'Not Produced' : pvDate === 'Not Applicable' ? 'Not Applicable' : 'Select Date');
    } else {
      setEditingId(null);
    }
  }, [editReport]);

  // Auto-update when vehicle class changes (motorcycle defaults)
  useEffect(() => {
    const isMoto = isMotorcycleClass(formData.vehicleClass);
    // If UCTD is checked, do not stomp on the UCTD values for brake fields.
    if (formData.brakeUnableToInspect) return;
    if (isMoto) {
      // 1. fitness expiry date -> Not Applicable
      setFitnessType('Not Applicable');
      setFormData((prev) => ({ ...prev, fitnessCertExpiryDate: 'Not Applicable' }));
      // 2. efficiency of parking brake -> "---"
      setFormData((prev) => ({ ...prev, parkingBrakeEfficiency: '---' }));
      // 3. date of validity of permit -> Not Applicable
      setPermitType('Not Applicable');
      setFormData((prev) => ({ ...prev, permitValidity: 'Not Applicable' }));
      // 11. parking brake failure cause -> Not Applicable
      setFormData((prev) => ({ ...prev, parkingBrakeLackLubrication: 'Not Applicable' }));
    } else {
      // Revert motorcycle-only defaults when switching to a non-motorcycle class
      setFormData((prev) => ({
        ...prev,
        parkingBrakeEfficiency: prev.parkingBrakeEfficiency === '---' ? 'Efficient' : prev.parkingBrakeEfficiency,
        parkingBrakeLackLubrication: prev.parkingBrakeLackLubrication === 'Not Applicable' ? 'No Brake Failure' : prev.parkingBrakeLackLubrication,
      }));
    }
  }, [formData.vehicleClass, formData.brakeUnableToInspect]);

  const updateField = (field: keyof AccidentReportFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'roadDescription') {
        updated.inspectionPlace = value;
      }
      return updated;
    });
  };

  // UCTD checkbox handler.
  // When checked:
  //   - Sl No 9 (Condition of brakes) → set to the UCTD radio text
  //     (footBrakeEfficiency / parkingBrakeEfficiency / brakeEvenAction all carry
  //      the same UCTD statement so the print view renders it once at Sl No 9)
  //   - Sl No 12 (Steering/Handle excessive backlash) → set to "---"
  // When unchecked: revert brake fields + steering backlash to their defaults
  //   so the inspector can fill them in normally.
  const handleUCTDChange = (checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return {
          ...prev,
          brakeUnableToInspect: true,
          footBrakeEfficiency: UCTD_BRAKE_TEXT,
          parkingBrakeEfficiency: UCTD_BRAKE_TEXT,
          brakeEvenAction: UCTD_BRAKE_TEXT,
          steeringBacklash: '---',
        };
      }
      return {
        ...prev,
        brakeUnableToInspect: false,
        footBrakeEfficiency: 'Efficient',
        parkingBrakeEfficiency: isMotorcycleClass(prev.vehicleClass) ? '---' : 'Efficient',
        brakeEvenAction: 'Even Action',
        steeringBacklash: 'No',
      };
    });
  };

  // Image upload handler — reads the file, compresses it, stores as base64 data URL
  const handleImageSelect = async (field: 'image1' | 'image2', file: File | null) => {
    if (!file) return;
    setImageUploading(field);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setFormData((prev) => ({ ...prev, [field]: dataUrl }));
      toast({ title: 'Image Added', description: `${file.name} has been added.` });
    } catch (error) {
      toast({
        title: 'Image Upload Failed',
        description: error instanceof Error ? error.message : 'Could not process the image.',
        variant: 'destructive',
      });
    } finally {
      setImageUploading(null);
    }
  };

  const handleImageRemove = (field: 'image1' | 'image2') => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const handleReset = () => {
    setFormData(getEmptyFormData());
    setRoadInspectionType('police_station');
    setInsuranceType('Valid');
    setFitnessType('Select Date');
    setPermitType('Select Date');
    setEditingId(null);
    toast({ title: 'Form Reset', description: 'All fields have been cleared.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.crimeNo || !formData.section || !formData.policeStation || !formData.district) {
      toast({
        title: 'Validation Error',
        description: 'District, Crime No, Section, and Police Station are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/reports/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // 403 = administrator has revoked edit permission since the page loaded.
        if (res.status === 403) {
          throw new Error(
            err.error
              ? `${err.error}. Please contact an administrator to request access.`
              : 'Administrator Approval Required. Please contact an administrator to request access.'
          );
        }
        const msg = err.error || err.hint || (editingId ? 'Failed to update report' : 'Failed to create report');
        throw new Error(msg);
      }

      toast({
        title: editingId ? 'Report Updated' : 'Report Submitted',
        description: `Crime No ${formData.crimeNo} has been successfully ${editingId ? 'updated' : 'saved'}.`,
      });

      setFormData(getEmptyFormData());
      setEditingId(null);
      setRoadInspectionType('police_station');
      setInsuranceType('Valid');
      setFitnessType('Select Date');
      setPermitType('Select Date');
      onSubmitted();
    } catch (error) {
      toast({
        title: editingId ? 'Update Failed' : 'Submission Failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMoto = isMotorcycleClass(formData.vehicleClass);

  // Permission gate: if the user can't edit/create reports, show the
  // "Administrator Approval Required" notice instead of the form. This runs
  // after all hooks above, so the Rules of Hooks are preserved.
  if (!canEdit) {
    return (
      <div className="space-y-4">
        {editingId && onEditCancel && (
          <div>
            <Button
              variant="outline"
              className="border-slate-300"
              onClick={onEditCancel}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Back to Records
            </Button>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-amber-300 bg-amber-50/50 rounded-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4">
            <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Administrator Approval Required
          </h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md">
            You do not have permission to{' '}
            {editingId ? 'edit accident reports' : 'create new accident reports'}.
            Please contact an administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  // Big bold field title style
  const fieldTitle = 'text-base font-bold text-slate-800';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Edit Mode Banner */}
      {editingId && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-amber-800 font-medium text-sm">
            ✏️ Editing Report — Crime No: {formData.crimeNo}
          </span>
          {onEditCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onEditCancel} className="text-amber-700 hover:text-amber-900">
              Cancel Edit
            </Button>
          )}
        </div>
      )}

      {/* Header Section */}
      <Card className="border-slate-300">
        <CardHeader className="bg-slate-50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
            <FileText className="h-5 w-5" />
            Accident Inspection Report
          </CardTitle>
          <p className="text-sm text-slate-500">
            Fill in all applicable fields. Fields marked with * are required.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="district" className="text-base font-bold text-slate-800">
                District <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.district}
                onValueChange={(value) => {
                  // When the district changes, clear the police station and
                  // reset the district-derived auto-fill fields so they don't
                  // keep referencing the old district.
                  updateField('district', value);
                  updateField('policeStation', '');
                  updateField('roadDescription', '');
                  updateField('inspectionPlace', '');
                  updateField('officerName', '');
                  updateField('copyTo', `DTO office, ${value}`);
                  setRoadInspectionType('police_station');
                }}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {DISTRICT_NAMES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crimeNo" className="text-base font-bold text-slate-800">
                Crime No <span className="text-red-500">*</span>
              </Label>
              <Input
                id="crimeNo"
                value={formData.crimeNo}
                onChange={(e) => updateField('crimeNo', e.target.value)}
                placeholder="e.g. 123/2024"
                className="border-slate-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section" className="text-base font-bold text-slate-800">
                Section <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.section}
                onValueChange={(value) => updateField('section', value)}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U/S 106(1) BNS">U/S 125(a) & 106(1) BNS</SelectItem>
                  <SelectItem value="U/S 106(2) BNS">U/S 106(2) BNS</SelectItem>
                  <SelectItem value="U/S 30(A)">U/S 30(A)</SelectItem>
                  <SelectItem value="U/S 125(a) BNS">U/S 125(a) BNS</SelectItem>
                  <SelectItem value="U/S 125(a) & 106(1) BNS">U/S 125(a) & 106(1) BNS</SelectItem>
                  <SelectItem value="U/S 304(a) IPC">U/S 304(a) IPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policeStation" className="text-base font-bold text-slate-800">
                Police Station <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.policeStation}
                onValueChange={(value) => {
                  const distName = formData.district || 'Siddipet';
                  updateField('policeStation', value);
                  setRoadInspectionType('police_station');
                  updateField('roadDescription', `Inspected the vehicle at ${value}`);
                  updateField('officerName', `SHO, ${value}, ${distName} (Dist)`);
                  updateField('copyTo', `DTO office, ${distName}`);
                  updateField('inspectionPlace', `Inspected the vehicle at ${value}`);
                }}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Select Police Station" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(() => {
                    const divisions = getDivisionsForDistrict(formData.district);
                    if (divisions && divisions.length > 0) {
                      // Grouped by revenue division
                      return divisions.flatMap((div, idx) => [
                        <SelectItem
                          key={`__hdr_${idx}`}
                          disabled
                          value={`__hdr_${idx}`}
                          className="font-semibold text-slate-500 uppercase text-xs tracking-wider"
                        >
                          — {div.name} —
                        </SelectItem>,
                        ...div.stations.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st}
                          </SelectItem>
                        )),
                      ]);
                    }
                    // Flat list for single-division districts
                    const stations = getStationsForDistrict(formData.district);
                    if (stations.length === 0) {
                      return (
                        <SelectItem disabled value="__none" className="text-slate-400">
                          Select a district first
                        </SelectItem>
                      );
                    }
                    return stations.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All sections expanded by default. Triggers show only the section name (no "Section N —" prefix, no icon). */}
      <Accordion
        type="multiple"
        defaultValue={[
          'section-1',
          'section-2',
          'section-3',
          'section-4',
          'section-5',
          'section-6',
          'section-7',
          'section-8',
        ]}
        className="space-y-2"
      >
        {/* Requisition & Receipt */}
        <AccordionItem value="section-1" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            Requisition &amp; Receipt
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="space-y-2">
              <Label className={fieldTitle}>
                1. Name and address of the officer from whom requisition is received
              </Label>
              <Input
                value={formData.officerName}
                readOnly
                placeholder="Auto-filled based on Police Station"
                className="border-slate-300 bg-slate-100"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={fieldTitle}>
                  2. Date of receive by the Inspector
                </Label>
                <Input
                  type="date"
                  value={formData.receiptDate}
                  onChange={(e) => updateField('receiptDate', e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldTitle}>
                  2. Received from
                </Label>
                <Input
                  value={formData.receiptDetails}
                  onChange={(e) => updateField('receiptDetails', e.target.value)}
                  placeholder='e.g. "from Kumar PC 356 PS Husnabad"'
                  className="border-slate-300"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Accident Details */}
        <AccordionItem value="section-2" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            Accident Details
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div>
              <Label className={fieldTitle}>
                3. Date, time and place of accident
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Date</Label>
                  <Input
                    type="date"
                    value={formData.accidentDate}
                    onChange={(e) => updateField('accidentDate', e.target.value)}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Time</Label>
                  <Input
                    type="time"
                    value={formData.accidentTime}
                    onChange={(e) => updateField('accidentTime', e.target.value)}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Place</Label>
                  <Input
                    value={formData.accidentPlace}
                    onChange={(e) => updateField('accidentPlace', e.target.value)}
                    placeholder="Place of accident"
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>
                4. Width of road, nature and brief description of the locality
              </Label>
              <RadioGroup
                value={roadInspectionType}
                onValueChange={(v) => {
                  if (v === 'police_station') {
                    setRoadInspectionType('police_station');
                    updateField('roadDescription', formData.policeStation ? `Inspected the vehicle at ${formData.policeStation}` : '');
                  } else if (v === 'accident_site') {
                    setRoadInspectionType('accident_site');
                    updateField('roadDescription', '');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="police_station" id="rd-police-station" />
                  <Label htmlFor="rd-police-station" className="text-sm text-slate-600 cursor-pointer">
                    Inspected the vehicle at {formData.policeStation || 'Police Station'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accident_site" id="rd-accident-site" />
                  <Label htmlFor="rd-accident-site" className="text-sm text-slate-600 cursor-pointer">Inspected at the accident site</Label>
                </div>
              </RadioGroup>
              {roadInspectionType === 'accident_site' && (
                <Input
                  value={formData.roadDescription}
                  onChange={(e) => updateField('roadDescription', e.target.value)}
                  placeholder="Enter details about the accident site"
                  className="border-slate-300 mt-2"
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Vehicle Details */}
        <AccordionItem value="section-3" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            Vehicle Details
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div>
              <Label className={`${fieldTitle} mb-2 block`}>
                5. Vehicle details
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Registration No</Label>
                  <Input
                    value={formData.regNo || ''}
                    onChange={(e) => updateField('regNo', e.target.value)}
                    placeholder="Reg No"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Class of Vehicle</Label>
                  <Input
                    value={formData.vehicleClass || ''}
                    onChange={(e) => updateField('vehicleClass', e.target.value)}
                    placeholder='e.g. "Motor Cycle" or "Tractor"'
                    className="border-slate-300"
                  />
                  {isMoto && (
                    <p className="text-xs text-emerald-700 mt-1 font-medium">
                      ✓ Motorcycle detected — Fitness, Parking Brake &amp; Permit auto-set to N/A
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Make/Model</Label>
                  <Input
                    value={formData.vehicleMake || ''}
                    onChange={(e) => updateField('vehicleMake', e.target.value)}
                    placeholder="e.g. Swaraj 735 FE"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Month / Year of Manufacture</Label>
                  <Input
                    value={formData.vehicleYear || ''}
                    onChange={(e) => updateField('vehicleYear', e.target.value)}
                    placeholder="e.g. 05/2013"
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className={`${fieldTitle} mb-2 block`}>
                6. Date, time and place of inspection
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Date</Label>
                  <Input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => updateField('inspectionDate', e.target.value)}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Time</Label>
                  <Input
                    type="time"
                    value={formData.inspectionTime}
                    onChange={(e) => updateField('inspectionTime', e.target.value)}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Place</Label>
                  <Input
                    value={formData.inspectionPlace}
                    readOnly
                    placeholder="Auto-filled from Width of road, nature and locality"
                    className="border-slate-300 bg-slate-100 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>
                7. Fitness certificate expiry date
              </Label>
              <RadioGroup
                value={fitnessType}
                onValueChange={(v) => {
                  setFitnessType(v as typeof fitnessType);
                  if (v === 'Select Date') {
                    updateField('fitnessCertExpiryDate', '');
                  } else if (v === 'Not Produced') {
                    updateField('fitnessCertExpiryDate', 'FC Not Produced');
                  } else if (v === 'Not Applicable') {
                    updateField('fitnessCertExpiryDate', 'Not Applicable');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Select Date" id="fc-select-date" disabled={isMoto} />
                  <Label htmlFor="fc-select-date" className={`text-sm cursor-pointer ${isMoto ? 'text-slate-400' : 'text-slate-600'}`}>Select Date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Produced" id="fc-not-produced" disabled={isMoto} />
                  <Label htmlFor="fc-not-produced" className={`text-sm cursor-pointer ${isMoto ? 'text-slate-400' : 'text-slate-600'}`}>FC Not Produced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Applicable" id="fc-not-applicable" />
                  <Label htmlFor="fc-not-applicable" className="text-sm text-slate-600 cursor-pointer">Not Applicable</Label>
                </div>
              </RadioGroup>
              {fitnessType === 'Select Date' && !isMoto && (
                <Input
                  value={formData.fitnessCertExpiryDate || ''}
                  onChange={(e) => updateField('fitnessCertExpiryDate', e.target.value)}
                  placeholder="Enter date"
                  className="border-slate-300 mt-2"
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Damages & Brakes */}
        <AccordionItem value="section-4" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            Damages &amp; Brakes
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="space-y-2">
              <Label className={fieldTitle}>
                8. Details regarding damages sustained by the vehicle
              </Label>
              <div className="space-y-2">
                {(formData.damagesDetails ? formData.damagesDetails.split('\n') : ['', '']).map((entry, idx, arr) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs text-slate-400 w-5 shrink-0">{idx + 1}.</span>
                    <Input
                      value={entry}
                      onChange={(e) => {
                        const items = arr.slice();
                        items[idx] = e.target.value;
                        updateField('damagesDetails', items.join('\n'));
                      }}
                      placeholder={`Damage detail ${idx + 1}`}
                      className="border-slate-300"
                    />
                    {arr.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 shrink-0"
                        onClick={() => {
                          const items = arr.slice();
                          items.splice(idx, 1);
                          updateField('damagesDetails', items.join('\n'));
                        }}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-600"
                onClick={() => {
                  const items = formData.damagesDetails ? formData.damagesDetails.split('\n') : ['', ''];
                  items.push('');
                  updateField('damagesDetails', items.join('\n'));
                }}
              >
                + Add
              </Button>
            </div>

            <div>
              <Label className={`${fieldTitle} mb-3 block`}>
                9. Condition of brakes at the time of inspection
              </Label>

              {/* Single UCTD checkbox — Unable to Conduct Driving Test */}
              <div className="flex items-start gap-3 mb-4">
                <Checkbox
                  id="uctd-brake"
                  checked={formData.brakeUnableToInspect === true}
                  onCheckedChange={(v) => handleUCTDChange(v === true)}
                  className="mt-1"
                />
                <Label htmlFor="uctd-brake" className="text-sm font-bold text-slate-800 cursor-pointer leading-relaxed">
                  Unable to conduct driving test due to Damages sustained by the vehicle due to Accident however i have throughly inspected the Braking System Adopted by the vehicle and found that the braking system was intact prior to the accedent
                </Label>
              </div>

              {/* The 3 sub-field dropdowns only appear when NOT UCTD */}
              {!formData.brakeUnableToInspect && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">a) Efficiency of foot brake</Label>
                    <Select
                      value={formData.footBrakeEfficiency || ''}
                      onValueChange={(v) => updateField('footBrakeEfficiency', v)}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Efficient">Efficient</SelectItem>
                        <SelectItem value="Not Efficient">Not Efficient</SelectItem>
                        <SelectItem value="Not Working">Not Working</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">b) Efficiency of parking brake</Label>
                    <Select
                      value={formData.parkingBrakeEfficiency || ''}
                      onValueChange={(v) => updateField('parkingBrakeEfficiency', v)}
                      disabled={isMoto}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="---">---</SelectItem>
                        <SelectItem value="Efficient">Efficient</SelectItem>
                        <SelectItem value="Not Efficient">Not Efficient</SelectItem>
                        <SelectItem value="Not Working">Not Working</SelectItem>
                      </SelectContent>
                    </Select>
                    {isMoto && (
                      <p className="text-xs text-emerald-700 font-medium">Auto-set to "---" (motorcycle)</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">c) Even action or not</Label>
                    <Select
                      value={formData.brakeEvenAction || ''}
                      onValueChange={(v) => updateField('brakeEvenAction', v)}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Even Action">Even Action</SelectItem>
                        <SelectItem value="Not Even Action">Not Even Action</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className={`${fieldTitle} mb-3 block`}>
                10. Cause of failure of brakes
              </Label>

              {/* Hydraulic */}
              <div className="border border-slate-200 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-slate-700 mb-3">If Hydraulic:</h4>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="hyd-no-failure"
                    checked={formData.hydraulicFluidLeak === 'No Brake Failure'}
                    onCheckedChange={() => {
                      updateField('hydraulicFluidLeak', 'No Brake Failure');
                      updateField('hydraulicLeakage', '');
                      updateField('hydraulicBreakages', '');
                      updateField('hydraulicWornOut', '');
                      updateField('hydraulicFailureOther', '');
                    }}
                  />
                  <Label htmlFor="hyd-no-failure" className="text-sm text-slate-600 font-medium">
                    NO Brake Failure
                  </Label>
                </div>
              </div>

              {/* Mechanical */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-700 mb-3">If Mechanical:</h4>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="mech-no-failure"
                    checked={formData.mechanicalLackLubrication === 'No Brake Failure'}
                    onCheckedChange={() => {
                      updateField('mechanicalLackLubrication', 'No Brake Failure');
                      updateField('mechanicalSlackAdjustment', '');
                      updateField('mechanicalWornOut', '');
                      updateField('mechanicalFailureOther', '');
                    }}
                  />
                  <Label htmlFor="mech-no-failure" className="text-sm text-slate-600 font-medium">
                    NO Brake Failure
                  </Label>
                </div>
              </div>
            </div>

            {/* Field 11 */}
            <div>
              <Label className={`${fieldTitle} mb-3 block`}>
                11. Parking brake failure cause
              </Label>
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="pb-status"
                    checked={isMoto ? formData.parkingBrakeLackLubrication === 'Not Applicable' : formData.parkingBrakeLackLubrication === 'No Brake Failure'}
                    onCheckedChange={() => {
                      if (isMoto) {
                        updateField('parkingBrakeLackLubrication', 'Not Applicable');
                      } else {
                        updateField('parkingBrakeLackLubrication', 'No Brake Failure');
                      }
                      updateField('parkingBrakeSlackness', '');
                      updateField('parkingBrakeWornOut', '');
                      updateField('parkingBrakeOtherReasons', '');
                    }}
                  />
                  <Label htmlFor="pb-status" className="text-sm text-slate-600 font-medium">
                    {isMoto ? 'Not Applicable' : 'NO Brake Failure'}
                  </Label>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Steering, Tyres & Documents */}
        <AccordionItem value="section-5" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            Steering, Tyres &amp; Documents
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={fieldTitle}>
                  12. Steering/Handle excessive backlash
                </Label>
                <Select
                  value={formData.steeringBacklash || ''}
                  onValueChange={(v) => updateField('steeringBacklash', v)}
                  disabled={formData.brakeUnableToInspect}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="---">---</SelectItem>
                  </SelectContent>
                </Select>
                {formData.brakeUnableToInspect && (
                  <p className="text-xs text-amber-700 font-medium">
                    Auto-set to &quot;---&quot; (UCTD — driving test not conducted)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={fieldTitle}>
                  13. Condition of tyres
                </Label>
                <Select
                  value={formData.tyreCondition || ''}
                  onValueChange={(v) => updateField('tyreCondition', v)}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Worn Out">Worn Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={fieldTitle}>
                14. Date of validity of permit
              </Label>
              <RadioGroup
                value={permitType}
                onValueChange={(v) => {
                  setPermitType(v as typeof permitType);
                  if (v === 'Select Date') {
                    updateField('permitValidity', '');
                  } else if (v === 'Not Produced') {
                    updateField('permitValidity', 'Permit Not Produced');
                  } else if (v === 'Not Applicable') {
                    updateField('permitValidity', 'Not Applicable');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Select Date" id="pv-select-date" disabled={isMoto} />
                  <Label htmlFor="pv-select-date" className={`text-sm cursor-pointer ${isMoto ? 'text-slate-400' : 'text-slate-600'}`}>Select Date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Produced" id="pv-not-produced" disabled={isMoto} />
                  <Label htmlFor="pv-not-produced" className={`text-sm cursor-pointer ${isMoto ? 'text-slate-400' : 'text-slate-600'}`}>Permit Not Produced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Applicable" id="pv-not-applicable" />
                  <Label htmlFor="pv-not-applicable" className="text-sm text-slate-600 cursor-pointer">Not Applicable</Label>
                </div>
              </RadioGroup>
              {permitType === 'Select Date' && !isMoto && (
                <Input
                  value={formData.permitValidity || ''}
                  onChange={(e) => updateField('permitValidity', e.target.value)}
                  placeholder="Enter date"
                  className="border-slate-300 mt-2"
                />
              )}
            </div>

            <div>
              <Label className={`${fieldTitle} mb-3 block`}>
                15. Insurance details
              </Label>
              <RadioGroup
                value={insuranceType}
                onValueChange={(v) => {
                  if (v === 'Valid') {
                    setInsuranceType('Valid');
                    updateField('insuranceExpiryDate', '');
                  } else if (v === 'Not Produced') {
                    setInsuranceType('Not Produced');
                    updateField('insuranceExpiryDate', 'IC Not Produced');
                    updateField('insuranceCompany', '');
                    updateField('insurancePolicyNo', '');
                  } else if (v === 'Not Applicable') {
                    setInsuranceType('Not Applicable');
                    updateField('insuranceExpiryDate', 'Not Applicable');
                    updateField('insuranceCompany', '');
                    updateField('insurancePolicyNo', '');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Valid" id="ins-valid" />
                  <Label htmlFor="ins-valid" className="text-sm text-slate-600 cursor-pointer">Valid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Produced" id="ins-not-produced" />
                  <Label htmlFor="ins-not-produced" className="text-sm text-slate-600 cursor-pointer">IC Not Produced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Applicable" id="ins-not-applicable" />
                  <Label htmlFor="ins-not-applicable" className="text-sm text-slate-600 cursor-pointer">Not Applicable</Label>
                </div>
              </RadioGroup>
              {insuranceType === 'Valid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Insurance expiry date</Label>
                    <Input
                      value={formData.insuranceExpiryDate || ''}
                      onChange={(e) => updateField('insuranceExpiryDate', e.target.value)}
                      placeholder="Enter expiry date"
                      className="border-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Insurance company name &amp; address</Label>
                    <Input
                      value={formData.insuranceCompany || ''}
                      onChange={(e) => updateField('insuranceCompany', e.target.value)}
                      placeholder="Company name and address"
                      className="border-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Policy number</Label>
                    <Input
                      value={formData.insurancePolicyNo || ''}
                      onChange={(e) => updateField('insurancePolicyNo', e.target.value)}
                      placeholder="Policy number"
                      className="border-slate-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* People */}
        <AccordionItem value="section-6" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            People
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="space-y-2">
              <Label className={fieldTitle}>
                16. Name and address of the owner
              </Label>
              <Textarea
                value={formData.ownerName || ''}
                onChange={(e) => updateField('ownerName', e.target.value)}
                placeholder="Owner name and address"
                className="border-slate-300 min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>
                17. Name and address of the driver
              </Label>
              <Textarea
                value={formData.driverName || ''}
                onChange={(e) => updateField('driverName', e.target.value)}
                placeholder="Driver name and address"
                className="border-slate-300 min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>
                18. Particulars of driver&apos;s licence
              </Label>
              <RadioGroup
                value={formData.driverLicenceDetails === 'DL Not Produced' || formData.driverLicenceDetails === 'Not Produced' ? 'Not Produced' : formData.driverLicenceDetails === 'Not Applicable' ? 'Not Applicable' : 'Valid'}
                onValueChange={(v) => {
                  if (v === 'Valid') {
                    updateField('driverLicenceDetails', 'Valid');
                  } else if (v === 'Not Produced') {
                    updateField('driverLicenceDetails', 'DL Not Produced');
                    updateField('driverLicenceNo', '');
                    updateField('driverLicenceValidUpto', '');
                  } else if (v === 'Not Applicable') {
                    updateField('driverLicenceDetails', 'Not Applicable');
                    updateField('driverLicenceNo', '');
                    updateField('driverLicenceValidUpto', '');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Valid" id="dl-valid" />
                  <Label htmlFor="dl-valid" className="text-sm text-slate-600 cursor-pointer">Valid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Produced" id="dl-not-produced" />
                  <Label htmlFor="dl-not-produced" className="text-sm text-slate-600 cursor-pointer">DL Not Produced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Not Applicable" id="dl-not-applicable" />
                  <Label htmlFor="dl-not-applicable" className="text-sm text-slate-600 cursor-pointer">Not Applicable</Label>
                </div>
              </RadioGroup>
              {formData.driverLicenceDetails === 'Valid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">DL Number</Label>
                    <Input
                      value={formData.driverLicenceNo || ''}
                      onChange={(e) => updateField('driverLicenceNo', e.target.value)}
                      placeholder="Enter DL Number"
                      className="border-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Valid Upto</Label>
                    <Input
                      value={formData.driverLicenceValidUpto || ''}
                      onChange={(e) => updateField('driverLicenceValidUpto', e.target.value)}
                      placeholder="Enter valid upto date"
                      className="border-slate-300"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>
                19. Person involved in accident, injuries, persons killed
              </Label>
              <RadioGroup
                value={formData.involvedPersonDetails === 'INA' ? 'INA' : 'Details'}
                onValueChange={(v) => {
                  if (v === 'INA') {
                    updateField('involvedPersonDetails', 'INA');
                  } else {
                    updateField('involvedPersonDetails', '');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INA" id="pa-ina" />
                  <Label htmlFor="pa-ina" className="text-sm text-slate-600 cursor-pointer">INA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Details" id="pa-details" />
                  <Label htmlFor="pa-details" className="text-sm text-slate-600 cursor-pointer">Enter Details</Label>
                </div>
              </RadioGroup>
              {formData.involvedPersonDetails !== 'INA' && formData.involvedPersonDetails !== '' && (
                <Textarea
                  value={formData.involvedPersonDetails || ''}
                  onChange={(e) => updateField('involvedPersonDetails', e.target.value)}
                  placeholder="Details of persons involved, injuries, fatalities"
                  className="border-slate-300 min-h-[80px] mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>
                20. Legal heirs of deceased in fatal accident
              </Label>
              <RadioGroup
                value={formData.legalHeirsDetails === 'INA' ? 'INA' : 'Details'}
                onValueChange={(v) => {
                  if (v === 'INA') {
                    updateField('legalHeirsDetails', 'INA');
                  } else {
                    updateField('legalHeirsDetails', '');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INA" id="lh-ina" />
                  <Label htmlFor="lh-ina" className="text-sm text-slate-600 cursor-pointer">INA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Details" id="lh-details" />
                  <Label htmlFor="lh-details" className="text-sm text-slate-600 cursor-pointer">Enter Details</Label>
                </div>
              </RadioGroup>
              {formData.legalHeirsDetails !== 'INA' && formData.legalHeirsDetails !== '' && (
                <Textarea
                  value={formData.legalHeirsDetails || ''}
                  onChange={(e) => updateField('legalHeirsDetails', e.target.value)}
                  placeholder="Legal heirs details (if fatal accident)"
                  className="border-slate-300 min-h-[60px] mt-2"
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Conclusion */}
        <AccordionItem value="section-7" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            Conclusion
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="space-y-2">
              <Label className={fieldTitle}>
                21. Was accident due to mechanical defects? Opinion/conclusion
              </Label>
              <div className="flex items-start gap-3 mt-1">
                <Checkbox
                  id="mech-defect-opinion"
                  checked={formData.mechanicalDefectsOpinion === 'In my opinion the accident was not occured due to any mechanical defects of the vehicle'}
                  onCheckedChange={() => updateField('mechanicalDefectsOpinion', 'In my opinion the accident was not occured due to any mechanical defects of the vehicle')}
                />
                <Label htmlFor="mech-defect-opinion" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                  In my opinion the accident was not occured due to any mechanical defects of the vehicle
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>
                22. Was the vehicle on Trade Plate? Details
              </Label>
              <RadioGroup
                value={formData.tradePlateDetails === 'INA' ? 'INA' : 'Details'}
                onValueChange={(v) => {
                  if (v === 'INA') {
                    updateField('tradePlateDetails', 'INA');
                  } else {
                    updateField('tradePlateDetails', '');
                  }
                }}
                className="flex flex-wrap gap-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INA" id="tp-ina" />
                  <Label htmlFor="tp-ina" className="text-sm text-slate-600 cursor-pointer">INA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Details" id="tp-details" />
                  <Label htmlFor="tp-details" className="text-sm text-slate-600 cursor-pointer">Enter Details</Label>
                </div>
              </RadioGroup>
              {formData.tradePlateDetails !== 'INA' && formData.tradePlateDetails !== '' && (
                <Input
                  value={formData.tradePlateDetails || ''}
                  onChange={(e) => updateField('tradePlateDetails', e.target.value)}
                  placeholder="Enter trade plate details"
                  className="border-slate-300 mt-2"
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* VCR & Copy */}
        <AccordionItem value="section-8" className="border border-slate-300 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base hover:no-underline">
            VCR &amp; Copy
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={fieldTitle}>VCR No</Label>
                <Input
                  value={formData.vcrNo || ''}
                  onChange={(e) => updateField('vcrNo', e.target.value)}
                  placeholder="VCR number"
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldTitle}>VCR Date</Label>
                <Input
                  value={formData.vcrDate || ''}
                  onChange={(e) => updateField('vcrDate', e.target.value)}
                  placeholder="VCR date"
                  className="border-slate-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={fieldTitle}>Copy to</Label>
              {(() => {
                const distName = formData.district || 'Siddipet';
                const isAutoFill = formData.copyTo === `DTO office, ${distName}` || formData.copyTo === '' || formData.copyTo === undefined;
                return (
                  <>
                    <RadioGroup
                      value={isAutoFill ? 'auto' : 'other'}
                      onValueChange={(v) => {
                        if (v === 'auto') {
                          updateField('copyTo', `DTO office, ${distName}`);
                        } else {
                          updateField('copyTo', '');
                        }
                      }}
                      className="flex flex-wrap gap-4 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="ct-auto" />
                        <Label htmlFor="ct-auto" className="text-sm text-slate-600 cursor-pointer">
                          DTO office, {distName}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="ct-other" />
                        <Label htmlFor="ct-other" className="text-sm text-slate-600 cursor-pointer">Other</Label>
                      </div>
                    </RadioGroup>
                    {!isAutoFill && (
                      <Input
                        value={formData.copyTo || ''}
                        onChange={(e) => updateField('copyTo', e.target.value)}
                        placeholder="Enter copy to recipient"
                        className="border-slate-300 mt-2"
                      />
                    )}
                  </>
                );
              })()}
            </div>

            {/* Image upload — 2 accident/damage photos */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <Label className={fieldTitle}>
                Accident Photos (max 2)
              </Label>
              <p className="text-xs text-slate-500">
                Upload up to 2 photos of the vehicle / accident scene. Images are automatically
                resized and compressed. JPG / PNG up to 8&nbsp;MB each.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {/* Image 1 */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Photo 1</Label>
                  {formData.image1 ? (
                    <div className="relative group border border-slate-300 rounded-lg overflow-hidden">
                      { }
                      <img
                        src={formData.image1}
                        alt="Accident photo 1"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove('image1')}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-colors"
                        aria-label="Remove photo 1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="image1-upload"
                      className={`flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors ${imageUploading === 'image1' ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      {imageUploading === 'image1' ? (
                        <>
                          <Loader2 className="h-6 w-6 text-slate-400 animate-spin mb-2" />
                          <span className="text-xs text-slate-500">Processing…</span>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-500">Click to upload Photo 1</span>
                        </>
                      )}
                      <input
                        id="image1-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleImageSelect('image1', e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>

                {/* Image 2 */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Photo 2</Label>
                  {formData.image2 ? (
                    <div className="relative group border border-slate-300 rounded-lg overflow-hidden">
                      { }
                      <img
                        src={formData.image2}
                        alt="Accident photo 2"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove('image2')}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-colors"
                        aria-label="Remove photo 2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="image2-upload"
                      className={`flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors ${imageUploading === 'image2' ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      {imageUploading === 'image2' ? (
                        <>
                          <Loader2 className="h-6 w-6 text-slate-400 animate-spin mb-2" />
                          <span className="text-xs text-slate-500">Processing…</span>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-500">Click to upload Photo 2</span>
                        </>
                      )}
                      <input
                        id="image2-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleImageSelect('image2', e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="border-slate-300 text-slate-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Form
        </Button>
        {editingId && onEditCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onEditCancel}
            className="border-slate-300 text-slate-700"
          >
            Cancel Edit
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-slate-800 hover:bg-slate-900 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? (editingId ? 'Updating...' : 'Submitting...') : (editingId ? 'Update Report' : 'Submit Report')}
        </Button>
      </div>
    </form>
  );
}
