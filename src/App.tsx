/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  InsuranceClaim, 
  InsuranceDomain, 
  ClaimStatus 
} from './types/insurance';
import { INITIAL_CLAIMS } from './data/mockClaims';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ClaimsHub } from './components/ClaimsHub';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { FNOLModal } from './components/FNOLModal';
import { FraudEngineView } from './components/FraudEngineView';
import { RAGChatbotView } from './components/RAGChatbotView';
import { PolicyExplorerView } from './components/PolicyExplorerView';

export default function App() {
  const [claims, setClaims] = useState<InsuranceClaim[]>(INITIAL_CLAIMS);
  const [selectedDomain, setSelectedDomain] = useState<'ALL' | InsuranceDomain>('ALL');
  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'FRAUD' | 'RAG_CHAT' | 'POLICIES'>('CLAIMS');
  
  // Modal states
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [isFNOLOpen, setIsFNOLOpen] = useState(false);
  
  // Chat pre-selected claim linkage
  const [chatClaimContext, setChatClaimContext] = useState<InsuranceClaim | null>(null);

  // Compute live executive statistics
  const stats = useMemo(() => {
    const totalClaims = claims.length;
    const totalReserves = claims.reduce((acc, c) => acc + c.currentReserve, 0);
    const siuCount = claims.filter(c => c.status === 'SIU_INVESTIGATION' || c.fraudScore >= 65).length;
    const fraudSaved = claims
      .filter(c => c.status === 'SIU_INVESTIGATION' || c.fraudScore >= 65)
      .reduce((acc, c) => acc + c.claimedAmount, 0);
    const approvedCount = claims.filter(c => c.status === 'APPROVED' || c.status === 'SETTLED').length;

    return {
      totalClaims,
      totalReserves,
      siuCount,
      fraudSaved,
      approvedCount,
    };
  }, [claims]);

  // Handler: Update Claim Status & Approved Payout
  const handleUpdateStatus = (claimId: string, newStatus: ClaimStatus, approvedPayout?: number) => {
    setClaims(prev =>
      prev.map(c => {
        if (c.id === claimId) {
          const updated = {
            ...c,
            status: newStatus,
            approvedPayout: approvedPayout !== undefined ? approvedPayout : c.approvedPayout,
            siuDispatched: newStatus === 'SIU_INVESTIGATION' ? true : c.siuDispatched,
          };
          if (selectedClaim?.id === claimId) {
            setSelectedClaim(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  // Handler: Adjust Financial Reserve
  const handleAdjustReserve = (claimId: string, newReserve: number) => {
    setClaims(prev =>
      prev.map(c => {
        if (c.id === claimId) {
          const updated = { ...c, currentReserve: newReserve };
          if (selectedClaim?.id === claimId) {
            setSelectedClaim(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  // Handler: Add Adjuster Audit Note
  const handleAddAdjusterNote = (claimId: string, noteText: string) => {
    const newNote = {
      id: `N-${Date.now()}`,
      author: 'Senior Claims Adjuster',
      role: 'Operations Desk',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      text: noteText,
    };

    setClaims(prev =>
      prev.map(c => {
        if (c.id === claimId) {
          const updated = {
            ...c,
            adjusterNotes: [newNote, ...c.adjusterNotes],
          };
          if (selectedClaim?.id === claimId) {
            setSelectedClaim(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  // Handler: Add Newly Submitted FNOL Claim
  const handleAddClaim = (newClaim: InsuranceClaim) => {
    setClaims(prev => [newClaim, ...prev]);
    setSelectedClaim(newClaim);
  };

  // Handler: Open RAG Chat with Claim Context
  const handleOpenChatWithClaim = (claim: InsuranceClaim) => {
    setSelectedClaim(null);
    setChatClaimContext(claim);
    setSelectedDomain(claim.domain);
    setActiveTab('RAG_CHAT');
  };

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-[#111827] flex overflow-hidden font-sans">
      {/* Enterprise Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedDomain={selectedDomain}
        onSelectDomain={setSelectedDomain}
        onOpenFNOL={() => setIsFNOLOpen(true)}
        siuCount={stats.siuCount}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar Contract */}
        <Header
          selectedDomain={selectedDomain}
          activeTab={activeTab}
          onOpenFNOL={() => setIsFNOLOpen(true)}
          stats={stats}
        />

        {/* Content Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'CLAIMS' && (
              <ClaimsHub
                claims={claims}
                selectedDomain={selectedDomain}
                onSelectClaim={claim => setSelectedClaim(claim)}
                onOpenFNOL={() => setIsFNOLOpen(true)}
              />
            )}

            {activeTab === 'FRAUD' && (
              <FraudEngineView
                claims={claims}
                onSelectClaim={claim => setSelectedClaim(claim)}
              />
            )}

            {activeTab === 'RAG_CHAT' && (
              <RAGChatbotView
                claims={claims}
                preSelectedClaim={chatClaimContext}
                selectedDomain={selectedDomain}
              />
            )}

            {activeTab === 'POLICIES' && (
              <PolicyExplorerView
                selectedDomain={selectedDomain}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal: Claim Adjudication Workbench */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onUpdateStatus={handleUpdateStatus}
          onAdjustReserve={handleAdjustReserve}
          onAddAdjusterNote={handleAddAdjusterNote}
          onOpenChatWithClaim={handleOpenChatWithClaim}
        />
      )}

      {/* Modal: First Notice of Loss (FNOL) Intake */}
      {isFNOLOpen && (
        <FNOLModal
          onClose={() => setIsFNOLOpen(false)}
          onSubmitClaim={handleAddClaim}
        />
      )}
    </div>
  );
}
