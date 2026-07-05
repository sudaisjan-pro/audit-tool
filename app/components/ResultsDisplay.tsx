'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  TrendingDown, DollarSign, Clock, ShieldAlert, Zap, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, BarChart3, HelpCircle,
  PhoneMissed, Users, Mail, RefreshCw, PhoneCall, Sliders, Award,
  Globe, MessageSquare, FileText, CalendarCheck, Phone, XCircle,
  Download,
} from 'lucide-react';
import ReportTemplate from './ReportTemplate';

interface ResultsProps {
  data: {
    companyName: string;
    businessSummary: string;
    industry: string;
    estimatedMonthlyRevenueLost: number;
    averageMissedCallsPerDay: number;
    peakHoursRevenueLoss: number;
    competitorAdvantageGap: number;
    annualLostRevenue: number;
    roiTimelineMonths: number;
    overallScore: number;
    weaknesses: string[];
    roiEstimate: string;
    recommendations: string[];
    siteIntelligence?: {
      hasChatbot: boolean;
      hasContactForm: boolean;
      hasOnlineBooking: boolean;
      hasPhoneCTA: boolean;
      has24_7Mention: boolean;
      servicesDetected: string[];
      serviceArea?: string;
    };
  };
  onReset: () => void;
}

export default function ResultsDisplay({ data, onReset }: ResultsProps) {
  // Interactive slider state for "What-If" simulation
  const [customDailyMissed, setCustomDailyMissed] = useState<number>(data.averageMissedCallsPerDay);
  const [customJobValue, setCustomJobValue] = useState<number>(
    data.industry === 'hvac' ? 550 : data.industry === 'plumbing' ? 420 : 480
  );
  const [copied, setCopied] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleEmailClick = () => {
    const plainTextBody = `Hi Sudais,\n\nI just completed the Missed Call Revenue Calculator and discovered we're losing ${formatCurrency(data.estimatedMonthlyRevenueLost)} per month.\n\nI'd like to discuss implementing your AI Receptionist to recover this revenue.\n\nCompany: ${data.companyName}\nIndustry: ${data.industry.toUpperCase()}\nEstimated Monthly Loss: ${formatCurrency(data.estimatedMonthlyRevenueLost)}\nAverage Missed Calls/Day: ${data.averageMissedCallsPerDay}\n\nWhen can we talk?`;
    try {
      navigator.clipboard.writeText(plainTextBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn('Could not copy to clipboard:', err);
    }
  };

  const handleDownloadReport = useCallback(async () => {
    setIsGeneratingReport(true);
    try {
      // Step 1: Call Gemini to generate report content
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const rData = await res.json();
      setReportData(rData);

      // Step 2: Wait for React to render the template
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Capture with html2canvas and generate PDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const el = reportRef.current;
      if (!el) throw new Error('Report element not found');

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Remove all stylesheets from the cloned document.
          // This prevents html2canvas from reading Tailwind v4's OKLCH/LAB color variables
          // which its internal CSS parser cannot understand and crashes on.
          // Since our ReportTemplate uses 100% inline styles, it renders perfectly without them.
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          // Force white bg + ensure basic text colors
          const root = clonedDoc.documentElement;
          root.style.colorScheme = 'light';
          root.style.backgroundColor = '#ffffff';
          root.style.color = '#1e293b';
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let pos = 0;

      pdf.addImage(imgData, 'PNG', 0, pos, imgW, imgH);
      heightLeft -= pdfH;

      while (heightLeft > 0) {
        pos -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, pos, imgW, imgH);
        heightLeft -= pdfH;
      }

      const safeName = data.companyName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
      pdf.save(`${safeName}-Revenue-Report.pdf`);
    } catch (err) {
      console.error('Report generation failed:', err);
      alert('Could not generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [data]);

  // Trigger confetti on initial load
  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ea580c', '#f97316', '#fbbf24', '#ffffff'],
      });
    } catch (e) {
      // ignore if canvas confetti fails in SSR/test
    }
  }, []);

  // Calculate dynamic what-if values
  const simulatedMonthlyLoss = Math.round((customDailyMissed * 30 * 0.22) * customJobValue);
  const simulatedAnnualLoss = simulatedMonthlyLoss * 12;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#F43F5E';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'At Risk';
    return 'Critical';
  };

  // Mailto link generation
  const mailSubject = encodeURIComponent(`Missed Call Revenue Recovery - ${data.companyName}`);
  const mailBody = encodeURIComponent(`Hi Sudais,

I just completed the Missed Call Revenue Calculator and discovered we're losing ${formatCurrency(data.estimatedMonthlyRevenueLost)} per month.

I'd like to discuss implementing your AI Receptionist to recover this revenue.

Company: ${data.companyName}
Industry: ${data.industry.toUpperCase()}
Estimated Monthly Loss: ${formatCurrency(data.estimatedMonthlyRevenueLost)}
Average Missed Calls/Day: ${data.averageMissedCallsPerDay}

When can we talk?`);
  const mailtoUrl = `mailto:sudais@sudaisjan.com?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10 space-y-12">
        {/* Top Bar with Reset / Back */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-orange-400 font-semibold block">
                Sudais Jan AI Receptionist
              </span>
              <h2 className="text-sm font-bold text-slate-200">Revenue Impact Report</h2>
            </div>
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-medium transition-all hover:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze Another Company
          </button>
        </div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            60-Second AI Diagnostics Complete
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Your Missed Call <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Revenue Impact</span>
          </h1>
          <p className="text-lg text-slate-400">
            Comprehensive financial & operational analysis for <span className="font-semibold text-white underline decoration-orange-500/50 underline-offset-4">{data.companyName}</span>
          </p>

          {data.businessSummary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-6 p-5 sm:p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md text-left max-w-3xl mx-auto relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-amber-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 block mb-1.5">
                VERIFIED BUSINESS PROFILE
              </span>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                {data.businessSummary}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Overall Score & Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="grid md:grid-cols-12 gap-8 items-center">
            {/* Score Circle */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-8 md:pb-0 md:pr-8">
              <div className="relative w-48 h-48 mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="84"
                    stroke="#1e293b"
                    strokeWidth="12"
                    fill="none"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="84"
                    stroke={getScoreStroke(data.overallScore)}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={527}
                    strokeDashoffset={527 - (data.overallScore / 100) * 527}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 527 }}
                    animate={{ strokeDashoffset: 527 - (data.overallScore / 100) * 527 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className={`text-5xl font-extrabold ${getScoreColor(data.overallScore).split(' ')[0]}`}
                  >
                    {data.overallScore}
                  </motion.span>
                  <span className="text-xs uppercase tracking-widest text-slate-500 mt-1 font-semibold">out of 100</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getScoreColor(data.overallScore)}`}>
                  Call Handling: {getScoreLabel(data.overallScore)}
                </span>
                <p className="text-sm text-slate-400 mt-2 max-w-xs">
                  Your current call coverage leaves critical after-hours and peak-hour revenue on the table.
                </p>
              </div>
            </div>

            {/* Quick Summary Highlights */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Executive Diagnostic Summary
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Based on emergency service call volume models for <span className="text-orange-400 font-semibold">{data.companyName}</span>, missing an average of <span className="text-white font-bold">{data.averageMissedCallsPerDay} calls daily</span> creates a compounding revenue deficit. Competitors who answer within 2 rings are actively capturing your high-intent callers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />
                    Daily Missed Calls
                  </span>
                  <span className="text-2xl font-bold text-white">{data.averageMissedCallsPerDay.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">~{Math.round(data.averageMissedCallsPerDay * 30)} calls / month</span>
                </div>

                <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Recovery Potential
                  </span>
                  <span className="text-2xl font-bold text-emerald-400">85% - 95%</span>
                  <span className="text-xs text-slate-500 block mt-0.5">With 24/7 AI Receptionist</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Monthly Revenue Lost */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 relative overflow-hidden group hover:border-rose-500/30 transition-all"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Monthly Revenue Lost</span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-rose-400 mb-2 tracking-tight">
              {formatCurrency(data.estimatedMonthlyRevenueLost)}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>From {data.averageMissedCallsPerDay.toFixed(1)} missed calls per day</span>
            </p>
          </motion.div>

          {/* Annual Impact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Annual Lost Revenue</span>
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-orange-400 mb-2 tracking-tight">
              {formatCurrency(data.annualLostRevenue)}
            </p>
            <p className="text-xs text-slate-400">
              Over 12 months of uncaptured service jobs
            </p>
          </motion.div>

          {/* ROI Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">ROI Payback Timeline</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mb-2 tracking-tight">
              {data.roiTimelineMonths} Months
            </p>
            <p className="text-xs text-slate-400">
              To fully recover AI receptionist investment
            </p>
          </motion.div>
        </div>

        {/* Peak Hours & Competitor Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 sm:p-8 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Peak Hours Revenue Loss
                </h4>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  High Demand Window
                </span>
              </div>
              <p className="text-3xl font-extrabold text-orange-400 mb-3">
                {formatCurrency(data.peakHoursRevenueLoss)}<span className="text-sm font-normal text-slate-400"> / month</span>
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Lost during high-demand hours (8am–10am & 4pm–7pm) when your dispatch team is overwhelmed or technicians are on-site. These represent your highest-converting emergency calls.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Impact Share: ~40% of total missed calls</span>
              <span className="text-orange-400 font-medium">Auto-answer solves this 100%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 sm:p-8 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-orange-400" />
                  Competitor Advantage Gap
                </h4>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Market Share Risk
                </span>
              </div>
              <p className="text-3xl font-extrabold text-orange-400 mb-3">
                +{data.competitorAdvantageGap}% <span className="text-sm font-normal text-slate-400">market capture</span>
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Your competitors capture this much more local market share simply by answering calls when you don&apos;t. In emergency plumbing and HVAC, 80% of callers hire the first company that picks up.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Caller Behavior: 80% won&apos;t leave voicemail</span>
              <span className="text-orange-400 font-medium">Be the first to respond</span>
            </div>
          </motion.div>
        </div>

        {/* LIVE INTERACTIVE SECTION: What-If Simulation Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-orange-950/20 rounded-3xl border border-orange-500/20 p-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase mb-2">
                <Sliders className="w-3.5 h-3.5" />
                Interactive Lead Magnet Feature
              </div>
              <h3 className="text-2xl font-bold text-white">
                Simulate Your Revenue Impact
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Adjust your daily call volume and average job value to see how much money is slipping away in real-time.
              </p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl text-right">
              <span className="text-xs text-slate-400 uppercase block font-medium">Simulated Annual Loss</span>
              <span className="text-3xl font-extrabold text-orange-400">{formatCurrency(simulatedAnnualLoss)}</span>
              <span className="text-xs text-emerald-400 block mt-0.5">+{formatCurrency(simulatedMonthlyLoss)} / mo</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300">
                  Daily Missed Calls: <span className="text-orange-400 font-bold">{customDailyMissed} calls/day</span>
                </label>
                <span className="text-xs text-slate-500">~{Math.round(customDailyMissed * 30)}/month</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={customDailyMissed}
                onChange={(e) => setCustomDailyMissed(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>1 call/day (Minor)</span>
                <span>10 calls/day</span>
                <span>20 calls/day (Severe)</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300">
                  Average Emergency Job Value: <span className="text-orange-400 font-bold">{formatCurrency(customJobValue)}</span>
                </label>
                <span className="text-xs text-slate-500">Industry Avg: $350–$800</span>
              </div>
              <input
                type="range"
                min="150"
                max="1500"
                step="50"
                value={customJobValue}
                onChange={(e) => setCustomJobValue(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>$150 (Simple repair)</span>
                <span>$750 (Replacement)</span>
                <span>$1,500+ (Commercial)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* WEBSITE INTELLIGENCE SCAN — Shows real Firecrawl detections */}
        {data.siteIntelligence && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Website Intelligence Scan</h3>
                <p className="text-sm text-slate-400">AI-powered analysis of {data.companyName}&apos;s digital presence</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'AI Chatbot', detected: data.siteIntelligence.hasChatbot, icon: <MessageSquare className="w-5 h-5" /> },
                { label: 'Contact Form', detected: data.siteIntelligence.hasContactForm, icon: <FileText className="w-5 h-5" /> },
                { label: 'Online Booking', detected: data.siteIntelligence.hasOnlineBooking, icon: <CalendarCheck className="w-5 h-5" /> },
                { label: 'Click-to-Call CTA', detected: data.siteIntelligence.hasPhoneCTA, icon: <Phone className="w-5 h-5" /> },
                { label: '24/7 Messaging', detected: data.siteIntelligence.has24_7Mention, icon: <Clock className="w-5 h-5" /> },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                    item.detected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${item.detected ? 'bg-emerald-500/20' : 'bg-rose-500/10'}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  <span className={`text-xs font-semibold flex items-center gap-1 ${item.detected ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {item.detected ? <><CheckCircle2 className="w-3 h-3" /> Detected</> : <><XCircle className="w-3 h-3" /> Not Found</>}
                  </span>
                </div>
              ))}
            </div>

            {data.siteIntelligence.servicesDetected.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Services Detected</span>
                <div className="flex flex-wrap gap-2">
                  {data.siteIntelligence.servicesDetected.map((service) => (
                    <span key={service} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-medium text-slate-300 capitalize">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.siteIntelligence.serviceArea && (
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Area: </span>
                <span className="text-sm text-white font-medium">{data.siteIntelligence.serviceArea}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Weaknesses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-rose-950/20 border border-rose-500/20 rounded-3xl p-8 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {data.weaknesses.length} Critical Weaknesses Costing You Revenue
              </h3>
              <p className="text-sm text-rose-300/80">Identified in {data.companyName}&apos;s current call workflow</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.weaknesses.map((weakness, index) => (
              <div key={index} className="bg-slate-900/90 border border-rose-500/20 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
                    0{index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Vulnerability</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{weakness}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ROI Estimate Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Guaranteed AI ROI Projection
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Projected ROI with AI Receptionist
            </h3>
            <p className="text-emerald-400 font-bold text-xl sm:text-2xl">
              {data.roiEstimate}
            </p>
            <p className="text-slate-300 text-sm leading-relaxed pt-1">
              Based on recovering 85%–95% of currently missed calls at your average job value, minus AI receptionist operational costs ($297–$497/month).
            </p>
          </div>
          <div className="flex-shrink-0 bg-slate-950/80 border border-emerald-500/30 p-6 rounded-2xl text-center min-w-[200px]">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Payback Period</span>
            <span className="text-4xl font-extrabold text-emerald-400 my-1 block">{data.roiTimelineMonths} Mo</span>
            <span className="text-xs text-emerald-300/80">Zero extra hiring overhead</span>
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                Recommended Actions to Recover Revenue
              </h3>
              <p className="text-sm text-slate-400">Tailored implementation roadmap for {data.companyName}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex gap-4 items-start hover:border-orange-500/30 transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/20 mt-0.5">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Step {index + 1} Strategy</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* DOWNLOAD REPORT CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border border-orange-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Full Strategy Document
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Download Your Complete Recovery Report
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Get a detailed PDF with step-by-step strategies, cost breakdowns for every weakness,
              a prioritized roadmap sorted by impact — and how to get all of this set up in your
              business <span className="text-orange-400 font-bold">completely FREE</span>.
            </p>
            <button
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-orange-500/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isGeneratingReport ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI is writing your personalized report...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  Download Full Report & Solution Document
                </>
              )}
            </button>
            <p className="text-xs text-slate-500">PDF • AI-generated • Personalized for {data.companyName}</p>
          </div>
        </motion.div>

        {/* CTA SECTION - Exact implementation per Section 8 of PRD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 rounded-3xl shadow-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden"
        >
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-white" />
              Instant Revenue Recovery
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Stop Losing Revenue to Missed Calls?
            </h2>
            <p className="text-lg sm:text-xl text-orange-50 leading-relaxed">
              Let&apos;s discuss how Sudais Jan&apos;s AI Receptionist can recover the <span className="font-bold underline decoration-white decoration-2 underline-offset-4">{formatCurrency(data.estimatedMonthlyRevenueLost)}/month</span> you&apos;re currently losing—starting within 48 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a
                href={mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleEmailClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 group"
              >
                <Mail className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                {copied ? "✓ Copied to Clipboard!" : "Email Me Your Solution"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>

              <button
                onClick={onReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white border-2 border-white/80 px-6 py-4 rounded-xl font-semibold hover:bg-white hover:text-orange-600 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                Analyze Another Company
              </button>
            </div>

            <p className="text-orange-100 text-xs sm:text-sm font-medium pt-2">
              ⚡ Most clients see positive ROI within {data.roiTimelineMonths} months • No upfront commitment required
            </p>
          </div>
        </motion.div>

        {/* Social Proof Footer */}
        <div className="text-center pb-8">
          <p className="text-slate-400 text-sm mb-4 uppercase tracking-wider font-semibold">
            Trusted by emergency service providers across the United States
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
              <span className="text-amber-400 font-bold">★ 4.9/5</span>
              <span className="text-slate-300">Client Rating</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">24/7 Coverage</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-slate-300 font-semibold">48-Hour Setup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Report Template for PDF capture — isolated from page CSS */}
      {reportData && (
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            colorScheme: 'light',
            backgroundColor: '#ffffff',
            color: '#1e293b',
          }}
        >
          <ReportTemplate ref={reportRef} analysis={data} report={reportData} />
        </div>
      )}
    </div>
  );
}
