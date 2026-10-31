export type InsuranceDomain = 'AUTO' | 'HOMEOWNERS' | 'LIFE' | 'PNC_COMMERCIAL';

export type ClaimStatus = 
  | 'FNOL_PENDING' 
  | 'UNDER_REVIEW' 
  | 'SIU_INVESTIGATION' 
  | 'APPROVED' 
  | 'SETTLED' 
  | 'DENIED';

export type FraudRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_SIU';

export interface FraudFactor {
  name: string;
  score: number;
  maxScore: number;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ClaimEvidence {
  id: string;
  title: string;
  type: 'PHOTO' | 'POLICE_REPORT' | 'TELEMATICS' | 'MEDICAL_BILL' | 'ESTIMATE' | 'DEATH_CERTIFICATE' | 'SURVEILLANCE';
  fileUrl?: string;
  verified: boolean;
  notes: string;
  anomalyDetected?: boolean;
}

export interface AdjusterNote {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  text: string;
}

export interface InsuranceClaim {
  id: string;
  domain: InsuranceDomain;
  policyNumber: string;
  policyholderName: string;
  policyholderPhone: string;
  policyholderEmail: string;
  policyInceptionDate: string;
  policyAgeDays: number;
  coverageLimit: number;
  deductible: number;
  
  // Incident details
  incidentDate: string;
  fnolDate: string;
  lossLocation: string;
  coverageType: string;
  description: string;
  
  // Financials
  claimedAmount: number;
  estimatedLoss: number;
  currentReserve: number;
  approvedPayout: number;
  
  // Status & Assignment
  status: ClaimStatus;
  assignedAdjuster: string;
  slaTargetDays: number;
  daysOpen: number;
  
  // Fraud Scoring
  fraudScore: number; // 0 - 100
  fraudTier: FraudRiskTier;
  fraudFactors: FraudFactor[];
  siuDispatched: boolean;
  exifMismatch?: boolean;
  priorClaimsCount: number;
  providerAnomaly?: boolean;
  telematicsDiscrepancy?: boolean;
  preExistingRot?: boolean;
  undisclosedCondition?: boolean;
  businessDistress?: boolean;
  
  // Artifacts & Notes
  evidence: ClaimEvidence[];
  adjusterNotes: AdjusterNote[];
  aiSummary?: string;
}

export interface PolicyClause {
  id: string;
  domain: InsuranceDomain;
  category: string;
  policyForm: string;
  section: string;
  title: string;
  keywords: string[];
  content: string;
  exclusions?: string[];
  deductibleGuidance?: string;
  relevanceScore?: number;
}
