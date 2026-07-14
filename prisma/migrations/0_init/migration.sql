-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "AccidentReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crimeNo" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "policeStation" TEXT NOT NULL,
    "district" TEXT,
    "officerName" TEXT NOT NULL,
    "officerAddress" TEXT,
    "receiptDate" TEXT NOT NULL,
    "receiptDetails" TEXT,
    "accidentDate" TEXT NOT NULL,
    "accidentTime" TEXT NOT NULL,
    "accidentPlace" TEXT NOT NULL,
    "roadDescription" TEXT NOT NULL,
    "chassisNo" TEXT,
    "regNo" TEXT,
    "vehicleClass" TEXT,
    "vehicleMake" TEXT,
    "vehicleYear" TEXT,
    "inspectionDate" TEXT NOT NULL,
    "inspectionTime" TEXT NOT NULL,
    "inspectionPlace" TEXT NOT NULL,
    "lastInspectionDate" TEXT,
    "fitnessCertExpiryDate" TEXT,
    "damagesDetails" TEXT,
    "brakeUnableToInspect" BOOLEAN NOT NULL DEFAULT false,
    "footBrakeEfficiency" TEXT,
    "parkingBrakeEfficiency" TEXT,
    "brakeEvenAction" TEXT,
    "hydraulicFluidLeak" TEXT,
    "hydraulicLeakage" TEXT,
    "hydraulicBreakages" TEXT,
    "hydraulicWornOut" TEXT,
    "hydraulicFailureOther" TEXT,
    "mechanicalLackLubrication" TEXT,
    "mechanicalSlackAdjustment" TEXT,
    "mechanicalWornOut" TEXT,
    "mechanicalFailureOther" TEXT,
    "parkingBrakeLackLubrication" TEXT,
    "parkingBrakeSlackness" TEXT,
    "parkingBrakeWornOut" TEXT,
    "parkingBrakeOtherReasons" TEXT,
    "steeringBacklash" TEXT,
    "tyreCondition" TEXT,
    "permitValidity" TEXT,
    "insuranceExpiryDate" TEXT,
    "insuranceCompany" TEXT,
    "insurancePolicyNo" TEXT,
    "insuranceCertificate" TEXT,
    "ownerName" TEXT,
    "ownerAddress" TEXT,
    "driverName" TEXT,
    "driverAddress" TEXT,
    "driverLicenceDetails" TEXT,
    "driverLicenceNo" TEXT,
    "driverLicenceValidUpto" TEXT,
    "involvedPersonDetails" TEXT,
    "legalHeirsDetails" TEXT,
    "mechanicalDefectsOpinion" TEXT,
    "tradePlateDetails" TEXT,
    "vcrNo" TEXT,
    "vcrDate" TEXT,
    "copyTo" TEXT,
    "image1" TEXT,
    "image2" TEXT,
    "userId" TEXT,

    CONSTRAINT "AccidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "canViewReports" BOOLEAN NOT NULL DEFAULT true,
    "canEditReports" BOOLEAN NOT NULL DEFAULT true,
    "canPrintReports" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteReports" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- AddForeignKey
ALTER TABLE "AccidentReport" ADD CONSTRAINT "AccidentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

