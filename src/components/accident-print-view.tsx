'use client';

import React from 'react';
import { AccidentReport } from '@/lib/report-types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface AccidentPrintViewProps {
  report: AccidentReport | null;
  onBack: () => void;
}

function FieldRow({ num, label, value }: { num?: number; label: string; value: string | null | undefined }) {
  return (
    <tr>
      <td className="border border-slate-400 px-2 py-1.5 font-medium text-sm text-slate-800 bg-slate-50 w-[360px] print:bg-slate-50">
        {num !== undefined ? `${num}. ` : ''}{label}
      </td>
      <td className="border border-slate-400 px-2 py-1.5 text-sm text-slate-900">
        {value === '__SKIP__' ? '' : (value || '\u2014')}
      </td>
    </tr>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} className="border border-slate-400 bg-slate-100 px-3 py-1.5 font-semibold text-sm text-slate-700 uppercase tracking-wide print:bg-slate-100">
        {title}
      </td>
    </tr>
  );
}

function CheckboxList({ items }: { items: { checked: boolean; label: string }[] }) {
  const anyChecked = items.some(i => i.checked);
  if (!anyChecked) {
    return <span>{'\u2014'}</span>;
  }
  return (
    <div className="space-y-0.5">
      {items.map((item, idx) =>
        item.checked ? <div key={idx}>{item.label} ✓</div> : null
      )}
    </div>
  );
}

