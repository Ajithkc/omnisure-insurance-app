import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility as per @google/genai guideline
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Comprehensive multi-domain Insurance Policy Knowledge Base for RAG
export interface PolicyKnowledgeChunk {
  id: string;
  domain: 'AUTO' | 'HOMEOWNERS' | 'LIFE' | 'PNC_COMMERCIAL';
  category: string;
  policyForm: string;
  section: string;
  title: string;
  keywords: string[];
  content: string;
  exclusions?: string[];
  deductibleGuidance?: string;
}

export const KNOWLEDGE_BASE_CHUNKS: PolicyKnowledgeChunk[] = [
  // --- AUTO INSURANCE ---
  {
    id: 'AUTO-COLL-01',
    domain: 'AUTO',
    category: 'Collision Coverage',
    policyForm: 'Personal Auto Policy (PAP) Form PP 00 01',
    section: 'Part D - Coverage for Damage to Your Auto',
    title: 'Collision Coverage & Actual Cash Value (ACV)',
    keywords: ['collision', 'crash', 'impact', 'deductible', 'actual cash value', 'acv', 'rollover', 'fender bender', 'oem'],
    content: 'Collision coverage pays for direct and accidental loss to "your covered auto" caused by upset of the vehicle or impact with another vehicle or object. Settlement is based on Actual Cash Value (ACV) at the time of loss, minus the deductible selected on the declarations page. OEM (Original Equipment Manufacturer) parts are guaranteed only for vehicles under 24 months old unless an OEM endorsement rider is active.',
    exclusions: ['Wear and tear, freezing, mechanical or electrical breakdown', 'Loss to radar/laser detectors', 'Intentional damage by named insured', 'Use as a commercial livery/rideshare vehicle unless TNC endorsement attached'],
    deductibleGuidance: 'Applies per incident. Waived in selected states if third party is 100% at fault and identified with verified insurance.'
  },
  {
    id: 'AUTO-COMP-02',
    domain: 'AUTO',
    category: 'Comprehensive Coverage',
    policyForm: 'Personal Auto Policy (PAP) Form PP 00 01',
    section: 'Part D - Other Than Collision (Comprehensive)',
    title: 'Comprehensive / Other-Than-Collision Perils',
    keywords: ['comprehensive', 'glass', 'windshield', 'hail', 'theft', 'vandalism', 'animal', 'deer', 'flood', 'fire'],
    content: 'Other Than Collision covers direct physical loss caused by missiles or falling objects, fire, theft or larceny, explosion, earthquake, windstorm, hail, water or flood, malicious mischief or vandalism, riot, contact with bird or animal, or glass breakage. Glass repair without replacement is often subject to a $0 deductible.',
    exclusions: ['Road damage to tires unless caused by concurrent covered peril', 'Personal property inside vehicle (covered under Homeowners Coverage C)', 'Loss due to seizure by governmental authority'],
    deductibleGuidance: 'Separate comprehensive deductible applies (typically $250, $500, or $1,000).'
  },
  {
    id: 'AUTO-TELE-03',
    domain: 'AUTO',
    category: 'Telematics & Staged Accident Detection',
    policyForm: 'OmniSure SmartDrive Telematics Endorsement',
    section: 'Section VII - Telematics Data & Fraud Verification Protocol',
    title: 'Telematics Anomaly Analysis & Staged Collision Verification',
    keywords: ['telematics', 'g-force', 'acceleration', 'hard brake', 'impact sensor', 'staged accident', 'fraud', 'speed', 'timestamp', 'siu'],
    content: 'Telematics devices record 3-axis accelerometer data (up to 50Hz during crash events), GPS position, velocity vector, and braking initiation timestamps. A claim showing sudden deceleration without prior braking at low-risk intersections with multiple occupants, or where crash event time deviates by more than 15 minutes from First Notice of Loss (FNOL), triggers Level-3 Special Investigation Unit (SIU) review.',
    exclusions: ['Tampering with OBD-II telematics device voids safe driver discount and subjects pending claims to forensic audit.'],
    deductibleGuidance: 'Standard collision deductible applies pending SIU clearance.'
  },

  // --- HOMEOWNERS INSURANCE ---
  {
    id: 'HOME-DWEL-01',
    domain: 'HOMEOWNERS',
    category: 'Dwelling & Other Structures',
    policyForm: 'Homeowners 3 - Special Form (HO-3)',
    section: 'Section I - Property Coverages: Coverage A & B',
    title: 'Dwelling (Coverage A) & Roof Replacement Standards',
    keywords: ['dwelling', 'coverage a', 'roof', 'windstorm', 'hail', 'replacement cost', 'shingles', 'contractor'],
    content: 'Coverage A covers the dwelling on the "residence premises" used principally as a private residence, including structures attached to the dwelling. Losses to the dwelling are settled at Replacement Cost without deduction for depreciation, provided the insured carries at least 80% insurance to value at the time of loss. Hail damage to roofs requires physical inspection of indentations and granule loss per square.',
    exclusions: ['Earth movement/earthquake', 'Flood, surface water, storm surge', 'Wear and tear, marring, deterioration', 'Continuous or repeated seepage or leakage of water over 14+ days'],
    deductibleGuidance: 'Standard Section I deductible applies ($1,000 to $2,500), except where distinct Hurricane or Named Storm percentage deductible (2% - 5%) is in force.'
  },
  {
    id: 'HOME-WATR-02',
    domain: 'HOMEOWNERS',
    category: 'Water Damage vs Flood Exclusion',
    policyForm: 'Homeowners 3 - Special Form (HO-3)',
    section: 'Section I - Perils Insured Against vs Exclusions',
    title: 'Sudden & Accidental Water Discharge vs Excluded Flood / Seepage',
    keywords: ['water damage', 'pipe burst', 'flood', 'seepage', 'basement', 'sump pump', 'plumbing', 'rot', 'mold'],
    content: 'HO-3 covers sudden and accidental discharge or overflow of water or steam from within a plumbing, heating, air conditioning or automatic fire protective sprinkler system or from within a household appliance. It strictly EXCLUDES flood, surface water, waves, tidal water, overflow of any body of water, water backing up through sewers or drains (unless Water Backup Endorsement HO-0495 is endorsed), and water seepage persisting over 14 days.',
    exclusions: ['Flood and surface water (must be covered by NFIP)', 'Water backup from municipal sewers without endorsement', 'Gradual pipe pinhole leaks exceeding 14 days', 'Pre-existing wood rot and fungal proliferation'],
    deductibleGuidance: 'Water damage endorsement typically has a $1,000 deductible with a $10,000 sublimit unless enhanced limit selected.'
  },
  {
    id: 'HOME-PERS-03',
    domain: 'HOMEOWNERS',
    category: 'Personal Property (Coverage C)',
    policyForm: 'Homeowners 3 - Special Form (HO-3)',
    section: 'Section I - Coverage C Personal Property & Special Limits',
    title: 'Personal Property Coverage & High-Value Sublimits',
    keywords: ['personal property', 'contents', 'coverage c', 'jewelry', 'theft', 'electronics', 'sublimit', 'actual cash value'],
    content: 'Coverage C covers personal property owned or used by an insured anywhere in the world. Standard policy provides Actual Cash Value settlement unless Replacement Cost Endorsement (HO-0490) is attached. Special sublimits apply for theft: Jewelry/Watches/Furs ($1,500 aggregate), Firearms ($2,500), Silverware/Goldware ($2,500), and Business Property on premises ($2,500).',
    exclusions: ['Articles separately described and specifically insured elsewhere', 'Animals, birds, or fish', 'Motor vehicles or all other motorized land conveyances'],
    deductibleGuidance: 'Subject to policy Section I base deductible.'
  },

  // --- LIFE INSURANCE ---
  {
    id: 'LIFE-TERM-01',
    domain: 'LIFE',
    category: 'Term Life Benefits & Contestability',
    policyForm: 'Individual Term Life Contract Form TL-2024',
    section: 'Section IV - Incontestability & Misrepresentation Clause',
    title: 'The 2-Year Contestability Period & Non-Disclosure Investigation',
    keywords: ['life insurance', 'death benefit', 'contestability', 'contestability period', 'two years', 'misrepresentation', 'medical disclosure', 'pre-existing'],
    content: 'In accordance with statutory insurance law, this policy becomes incontestable after it has been in force during the lifetime of the insured for two (2) years from its Issue Date. If the insured dies within the 24-month contestability period, the insurer reserves the statutory right to review the original underwriting application and medical questionnaire. Material misrepresentations or omission of chronic pre-existing conditions (e.g. cardiac failure, undisclosed malignancy) can lead to claim denial and premium refund.',
    exclusions: ['Suicide within the first two policy years (limited to return of premiums paid less any debt)', 'Fraudulent impersonation during medical exams', 'War or military hazard clause where applicable'],
    deductibleGuidance: 'No deductible applies to life insurance proceeds. Death benefits are distributed income-tax-free under IRC Section 101(a).'
  },
  {
    id: 'LIFE-DISB-02',
    domain: 'LIFE',
    category: 'Claims Adjudication & Beneficiary Payout',
    policyForm: 'Individual Term & Whole Life Settlement Guidelines',
    section: 'Section IX - Claim Submission, Proof of Death & Settlement',
    title: 'Proof of Death Requirements & Accelerated Death Benefits',
    keywords: ['beneficiary', 'death certificate', 'proof of death', 'payout', 'accelerated death benefit', 'terminal illness', 'claimant statement'],
    content: 'Payment of the death benefit requires receipt of: (1) Certified Death Certificate with manner and cause of death, (2) Completed and notarized Claimant Statement Form from designated primary or contingent beneficiaries, (3) Original policy contract or lost-policy affidavit. For terminal illness diagnosis with life expectancy under 12 months, the Accelerated Death Benefit Rider permits withdrawal of up to 75% (maximum $500,000) of the face amount while the insured is living.',
    exclusions: ['Slayer Statute: Beneficiary convicted of principal or accessory in the murder of the insured is disqualified from proceeds'],
    deductibleGuidance: 'Lump sum check, electronic funds transfer (EFT), or Retained Asset Account (Interest-bearing settlement account).'
  },

  // --- PROPERTY & CASUALTY (COMMERCIAL P&C) ---
  {
    id: 'PNC-CGL-01',
    domain: 'PNC_COMMERCIAL',
    category: 'Commercial General Liability (CGL)',
    policyForm: 'ISO Commercial General Liability Form CG 00 01',
    section: 'Section I - Coverages: Coverage A Bodily Injury and Property Damage',
    title: 'CGL Occurrence Form, Slip-and-Fall & Premises Liability',
    keywords: ['cgl', 'commercial liability', 'slip and fall', 'premises liability', 'bodily injury', 'property damage', 'occurrence', 'duty to defend'],
    content: 'Coverage A applies to bodily injury and property damage only if caused by an "occurrence" that takes place in the "coverage territory" and occurs during the policy period. An occurrence means an accident, including continuous or repeated exposure to substantially the same general harmful conditions. The insurer has the right and duty to defend the insured against any suit seeking damages, even if the allegations are groundless, false, or fraudulent.',
    exclusions: ['Expected or intentional injury', 'Contractual liability assumed prior to loss', 'Liquor liability for businesses in manufacturing/selling alcohol', 'Workers compensation obligations', 'Pollution and toxic mold'],
    deductibleGuidance: 'Commercial liability claims typically do not carry an insured deductible for defense costs unless a Self-Insured Retention (SIR) endorsement is active.'
  },
  {
    id: 'PNC-BINT-02',
    domain: 'PNC_COMMERCIAL',
    category: 'Business Interruption & Commercial Property',
    policyForm: 'Building and Personal Property Coverage Form CP 00 10 / CP 00 30',
    section: 'Business Income (and Extra Expense) Coverage Form',
    title: 'Business Interruption Loss Calculation & Extra Expense',
    keywords: ['business interruption', 'extra expense', 'commercial property', 'revenue loss', 'fire', 'waiting period', 'forensic accounting'],
    content: 'Business Income coverage pays for the actual loss of Business Income sustained due to the necessary "suspension" of operations during the "period of restoration". The suspension must be caused by direct physical loss of or damage to property at premises described in the Declarations, caused by a Covered Cause of Loss. Coverage includes Net Income that would have been earned plus continuing normal operating expenses (including payroll). 72-hour waiting period standard.',
    exclusions: ['Loss caused by off-premises power utility failure unless Utility Services endorsement attached', 'Acts of civil authority without physical damage within 1 mile', 'Loss caused by delay in market demand or economic recession'],
    deductibleGuidance: 'Measured as a 72-hour waiting period deductible; dollar deductibles apply to the primary building property damage.'
  },
  {
    id: 'PNC-SUBR-03',
    domain: 'PNC_COMMERCIAL',
    category: 'Subrogation & Third-Party Recovery',
    policyForm: 'Commercial Property & Casualty Common Policy Conditions',
    section: 'Condition K - Transfer of Rights of Recovery Against Others',
    title: 'Subrogation Investigation & Inter-Company Recovery',
    keywords: ['subrogation', 'third party', 'recovery', 'contractor liability', 'indemnification', 'waiver of subrogation'],
    content: 'If any person or organization to or for whom the insurer makes payment has rights to recover damages from another, those rights are transferred to the insurer to the extent of its payment. The insured must do everything necessary to secure our rights and do nothing after loss to impair them. If full recovery is obtained from a third-party tortfeasor or negligent subcontractor, the insured is reimbursed their deductible first before insurer recovery.',
    exclusions: ['Pre-loss written waiver of subrogation in an executed commercial contract is valid and respected.'],
    deductibleGuidance: 'Insured deductible is refunded on a pro-rata or full basis upon successful recovery from adverse carrier.'
  }
];

