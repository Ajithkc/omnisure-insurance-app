import React, { useState } from 'react';
import { 
  InsuranceDomain, 
  InsuranceClaim, 
  FraudRiskTier,
  FraudFactor
} from '../types/insurance';
import { 
  X, 
  Loader2
} from 'lucide-react';

interface FNOLModalProps {
  onClose: () => void;
  onSubmitClaim: (newClaim: InsuranceClaim) => void;
}

export const FNOLModal: React.FC<FNOLModalProps> = ({
  onClose,
  onSubmitClaim,
}) => {
  const [domain, setDomain] = useState<InsuranceDomain>('AUTO');
  const [policyholderName, setPolicyholderName] = useState('Jonathan Reynolds');
  const [policyNumber, setPolicyNumber] = useState('POL-AUT-449102');
  const [policyholderEmail, setPolicyholderEmail] = useState('j.reynolds@domain.com');
  const [policyholderPhone, setPolicyholderPhone] = useState('(555) 349-2199');
  const [policyAgeDays, setPolicyAgeDays] = useState(18);
  const [coverageLimit, setCoverageLimit] = useState(100000);
  const [deductible, setDeductible] = useState(500);
  
  const [incidentDate, setIncidentDate] = useState('2026-10-06');
  const [lossLocation, setLossLocation] = useState('Route 1 & Mill Rd, Princeton, NJ');
  const [coverageType, setCoverageType] = useState('Part D - Collision & Comprehensive');
  const [description, setDescription] = useState('Vehicle struck a guardrail while avoiding road debris at 45 mph. Heavy front-right suspension damage.');
  const [claimedAmount, setClaimedAmount] = useState(8500);

  // Fraud testing simulation toggles
  const [exifMismatch, setExifMismatch] = useState(true);
  const [priorClaimsCount, setPriorClaimsCount] = useState(2);
  const [providerAnomaly, setProviderAnomaly] = useState(false);
  const [domainAnomaly, setDomainAnomaly] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDomainChange = (newDomain: InsuranceDomain) => {
    setDomain(newDomain);
    if (newDomain === 'AUTO') {
      setPolicyNumber('POL-AUT-449102');
      setCoverageType('Part D - Collision & Comprehensive');
      setLossLocation('Route 1 & Mill Rd, Princeton, NJ');
      setDescription('Vehicle struck a guardrail while avoiding road debris at 45 mph. Heavy front-right suspension damage.');
      setClaimedAmount(8500);
      setCoverageLimit(100000);
      setDeductible(500);
    } else if (newDomain === 'HOMEOWNERS') {
      setPolicyNumber('POL-HOM-772810');
      setCoverageType('Coverage A - Dwelling & Water Backup');
      setLossLocation('89 Orchard Lane, Naperville, IL');
      setDescription('Water heater supply tube ruptured, causing standing water across finished basement hardwood.');
      setClaimedAmount(14200);
      setCoverageLimit(350000);
      setDeductible(1000);
    } else if (newDomain === 'LIFE') {
      setPolicyNumber('POL-LIF-883019');
      setCoverageType('Term-20 Level Death Benefit');
      setLossLocation('St. Jude Medical Center, Houston, TX');
      setDescription('Beneficiary filing for death benefit. Insured passed away from acute pulmonary complication.');
      setClaimedAmount(500000);
      setCoverageLimit(500000);
      setDeductible(0);
    } else if (newDomain === 'PNC_COMMERCIAL') {
      setPolicyNumber('POL-PNC-551029');
      setCoverageType('Commercial General Liability (CGL)');
      setLossLocation('Harborview Retail Complex, Suite 400, Boston, MA');
      setDescription('Customer sustained slip-and-fall on freshly mopped terrazzo tiles without warning signage; claiming fractured patella.');
      setClaimedAmount(42000);
      setCoverageLimit(1000000);
      setDeductible(2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedId = `CLM-${domain.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const claimPayload = {
      id: generatedId,
      domain,
      policyNumber,
      policyholderName,
      policyholderEmail,
      policyholderPhone,
      policyInceptionDate: new Date(Date.now() - policyAgeDays * 24 * 3600 * 1000).toISOString().split('T')[0],
      policyAgeDays,
      coverageLimit,
      deductible,
      incidentDate,
      fnolDate: new Date().toISOString().split('T')[0],
      lossLocation,
      coverageType,
      description,
      claimedAmount,
      estimatedLoss: Math.round(claimedAmount * 0.9),
      currentReserve: Math.round(claimedAmount * 1.05),
      approvedPayout: 0,
      status: 'FNOL_PENDING',
      assignedAdjuster: 'Auto-Routing Intake Desk',
      slaTargetDays: 14,
      daysOpen: 1,
      priorClaimsCount,
      exifMismatch,
      providerAnomaly,
      telematicsDiscrepancy: domain === 'AUTO' && domainAnomaly,
      preExistingRot: domain === 'HOMEOWNERS' && domainAnomaly,
      undisclosedCondition: domain === 'LIFE' && domainAnomaly,
      businessDistress: domain === 'PNC_COMMERCIAL' && domainAnomaly,
    };

    try {
      const response = await fetch('/api/fraud/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimPayload),
      });

      const fraudData = await response.json();

      const newClaim: InsuranceClaim = {
        ...claimPayload,
        fraudScore: fraudData.totalScore || 20,
        fraudTier: (fraudData.riskTier as FraudRiskTier) || 'LOW',
        fraudFactors: (fraudData.factors as FraudFactor[]) || [],
        siuDispatched: fraudData.riskTier === 'CRITICAL_SIU',
        status: fraudData.riskTier === 'CRITICAL_SIU' ? 'SIU_INVESTIGATION' : 'UNDER_REVIEW',
        aiSummary: fraudData.aiExplanation || 'Intake completed. Standard desk triage initialized.',
        evidence: [
          {
            id: `EV-${generatedId}-1`,
            title: 'FNOL Loss Verification Intake Report',
            type: 'ESTIMATE',
            verified: !exifMismatch,
            notes: exifMismatch 
              ? 'Metadata timestamp does not align with reported loss time.' 
              : 'Digital photo EXIF timestamp matches reported loss window.',
            anomalyDetected: exifMismatch,
          },
        ],
        adjusterNotes: [
          {
            id: `N-${Date.now()}`,
            author: 'OmniSure Intake Triage',
            role: 'Automated Routing Engine',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            text: `Claim registered via intake workflow. Heuristic score: ${fraudData.totalScore}/100. Action: ${fraudData.recommendedAction}`,
          },
        ],
      };

      onSubmitClaim(newClaim);
    } catch (err) {
      console.error('FNOL submission failed:', err);
      const fallbackClaim: InsuranceClaim = {
        ...claimPayload,
        fraudScore: 25,
        fraudTier: 'MEDIUM',
        fraudFactors: [],
        siuDispatched: false,
        status: 'UNDER_REVIEW',
        evidence: [],
        adjusterNotes: [],
      };
      onSubmitClaim(fallbackClaim);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B1F3A]">
              First Notice of Loss (FNOL) Intake
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter claim specifications to trigger automatic policy routing and fraud scoring.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#111827] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Domain Segmented Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#64748B] uppercase text-[10px] tracking-wider block">
              1. Line of Business:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['AUTO', 'HOMEOWNERS', 'LIFE', 'PNC_COMMERCIAL'] as InsuranceDomain[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDomainChange(d)}
                  className={`py-2 px-2 rounded-lg font-medium border text-xs text-center transition-colors cursor-pointer ${
                    domain === d
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-semibold'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#111827]'
                  }`}
                >
                  {d === 'AUTO' ? 'Auto' : d === 'HOMEOWNERS' ? 'Home' : d === 'LIFE' ? 'Life' : 'P&C'}
                </button>
              ))}
            </div>
          </div>

          {/* Policyholder & Coverage Details */}
          <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
            <div className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
              2. Insured Credentials & Policy Age
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[#64748B] block mb-1">Policyholder Full Name</label>
                <input
                  type="text"
                  required
                  value={policyholderName}
                  onChange={e => setPolicyholderName(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-[#64748B] block mb-1">Policy Number</label>
                <input
                  type="text"
                  required
                  value={policyNumber}
                  onChange={e => setPolicyNumber(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 font-mono text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-[#64748B] block mb-1">Policy Age (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={policyAgeDays}
                  onChange={e => setPolicyAgeDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 font-mono text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[#64748B] block mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={policyholderEmail}
                  onChange={e => setPolicyholderEmail(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-[#64748B] block mb-1">Coverage Form & Rider</label>
                <input
                  type="text"
                  required
                  value={coverageType}
                  onChange={e => setCoverageType(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Incident Details & Valuation */}
          <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
            <div className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
              3. Incident Narrative & Financial Valuation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[#64748B] block mb-1">Date of Loss</label>
                <input
                  type="date"
                  required
                  value={incidentDate}
                  onChange={e => setIncidentDate(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-[#64748B] block mb-1">Claimed Amount ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={claimedAmount}
                  onChange={e => setClaimedAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 font-mono text-[#0B1F3A] font-bold focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-[#64748B] block mb-1">Deductible ($)</label>
                <input
                  type="number"
                  min="0"
                  value={deductible}
                  onChange={e => setDeductible(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 font-mono text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="text-[#64748B] block mb-1">Loss Location</label>
              <input
                type="text"
                required
                value={lossLocation}
                onChange={e => setLossLocation(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="text-[#64748B] block mb-1">Incident Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded p-2.5 text-[#111827] focus:outline-none focus:border-[#2563EB] leading-relaxed"
              />
            </div>
          </div>

          {/* Test Forensic Toggles */}
          <div className="space-y-2 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
              Fraud Heuristics Simulation Switches:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#111827]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exifMismatch}
                  onChange={e => setExifMismatch(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>EXIF Timestamp Mismatch</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priorClaimsCount >= 2}
                  onChange={e => setPriorClaimsCount(e.target.checked ? 3 : 0)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Multiple Prior Losses</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={providerAnomaly}
                  onChange={e => setProviderAnomaly(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>NICB Watchlist Provider</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={domainAnomaly}
                  onChange={e => setDomainAnomaly(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Domain Specific Flag</span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#111827] px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Claim...</span>
                </>
              ) : (
                <span>Submit FNOL Intake</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
