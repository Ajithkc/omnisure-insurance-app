import React, { useState } from 'react';
import { 
  InsuranceClaim, 
  ClaimStatus 
} from '../types/insurance';
import { 
  X, 
  Bot, 
  CheckCircle2, 
  AlertTriangle,
  Plus
} from 'lucide-react';

interface ClaimDetailModalProps {
  claim: InsuranceClaim;
  onClose: () => void;
  onUpdateStatus: (claimId: string, newStatus: ClaimStatus, approvedPayout?: number) => void;
  onAdjustReserve: (claimId: string, newReserve: number) => void;
  onAddAdjusterNote: (claimId: string, noteText: string) => void;
  onOpenChatWithClaim: (claim: InsuranceClaim) => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  claim,
  onClose,
  onUpdateStatus,
  onAdjustReserve,
  onAddAdjusterNote,
  onOpenChatWithClaim,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FRAUD' | 'EVIDENCE' | 'NOTES'>('OVERVIEW');
  const [newNote, setNewNote] = useState('');
  const [reserveInput, setReserveInput] = useState(claim.currentReserve.toString());
  const [payoutInput, setPayoutInput] = useState(
    claim.approvedPayout > 0 
      ? claim.approvedPayout.toString() 
      : Math.max(0, claim.estimatedLoss - claim.deductible).toString()
  );
  const [isAdjustingReserve, setIsAdjustingReserve] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleSaveReserve = () => {
    const val = parseFloat(reserveInput);
    if (!isNaN(val) && val >= 0) {
      onAdjustReserve(claim.id, val);
      setIsAdjustingReserve(false);
    }
  };

  const handleApprovePayout = () => {
    const val = parseFloat(payoutInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateStatus(claim.id, 'APPROVED', val);
      setIsApproving(false);
    }
  };

