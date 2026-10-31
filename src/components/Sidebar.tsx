import React from 'react';
import { 
  FileText, 
  ShieldAlert, 
  Bot, 
  BookOpen, 
  Car, 
  Home, 
  HeartHandshake, 
  Building2, 
  Plus, 
  Layers, 
  Shield 
} from 'lucide-react';
import { InsuranceDomain } from '../types/insurance';

interface SidebarProps {
  activeTab: 'CLAIMS' | 'FRAUD' | 'RAG_CHAT' | 'POLICIES';
  onSelectTab: (tab: 'CLAIMS' | 'FRAUD' | 'RAG_CHAT' | 'POLICIES') => void;
  selectedDomain: 'ALL' | InsuranceDomain;
  onSelectDomain: (domain: 'ALL' | InsuranceDomain) => void;
  onOpenFNOL: () => void;
  siuCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  selectedDomain,
  onSelectDomain,
  onOpenFNOL,
  siuCount,
}) => {
  const navItems: Array<{
    id: 'CLAIMS' | 'FRAUD' | 'RAG_CHAT' | 'POLICIES';
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'CLAIMS',
      label: 'Claims Operations',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'FRAUD',
      label: 'Fraud & SIU Engine',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: siuCount,
    },
    {
      id: 'RAG_CHAT',
      label: 'Customer Service RAG',
      icon: <Bot className="w-4 h-4" />,
    },
    {
      id: 'POLICIES',
      label: 'Policy Repository',
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  const linesOfBusiness: Array<{
    id: 'ALL' | InsuranceDomain;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'ALL', label: 'All Portfolio Lines', icon: <Layers className="w-4 h-4" /> },
    { id: 'AUTO', label: 'Personal Auto (PAP)', icon: <Car className="w-4 h-4" /> },
    { id: 'HOMEOWNERS', label: 'Homeowners (HO-3)', icon: <Home className="w-4 h-4" /> },
    { id: 'LIFE', label: 'Term Life Contracts', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'PNC_COMMERCIAL', label: 'Commercial P&C', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 select-none h-full z-20">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight text-[#0B1F3A]">
              OmniSure
            </div>
            <div className="text-[11px] font-medium text-[#64748B] -mt-0.5">
              Insurance Suite v3.2
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Intake Claim */}
      <div className="p-3.5 border-b border-[#E2E8F0]">
        <button
          onClick={onOpenFNOL}
          className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs py-2 px-3.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New FNOL Intake</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Main Workspaces */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            Navigation
          </div>

          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-[#DC2626] border border-rose-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Line of Business */}
        <div className="space-y-1 pt-3 border-t border-[#E2E8F0]">
          <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            Line of Business
          </div>
          {linesOfBusiness.map(lob => {
            const isSelected = selectedDomain === lob.id;
            return (
              <button
                key={lob.id}
                onClick={() => onSelectDomain(lob.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isSelected ? 'text-[#2563EB]' : 'text-[#94A3B8]'}>
                    {lob.icon}
                  </span>
                  <span className="truncate">{lob.label}</span>
                </div>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Adjuster / User Area */}
      <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
            AD
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#111827] truncate">Senior Adjuster</div>
            <div className="text-[10px] text-[#64748B] font-mono truncate">ID: ADJ-9042</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#16A34A] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
          Online
        </span>
      </div>
    </aside>
  );
};