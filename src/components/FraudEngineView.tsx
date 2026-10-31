import React, { useState } from 'react';
import { 
  InsuranceClaim, 
  InsuranceDomain,
  FraudFactor
} from '../types/insurance';
import { 
  ShieldAlert, 
  Loader2, 
  ChevronRight
} from 'lucide-react';

interface FraudEngineViewProps {
  claims: InsuranceClaim[];
  onSelectClaim: (claim: InsuranceClaim) => void;
}

export const FraudEngineView: React.FC<FraudEngineViewProps> = ({
  claims,
  onSelectClaim,
}) => {
  // Simulator State
  const [simDomain, setSimDomain] = useState<InsuranceDomain>('AUTO');
  const [simPolicyAgeDays, setSimPolicyAgeDays] = useState(14);
  const [simPriorClaims, setSimPriorClaims] = useState(3);
  const [simExifMismatch, setSimExifMismatch] = useState(true);
  const [simProviderAnomaly, setSimProviderAnomaly] = useState(true);
  const [simDomainAnomaly, setSimDomainAnomaly] = useState(true);
  const [simClaimedAmount, setSimClaimedAmount] = useState(48000);

  // Result state
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    totalScore: number;
    riskTier: string;
    factors: FraudFactor[];
    aiExplanation: string;
    recommendedAction: string;
  } | null>(null);

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const payload = {
        id: 'SIM-TEST-001',
        domain: simDomain,
        claimedAmount: simClaimedAmount,
        description: 'Simulated claim scenario running through multi-factor fraud detection matrix.',
        policyAgeDays: simPolicyAgeDays,
        priorClaimsCount: simPriorClaims,
        exifMismatch: simExifMismatch,
        providerAnomaly: simProviderAnomaly,
        telematicsDiscrepancy: simDomain === 'AUTO' && simDomainAnomaly,
        preExistingRot: simDomain === 'HOMEOWNERS' && simDomainAnomaly,
        undisclosedCondition: simDomain === 'LIFE' && simDomainAnomaly,
        businessDistress: simDomain === 'PNC_COMMERCIAL' && simDomainAnomaly,
      };

      const res = await fetch('/api/fraud/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSimResult(data);
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setSimulating(false);
    }
  };

  const highRiskClaims = claims.filter(c => c.fraudScore >= 40);

  return (
    <div className="space-y-6">
      {/* Executive Intro Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#0B1F3A]">
            Algorithmic Fraud Detection & Special Investigation Unit (SIU)
          </h2>
          <p className="text-xs text-[#64748B] mt-1 max-w-3xl leading-relaxed">
            Automated multi-factor risk scoring analyzing rapid policy inception losses, digital EXIF metadata anomalies,
            cross-carrier frequency records, telematics delta-V discrepancies, and statutory contestability non-disclosures.
          </p>
        </div>

        <div className="flex items-center gap-6 border-l border-[#E2E8F0] pl-6 shrink-0 text-xs">
          <div>
            <div className="text-[10px] text-[#64748B] uppercase font-semibold">Active Claims Screened</div>
            <div className="font-mono text-base font-bold text-[#0B1F3A] tabular-nums">{claims.length}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#DC2626] uppercase font-semibold">SIU Critical Hold</div>
            <div className="font-mono text-base font-bold text-[#DC2626] tabular-nums">
              {claims.filter(c => c.fraudTier === 'CRITICAL_SIU').length}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Simulator on Left, SIU Watchlist on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-semibold text-[#0B1F3A] uppercase tracking-wider">
                Heuristic Parameter Simulator ("What-If" Matrix)
              </h3>
              <span className="text-xs text-[#64748B]">Evaluate scoring engine</span>
            </div>

            {/* Domain Selection */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[#64748B] font-medium">Line of Business:</span>
              <div className="grid grid-cols-4 gap-2">
                {(['AUTO', 'HOMEOWNERS', 'LIFE', 'PNC_COMMERCIAL'] as InsuranceDomain[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSimDomain(d);
                      setSimResult(null);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-medium border text-xs text-center transition-colors cursor-pointer ${
                      simDomain === d
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-semibold'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#111827]'
                    }`}
                  >
                    {d === 'AUTO' ? 'Auto' : d === 'HOMEOWNERS' ? 'Home' : d === 'LIFE' ? 'Life' : 'P&C'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders and Toggles */}
            <div className="space-y-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-xs">
              {/* Inception Age */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#111827] font-medium">Policy Age at Loss:</span>
                  <span className="font-mono text-[#2563EB] font-bold tabular-nums">{simPolicyAgeDays} days</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="730"
                  step="5"
                  value={simPolicyAgeDays}
                  onChange={e => setSimPolicyAgeDays(parseInt(e.target.value, 10))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#64748B]">
                  <span className="text-[#DC2626] font-medium">&lt;14 Days (Critical Vector)</span>
                  <span>45 Days</span>
                  <span>1 Year</span>
                  <span>2 Years (Incontestable)</span>
                </div>
              </div>

              {/* Prior Claims */}
              <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
                <div className="flex justify-between">
                  <span className="text-[#111827] font-medium">Prior Losses in 24 Months:</span>
                  <span className="font-mono text-[#2563EB] font-bold tabular-nums">{simPriorClaims} losses</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={simPriorClaims}
                  onChange={e => setSimPriorClaims(parseInt(e.target.value, 10))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Claimed Amount */}
              <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
                <div className="flex justify-between">
                  <span className="text-[#111827] font-medium">Claimed Loss Amount:</span>
                  <span className="font-mono text-[#111827] font-bold tabular-nums">${simClaimedAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="250000"
                  step="2000"
                  value={simClaimedAmount}
                  onChange={e => setSimClaimedAmount(parseInt(e.target.value, 10))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Forensic Anomaly Triggers */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <div className="text-[#111827] font-medium">Forensic Indicators:</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simExifMismatch}
                      onChange={e => setSimExifMismatch(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-[#111827]">Photo EXIF Timestamp Mismatch (+25 pts)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simProviderAnomaly}
                      onChange={e => setSimProviderAnomaly(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-[#111827]">NICB Watchlist Vendor / Medical Clinic (+18 pts)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simDomainAnomaly}
                      onChange={e => setSimDomainAnomaly(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-[#111827]">
                      {simDomain === 'AUTO' && 'Telematics 0.1G G-Force Contradiction (+22 pts)'}
                      {simDomain === 'HOMEOWNERS' && 'Subfloor 90-Day Pre-Existing Rot (+24 pts)'}
                      {simDomain === 'LIFE' && 'Contestability Window + Undeclared Cardiac History (+35 pts)'}
                      {simDomain === 'PNC_COMMERCIAL' && 'Commercial Revenue Distress Prior to Loss (+25 pts)'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Multi-Factor Risk Score...</span>
                </>
              ) : (
                <span>Execute Risk Model & Generate SIU Brief</span>
              )}
            </button>

            {/* Results */}
            {simResult && (
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <div className="text-lg font-bold font-mono text-[#0B1F3A] tabular-nums">
                      {simResult.totalScore}/100 Risk Score
                    </div>
                    <div className="text-xs text-[#64748B]">
                      Tier: <strong className={simResult.totalScore >= 65 ? 'text-[#DC2626]' : 'text-[#2563EB]'}>{simResult.riskTier}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#64748B] uppercase font-semibold">Triage Action</div>
                    <div className="text-xs font-semibold text-[#0B1F3A]">{simResult.recommendedAction}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-[#64748B] uppercase text-[10px]">Contributed Risk Factors:</div>
                  {simResult.factors.map((f, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-[#F1F5F9] text-[#111827]">
                      <span>{f.name}</span>
                      <span className={`font-mono font-semibold tabular-nums ${f.score > 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                        +{f.score} pts
                      </span>
                    </div>
                  ))}
                </div>

                {simResult.aiExplanation && (
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs space-y-1">
                    <div className="font-semibold text-[#2563EB]">SIU Special Agent Memorandum:</div>
                    <div className="text-[#111827] whitespace-pre-line leading-relaxed">
                      {simResult.aiExplanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SIU Watchlist (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-semibold text-[#0B1F3A] uppercase tracking-wider">
                SIU Priority Investigation Queue
              </h3>
              <span className="font-mono text-xs font-semibold text-[#DC2626]">
                {highRiskClaims.length} Flagged
              </span>
            </div>

            <div className="space-y-2.5">
              {highRiskClaims.map(claim => (
                <div
                  key={claim.id}
                  onClick={() => onSelectClaim(claim)}
                  className="p-3.5 bg-[#F8FAFC] hover:bg-white rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#0B1F3A] group-hover:text-[#2563EB]">
                      {claim.id}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#DC2626] tabular-nums">
                      {claim.fraudScore}/100 Risk
                    </span>
                  </div>

                  <div className="text-xs text-[#111827] font-semibold mt-1">
                    {claim.policyholderName}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {claim.coverageType}
                  </div>

                  <div className="mt-2 text-[11px] text-[#DC2626] bg-red-50 p-2 rounded border border-red-100 leading-tight">
                    {claim.fraudFactors[0]?.name || 'Anomalous loss pattern'}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] font-mono">
                    <span>Reserve Hold: ${claim.currentReserve.toLocaleString()}</span>
                    <span className="text-[#2563EB] font-sans group-hover:underline flex items-center gap-0.5 font-medium">
                      Review File <ChevronRight className="w-3 h-3 inline" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
