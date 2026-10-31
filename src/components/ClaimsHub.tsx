import React, { useState, useMemo } from 'react';
import { 
  InsuranceClaim, 
  InsuranceDomain, 
  ClaimStatus 
} from '../types/insurance';
import { 
  Search, 
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';

interface ClaimsHubProps {
  claims: InsuranceClaim[];
  selectedDomain: 'ALL' | InsuranceDomain;
  onSelectClaim: (claim: InsuranceClaim) => void;
  onOpenFNOL: () => void;
}

export const ClaimsHub: React.FC<ClaimsHubProps> = ({
  claims,
  selectedDomain,
  onSelectClaim,
  onOpenFNOL,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClaimStatus>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'fraud'>('fraud');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter & sort claims
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      if (selectedDomain !== 'ALL' && c.domain !== selectedDomain) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.policyholderName.toLowerCase().includes(q) ||
          c.policyNumber.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.lossLocation.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime();
      } else if (sortBy === 'amount') {
        comparison = b.claimedAmount - a.claimedAmount;
      } else if (sortBy === 'fraud') {
        comparison = b.fraudScore - a.fraudScore;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [claims, selectedDomain, statusFilter, searchQuery, sortBy, sortOrder]);

  const getDomainText = (domain: InsuranceDomain) => {
    switch (domain) {
      case 'AUTO': return 'Auto';
      case 'HOMEOWNERS': return 'Homeowners';
      case 'LIFE': return 'Life';
      case 'PNC_COMMERCIAL': return 'Commercial P&C';
    }
  };

  const renderStatus = (status: ClaimStatus) => {
    switch (status) {
      case 'FNOL_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            FNOL Intake
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
            Under Review
          </span>
        );
      case 'SIU_INVESTIGATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
            SIU Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-[#16A34A] border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
            Approved
          </span>
        );
      case 'SETTLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-[#0B1F3A] border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B1F3A]"></span>
            Settled / Paid
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 line-through border border-slate-200">
            Denied
          </span>
        );
    }
  };

  const renderFraudScore = (score: number) => {
    if (score >= 65) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-[#DC2626] border border-red-200 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
          {score}/100 Critical
        </span>
      );
    } else if (score >= 40) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-[#D97706] border border-amber-200 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
          {score}/100 High
        </span>
      );
    } else if (score >= 20) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-[#2563EB] border border-blue-200 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
          {score}/100 Medium
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-[#16A34A] border border-emerald-200 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
          {score}/100 Low (STP)
        </span>
      );
    }
  };

  // KPI calculations
  const totalAmount = useMemo(() => filteredClaims.reduce((s, c) => s + c.claimedAmount, 0), [filteredClaims]);
  const totalReserve = useMemo(() => filteredClaims.reduce((s, c) => s + c.currentReserve, 0), [filteredClaims]);
  const siuCount = useMemo(() => filteredClaims.filter(c => c.status === 'SIU_INVESTIGATION' || c.fraudScore >= 65).length, [filteredClaims]);

  return (
    <div className="space-y-6">
      {/* 4 Clean White KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Filtered Claims */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            Filtered Claims
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#0B1F3A] tabular-nums">
            {filteredClaims.length}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            Across current line filter
          </div>
        </div>

        {/* Card 2: Total Claimed Loss */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            Total Claimed Loss
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#0B1F3A] tabular-nums">
            ${totalAmount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            Gross reported valuation
          </div>
        </div>

        {/* Card 3: Current Reserve Balance (Primary Blue) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            Current Reserve Balance
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#2563EB] tabular-nums">
            ${totalReserve.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            Actuarial loss funds set aside
          </div>
        </div>

        {/* Card 4: SIU Fraud Referrals (Critical Red) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            SIU Fraud Referrals
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#DC2626] tabular-nums">
            {siuCount}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            Flagged by heuristic engine
          </div>
        </div>
      </div>

      {/* Horizontal Search & Filter Toolbar */}
      <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by claim ID, policyholder, policy..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
          />
        </div>

        {/* Status segmented filters */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
            {(['ALL', 'UNDER_REVIEW', 'SIU_INVESTIGATION', 'APPROVED', 'SETTLED'] as Array<'ALL' | ClaimStatus>).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs border border-[#E2E8F0]'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'UNDER_REVIEW' ? 'Review' : st === 'SIU_INVESTIGATION' ? 'SIU' : st === 'APPROVED' ? 'Approved' : 'Settled'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#111827] text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="fraud">Fraud Score</option>
              <option value="amount">Claimed Amount</option>
              <option value="date">Loss Date</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="text-[#64748B] hover:text-[#111827] text-[10px] font-mono font-bold px-1"
              title="Toggle sort order"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise Claims Data Grid */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B] sticky top-0">
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Line</th>
                <th className="py-3 px-4">Policyholder & Number</th>
                <th className="py-3 px-4">Date of Loss</th>
                <th className="py-3 px-4 text-right">Claimed Loss</th>
                <th className="py-3 px-4 text-right">Reserve</th>
                <th className="py-3 px-4">Fraud Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B]">
                    <FileSpreadsheet className="w-7 h-7 mx-auto mb-2 text-[#94A3B8]" />
                    No insurance claims match your current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim, idx) => (
                  <tr
                    key={claim.id}
                    onClick={() => onSelectClaim(claim)}
                    className={`hover:bg-[#F8FAFC] transition-colors cursor-pointer group ${
                      idx % 2 === 1 ? 'bg-[#FAFCFE]' : 'bg-white'
                    }`}
                  >
                    {/* Claim ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#0B1F3A] group-hover:text-[#2563EB]">
                      {claim.id}
                    </td>

                    {/* Line of Business */}
                    <td className="py-3.5 px-4 text-[#111827] font-medium">
                      {getDomainText(claim.domain)}
                    </td>

                    {/* Policyholder & Number */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#111827]">{claim.policyholderName}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{claim.policyNumber}</div>
                    </td>

                    {/* Date of Loss */}
                    <td className="py-3.5 px-4 text-[#64748B] font-mono">
                      {claim.incidentDate}
                    </td>

                    {/* Claimed Loss */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#111827] font-semibold tabular-nums">
                      ${claim.claimedAmount.toLocaleString()}
                    </td>

                    {/* Reserve */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#2563EB] font-semibold tabular-nums">
                      ${claim.currentReserve.toLocaleString()}
                    </td>

                    {/* Fraud Risk Score */}
                    <td className="py-3.5 px-4">
                      {renderFraudScore(claim.fraudScore)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {renderStatus(claim.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClaim(claim);
                        }}
                        className="text-xs text-[#2563EB] hover:text-blue-800 font-medium inline-flex items-center gap-1 group-hover:underline cursor-pointer"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
