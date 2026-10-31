import React, { useState, useEffect } from 'react';
import { InsuranceDomain, PolicyClause } from '../types/insurance';
import { 
  Search, 
  Tag
} from 'lucide-react';

interface PolicyExplorerViewProps {
  selectedDomain: 'ALL' | InsuranceDomain;
}

export const PolicyExplorerView: React.FC<PolicyExplorerViewProps> = ({
  selectedDomain,
}) => {
  const [chunks, setChunks] = useState<PolicyClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState<'ALL' | InsuranceDomain>(selectedDomain);

  useEffect(() => {
    setActiveDomain(selectedDomain);
  }, [selectedDomain]);

  useEffect(() => {
    fetch('/api/knowledge-base')
      .then(res => res.json())
      .then(data => {
        setChunks(data.chunks || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load KB:', err);
        setLoading(false);
      });
  }, []);

  const filteredChunks = chunks.filter(c => {
    if (activeDomain !== 'ALL' && c.domain !== activeDomain) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchContent = c.content.toLowerCase().includes(q);
      const matchForm = c.policyForm.toLowerCase().includes(q);
      const matchKw = c.keywords.some(k => k.toLowerCase().includes(q));
      return matchTitle || matchContent || matchForm || matchKw;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#0B1F3A]">
            Statutory Policy Repository & Endorsement Rules
          </h2>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            Standard insurance policy forms indexed for RAG vector retrieval. Review contractual provisions,
            insuring agreements, sublimits, and mandatory state exclusions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clauses (e.g. flood, contestability)..."
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Domain Segmented Control */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8F0] w-fit text-xs shadow-xs">
        {(['ALL', 'AUTO', 'HOMEOWNERS', 'LIFE', 'PNC_COMMERCIAL'] as Array<'ALL' | InsuranceDomain>).map(d => (
          <button
            key={d}
            onClick={() => setActiveDomain(d)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeDomain === d
                ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border border-blue-200'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            {d === 'ALL' ? 'All Portfolio Lines' : d === 'AUTO' ? 'Auto (PAP)' : d === 'HOMEOWNERS' ? 'Homeowners (HO-3)' : d === 'LIFE' ? 'Term Life' : 'Commercial P&C'}
          </button>
        ))}
      </div>

      {/* Clauses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChunks.map(chunk => (
          <div
            key={chunk.id}
            className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] p-5 rounded-xl space-y-3.5 transition-all shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] font-mono">
                <span className="font-semibold text-[#2563EB]">{chunk.id}</span>
                <span>{chunk.policyForm}</span>
              </div>
              <h3 className="text-sm font-semibold text-[#0B1F3A] mt-1">
                {chunk.title}
              </h3>
              <div className="text-[11px] text-[#2563EB] font-medium mt-0.5">
                {chunk.section}
              </div>
            </div>

            <p className="text-xs text-[#111827] leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              {chunk.content}
            </p>

            {chunk.exclusions && chunk.exclusions.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] uppercase font-semibold text-[#DC2626] block">
                  Statutory Exclusions:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#64748B]">
                  {chunk.exclusions.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {chunk.deductibleGuidance && (
              <div className="text-xs text-[#111827] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B] block">Deductible & Settlement:</span>
                <span className="text-[11px] text-[#111827]">{chunk.deductibleGuidance}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {chunk.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-[10px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
