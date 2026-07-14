import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserFromRequest, permissionDeniedResponse } from '@/lib/auth';

// GET /api/reports/[id] - Get a single accident report
// Users can only read their own (requires canViewReports); admins can read any.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Per-user permission check (admin bypasses).
    if (user.role !== 'ADMIN' && !user.canViewReports) {
      return permissionDeniedResponse('view reports');
    }

    const { id } = await params;
    const report = await db.accidentReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Ownership check: non-admins can only read their own
    if (user.role !== 'ADMIN' && report.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this report.' },
        { status: 403 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// PUT /api/reports/[id] - Update an accident report (requires canEditReports)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Per-user permission check (admin bypasses).
    if (user.role !== 'ADMIN' && !user.canEditReports) {
      return permissionDeniedResponse('edit reports');
    }

    const { id } = await params;

    // Ownership check
    const existing = await db.accidentReport.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    if (user.role !== 'ADMIN' && existing.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this report.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const report = await db.accidentReport.update({
      where: { id },
      data: {
        crimeNo: body.crimeNo,
        section: body.section,
        policeStation: body.policeStation,
        district: body.district || null,
        officerName: body.officerName,
        officerAddress: body.officerAddress || null,
        receiptDate: body.receiptDate,
        receiptDetails: body.receiptDetails || null,
        accidentDate: body.accidentDate,
        accidentTime: body.accidentTime,
        accidentPlace: body.accidentPlace,
        roadDescription: body.roadDescription,
        chassisNo: body.chassisNo || null,
        regNo: body.regNo || null,
        vehicleClass: body.vehicleClass || null,
        vehicleMake: body.vehicleMake || null,
        vehicleYear: body.vehicleYear || null,
        inspectionDate: body.inspectionDate,
        inspectionTime: body.inspectionTime,
        inspectionPlace: body.inspectionPlace,
        lastInspectionDate: body.lastInspectionDate || null,
        fitnessCertExpiryDate: body.fitnessCertExpiryDate || null,
        damagesDetails: body.damagesDetails || null,
        brakeUnableToInspect: body.brakeUnableToInspect === true,
        footBrakeEfficiency: body.footBrakeEfficiency || null,
        parkingBrakeEfficiency: body.parkingBrakeEfficiency || null,
        brakeEvenAction: body.brakeEvenAction || null,
        hydraulicFluidLeak: body.hydraulicFluidLeak || null,
        hydraulicLeakage: body.hydraulicLeakage || null,
        hydraulicBreakages: body.hydraulicBreakages || null,
        hydraulicWornOut: body.hydraulicWornOut || null,
        hydraulicFailureOther: body.hydraulicFailureOther || null,
        mechanicalLackLubrication: body.mechanicalLackLubrication || null,
        mechanicalSlackAdjustment: body.mechanicalSlackAdjustment || null,
        mechanicalWornOut: body.mechanicalWornOut || null,
        mechanicalFailureOther: body.mechanicalFailureOther || null,
        parkingBrakeLackLubrication: body.parkingBrakeLackLubrication || null,
        parkingBrakeSlackness: body.parkingBrakeSlackness || null,
        parkingBrakeWornOut: body.parkingBrakeWornOut || null,
        parkingBrakeOtherReasons: body.parkingBrakeOtherReasons || null,
        steeringBacklash: body.steeringBacklash || null,
        tyreCondition: body.tyreCondition || null,
        permitValidity: body.permitValidity || null,
        insuranceExpiryDate: body.insuranceExpiryDate || null,
        insuranceCompany: body.insuranceCompany || null,
        insurancePolicyNo: body.insurancePolicyNo || null,
        insuranceCertificate: body.insuranceCertificate || null,
        ownerName: body.ownerName || null,
        ownerAddress: body.ownerAddress || null,
        driverName: body.driverName || null,
        driverAddress: body.driverAddress || null,
        driverLicenceDetails: body.driverLicenceDetails || null,
        driverLicenceNo: body.driverLicenceNo || null,
        driverLicenceValidUpto: body.driverLicenceValidUpto || null,
        involvedPersonDetails: body.involvedPersonDetails || null,
        legalHeirsDetails: body.legalHeirsDetails || null,
        mechanicalDefectsOpinion: body.mechanicalDefectsOpinion || null,
        tradePlateDetails: body.tradePlateDetails || null,
        vcrNo: body.vcrNo || null,
        vcrDate: body.vcrDate || null,
        copyTo: body.copyTo || null,
        image1: body.image1 || null,
        image2: body.image2 || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    const message = error instanceof Error ? error.message : 'Failed to update report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/reports/[id] - Delete an accident report (requires canDeleteReports)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Per-user permission check (admin bypasses).
    if (user.role !== 'ADMIN' && !user.canDeleteReports) {
      return permissionDeniedResponse('delete reports');
    }

    const { id } = await params;

    const existing = await db.accidentReport.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    if (user.role !== 'ADMIN' && existing.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this report.' },
        { status: 403 }
      );
    }

    await db.accidentReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
