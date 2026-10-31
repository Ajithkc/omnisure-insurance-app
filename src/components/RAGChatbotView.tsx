import React, { useState, useRef, useEffect } from 'react';
import { 
  InsuranceClaim, 
  InsuranceDomain, 
  PolicyClause 
} from '../types/insurance';
import { 
  Send, 
  Layers, 
  Loader2, 
  FileText,
  Info
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  retrievedChunks?: PolicyClause[];
  timestamp: string;
}

interface RAGChatbotViewProps {
  claims: InsuranceClaim[];
  preSelectedClaim?: InsuranceClaim | null;
  selectedDomain: 'ALL' | InsuranceDomain;
}

export const RAGChatbotView: React.FC<RAGChatbotViewProps> = ({
  claims,
  preSelectedClaim,
  selectedDomain,
}) => {
  const [domainFilter, setDomainFilter] = useState<'ALL' | InsuranceDomain>(selectedDomain || 'ALL');
  const [activeClaimId, setActiveClaimId] = useState<string>(preSelectedClaim?.id || '');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRAGInspector, setShowRAGInspector] = useState(true);
  const [inspectingChunk, setInspectingChunk] = useState<PolicyClause | null>(null);

  const activeClaim = claims.find(c => c.id === activeClaimId);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Welcome to OmniSure Policy Intelligence.

I perform semantic retrieval across statutory policy contracts (PAP Form PP 00 01, HO-3 Special Form, Term Life TL-2024, ISO CGL CG 00 01) to provide grounded answers with exact clause citations.

