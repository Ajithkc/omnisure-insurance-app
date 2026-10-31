import React from 'react';
import { 
  Plus, 
  ChevronRight 
} from 'lucide-react';
import { InsuranceDomain } from '../types/insurance';

interface HeaderProps {
  selectedDomain: 'ALL' | InsuranceDomain;
  activeTab: 'CLAIMS' | 'FRAUD' | 'RAG_CHAT' | 'POLICIES';
  onOpenFNOL: () => void;
  stats: {
    totalClaims: number;
    totalReserves: number;
    siuCount: number;
    fraudSaved: number;
    approvedCount: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  selectedDomain,
  activeTab,
  onOpenFNOL,
  stats,
}) => {
  const getPageTitle = () => {
    switch (activeTab) {
      case 'CLAIMS':
        return 'Claims Operations & Adjudication';
      case 'FRAUD':
        return 'Fraud Detection Engine & SIU Workbench';
      case 'RAG_CHAT':
        return 'Customer Service RAG Policy Assistant';
      case 'POLICIES':
        return 'Statutory Policy Form Repository';
    }
  };

  const getDomainLabel = () => {
    switch (selectedDomain) {
      case 'ALL':
        return 'All Lines';
      case 'AUTO':
        return 'Personal Auto (PAP)';
      case 'HOMEOWNERS':
        return 'Homeowners (HO-3)';
      case 'LIFE':
        return 'Term Life';
      case 'PNC_COMMERCIAL':
        return 'Commercial P&C';
    }
  };

  return (
    <header className="h-16 px-6 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0 z-10">
      {/* Zone 1: Breadcrumb Trail & Page Title */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <span className="hover:text-[#111827] transition-colors">OmniSure</span>
          <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
          <span className="hover:text-[#111827] transition-colors">{getDomainLabel()}</span>
          <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
          <span className="text-[#111827] font-medium">{getPageTitle()}</span>
        </div>
        <h1 className="text-sm font-semibold text-[#0B1F3A] tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Zone 2: Enterprise Metrics Bar */}
      <div className="hidden lg:flex items-center gap-6 text-xs border-x border-[#E2E8F0] px-6">
        <div>
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-medium">Incurred Reserves</span>
          <span className="font-mono text-[#0B1F3A] font-semibold tabular-nums text-xs">
            ${(stats.totalReserves).toLocaleString()}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-medium">SIU Risk Hold</span>
          <span className="font-mono text-[#DC2626] font-semibold tabular-nums text-xs">
            ${(stats.fraudSaved).toLocaleString()}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-medium">Closed / Settled</span>
          <span className="font-mono text-[#0B1F3A] font-semibold tabular-nums text-xs">
            {stats.approvedCount} of {stats.totalClaims}
          </span>
        </div>
      </div>

      {/* Zone 3: Actions & User Area */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenFNOL}
          className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs py-2 px-3.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New FNOL Claim</span>
        </button>

        <div className="h-6 w-px bg-[#E2E8F0]" />

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-blue-200 text-[#2563EB] flex items-center justify-center font-bold text-xs">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};