export default function AccidentPrintView({ report, onBack }: AccidentPrintViewProps) {
  const { user } = useAuth();
  // ADMIN always has full access; otherwise check the per-user flag.
  const canPrint = user?.role === 'ADMIN' || !!user?.canPrintReports;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Printer className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">No report selected</p>
        <p className="text-sm">Select a report from the Records tab to print.</p>
        <Button variant="outline" className="mt-4 border-slate-300" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Records
        </Button>
      </div>
    );
  }

  // Permission gate: if the user can't print, show the approval-required
  // notice instead of the printable form.
  if (!canPrint) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" className="border-slate-300" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-amber-300 bg-amber-50/50 rounded-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4">
            <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Administrator Approval Required
          </h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md">
            You do not have permission to print accident reports. Please
            contact an administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  const r = report;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Print button - hidden when printing */}
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <Button variant="outline" className="border-slate-300" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Government Form Layout */}
      <div className="print-form border border-slate-500 bg-white max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-slate-500 p-4 text-center">
          <img src="" alt="Logo" className="h-16 w-16 object-contain mx-auto mb-2" />
          <h1 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Accident Report from Inspector of Motor Vehicles
          </h1>
        </div>

        {/* Crime No / Section / District / PS Row */}
        <div className="grid grid-cols-4 border-b border-slate-500">
          <div className="border-r border-slate-400 px-3 py-2">
            <span className="text-xs font-semibold text-slate-600 uppercase block">Crime No</span>
            <span className="text-sm font-bold text-slate-900">{r.crimeNo}</span>
          </div>
          <div className="border-r border-slate-400 px-3 py-2">
            <span className="text-xs font-semibold text-slate-600 uppercase block">Section</span>
            <span className="text-sm font-bold text-slate-900">{r.section}</span>
          </div>
          <div className="border-r border-slate-400 px-3 py-2">
            <span className="text-xs font-semibold text-slate-600 uppercase block">District</span>
            <span className="text-sm font-bold text-slate-900">{r.district || '—'}</span>
          </div>
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-slate-600 uppercase block">Police Station</span>
            <span className="text-sm font-bold text-slate-900">{r.policeStation}</span>
          </div>
        </div>

        {/* Main Content Table */}
        <table className="w-full border-collapse">
          <tbody>
            <FieldRow num={1} label="Name and address of the officer from whom requisition is received" value={r.officerName} />
            <FieldRow num={2} label="Date of receipt by the Motor Vehicles Inspector" value={r.receiptDate} />
            <FieldRow label="Received by" value={r.receiptDetails} />

            <FieldRow num={3} label="Date of accident" value={r.accidentDate} />
            <FieldRow label="Time of accident" value={r.accidentTime} />
            <FieldRow label="Place of accident" value={r.accidentPlace} />
            <FieldRow num={4} label="Width of road and nature (bend, turn, curve, gradient etc.,) and brief description of the locality of the accident" value={r.roadDescription} />

            <tr>
              <td className="border border-slate-400 px-2 py-1.5 font-medium text-sm text-slate-800 bg-slate-50 w-[360px] print:bg-slate-50" rowSpan={4}>
                5. Vehicles involved in accident with a brief description of the types, make and model of the vehicles with their registration numbers
              </td>
              <td className="border border-slate-400 px-2 py-0.5 text-sm text-slate-900">
                <span className="font-medium text-slate-600">Registration No: </span>{r.regNo || '\u2014'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-400 px-2 py-0.5 text-sm text-slate-900">
                <span className="font-medium text-slate-600">Class of Vehicle: </span>{r.vehicleClass || '\u2014'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-400 px-2 py-0.5 text-sm text-slate-900">
                <span className="font-medium text-slate-600">Make/Model: </span>{r.vehicleMake || '\u2014'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-400 px-2 py-0.5 text-sm text-slate-900">
                <span className="font-medium text-slate-600">Year of Manufacture: </span>{r.vehicleYear || '\u2014'}
              </td>
            </tr>
            <FieldRow num={6} label="Date of inspection" value={r.inspectionDate} />
            <FieldRow label="Time of inspection" value={r.inspectionTime} />
            <FieldRow label="Place of inspection" value={r.inspectionPlace} />
            <FieldRow num={7} label="Date of last inspection and date of expiry of present Fitness certificate" value={
              r.fitnessCertExpiryDate === 'FC Not Produced' || r.fitnessCertExpiryDate === 'Not Produced' ? 'NOT PRODUCED' :
              r.fitnessCertExpiryDate === 'Not Applicable' ? 'NOT APPLICABLE' :
              r.fitnessCertExpiryDate
                ? (r.lastInspectionDate ? `${r.lastInspectionDate} / ${r.fitnessCertExpiryDate}` : r.fitnessCertExpiryDate)
                : (r.lastInspectionDate || '—')
            } />

            {/* Section 4 */}
            <tr>
              <td className="border border-slate-400 px-2 py-1.5 font-medium text-sm text-slate-800 bg-slate-50 w-[360px] print:bg-slate-50">
                8. Details regarding damages sustained by the vehicle
              </td>
              <td className="border border-slate-400 px-2 py-1.5 text-sm text-slate-900">
                {r.damagesDetails
                  ? r.damagesDetails.split('\n').map((line, i) => (
                      <span key={i}>{i > 0 ? '\u00A0\u00A0\u00A0\u00A0\u00A0' : ''}{i + 1}. {line}</span>
                    ))
                  : '\u2014'
                }
              </td>
            </tr>
            {r.brakeUnableToInspect ? (
              <tr>
                <td className="border border-slate-400 px-2 py-1.5 font-medium text-sm text-slate-800 bg-slate-50 w-[360px] print:bg-slate-50 align-top">
                  9. Condition of brakes at the time of inspection
                </td>
                <td className="border border-slate-400 px-2 py-1.5 text-sm text-slate-900 italic">
                  Unable to conduct driving test due to Damages sustained by the vehicle due to Accident however i have throughly inspected the Braking System Adopted by the vehicle and found that the braking system was intact prior to the accedent
                </td>
              </tr>
            ) : (
              <>
                <FieldRow num={9} label="Condition of brakes at the time of inspection" value="__SKIP__" />
                <FieldRow label="a) Efficiency of foot brake" value={r.footBrakeEfficiency} />
                <FieldRow label="b) Efficiency of parking brake" value={r.parkingBrakeEfficiency} />
                <FieldRow label="c) Even action or not" value={r.brakeEvenAction} />
              </>
            )}
            <FieldRow num={10} label="Cause of failure of brakes" value="__SKIP__" />
            <tr>
              <td className="border border-slate-400 px-2 py-1.5 font-medium text-sm text-slate-800 bg-slate-50 w-[360px] print:bg-slate-50">
                If Hydraulic
              </td>
              <td className="border border-slate-400 px-2 py-1.5 text-sm text-slate-900">
                {r.hydraulicFluidLeak === 'No Brake Failure' ? 'NO Brake Failure' : '—'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-400 px-2 py-1.5 font-medium text-sm text-slate-800 bg-slate-50 w-[360px] print:bg-slate-50">
                If Mechanical
              </td>
              <td className="border border-slate-400 px-2 py-1.5 text-sm text-slate-900">
                {r.mechanicalLackLubrication === 'No Brake Failure' ? 'NO Brake Failure' : '—'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-400 px-2 py-1.5 font-medium text-sm text-slate-800 bg-slate-50 w-[360px] print:bg-slate-50">
                11. Parking brake failure cause
              </td>
              <td className="border border-slate-400 px-2 py-1.5 text-sm text-slate-900">
                {r.parkingBrakeLackLubrication === 'Not Applicable' ? 'Not Applicable' : r.parkingBrakeLackLubrication === 'No Brake Failure' ? 'NO Brake Failure' : '—'}
              </td>
            </tr>

            {/* Section 5 */}
            <FieldRow num={12} label="Steering/Handle: if there is any excessive backlash" value={r.steeringBacklash} />
            <FieldRow num={13} label="Condition of tyres" value={r.tyreCondition} />
            <FieldRow num={14} label="Date of validity of permit" value={
              r.permitValidity === 'Permit Not Produced' || r.permitValidity === 'Not Produced' ? 'NOT PRODUCED' :
              r.permitValidity === 'Not Applicable' ? 'NOT APPLICABLE' :
              r.permitValidity
            } />
            <FieldRow num={15} label="Date of expiry of insurance, in respect of vehicle" value={
              r.insuranceExpiryDate === 'IC Not Produced' || r.insuranceExpiryDate === 'Not Produced' ? 'NOT PRODUCED' :
              r.insuranceExpiryDate === 'Not Applicable' ? 'NOT APPLICABLE' :
              r.insuranceExpiryDate
            } />
            {r.insuranceExpiryDate && r.insuranceExpiryDate !== 'Not Produced' && r.insuranceExpiryDate !== 'IC Not Produced' && r.insuranceExpiryDate !== 'Not Applicable' && (
              <>
                <FieldRow label="Insurance company name & address" value={r.insuranceCompany} />
                <FieldRow label="Insurance Policy number" value={r.insurancePolicyNo} />
              </>
            )}

            {/* Section 6 */}
            <FieldRow num={16} label="Name and address of the owner" value={r.ownerName} />
            <FieldRow num={17} label="Name and address of the driver" value={r.driverName} />
            <FieldRow num={18} label="Particulars of driver's licence" value={
              r.driverLicenceDetails === 'DL Not Produced' || r.driverLicenceDetails === 'Not Produced' ? 'NOT PRODUCED' :
              r.driverLicenceDetails === 'Not Applicable' ? 'NOT APPLICABLE' :
              r.driverLicenceDetails === 'Valid' ? '__SKIP__' :
              r.driverLicenceDetails
            } />
            {r.driverLicenceDetails === 'Valid' && (
              <>
                <FieldRow label="DL Number" value={r.driverLicenceNo} />
                <FieldRow label="Valid Upto" value={r.driverLicenceValidUpto} />
              </>
            )}
            <FieldRow num={19} label="Name and address of person, if any, Involved in accident and extent of Injuries received and the number of Persons killed if it is fatal accident" value={r.involvedPersonDetails} />
            <FieldRow num={20} label="Name and address of the legal heirs of the deceased in case of fatal accident, to whom Compensation is due." value={r.legalHeirsDetails} />

            {/* Section 7 */}
            <FieldRow num={21} label="Whether the accident is due to mechanical defects of the vehicle? If so, the reasons and conclusion arrived at on inspection." value={r.mechanicalDefectsOpinion} />
            <FieldRow num={22} label="Was the vehicle on Trade Plate? If so, for what purpose was the trade plate used for delivery or trial." value={r.tradePlateDetails} />
          </tbody>
        </table>

        {/* Footer - Signature Section */}
        <div className="border-t border-slate-500">
          <div className="grid grid-cols-2">
            <div className="border-r border-slate-400 p-3">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-slate-600">VCR No: </span>
                  <span className="text-slate-900">{r.vcrNo || '\u2014'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">VCR Date: </span>
                  <span className="text-slate-900">{r.vcrDate || '\u2014'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Copy to: </span>
                  <span className="text-slate-900">{r.copyTo || '\u2014'}</span>
                </div>
              </div>
            </div>
            <div className="p-3 flex flex-col justify-end h-full">
              <div className="text-sm text-center space-y-0 mt-16">
                <div>
                  <span className="text-xs text-slate-500">&nbsp;</span>
                </div>
                <div>
                  <span className="text-slate-900">&nbsp;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accident Photos */}
        {(r.image1 || r.image2) && (
          <div className="border-t border-slate-500 p-3">
            <h3 className="font-bold text-sm text-slate-800 mb-2 uppercase tracking-wide">
              Accident Photos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {r.image1 && (
                <div className="border border-slate-300 rounded p-1">
                  { }
                  <img
                    src={r.image1}
                    alt="Accident photo 1"
                    className="w-full h-40 object-cover"
                  />
                  <p className="text-xs text-center text-slate-500 mt-1">Photo 1</p>
                </div>
              )}
              {r.image2 && (
                <div className="border border-slate-300 rounded p-1">
                  { }
                  <img
                    src={r.image2}
                    alt="Accident photo 2"
                    className="w-full h-40 object-cover"
                  />
                  <p className="text-xs text-center text-slate-500 mt-1">Photo 2</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-form,
          .print-form * {
            visibility: visible;
          }
          .print-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 11px;
          }
          .print-form table {
            font-size: 11px;
          }
          .print-form td {
            padding: 3px 6px;
          }
          @page {
            margin: 10mm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