  const handleSendToSIU = () => {
    onUpdateStatus(claim.id, 'SIU_INVESTIGATION');
    onAddAdjusterNote(claim.id, 'Escalated to Special Investigation Unit (SIU) based on verified anomalous triggers.');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddAdjusterNote(claim.id, newNote.trim());
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
              <span className="text-[#0B1F3A] font-bold text-sm">{claim.id}</span>
              <span aria-hidden="true">·</span>
              <span>Policy {claim.policyNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{claim.domain} Line</span>
              <span aria-hidden="true">·</span>
              <span>Inception {claim.policyInceptionDate} ({claim.policyAgeDays}d)</span>
            </div>
            <h2 className="text-base font-semibold text-[#0B1F3A] mt-1">
              {claim.policyholderName} — {claim.coverageType}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#111827] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#E2E8F0] bg-white px-5 flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`py-3 font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Adjudication & Reserves
            </button>

            <button
              onClick={() => setActiveTab('FRAUD')}
              className={`py-3 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'FRAUD'
                  ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#111827]'
              }`}
            >
              <span>Fraud Risk Assessment</span>
              <span className="font-mono text-[11px] text-[#DC2626] font-semibold">({claim.fraudScore}/100)</span>
            </button>

            <button
              onClick={() => setActiveTab('EVIDENCE')}
              className={`py-3 font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'EVIDENCE'
                  ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Evidence Artifacts ({claim.evidence.length})
            </button>

            <button
              onClick={() => setActiveTab('NOTES')}
              className={`py-3 font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'NOTES'
                  ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Audit Log ({claim.adjusterNotes.length})
            </button>
          </div>

          <button
            onClick={() => onOpenChatWithClaim(claim)}
            className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-blue-800 font-medium cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Consult Policy RAG</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Ledger Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <div>
                  <div className="text-[10px] text-[#64748B] uppercase font-semibold">Claimed Loss</div>
                  <div className="font-mono text-base font-bold text-[#0B1F3A] mt-1 tabular-nums">
                    ${claim.claimedAmount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#64748B] uppercase font-semibold">Estimated Loss (ACV)</div>
                  <div className="font-mono text-base font-bold text-[#111827] mt-1 tabular-nums">
                    ${claim.estimatedLoss.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#64748B] uppercase font-semibold">Policy Deductible</div>
                  <div className="font-mono text-base font-bold text-[#111827] mt-1 tabular-nums">
                    ${claim.deductible.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#2563EB] uppercase font-semibold flex items-center justify-between">
                    <span>Active Reserve</span>
                    <button
                      onClick={() => setIsAdjustingReserve(!isAdjustingReserve)}
                      className="text-[10px] text-[#2563EB] hover:underline lowercase font-sans cursor-pointer"
                    >
                      edit
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-[#2563EB] mt-1 tabular-nums">
                    ${claim.currentReserve.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Reserve Modifier Inline */}
              {isAdjustingReserve && (
                <div className="p-3 bg-white border border-[#2563EB] rounded-lg flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#111827] font-medium">New Reserve ($):</span>
                    <input
                      type="number"
                      value={reserveInput}
                      onChange={e => setReserveInput(e.target.value)}
                      className="bg-[#F8FAFC] border border-[#CBD5E1] px-2.5 py-1 rounded text-[#111827] font-mono w-32 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveReserve}
                      className="bg-[#2563EB] hover:bg-blue-700 text-white px-3 py-1 rounded font-medium cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsAdjustingReserve(false)}
                      className="text-[#64748B] hover:text-[#111827] px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Narrative & Incident Metadata */}
              <div className="space-y-3">
                <div className="font-semibold text-[#0B1F3A]">First Notice of Loss Narrative</div>
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] leading-relaxed text-[#111827]">
                  {claim.description}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-[#64748B] border-t border-[#E2E8F0]">
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Incident Date & Location</span>
                    <span className="text-[#111827] font-medium">{claim.incidentDate} — {claim.lossLocation}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Coverage Limit</span>
                    <span className="text-[#111827] font-mono font-medium">${claim.coverageLimit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Assigned Adjuster</span>
                    <span className="text-[#111827] font-medium">{claim.assignedAdjuster}</span>
                  </div>
                </div>
              </div>

              {/* Adjudication AI Memorandum */}
              {claim.aiSummary && (
                <div className="space-y-1.5 p-4 bg-[#EFF6FF] rounded-xl border border-blue-200">
                  <div className="font-semibold text-[#2563EB] text-xs">
                    Automated Adjudication Assessment
                  </div>
                  <p className="text-[#111827] leading-relaxed">
                    {claim.aiSummary}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'FRAUD' && (
            <div className="space-y-5">
              {/* Risk Level Banner */}
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#0B1F3A] font-mono tabular-nums">
                      {claim.fraudScore}/100 Risk Score
                    </span>
                    <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
                    <span className={`font-semibold ${
                      claim.fraudScore >= 65 ? 'text-[#DC2626]' : claim.fraudScore >= 40 ? 'text-[#D97706]' : 'text-[#16A34A]'
                    }`}>
                      Tier: {claim.fraudTier}
                    </span>
                  </div>
                  <p className="text-[#64748B] mt-1">
                    {claim.fraudScore >= 65 
                      ? 'Severe risk pattern. Requires Special Investigation Unit (SIU) dispatch and EUO.' 
                      : claim.fraudScore >= 40 
                      ? 'Elevated risk score. Require verification of repair invoices and prior claims.' 
                      : 'Nominal risk indicators. Eligible for Straight-Through Processing (STP).'}
                  </p>
                </div>

                {claim.fraudScore >= 65 && !claim.siuDispatched && (
                  <button
                    onClick={handleSendToSIU}
                    className="bg-[#DC2626] hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Escalate to SIU
                  </button>
                )}
              </div>

              {/* Triggered Factors */}
              <div className="space-y-2">
                <div className="font-semibold text-[#0B1F3A]">Algorithmic Heuristic Factors:</div>
                <div className="space-y-2">
                  {claim.fraudFactors.map((f, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-[#E2E8F0] flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-[#111827]">{f.name}</div>
                        <div className="text-[#64748B] text-[11px] mt-0.5">{f.reason}</div>
                      </div>
                      <div className="font-mono text-right shrink-0">
                        <span className={f.score > 0 ? 'text-[#DC2626] font-semibold' : 'text-[#94A3B8]'}>
                          +{f.score}
                        </span>
                        <span className="text-[#64748B] text-[10px]"> / {f.maxScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EVIDENCE' && (
            <div className="space-y-4">
              <div className="font-semibold text-[#0B1F3A]">Verified Evidence & Forensics:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {claim.evidence.map(ev => (
                  <div key={ev.id} className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-[#64748B]">{ev.id}</span>
                      <span className={ev.anomalyDetected ? 'text-[#DC2626] font-semibold' : 'text-[#16A34A] font-medium'}>
                        {ev.anomalyDetected ? 'Anomaly Flagged' : 'Verified'}
                      </span>
                    </div>
                    <div className="font-semibold text-[#111827]">{ev.title}</div>
                    <p className="text-[#64748B] leading-relaxed text-[11px] bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                      {ev.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'NOTES' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Record adjuster findings or audit log entry..."
                  className="flex-1 bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Post Note
                </button>
              </form>

              <div className="space-y-2">
                {claim.adjusterNotes.map(n => (
                  <div key={n.id} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                    <div className="flex justify-between text-[11px] text-[#64748B]">
                      <span className="text-[#111827] font-semibold">{n.author} ({n.role})</span>
                      <span className="font-mono">{n.timestamp}</span>
                    </div>
                    <div className="text-[#111827]">{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="text-xs text-[#64748B] font-medium">
            Status: <span className="text-[#111827] font-semibold">{claim.status}</span>
          </div>

          <div className="flex items-center gap-3">
            {isApproving ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#111827] font-medium">Payout ($):</span>
                <input
                  type="number"
                  value={payoutInput}
                  onChange={e => setPayoutInput(e.target.value)}
                  className="bg-white border border-[#CBD5E1] px-2.5 py-1 rounded text-xs font-mono text-[#111827] w-28 focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  onClick={handleApprovePayout}
                  className="bg-[#16A34A] hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded font-medium cursor-pointer"
                >
                  Confirm Payout
                </button>
                <button
                  onClick={() => setIsApproving(false)}
                  className="text-[#64748B] hover:text-[#111827] px-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {claim.status !== 'APPROVED' && claim.status !== 'SETTLED' && (
                  <button
                    onClick={() => setIsApproving(true)}
                    className="bg-[#16A34A] hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-medium cursor-pointer shadow-xs transition-colors"
                  >
                    Approve Payout
                  </button>
                )}

                {claim.status !== 'SIU_INVESTIGATION' && (
                  <button
                    onClick={handleSendToSIU}
                    className="bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Refer to SIU
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="bg-white hover:bg-slate-50 text-[#111827] border border-[#CBD5E1] text-xs px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
