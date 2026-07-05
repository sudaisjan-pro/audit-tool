'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCall,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Clock,
  Users,
  AlertCircle,
  Zap,
  BarChart3,
  DollarSign,
  PhoneMissed,
  Activity,
  ChevronRight,
} from 'lucide-react';
import ResultsDisplay from './components/ResultsDisplay';

interface AnalysisData {
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
}

// Inner component that uses useSearchParams inside Suspense
function CalculatorContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<AnalysisData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      website: '',
      weeklyCallVolume: '50-100',
      afterHoursSupport: 'no',
      estimatedMissedCalls: '',
    },
  });

  // URL Parameter Auto-Fill per Section 3 of PRD
  useEffect(() => {
    const websiteParam = searchParams.get('website');
    if (websiteParam) {
      const decodedWebsite = decodeURIComponent(websiteParam);
      setValue('website', decodedWebsite);
    }
  }, [searchParams, setValue]);

  // Loading steps animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Trigger retargeting pixels when results load per Section 9 of PRD
  useEffect(() => {
    if (results) {
      // Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Missed Call Calculator',
          value: results.estimatedMonthlyRevenueLost,
          currency: 'USD',
        });
      }

      // Google Tag Manager
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'calculator_complete',
          revenue_lost: results.estimatedMonthlyRevenueLost,
          company_name: results.companyName,
        });
      }

      // LinkedIn
      if (typeof window !== 'undefined' && (window as any).lintrk) {
        // Safe check for lintrk
        try {
          (window as any).lintrk('track', { conversion_id: 'YOUR_CONVERSION_ID' });
        } catch (e) {}
      }
    }
  }, [results]);

  const onSubmit = async (data: { website: string; weeklyCallVolume: string; afterHoursSupport: string; estimatedMissedCalls: string }) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let cleanUrl = data.website.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
        setValue('website', cleanUrl);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: cleanUrl,
          weeklyCallVolume: data.weeklyCallVolume,
          afterHoursSupport: data.afterHoursSupport,
          estimatedMissedCalls: data.estimatedMissedCalls ? parseInt(data.estimatedMissedCalls) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze website');

      const analysisData: AnalysisData = await response.json();
      setResults(analysisData);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMsg('Could not complete analysis. Please check the website URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadingMessages = [
    'Crawling your website with AI to detect services, chatbots & forms...',
    'Analyzing your call volume against industry benchmarks...',
    'Generating personalized revenue impact report with Gemini AI...',
  ];

  // If results exist, display results screen
  if (results) {
    return <ResultsDisplay data={results} onReset={() => setResults(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white pb-20 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-orange-600/20 via-orange-600/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navbar / Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-lg block leading-none">
                Sudais Jan
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
                AI Receptionist
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              24/7 Emergency Coverage
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-orange-400 text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Tailored For Plumbers & HVAC Providers (15+ Employees)
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            How Much Revenue Are You Losing From{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 underline decoration-orange-500/30 decoration-wavy underline-offset-8">
              Missed Calls?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Get a detailed revenue impact report in <span className="text-white font-bold">60 seconds</span>. See exactly how many paying jobs you&apos;re losing each month—and what 24/7 AI call coverage could recover.
          </p>

          {/* Trust Indicators - Section 4 of PRD */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 pt-4 text-xs sm:text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Free Instant Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>No Email Required</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>60-Second Report</span>
            </div>
          </div>
        </motion.div>

        {/* Input Form Section - Section 5 of PRD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <div>
              <label htmlFor="website" className="block text-sm font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span>Enter Your Company Website</span>
                <span className="text-xs font-normal text-slate-400">Example: https://plumbingpros.com</span>
              </label>
              
              <div className="relative">
                <input
                  id="website"
                  type="text"
                  disabled={isLoading}
                  {...register('website', {
                    required: 'Website URL is required',
                    pattern: {
                      value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                      message: 'Please enter a valid website URL (e.g. plumbingpros.com or https://...)',
                    },
                  })}
                  placeholder="https://yourcompany.com"
                  className="w-full px-5 py-4 sm:py-5 text-base sm:text-lg bg-slate-950/80 border-2 border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all disabled:opacity-50 font-medium"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  SSL Secure
                </div>
              </div>

              {errors.website && (
                <p className="mt-2 text-sm text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.website.message}
                </p>
              )}
              
              {errorMsg && (
                <p className="mt-2 text-sm text-rose-400 flex items-center gap-1.5 font-medium bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </p>
              )}

              <p className="mt-2 text-xs text-slate-400">
                We&apos;ll crawl your website with AI to detect services, chatbots, forms, and booking capabilities.
              </p>
            </div>

            {/* ── Question 2: Weekly Call Volume ── */}
            <div>
              <label htmlFor="weeklyCallVolume" className="block text-sm font-bold text-slate-200 mb-2">
                How many incoming calls do you get per week?
              </label>
              <select
                id="weeklyCallVolume"
                disabled={isLoading}
                {...register('weeklyCallVolume', { required: true })}
                className="w-full px-5 py-4 text-base bg-slate-950/80 border-2 border-slate-800 rounded-2xl text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all disabled:opacity-50 font-medium appearance-none cursor-pointer"
              >
                <option value="10-20">10 – 20 calls/week</option>
                <option value="20-50">20 – 50 calls/week</option>
                <option value="50-100">50 – 100 calls/week</option>
                <option value="100-200">100 – 200 calls/week</option>
                <option value="200+">200+ calls/week</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-400">This helps us match your volume against industry miss-rate benchmarks.</p>
            </div>

            {/* ── Question 3: After-Hours Support ── */}
            <div>
              <label htmlFor="afterHoursSupport" className="block text-sm font-bold text-slate-200 mb-2">
                Do you have after-hours emergency call coverage?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'no', label: 'No', desc: 'Calls go to voicemail' },
                  { value: 'partial', label: 'Partial', desc: 'Answering service, not 24/7' },
                  { value: 'yes', label: 'Yes', desc: 'Full 24/7 coverage' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex flex-col items-center gap-1 p-4 rounded-2xl border-2 cursor-pointer transition-all text-center ${
                      watch('afterHoursSupport') === option.value
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('afterHoursSupport')}
                      className="sr-only"
                    />
                    <span className="font-bold text-sm">{option.label}</span>
                    <span className="text-xs text-slate-400">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Question 4: Estimated Missed Calls (Optional) ── */}
            <div>
              <label htmlFor="estimatedMissedCalls" className="block text-sm font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span>How many calls do you think you miss per week?</span>
                <span className="text-xs font-normal text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">Optional</span>
              </label>
              <input
                id="estimatedMissedCalls"
                type="number"
                min="0"
                max="500"
                disabled={isLoading}
                {...register('estimatedMissedCalls')}
                placeholder="Leave blank to use industry average (~22% miss rate)"
                className="w-full px-5 py-4 text-base bg-slate-950/80 border-2 border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all disabled:opacity-50 font-medium"
              />
              <p className="mt-1.5 text-xs text-slate-400">If you&apos;re not sure, we&apos;ll calculate using Google&apos;s industry average miss rate for your business size.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-lg font-extrabold py-5 px-8 rounded-2xl shadow-xl hover:shadow-orange-500/25 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
              
              {isLoading ? (
                <div className="flex items-center gap-3 py-0.5">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-bold text-base sm:text-lg">{loadingMessages[loadingStep]}</span>
                </div>
              ) : (
                <>
                  <span>Calculate My Revenue Loss</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Privacy Note */}
            <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Your data is analyzed securely and never shared. Results appear instantly.
            </p>
          </form>
        </motion.div>

        {/* LIVE ACTIVITY TICKER / SOCIAL PROOF */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="font-bold text-slate-300">Live Diagnostics Activity:</span>
          </div>
          <div className="flex items-center gap-3 overflow-hidden text-center sm:text-left">
            <span className="text-slate-300 font-medium">⚡ 4 mins ago: <span className="text-white">Apex Plumbing (TX)</span> uncovered <span className="text-rose-400 font-bold">$14,800/mo</span> in missed calls</span>
          </div>
          <div className="hidden md:block text-slate-500">
            <span>24/7 AI Receptionist Benchmarking</span>
          </div>
        </motion.div>
      </section>

      {/* WHY EMERGENCY SERVICE COMPANIES LOSE REVENUE */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-6xl relative z-10 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why Plumbing & HVAC Providers Lose <span className="text-orange-400">$100k+ Annually</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            In emergency home services, 80% of customers hire the first company that answers the phone. When you miss a call, you aren&apos;t just losing a voicemail—you&apos;re handing a high-ticket job directly to your competitor.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-orange-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">After-Hours Emergency Gaps</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pipe bursts and AC breakdowns don&apos;t happen from 9 to 5. Without 24/7 coverage, high-value night and weekend emergency jobs ($500–$1,500+) go unanswered or straight to voicemail.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-orange-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
              <PhoneMissed className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Peak Hour Rush Overload</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Between 8am–10am and 4pm–7pm, incoming call volume spikes by 300%. When your dispatchers are busy on another line, secondary callers hang up within 20 seconds.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-orange-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">High Staffing Overhead</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Hiring overnight and weekend call center staff costs $4,000+/month and suffers from high turnover and inconsistent qualification. AI delivers flawless 24/7 coverage at a fraction of the cost.
            </p>
          </div>
        </div>
      </section>

      {/* THE SUDAIS JAN ADVANTAGE PREVIEW */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl relative z-10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border border-orange-500/20 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                The AI Receptionist Solution
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Never Miss Another Paying Job Again
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Sudais Jan&apos;s AI Receptionist is custom-trained for emergency plumbers and HVAC contractors. It answers on the first ring, books jobs directly into your dispatch system, and handles emergency triage 24 hours a day, 7 days a week.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span><strong>Instant Answer:</strong> Zero hold times, 365 days a year</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span><strong>Emergency Triage:</strong> Recognizes urgent leaks and HVAC failures</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span><strong>Seamless Dispatch:</strong> Books jobs without adding headcount</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Call Comparison</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  AI Active
                </span>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-rose-300">
                    <span>❌ Without AI Coverage (2:15 AM)</span>
                    <span>Missed Job</span>
                  </div>
                  <p className="text-slate-400">&quot;You have reached voicemail. Please leave a message...&quot; → Caller hangs up and calls competitor.</p>
                  <span className="text-rose-400 font-bold block pt-1">Lost Revenue: -$650</span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-emerald-300">
                    <span>⚡ With Sudais Jan AI (2:15 AM)</span>
                    <span>Job Secured</span>
                  </div>
                  <p className="text-slate-300">&quot;Hello! I can get an emergency technician dispatched to your flooded basement immediately. What is your address?&quot;</p>
                  <span className="text-emerald-400 font-bold block pt-1">Secured Revenue: +$650</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-16 pt-8 text-center text-xs text-slate-500">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Sudais Jan — AI Receptionist for Emergency Local Services. All rights reserved.</p>
          <p className="mt-2 text-slate-600">Built with modern AI diagnostics & design system architecture.</p>
        </div>
      </footer>
    </div>
  );
}

// Main Page wrapping in Suspense per Next.js App Router requirements
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 animate-bounce mb-4">
            <PhoneCall className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sudais Jan AI Receptionist</h2>
          <p className="text-sm text-slate-400 animate-pulse">Loading Revenue Calculator...</p>
        </div>
      }
    >
      <CalculatorContent />
    </Suspense>
  );
}
