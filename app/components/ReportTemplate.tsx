'use client';

import React, { forwardRef } from 'react';

interface ReportData {
  executiveSummary: string;
  detailedWeaknesses: { title: string; explanation: string; monthlyCost: string }[];
  prioritizedRoadmap: { priority: number; title: string; description: string; expectedImpact: string; timeline: string }[];
  personalClosing: string;
}

interface AnalysisData {
  companyName: string;
  businessSummary: string;
  industry: string;
  estimatedMonthlyRevenueLost: number;
  annualLostRevenue: number;
  averageMissedCallsPerDay: number;
  overallScore: number;
  roiEstimate: string;
  roiTimelineMonths: number;
  siteIntelligence?: {
    hasChatbot: boolean;
    hasContactForm: boolean;
    hasOnlineBooking: boolean;
    hasPhoneCTA: boolean;
    has24_7Mention: boolean;
    servicesDetected: string[];
    serviceArea?: string;
  };
}

interface Props {
  analysis: AnalysisData;
  report: ReportData;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const scoreColor = (s: number) => (s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444');
const scoreLabel = (s: number) => (s >= 80 ? 'Strong' : s >= 60 ? 'At Risk' : 'Critical');

const ReportTemplate = forwardRef<HTMLDivElement, Props>(({ analysis, report }, ref) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const si = analysis.siteIntelligence;

  return (
    <div
      ref={ref}
      style={{
        width: 800,
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: '#ffffff',
        color: '#1e293b',
        lineHeight: 1.6,
        padding: 0,
        margin: 0,
      }}
    >
      {/* ════ HEADER ══════════════════════════════════════════════════════ */}
      <div style={{ background: 'linear-gradient(135deg, #ea580c, #f59e0b)', padding: '40px 48px 32px', color: '#fff' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.85, marginBottom: 8 }}>
          SUDAIS JAN · AI RECEPTIONIST
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
          Revenue Impact Report
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 32, fontSize: 13, opacity: 0.9 }}>
          <span>Prepared for: <strong>{analysis.companyName}</strong></span>
          <span>Industry: <strong style={{ textTransform: 'capitalize' }}>{analysis.industry}</strong></span>
          <span>{today}</span>
        </div>
      </div>

      {/* ══════ EXECUTIVE SUMMARY ═════════════════════════════════════════ */}
      <div style={{ padding: '32px 48px' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#ea580c', fontWeight: 700, marginBottom: 8 }}>
          EXECUTIVE SUMMARY
        </div>
        <p style={{ fontSize: 15, color: '#334155', margin: 0, lineHeight: 1.7 }}>
          {report.executiveSummary}
        </p>
      </div>

      {/* ══════ KEY METRICS ═══════════════════════════════════════════════ */}
      <div style={{ padding: '0 48px 32px', display: 'flex', gap: 16 }}>
        {/* Score */}
        <div style={{ flex: 1, border: `2px solid ${scoreColor(analysis.overallScore)}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(analysis.overallScore) }}>
            {analysis.overallScore}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#64748b', marginTop: 4 }}>
            Score: {scoreLabel(analysis.overallScore)}
          </div>
        </div>
        {/* Monthly Loss */}
        <div style={{ flex: 1, border: '2px solid #fecaca', borderRadius: 12, padding: '20px 16px', textAlign: 'center', background: '#fef2f2' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>
            {fmt(analysis.estimatedMonthlyRevenueLost)}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#64748b', marginTop: 4 }}>
            MONTHLY REVENUE LOST
          </div>
        </div>
        {/* Annual Loss */}
        <div style={{ flex: 1, border: '2px solid #fed7aa', borderRadius: 12, padding: '20px 16px', textAlign: 'center', background: '#fff7ed' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>
            {fmt(analysis.annualLostRevenue)}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#64748b', marginTop: 4 }}>
            ANNUAL IMPACT
          </div>
        </div>
        {/* Daily Missed */}
        <div style={{ flex: 1, border: '2px solid #e2e8f0', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
            {analysis.averageMissedCallsPerDay.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#64748b', marginTop: 4 }}>
            MISSED CALLS / DAY
          </div>
        </div>
      </div>

      {/* ══════ WEBSITE INTELLIGENCE ══════════════════════════════════════ */}
      {si && (
        <div style={{ padding: '24px 48px 32px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#ea580c', fontWeight: 700, marginBottom: 16 }}>
            WEBSITE INTELLIGENCE SCAN
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { label: 'AI Chatbot', ok: si.hasChatbot },
              { label: 'Contact Form', ok: si.hasContactForm },
              { label: 'Online Booking', ok: si.hasOnlineBooking },
              { label: 'Click-to-Call', ok: si.hasPhoneCTA },
              { label: '24/7 Coverage', ok: si.has24_7Mention },
            ].map((f) => (
              <div
                key={f.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${f.ok ? '#bbf7d0' : '#fecaca'}`,
                  background: f.ok ? '#f0fdf4' : '#fef2f2',
                  color: f.ok ? '#16a34a' : '#dc2626',
                }}
              >
                {f.ok ? '✓' : '✗'} {f.label}
              </div>
            ))}
          </div>
          {si.servicesDetected.length > 0 && (
            <div style={{ fontSize: 13, color: '#475569' }}>
              <strong>Services Detected:</strong>{' '}
              {si.servicesDetected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
            </div>
          )}
          {si.serviceArea && (
            <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
              <strong>Service Area:</strong> {si.serviceArea}
            </div>
          )}
        </div>
      )}

      {/* ══════ CRITICAL WEAKNESSES ═══════════════════════════════════════ */}
      <div style={{ padding: '24px 48px 32px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#dc2626', fontWeight: 700, marginBottom: 16 }}>
          {report.detailedWeaknesses.length} CRITICAL WEAKNESSES IDENTIFIED
        </div>
        {report.detailedWeaknesses.map((w, i) => (
          <div
            key={i}
            style={{
              marginBottom: 16, padding: '16px 20px', borderRadius: 10,
              border: '1px solid #fecaca', background: '#fef2f2',
              borderLeft: '4px solid #dc2626',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                background: '#dc2626', color: '#fff', width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#991b1b' }}>{w.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                ~{w.monthlyCost}/mo
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, paddingLeft: 34, lineHeight: 1.6 }}>
              {w.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* ══════ RECOVERY ROADMAP ══════════════════════════════════════════ */}
      <div style={{ padding: '24px 48px 32px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#ea580c', fontWeight: 700, marginBottom: 4 }}>
          YOUR RECOVERY ROADMAP
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
          Step-by-step strategy to recover {fmt(analysis.annualLostRevenue)}/year — sorted by impact
        </p>
        {report.prioritizedRoadmap.map((step) => (
          <div
            key={step.priority}
            style={{
              marginBottom: 16, padding: '16px 20px', borderRadius: 10,
              border: '1px solid #e2e8f0', background: '#f8fafc',
              borderLeft: '4px solid #ea580c',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                background: 'linear-gradient(135deg, #ea580c, #f59e0b)', color: '#fff',
                width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0,
              }}>
                {step.priority}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{step.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#ea580c', background: '#fff7ed', padding: '3px 10px', borderRadius: 6, border: '1px solid #fed7aa' }}>
                {step.timeline}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 4px', paddingLeft: 36, lineHeight: 1.6 }}>
              {step.description}
            </p>
            <p style={{ fontSize: 12, color: '#16a34a', margin: 0, paddingLeft: 36, fontWeight: 600 }}>
              ↗ Expected Impact: {step.expectedImpact}
            </p>
          </div>
        ))}
      </div>

      {/* ══════ ROI SUMMARY ═══════════════════════════════════════════════ */}
      <div style={{ margin: '0 48px 32px', padding: '24px 28px', borderRadius: 12, background: '#f0fdf4', border: '2px solid #bbf7d0' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#16a34a', fontWeight: 700, marginBottom: 8 }}>
          PROJECTED ROI
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d', marginBottom: 4 }}>
          {analysis.roiEstimate}
        </div>
        <div style={{ fontSize: 13, color: '#475569' }}>
          Payback period: <strong>{analysis.roiTimelineMonths} month{analysis.roiTimelineMonths > 1 ? 's' : ''}</strong> — recovering 85-95% of currently missed calls with zero additional headcount.
        </div>
      </div>

      {/* ══════ PERSONAL CLOSING ══════════════════════════════════════════ */}
      <div style={{ padding: '24px 48px 16px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#ea580c', fontWeight: 700, marginBottom: 12 }}>
          A PERSONAL NOTE
        </div>
        <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
          &ldquo;{report.personalClosing}&rdquo;
        </p>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sudais Jan</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>AI Receptionist Specialist</div>
          </div>
        </div>
      </div>

      {/* ══════ HOW TO GET STARTED — FREE ═════════════════════════════════ */}
      <div style={{ margin: '16px 48px 0', padding: '24px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #fff7ed, #fef2f2)', border: '2px solid #fed7aa' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#ea580c', marginBottom: 8 }}>
          How to Get All of This Into Your Business — Completely FREE
        </div>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
          I&apos;ll personally build and set up your entire AI receptionist system at no cost for the first month.
          You run it, test it, and watch it book real jobs — <strong>zero risk</strong>. All you cover is the
          basic software subscription and provide tool access so I can connect everything. If it doesn&apos;t
          pay for itself by month two, walk away. No contracts, no pressure.
        </div>
      </div>

      {/* ══════ FOOTER ════════════════════════════════════════════════════ */}
      <div style={{ padding: '32px 48px 40px', marginTop: 24, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Ready to stop losing revenue?</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            📧 sudais@sudaisjan.com &nbsp;&nbsp;|&nbsp;&nbsp; 🌐 sudaisjan.com
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>
          <div>© {new Date().getFullYear()} Sudais Jan</div>
          <div>AI Receptionist for Emergency Services</div>
        </div>
      </div>
    </div>
  );
});

ReportTemplate.displayName = 'ReportTemplate';
export default ReportTemplate;