// Helper: Keyword & TF-IDF style semantic relevance score for RAG retrieval
function retrieveRelevantChunks(query: string, domainFilter?: string, topK: number = 3) {
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  const scoredChunks = KNOWLEDGE_BASE_CHUNKS.map(chunk => {
    // If domain filter is specified and doesn't match, penalize
    let score = 0;
    if (domainFilter && domainFilter !== 'ALL' && chunk.domain !== domainFilter) {
      return { chunk, score: -1 };
    }

    const titleLower = chunk.title.toLowerCase();
    const contentLower = chunk.content.toLowerCase();
    const catLower = chunk.category.toLowerCase();
    const formLower = chunk.policyForm.toLowerCase();

    // Exact phrase match bonus
    if (queryLower.length > 5 && contentLower.includes(queryLower)) {
      score += 15;
    }

    // Keyword match
    for (const kw of chunk.keywords) {
      if (queryLower.includes(kw.toLowerCase())) {
        score += 8;
      }
    }

    // Token match scoring
    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 5;
      if (catLower.includes(token)) score += 4;
      if (kwMatch(chunk.keywords, token)) score += 4;
      if (formLower.includes(token)) score += 3;
      if (contentLower.includes(token)) score += 1.5;
      if (chunk.exclusions?.some(e => e.toLowerCase().includes(token))) score += 2;
    }

    return { chunk, score };
  });

  function kwMatch(keywords: string[], token: string): boolean {
    return keywords.some(k => k.toLowerCase().includes(token));
  }

  return scoredChunks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => ({
      ...item.chunk,
      relevanceScore: Math.min(99, Math.round(item.score * 7.5 + 20)),
    }));
}