You may submit general coverage inquiries or attach an active claim to evaluate deductibles, exclusions, and settlement criteria.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sampleQuestions = [
    {
      label: 'Homeowners Flood vs Pipe Burst',
      query: 'Does homeowners insurance cover basement water damage from rain vs a sudden pipe burst?',
      domain: 'HOMEOWNERS' as InsuranceDomain,
    },
    {
      label: 'Life 2-Year Contestability Clause',
      query: 'What happens if a death benefit claim is filed within the 2-year contestability period with pre-existing conditions?',
      domain: 'LIFE' as InsuranceDomain,
    },
    {
      label: 'Auto OEM Parts & ACV',
      query: 'Am I guaranteed brand new OEM manufacturer parts for my auto collision repair, and how does the deductible apply?',
      domain: 'AUTO' as InsuranceDomain,
    },
    {
      label: 'Commercial Business Interruption',
      query: 'Does Commercial P&C cover lost restaurant revenue and payroll while closed after a kitchen fire?',
      domain: 'PNC_COMMERCIAL' as InsuranceDomain,
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          domainFilter: domainFilter,
          claimContext: activeClaim || undefined,
        }),
      });

      const data = await response.json();

      let answerText = data.answer;
      if (!answerText && data.retrievedChunks && data.retrievedChunks.length > 0) {
        const top = data.retrievedChunks[0];
        answerText = `Based on your policy documentation [${top.id} — ${top.title}] (${top.policyForm}):\n\n• Insuring Agreement:\n  ${top.content}\n\n• Deductibles & Settlement:\n  ${top.deductibleGuidance || 'Standard statutory deductible applies.'}`;
      } else if (!answerText) {
        answerText = 'Thank you for your inquiry. Our underwriting guidelines have processed your request across our statutory policy database. Please select a specific line of business or link your active Claim ID for detailed clause adjudication.';
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: answerText,
        retrievedChunks: data.retrievedChunks || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (data.retrievedChunks && data.retrievedChunks.length > 0) {
        setInspectingChunk(data.retrievedChunks[0]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: 'An error occurred during clause retrieval. Please re-try.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.retrievedChunks?.length);
  const currentInspectorChunks = latestAssistantMessage?.retrievedChunks || [];

  return (
    <div className="space-y-4">
      {/* Configuration Header */}
      <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#64748B] font-medium">Policy Domain Scope:</span>
          <div className="flex items-center bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
            {(['ALL', 'AUTO', 'HOMEOWNERS', 'LIFE', 'PNC_COMMERCIAL'] as Array<'ALL' | InsuranceDomain>).map(d => (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  domainFilter === d
                    ? 'bg-white text-[#2563EB] font-semibold shadow-xs border border-[#E2E8F0]'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                {d === 'ALL' ? 'All Lines' : d === 'AUTO' ? 'Auto' : d === 'HOMEOWNERS' ? 'Home' : d === 'LIFE' ? 'Life' : 'P&C'}
              </button>
            ))}
          </div>
        </div>

        {/* Claim context link */}
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-[#64748B]">Attach Active File:</span>
          <select
            value={activeClaimId}
            onChange={e => setActiveClaimId(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB] cursor-pointer max-w-[220px] truncate"
          >
            <option value="">None (General Inquiries)</option>
            {claims.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.policyholderName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split-View: Chat + RAG Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chat Window */}
        <div className={`${showRAGInspector ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} flex flex-col h-[660px] bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs`}>
          {/* Header */}
          <div className="h-12 px-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[#0B1F3A]">Policy Grounding Assistant</span>
              <span className="text-[#64748B] font-mono text-[11px]">| gemini-3.8-flash</span>
            </div>

            <button
              onClick={() => setShowRAGInspector(!showRAGInspector)}
              className="text-xs text-[#2563EB] hover:text-blue-800 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showRAGInspector ? 'Hide Inspector' : 'Show Inspector'}</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl p-4 leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-[#2563EB] text-white rounded-tr-none shadow-xs'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-line text-xs">
                      {msg.content}
                    </div>

                    {!isUser && msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                      <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                          Grounding Citations:
                        </span>
                        {msg.retrievedChunks.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setShowRAGInspector(true);
                              setInspectingChunk(c);
                            }}
                            className="text-[10px] font-mono text-[#2563EB] hover:bg-blue-100 bg-[#EFF6FF] border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            [{c.id}] · {c.relevanceScore}% match
                          </button>
                        ))}
                      </div>
                    )}

                    <div className={`text-[10px] text-right font-mono ${isUser ? 'text-blue-100' : 'text-[#94A3B8]'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 items-center text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                <span>Retrieving policy clauses and generating grounded response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-[#64748B] font-medium shrink-0">Prompts:</span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDomainFilter(q.domain);
                  handleSendMessage(q.query);
                }}
                className="bg-white hover:bg-[#F1F5F9] text-[#111827] px-2.5 py-1 rounded border border-[#CBD5E1] whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="p-3 bg-white border-t border-[#E2E8F0]">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask about coverage, deductibles, exclusions, or claim status..."
                className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2 text-xs text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: RAG Context Inspector */}
        {showRAGInspector && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[660px] bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="h-12 px-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-[#0B1F3A]">Retrieved Policy Clauses</span>
              <span className="text-[11px] font-mono text-[#64748B]">Vector Top-k</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {currentInspectorChunks.length === 0 ? (
                <div className="text-center py-12 text-[#94A3B8] space-y-2">
                  <Info className="w-6 h-6 mx-auto text-[#CBD5E1]" />
                  <p>Inquire with the chatbot to inspect retrieved policy clauses and relevance ranking.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {currentInspectorChunks.map((chunk, idx) => {
                      const isSelected = inspectingChunk?.id === chunk.id;
                      return (
                        <div
                          key={idx}
                          onClick={() => setInspectingChunk(chunk)}
                          className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#EFF6FF] border-[#2563EB] text-[#111827]'
                              : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] text-[#64748B]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-[#2563EB]">
                              {chunk.id}
                            </span>
                            <span className="text-[10px] font-mono text-[#16A34A] font-semibold">
                              {chunk.relevanceScore}% similarity
                            </span>
                          </div>

                          <div className="font-semibold text-xs mt-1 text-[#0B1F3A]">
                            {chunk.title}
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">
                            {chunk.policyForm}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {inspectingChunk && (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
                      <div className="border-b border-[#E2E8F0] pb-2">
                        <div className="text-[10px] font-mono text-[#64748B]">{inspectingChunk.id}</div>
                        <div className="font-semibold text-xs text-[#0B1F3A]">{inspectingChunk.title}</div>
                        <div className="text-[10px] text-[#64748B]">{inspectingChunk.section}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[#64748B] uppercase font-semibold mb-1">Clause Text:</div>
                        <p className="text-[#111827] leading-relaxed bg-white p-2.5 rounded border border-[#E2E8F0] text-[11px]">
                          {inspectingChunk.content}
                        </p>
                      </div>

                      {inspectingChunk.exclusions && (
                        <div>
                          <div className="text-[10px] text-[#DC2626] uppercase font-semibold mb-1">Exclusions:</div>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#64748B]">
                            {inspectingChunk.exclusions.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {inspectingChunk.deductibleGuidance && (
                        <div>
                          <div className="text-[10px] text-[#D97706] uppercase font-semibold mb-0.5">Deductible Rule:</div>
                          <div className="text-[11px] text-[#64748B]">{inspectingChunk.deductibleGuidance}</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
