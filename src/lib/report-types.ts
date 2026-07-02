export interface AccidentReport {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Header fields
  crimeNo: string;
  section: string;
  policeStation: string;

  // Field 1
  officerName: string;
  officerAddress: string | null;

  // Field 2
  receiptDate: string;
  receiptDetails: string | null;

  // Field 3
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;

  // Field 4
  roadDescription: string;

  // Field 5
  chassisNo: string | null;
  regNo: string | null;
  vehicleClass: string | null;
  vehicleMake: string | null;
  vehicleYear: string | null;

  // Field 6
  inspectionDate: string;
  inspectionTime: string;
  inspectionPlace: string;

  // Field 7
  lastInspectionDate: string | null;
  fitnessCertExpiryDate: string | null;

  // Field 8
  damagesDetails: string | null;

  // Field 9
  brakeUnableToInspect: boolean; // UCTD checkbox — when true, brakes couldn't be tested due to accident damage
  footBrakeEfficiency: string | null;
  parkingBrakeEfficiency: string | null;
  brakeEvenAction: string | null;

  // Field 10 - Hydraulic
  hydraulicFluidLeak: string | null;
  hydraulicLeakage: string | null;
  hydraulicBreakages: string | null;
  hydraulicWornOut: string | null;
  hydraulicFailureOther: string | null;

  // Field 10 - Mechanical
  mechanicalLackLubrication: string | null;
  mechanicalSlackAdjustment: string | null;
  mechanicalWornOut: string | null;
  mechanicalFailureOther: string | null;

  // Field 11
  parkingBrakeLackLubrication: string | null;
  parkingBrakeSlackness: string | null;
  parkingBrakeWornOut: string | null;
  parkingBrakeOtherReasons: string | null;

  // Field 12
  steeringBacklash: string | null;

  // Field 13
  tyreCondition: string | null;

  // Field 14
  permitValidity: string | null;

  // Field 15
  insuranceExpiryDate: string | null;
  insuranceCompany: string | null;
  insurancePolicyNo: string | null;
  insuranceCertificate: string | null;

  // Field 16
  ownerName: string | null;
  ownerAddress: string | null;

  // Field 17
  driverName: string | null;
  driverAddress: string | null;

  // Field 18
  driverLicenceDetails: string | null;
  driverLicenceNo: string | null;
  driverLicenceValidUpto: string | null;

  // Field 19
  involvedPersonDetails: string | null;

  // Field 20
  legalHeirsDetails: string | null;

  // Field 21
  mechanicalDefectsOpinion: string | null;

  // Field 22
  tradePlateDetails: string | null;

  // VCR & Copy
  vcrNo: string | null;
  vcrDate: string | null;
  copyTo: string | null;

  // Images (base64 data URLs)
  image1: string | null;
  image2: string | null;

  // Ownership
  userId: string | null;
  user?: { id: string; name: string; email: string; role: string } | null;
}

export interface AccidentReportFormData {
  crimeNo: string;
  section: string;
  policeStation: string;
  officerName: string;
  officerAddress: string;
  receiptDate: string;
  receiptDetails: string;
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  roadDescription: string;
  chassisNo: string;
  regNo: string;
  vehicleClass: string;
  vehicleMake: string;
  vehicleYear: string;
  inspectionDate: string;
  inspectionTime: string;
  inspectionPlace: string;
  lastInspectionDate: string;
  fitnessCertExpiryDate: string;
  damagesDetails: string;
  brakeUnableToInspect: boolean;
  footBrakeEfficiency: string;
  parkingBrakeEfficiency: string;
  brakeEvenAction: string;
  hydraulicFluidLeak: string;
  hydraulicLeakage: string;
  hydraulicBreakages: string;
  hydraulicWornOut: string;
  hydraulicFailureOther: string;
  mechanicalLackLubrication: string;
  mechanicalSlackAdjustment: string;
  mechanicalWornOut: string;
  mechanicalFailureOther: string;
  parkingBrakeLackLubrication: string;
  parkingBrakeSlackness: string;
  parkingBrakeWornOut: string;
  parkingBrakeOtherReasons: string;
  steeringBacklash: string;
  tyreCondition: string;
  permitValidity: string;
  insuranceExpiryDate: string;
  insuranceCompany: string;
  insurancePolicyNo: string;
  insuranceCertificate: string;
  ownerName: string;
  ownerAddress: string;
  driverName: string;
  driverAddress: string;
  driverLicenceDetails: string;
  driverLicenceNo: string;
  driverLicenceValidUpto: string;
  involvedPersonDetails: string;
  legalHeirsDetails: string;
  mechanicalDefectsOpinion: string;
  tradePlateDetails: string;
  vcrNo: string;
  vcrDate: string;
  copyTo: string;
  image1: string;
  image2: string;
}