// Robust Grounded RAG synthesizer if model encounters temporary 503/429
function generateGroundedRAGAnswer(query: string, retrievedChunks: any[], claimContext: any): string {
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return `Thank you for contacting OmniSure. Regarding your question on "${query}", our underwriting guidelines require evaluating specific policy conditions across Auto, Homeowners, Life, or Commercial P&C. Please select a specific line of business or enter your Claim ID for precise clause adjudication.`;
  }

  const primary = retrievedChunks[0];
  const secondary = retrievedChunks.length > 1 ? retrievedChunks[1] : null;

  let answer = `Based on your policy documentation [${primary.id} — ${primary.title}] (${primary.policyForm}, ${primary.section}):\n\n`;

  // Core coverage summary
  answer += `• Insuring Agreement & Coverage:\n  ${primary.content}\n\n`;

  // Exclusions
  if (primary.exclusions && primary.exclusions.length > 0) {
    answer += `• Key Exclusions to Note:\n`;
    primary.exclusions.forEach((ex: string) => {
      answer += `  - ${ex}\n`;
    });
    answer += `\n`;
  }

  // Deductibles & Settlement
  if (primary.deductibleGuidance) {
    answer += `• Deductible & Settlement Guidelines:\n  ${primary.deductibleGuidance}\n\n`;
  }

  // Secondary clause reference if available
  if (secondary) {
    answer += `• Related Policy Provision [${secondary.id} — ${secondary.title}]:\n  ${secondary.content}\n\n`;
  }

  // Active claim context if linked
  if (claimContext) {
    answer += `--------------------------------------------------\n` +
      `[Active File Context for ${claimContext.id} — ${claimContext.policyholderName}]:\n` +
      `• Line of Business: ${claimContext.domain} (${claimContext.coverageType})\n` +
      `• Incident Date: ${claimContext.incidentDate}\n` +
      `• Claimed Loss Valuation: $${claimContext.claimedAmount?.toLocaleString()} (Deductible: $${claimContext.deductible?.toLocaleString()})\n` +
      `• Active Actuarial Reserve: $${claimContext.currentReserve?.toLocaleString()}\n` +
      `• Current File Status: ${claimContext.status}\n` +
      `• Assigned Examiner: ${claimContext.assignedAdjuster || 'Senior Operations Desk'}\n`;
  }

  return answer;
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. RAG-based Customer Service Chatbot Endpoint
app.post('/api/chat/rag', async (req, res) => {
  try {
    const { query, history = [], domainFilter = 'ALL', claimContext } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    // Retrieve relevant policy clauses
    const retrievedChunks = retrieveRelevantChunks(query, domainFilter, 3);

    // If query has specific claim context, we can append it
    let claimContextSnippet = '';
    if (claimContext) {
      claimContextSnippet = `\n[Active Claim Context]:\nClaim ID: ${claimContext.id}\nPolicyholder: ${claimContext.policyholderName || claimContext.policyholder}\nPolicy Line: ${claimContext.domain}\nCoverage: ${claimContext.coverageType}\nStatus: ${claimContext.status}\nReported Loss Amount: $${claimContext.claimedAmount?.toLocaleString()}\nDeductible: $${claimContext.deductible?.toLocaleString()}\nIncident Date: ${claimContext.incidentDate}\nIncident Summary: ${claimContext.description}\n`;
    }

    // Build RAG Context String
    const ragContext = retrievedChunks
      .map(
        (c, idx) =>
          `[Source ${idx + 1} - ${c.id}] ${c.title} (${c.policyForm}, ${c.section}):\n${c.content}\nExclusions: ${c.exclusions?.join('; ') || 'None stated'}\nDeductible/Limits: ${c.deductibleGuidance || 'Standard'}`
      )
      .join('\n\n');

    let answer = '';
    let generatedWithAi = false;

    if (ai) {
      const systemInstruction = `You are OmniSure's Senior Insurance Adjudicator & Customer Service AI Assistant.
You specialize in four core insurance domains:
1. Auto Insurance
2. Homeowners Insurance
3. Life Insurance
4. Property & Casualty (Commercial P&C)

RULES:
- Ground your response firmly in the provided policy clauses and claim context.
- Always cite the specific policy clause or source identifier (e.g. [AUTO-COLL-01], [HOME-WATR-02], [LIFE-TERM-01], [PNC-CGL-01]) when stating rules, exclusions, or payout conditions.
- Be clear, empathetic, authoritative, and direct.
- Explain whether an event is covered or excluded, how deductibles apply, and what documents are required.
- If the question relates to an active claim provided in the context, refer directly to its specific numbers and status.
- Keep the response structured with brief bullet points where appropriate.`;

      const prompt = `Retrieved Policy Knowledge Base Clauses:
${ragContext}
${claimContextSnippet}

User Question: "${query}"

Provide a professional, grounded insurance customer guidance response citing the retrieved sources:`;

      try {
        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.3,
          },
        });

        // 4000ms timeout race to guarantee instant responsiveness even during Gemini model demand spikes
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const response: any = await Promise.race([aiPromise, timeoutPromise]);

        if (response && response.text) {
          answer = response.text;
          generatedWithAi = true;
        }
      } catch (aiErr: any) {
        console.warn('Gemini generateContent encountered an error, falling back to grounded RAG synthesizer:', aiErr?.message || aiErr);
      }
    }

    // If AI generation did not produce an answer (due to API rate limit/503/missing key), use grounded RAG synthesis
    if (!answer) {
      answer = generateGroundedRAGAnswer(query, retrievedChunks, claimContext);
    }

    res.json({
      answer,
      retrievedChunks,
      generatedWithAi,
      domain: domainFilter,
    });
  } catch (error: any) {
    console.error('RAG Chatbot Error:', error);
    // Even in case of an unexpected error, guarantee a helpful grounded answer
    const fallbackChunks = retrieveRelevantChunks(req.body?.query || '', req.body?.domainFilter || 'ALL', 2);
    res.json({
      answer: generateGroundedRAGAnswer(req.body?.query || '', fallbackChunks, req.body?.claimContext),
      retrievedChunks: fallbackChunks,
      generatedWithAi: false,
      domain: req.body?.domainFilter || 'ALL',
    });
  }
});

