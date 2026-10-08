'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Play,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Calendar,
  BarChart2,
  Bell,
  Zap,
  Repeat,
  Layers,
  Star,
  Check,
  Ban,
  Activity,
  HeartHandshake,
  Compass,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { FilterProvider } from '@/lib/filterContext';
import { useLanguage } from '@/lib/languageContext';

function AboutContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 selection:bg-teal-100 selection:text-teal-900">
      <Header />

      <main className="flex-1 w-full">
        {/* ═════════════════════════════════════════════════════════════════════
            1. HERO SECTION
        ═════════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-gray-50/70 pt-12 pb-16 md:pt-20 md:pb-24 border-b border-gray-100">
          {/* Subtle decorative background blur shapes */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-teal-200/30 to-emerald-100/40 blur-3xl pointer-events-none rounded-full"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3.5 py-1.5 text-xs font-semibold text-teal-800 shadow-xs mb-6 backdrop-blur-xs">
              <Sparkles size={14} className="text-do_now shrink-0" />
              <span>{t('about.hero_badge')}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight md:leading-snug">
              {t('about.hero_title')}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('about.hero_subtitle')}
            </p>

            {/* Action CTA Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-do_now px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                <span>{t('about.cta_start')}</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="#video-guide"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm sm:text-base font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-[0.98]"
              >
                <Play size={16} className="text-do_now fill-do_now" />
                <span>{t('about.cta_watch')}</span>
              </a>
            </div>

            {/* ── Mockup Giao Diện (Visual Interface Showcase) ── */}
            <div className="mt-12 sm:mt-16 mx-auto max-w-4xl">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden text-left">
                {/* Mockup Window Header Bar */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>{t('about.mockup_title')}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-400">
                    app.eisenhower
                  </div>
                </div>

                {/* Mockup Body Content */}
                <div className="p-4 sm:p-6 bg-gray-50/50">
                  {/* Stats Pill Row */}
                  <div className="flex items-center justify-between gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-do_now flex items-center justify-center font-bold text-xs">
                        4
                      </div>
                      <span className="text-xs font-medium text-gray-600 hidden sm:inline">
                        {t('about.mockup_all_tasks')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 font-semibold">
                        <Check size={12} strokeWidth={2.5} />
                        {t('about.mockup_today')}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 font-semibold">
                        <Activity size={12} />
                        {t('about.mockup_streak')}: 7 {t('about.mockup_days')}
                      </span>
                    </div>
                  </div>

                  {/* 4 Quadrants Mockup Preview Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Quadrant 1 Preview */}
                    <div className="rounded-xl border-2 border-do_now/30 bg-white shadow-xs overflow-hidden">
                      <div className="bg-do_now px-3 py-2 flex items-center justify-between text-white">
                        <span className="text-xs font-bold">{t('quadrants.do_now_title')}</span>
                        <span className="rounded-full bg-teal-50 text-do_now text-[11px] font-bold px-2 py-0.5">
                          1
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {t('about.mockup_sample_task1')}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                            09:00
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quadrant 2 Preview */}
                    <div className="rounded-xl border-2 border-schedule/30 bg-white shadow-xs overflow-hidden">
                      <div className="bg-schedule px-3 py-2 flex items-center justify-between text-white">
                        <span className="text-xs font-bold">{t('quadrants.schedule_title')}</span>
                        <span className="rounded-full bg-amber-50 text-schedule text-[11px] font-bold px-2 py-0.5">
                          1
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {t('about.mockup_sample_task2')}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                            {t('about.f2_title')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quadrant 3 Preview */}
                    <div className="rounded-xl border-2 border-delegate/30 bg-white shadow-xs overflow-hidden">
                      <div className="bg-delegate px-3 py-2 flex items-center justify-between text-white">
                        <span className="text-xs font-bold">{t('quadrants.delegate_title')}</span>
                        <span className="rounded-full bg-pink-50 text-delegate text-[11px] font-bold px-2 py-0.5">
                          1
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {t('about.mockup_sample_task3')}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">
                            15:30
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quadrant 4 Preview */}
                    <div className="rounded-xl border-2 border-eliminate/30 bg-white shadow-xs overflow-hidden">
                      <div className="bg-eliminate px-3 py-2 flex items-center justify-between text-white">
                        <span className="text-xs font-bold">{t('quadrants.eliminate_title')}</span>
                        <span className="rounded-full bg-purple-50 text-eliminate text-[11px] font-bold px-2 py-0.5">
                          1
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {t('about.mockup_sample_task4')}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                            {t('about.q4_action')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            2. TRIẾT LÝ MA TRẬN EISENHOWER (PHILOSOPHY & 4 QUADRANTS)
        ═════════════════════════════════════════════════════════════════════ */}
        <section id="philosophy" className="py-16 md:py-24 bg-white border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            {/* Header info */}
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200 mb-3">
                <Compass size={14} className="text-amber-600" />
                {t('about.philosophy_badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {t('about.philosophy_title')}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('about.philosophy_desc')}
              </p>
            </div>

            {/* 2 Trục Cốt Lõi: Khẩn cấp & Quan trọng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10">
              {/* Trục Khẩn cấp */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 sm:p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {t('about.axis_urgent')}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('about.axis_urgent_desc')}
                  </p>
                </div>
              </div>

              {/* Trục Quan trọng */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 sm:p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-do_now flex items-center justify-center shrink-0 shadow-xs">
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {t('about.axis_important')}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('about.axis_important_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Góc phần tư chi tiết */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Q1: Do Now */}
              <div className="rounded-2xl border-2 border-do_now/30 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold text-white bg-do_now shadow-xs">
                      {t('about.q1_name')}
                    </span>
                    <span className="text-xs font-semibold text-do_now">1st Priority</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('about.q1_desc')}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold text-do_now">
                  <Zap size={14} />
                  <span>{t('about.q1_action')}</span>
                </div>
              </div>

              {/* Q2: Schedule */}
              <div className="rounded-2xl border-2 border-schedule/30 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold text-white bg-schedule shadow-xs">
                      {t('about.q2_name')}
                    </span>
                    <span className="text-xs font-semibold text-schedule">Growth Realm</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('about.q2_desc')}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold text-schedule">
                  <Calendar size={14} />
                  <span>{t('about.q2_action')}</span>
                </div>
              </div>

              {/* Q3: Delegate */}
              <div className="rounded-2xl border-2 border-delegate/30 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold text-white bg-delegate shadow-xs">
                      {t('about.q3_name')}
                    </span>
                    <span className="text-xs font-semibold text-delegate">Distractions</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('about.q3_desc')}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold text-delegate">
                  <HeartHandshake size={14} />
                  <span>{t('about.q3_action')}</span>
                </div>
              </div>

              {/* Q4: Eliminate */}
              <div className="rounded-2xl border-2 border-eliminate/30 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold text-white bg-eliminate shadow-xs">
                      {t('about.q4_name')}
                    </span>
                    <span className="text-xs font-semibold text-eliminate">Waste / Drains</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('about.q4_desc')}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold text-eliminate">
                  <Ban size={14} />
                  <span>{t('about.q4_action')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            3. 6 TÍNH NĂNG TIÊU BIỂU (6 CORE FEATURES)
        ═════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-gray-50 border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            {/* Header info */}
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200 mb-3">
                <Sparkles size={14} className="text-do_now" />
                {t('about.features_badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {t('about.features_title')}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('about.features_subtitle')}
              </p>
            </div>

            {/* 6 Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-do_now flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Layers size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {t('about.f1_title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {t('about.f1_desc')}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-schedule flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Repeat size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {t('about.f2_title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {t('about.f2_desc')}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {t('about.f3_title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {t('about.f3_desc')}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-delegate flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <BarChart2 size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {t('about.f4_title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {t('about.f4_desc')}
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-eliminate flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Bell size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {t('about.f5_title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {t('about.f5_desc')}
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Shield size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {t('about.f6_title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {t('about.f6_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            4. VIDEO YOUTUBE & 3 BƯỚC BẮT ĐẦU NHANH
        ═════════════════════════════════════════════════════════════════════ */}
        <section id="video-guide" className="py-16 md:py-24 bg-white border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            {/* Header info */}
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200 mb-3">
                <Play size={14} className="text-do_now fill-do_now" />
                {t('about.video_badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {t('about.video_title')}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('about.video_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Responsive 16:9 YouTube Video Embed */}
              <div className="lg:col-span-7">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-black">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube-nocookie.com/embed/SUb_Q9yQ2nQ"
                    title={t('about.video_title')}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* 3 Quick Start Steps */}
              <div className="lg:col-span-5 space-y-4">
                {/* Step 1 */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 flex items-start gap-3.5 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-do_now text-white font-bold text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {t('about.step1_title')}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      {t('about.step1_desc')}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 flex items-start gap-3.5 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-schedule text-white font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {t('about.step2_title')}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      {t('about.step2_desc')}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 flex items-start gap-3.5 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-delegate text-white font-bold text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {t('about.step3_title')}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      {t('about.step3_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            5. BOTTOM CALL TO ACTION
        ═════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
              {/* Background ambient light */}
              <div
                className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-teal-100 mb-4 backdrop-blur-xs">
                  {t('about.cta_badge')}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                  {t('about.cta_title')}
                </h2>
                <p className="mt-4 text-xs sm:text-sm text-teal-100 leading-relaxed max-w-lg mx-auto">
                  {t('about.cta_desc')}
                </p>

                <div className="mt-8">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm sm:text-base font-bold text-teal-900 hover:bg-teal-50 transition-all shadow-md active:scale-[0.98]"
                  >
                    <span>{t('about.cta_button')}</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═════════════════════════════════════════════════════════════════════
          6. FOOTER (CHUYỂN HƯỚNG ĐẦY ĐỦ CÁC TRANG TRONG ỨNG DỤNG)
      ═════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-white border-t border-gray-200 py-12 text-sm text-gray-600">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-100">
            {/* Brand Info */}
            <div className="md:col-span-2 space-y-3">
              <Link href="/" className="flex items-center gap-2 w-fit">
                <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                  <div className="rounded-sm bg-do_now" />
                  <div className="rounded-sm bg-schedule" />
                  <div className="rounded-sm bg-delegate" />
                  <div className="rounded-sm bg-eliminate" />
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  {t('header.title')}
                </span>
              </Link>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                {t('about.footer_tagline')}
              </p>
            </div>

            {/* Quick Links Navigation */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-3">
                {t('about.footer_navigation')}
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/" className="hover:text-do_now transition-colors">
                    {t('about.footer_home')}
                  </Link>
                </li>
                <li>
                  <Link href="/completed" className="hover:text-do_now transition-colors">
                    {t('about.footer_completed')}
                  </Link>
                </li>
                <li>
                  <Link href="/motivation" className="hover:text-do_now transition-colors">
                    {t('about.footer_motivation')}
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="hover:text-do_now transition-colors">
                    {t('about.footer_settings')}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-do_now font-semibold">
                    {t('about.footer_about')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Privacy / Security Info */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-1.5">
                <Shield size={14} className="text-do_now" />
                {t('about.footer_privacy')}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                {t('about.footer_privacy_note')}
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                <CheckCircle2 size={12} />
                <span>100% Offline Capable</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 text-center text-xs text-gray-400">
            {t('about.footer_copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense>
      <FilterProvider>
        <AboutContent />
      </FilterProvider>
    </Suspense>
  );
}