export function getEmptyFormData(): AccidentReportFormData {
  return {
    crimeNo: '',
    section: 'U/S 106(1) BNS',
    policeStation: '',
    officerName: '',
    officerAddress: '',
    receiptDate: '',
    receiptDetails: '',
    accidentDate: '',
    accidentTime: '',
    accidentPlace: '',
    roadDescription: '',
    chassisNo: '',
    regNo: '',
    vehicleClass: '',
    vehicleMake: '',
    vehicleYear: '',
    inspectionDate: '',
    inspectionTime: '',
    inspectionPlace: '',
    lastInspectionDate: '',
    fitnessCertExpiryDate: '',
    damagesDetails: '',
    brakeUnableToInspect: false,
    footBrakeEfficiency: 'Efficient',
    parkingBrakeEfficiency: 'Efficient',
    brakeEvenAction: 'Even Action',
    hydraulicFluidLeak: 'No Brake Failure',
    hydraulicLeakage: '',
    hydraulicBreakages: '',
    hydraulicWornOut: '',
    hydraulicFailureOther: '',
    mechanicalLackLubrication: 'No Brake Failure',
    mechanicalSlackAdjustment: '',
    mechanicalWornOut: '',
    mechanicalFailureOther: '',
    parkingBrakeLackLubrication: 'No Brake Failure',
    parkingBrakeSlackness: '',
    parkingBrakeWornOut: '',
    parkingBrakeOtherReasons: '',
    steeringBacklash: 'No',
    tyreCondition: 'Good',
    permitValidity: '',
    insuranceExpiryDate: '',
    insuranceCompany: '',
    insurancePolicyNo: '',
    insuranceCertificate: '',
    ownerName: '',
    ownerAddress: '',
    driverName: '',
    driverAddress: '',
    driverLicenceDetails: 'Valid',
    driverLicenceNo: '',
    driverLicenceValidUpto: '',
    involvedPersonDetails: 'INA',
    legalHeirsDetails: 'INA',
    mechanicalDefectsOpinion: 'In my opinion the accident was not occured due to any mechanical defects of the vehicle',
    tradePlateDetails: 'INA',
    vcrNo: '',
    vcrDate: '',
    copyTo: 'DTO office, Siddipet',
    image1: '',
    image2: '',
  };
}

export function reportToFormData(report: AccidentReport): AccidentReportFormData {
  return {
    crimeNo: report.crimeNo || '',
    section: report.section || '',
    policeStation: report.policeStation || '',
    officerName: report.officerName || '',
    officerAddress: report.officerAddress || '',
    receiptDate: report.receiptDate || '',
    receiptDetails: report.receiptDetails || '',
    accidentDate: report.accidentDate || '',
    accidentTime: report.accidentTime || '',
    accidentPlace: report.accidentPlace || '',
    roadDescription: report.roadDescription || '',
    chassisNo: report.chassisNo || '',
    regNo: report.regNo || '',
    vehicleClass: report.vehicleClass || '',
    vehicleMake: report.vehicleMake || '',
    vehicleYear: report.vehicleYear || '',
    inspectionDate: report.inspectionDate || '',
    inspectionTime: report.inspectionTime || '',
    inspectionPlace: report.inspectionPlace || '',
    lastInspectionDate: report.lastInspectionDate || '',
    fitnessCertExpiryDate: report.fitnessCertExpiryDate || '',
    damagesDetails: report.damagesDetails || '',
    brakeUnableToInspect: report.brakeUnableToInspect ?? false,
    footBrakeEfficiency: report.footBrakeEfficiency || 'Efficient',
    parkingBrakeEfficiency: report.parkingBrakeEfficiency || 'Efficient',
    brakeEvenAction: report.brakeEvenAction || 'Even Action',
    hydraulicFluidLeak: report.hydraulicFluidLeak || 'No Brake Failure',
    hydraulicLeakage: report.hydraulicLeakage || '',
    hydraulicBreakages: report.hydraulicBreakages || '',
    hydraulicWornOut: report.hydraulicWornOut || '',
    hydraulicFailureOther: report.hydraulicFailureOther || '',
    mechanicalLackLubrication: report.mechanicalLackLubrication || 'No Brake Failure',
    mechanicalSlackAdjustment: report.mechanicalSlackAdjustment || '',
    mechanicalWornOut: report.mechanicalWornOut || '',
    mechanicalFailureOther: report.mechanicalFailureOther || '',
    parkingBrakeLackLubrication: report.parkingBrakeLackLubrication || 'No Brake Failure',
    parkingBrakeSlackness: report.parkingBrakeSlackness || '',
    parkingBrakeWornOut: report.parkingBrakeWornOut || '',
    parkingBrakeOtherReasons: report.parkingBrakeOtherReasons || '',
    steeringBacklash: report.steeringBacklash || 'No',
    tyreCondition: report.tyreCondition || 'Good',
    permitValidity: report.permitValidity || '',
    insuranceExpiryDate: report.insuranceExpiryDate || '',
    insuranceCompany: report.insuranceCompany || '',
    insurancePolicyNo: report.insurancePolicyNo || '',
    insuranceCertificate: report.insuranceCertificate || '',
    ownerName: report.ownerName || '',
    ownerAddress: report.ownerAddress || '',
    driverName: report.driverName || '',
    driverAddress: report.driverAddress || '',
    driverLicenceDetails: report.driverLicenceDetails || '',
    driverLicenceNo: report.driverLicenceNo || '',
    driverLicenceValidUpto: report.driverLicenceValidUpto || '',
    involvedPersonDetails: report.involvedPersonDetails || '',
    legalHeirsDetails: report.legalHeirsDetails || '',
    mechanicalDefectsOpinion: report.mechanicalDefectsOpinion || '',
    tradePlateDetails: report.tradePlateDetails || '',
    vcrNo: report.vcrNo || '',
    vcrDate: report.vcrDate || '',
    copyTo: report.copyTo || '',
    image1: report.image1 || '',
    image2: report.image2 || '',
  };
}