// 2. Fraud Detection Algorithm & SIU Scoring Endpoint
app.post('/api/fraud/evaluate', async (req, res) => {
  try {
    const claim = req.body;

    // Algorithmic evaluation engine based on multi-factor heuristics
    const factors: Array<{ name: string; score: number; maxScore: number; reason: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = [];

    // Factor 1: Policy Inception to Loss Delta (Premature claim)
    const policyAgeDays = claim.policyAgeDays ?? 120;
    if (policyAgeDays < 15) {
      factors.push({
        name: 'Rapid Inception Loss (First 14 Days)',
        score: 30,
        maxScore: 30,
        reason: `Loss occurred only ${policyAgeDays} days after policy binding. High probability of pre-existing loss or staged occurrence.`,
        severity: 'CRITICAL',
      });
    } else if (policyAgeDays < 45) {
      factors.push({
        name: 'Early Policy Loss (15-45 Days)',
        score: 15,
        maxScore: 30,
        reason: `Loss occurred ${policyAgeDays} days post-inception. Heightened risk threshold triggered.`,
        severity: 'MEDIUM',
      });
    } else {
      factors.push({
        name: 'Established Policy Inception Age',
        score: 0,
        maxScore: 30,
        reason: `Policy in good standing for ${policyAgeDays} days prior to incident.`,
        severity: 'LOW',
      });
    }

    // Factor 2: Digital Forensics & Metadata Anomaly
    const exifMismatch = claim.exifMismatch === true;
    if (exifMismatch) {
      factors.push({
        name: 'Digital Image Forensics Anomaly',
        score: 25,
        maxScore: 25,
        reason: 'EXIF metadata indicates image capture timestamp precedes reported loss time or device location deviates by >50 miles.',
        severity: 'CRITICAL',
      });
    } else {
      factors.push({
        name: 'Digital Evidence Verification',
        score: 0,
        maxScore: 25,
        reason: 'Photo EXIF timestamps and geolocation match FNOL telemetry and incident dispatch.',
        severity: 'LOW',
      });
    }

    // Factor 3: Prior Claim Frequency
    const priorClaimsCount = claim.priorClaimsCount ?? 0;
    if (priorClaimsCount >= 3) {
      factors.push({
        name: 'High Frequency Claim History',
        score: 20,
        maxScore: 20,
        reason: `Claimant has filed ${priorClaimsCount} claims within 24 months across cross-carrier databases.`,
        severity: 'HIGH',
      });
    } else if (priorClaimsCount === 2) {
      factors.push({
        name: 'Moderate Claim Frequency',
        score: 10,
        maxScore: 20,
        reason: 'Two prior recorded losses in the last 24 months.',
        severity: 'MEDIUM',
      });
    } else {
      factors.push({
        name: 'Clean or Single Claim History',
        score: 0,
        maxScore: 20,
        reason: 'Low historical claim frequency.',
        severity: 'LOW',
      });
    }

    // Factor 4: Vendor / Body Shop / Medical Billing Anomaly
    const providerAnomaly = claim.providerAnomaly === true;
    if (providerAnomaly) {
      factors.push({
        name: 'High-Risk Network Entity Association',
        score: 18,
        maxScore: 20,
        reason: 'Repair shop or medical provider is flagged on the National Insurance Crime Bureau (NICB) watchlist for inflated labor or phantom billing.',
        severity: 'HIGH',
      });
    }

    // Factor 5: Domain-Specific Peril Anomalies
    if (claim.domain === 'LIFE') {
      const contestabilityActive = (claim.policyAgeDays ?? 365) < 730;
      const undisclosedCondition = claim.undisclosedCondition === true;
      if (contestabilityActive && undisclosedCondition) {
        factors.push({
          name: 'Contestability Period Material Misrepresentation',
          score: 35,
          maxScore: 35,
          reason: 'Insured passed away within statutory 24-month contestability window with documented undeclared chronic condition on hospital records.',
          severity: 'CRITICAL',
        });
      }
    } else if (claim.domain === 'AUTO') {
      const telematicsDiscrepancy = claim.telematicsDiscrepancy === true;
      if (telematicsDiscrepancy) {
        factors.push({
          name: 'Telematics vs Driver Narrative Discrepancy',
          score: 22,
          maxScore: 25,
          reason: 'OBD/Telematics accelerometer recorded 0.1G impact, inconsistent with severe body deformation and claimed soft-tissue whiplash.',
          severity: 'HIGH',
        });
      }
    } else if (claim.domain === 'HOMEOWNERS') {
      const preExistingMoldRot = claim.preExistingRot === true;
      if (preExistingMoldRot) {
        factors.push({
          name: 'Pre-Existing Chronic Rot Disguised as Sudden Pipe Burst',
          score: 24,
          maxScore: 25,
          reason: 'Subfloor inspection revealed dry rot and fungal decay indicative of >60 days chronic leakage, violating sudden/accidental clause.',
          severity: 'HIGH',
        });
      }
    } else if (claim.domain === 'PNC_COMMERCIAL') {
      const financialDistress = claim.businessDistress === true;
      if (financialDistress) {
        factors.push({
          name: 'Commercial Revenue Plunge Prior to Catastrophic Loss',
          score: 25,
          maxScore: 25,
          reason: 'Forensic P&L indicates company was facing bankruptcy 3 weeks prior to warehouse fire incident.',
          severity: 'HIGH',
        });
      }
    }

    // Calculate total score
    const totalScore = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));

    let riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_SIU' = 'LOW';
    if (totalScore >= 65) riskTier = 'CRITICAL_SIU';
    else if (totalScore >= 40) riskTier = 'HIGH';
    else if (totalScore >= 20) riskTier = 'MEDIUM';

    let aiExplanation = '';
    if (ai) {
      try {
        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are an expert Insurance Fraud Investigator (SIU Special Agent).
Analyze this claim fraud score and write a concise, bulleted 3-part investigator memorandum:
Claim Info: ${JSON.stringify({ id: claim.id, domain: claim.domain, claimedAmount: claim.claimedAmount, description: claim.description })}
Total Risk Score: ${totalScore}/100 (Tier: ${riskTier})
Triggered Risk Factors: ${JSON.stringify(factors.filter(f => f.score > 0))}

Provide:
1. Risk Assessment Summary (2 sentences)
2. Red Flag Evidentiary Highlights
3. SIU Actionable Next Steps (e.g. Examination Under Oath, metadata audit, physical re-inspection)`,
          config: {
            temperature: 0.2,
          },
        });

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const response: any = await Promise.race([aiPromise, timeoutPromise]);
        if (response && response.text) {
          aiExplanation = response.text;
        }
      } catch (err) {
        console.warn('AI fraud explanation failed, continuing with rules:', err);
      }
    }

    if (!aiExplanation && totalScore >= 20) {
      aiExplanation = `1. Risk Assessment Summary:\nClaim exhibits an aggregate risk score of ${totalScore}/100 (Risk Tier: ${riskTier}) with ${factors.filter(f => f.score > 0).length} active anomaly vectors detected.\n\n2. Red Flag Evidentiary Highlights:\n` +
        factors.filter(f => f.score > 0).map(f => `• ${f.name} (+${f.score} pts): ${f.reason}`).join('\n') +
        `\n\n3. SIU Actionable Next Steps:\n• ${riskTier === 'CRITICAL_SIU' ? 'Freeze disbursement and issue formal Examination Under Oath (EUO) notice' : 'Assign senior desk audit and request supporting documentation'}\n• Audit photo EXIF timestamps against dispatch logs and carrier database\n• Cross-reference vendor and clinic Tax IDs against NICB indexed registries`;
    }

    res.json({
      totalScore,
      riskTier,
      factors,
      aiExplanation,
      recommendedAction:
        riskTier === 'CRITICAL_SIU'
          ? 'HOLD PAYOUT & DISPATCH SIU INVESTIGATOR'
          : riskTier === 'HIGH'
          ? 'ASSIGN SENIOR DESK AUDIT & REQUEST AFFIDAVITS'
          : riskTier === 'MEDIUM'
          ? 'STANDARD ADJUSTER INSPECTION & VERIFY RECEIPTS'
          : 'FAST-TRACK STRAIGHT THROUGH PROCESSING (STP)',
    });
  } catch (error: any) {
    console.error('Fraud evaluate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Knowledge base retrieval endpoint for explorer
app.get('/api/knowledge-base', (_req, res) => {
  res.json({
    totalChunks: KNOWLEDGE_BASE_CHUNKS.length,
    chunks: KNOWLEDGE_BASE_CHUNKS,
  });
});

// 4. Download source zip package endpoint
app.get('/api/download-zip', (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'omnisure-enterprise-app.zip');
  const rootZipPath = path.resolve(__dirname, 'omnisure-enterprise-app.zip');

  const fileToServe = fs.existsSync(zipPath) ? zipPath : rootZipPath;

  if (fs.existsSync(fileToServe)) {
    const stat = fs.statSync(fileToServe);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="omnisure-enterprise-app.zip"');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const stream = fs.createReadStream(fileToServe);
    stream.pipe(res);
  } else {
    res.status(404).json({ error: 'Zip archive not found' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniSure] Insurance Operations server running on http://localhost:${PORT}`);
  });
}

startServer();
