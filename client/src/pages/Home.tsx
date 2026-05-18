import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUpload } from '@/components/FileUpload';
import { GitHubBrowser } from '@/components/GitHubBrowser';
import { DataTable } from '@/components/DataTable';
import { PdfSettingsPanel } from '@/components/PdfSettings';
import { FileUploader } from '@/components/dashboard/FileUploader';
import { ConversionOptions } from '@/components/dashboard/ConversionOptions';
import { LogTerminal } from '@/components/dashboard/LogTerminal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { parseExcelFile, parseExcelBuffer, ParsedData } from '@/lib/excelParser';
import { exportToPdf, previewPdf, PdfSettings } from '@/lib/pdfExport';
import {
  Download, FileText, Layers, Eye, FileSpreadsheet,
  ArrowRight, CheckCircle, XCircle, Loader2, RefreshCw,
  FileDown, Zap, ScanText, TableProperties, ChevronDown,
  ArrowDownToLine, Sparkles, Shield, Clock, Globe,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface ConversionResult {
  id: string;
  originalName: string;
  excelName: string;
  tableCount: number;
  jobId: string;
  status: 'completed' | 'failed';
  errorMessage?: string;
}

function makeLog(level: LogEntry['level'], message: string): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toLocaleTimeString(),
    level,
    message,
  };
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

// ─── Hero stats ───────────────────────────────────────────────────────────────

function StatCard({ value, suffix, label, delay, started }: {
  value: number; suffix: string; label: string; delay: number; started: boolean;
}) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t);
  }, [started, delay]);
  const count = useCounter(value, 1600, active);
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-[100px] translate-y-1/3" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16">
        {/* Eyebrow badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3 h-3" />
            Dual-Purpose Conversion Engine
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground mb-6">
          Convert{' '}
          <span className="relative inline-block">
            <span className="relative z-10 text-primary">PDF ↔ Excel</span>
            <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/15 rounded-sm -z-0" />
          </span>
          <br />
          with precision
        </h1>

        {/* Sub-headline */}
        <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Extract tables from any PDF into structured Excel spreadsheets — or render
          any Excel file into a beautifully formatted PDF. No cloud upload required
          for Excel&nbsp;→&nbsp;PDF.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            onClick={onGetStarted}
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Converting
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base"
            onClick={onGetStarted}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            See how it works
          </Button>
        </div>

        {/* Conversion flow visual */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-16 flex-wrap">
          {/* PDF box */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-24 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 flex flex-col items-center justify-center gap-1 shadow-sm">
              <FileText className="w-8 h-8 text-red-500" />
              <span className="text-[10px] font-bold text-red-500 tracking-widest">PDF</span>
            </div>
            <span className="text-xs text-muted-foreground">Source</span>
          </div>

          {/* Arrow right */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground">Extract</span>
          </div>

          {/* Excel box */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-24 rounded-xl border-2 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 flex flex-col items-center justify-center gap-1 shadow-sm">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <span className="text-[10px] font-bold text-green-600 tracking-widest">XLSX</span>
            </div>
            <span className="text-xs text-muted-foreground">Output</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-16 bg-border mx-2" />

          {/* Excel box (reverse) */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-24 rounded-xl border-2 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 flex flex-col items-center justify-center gap-1 shadow-sm">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <span className="text-[10px] font-bold text-green-600 tracking-widest">XLSX</span>
            </div>
            <span className="text-xs text-muted-foreground">Source</span>
          </div>

          {/* Arrow right */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground">Render</span>
          </div>

          {/* PDF box */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-24 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 flex flex-col items-center justify-center gap-1 shadow-sm">
              <FileText className="w-8 h-8 text-red-500" />
              <span className="text-[10px] font-bold text-red-500 tracking-widest">PDF</span>
            </div>
            <span className="text-xs text-muted-foreground">Output</span>
          </div>
        </div>

        {/* Stats row */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 border-y border-border/60"
        >
          <StatCard value={50}   suffix="MB"  label="Max file size"       delay={0}   started={statsStarted} />
          <StatCard value={3}    suffix=""    label="Extraction modes"    delay={150} started={statsStarted} />
          <StatCard value={100}  suffix="+"   label="Sheets supported"    delay={300} started={statsStarted} />
          <StatCard value={0}    suffix=""    label="Cloud uploads (Excel→PDF)" delay={450} started={statsStarted} />
        </div>
      </div>
    </section>
  );
}

// ─── Feature cards ────────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      icon: TableProperties,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: 'Layout-aware extraction',
      desc: 'Detects column boundaries from PDF coordinates — not just raw text — so tables come out structured.',
    },
    {
      icon: ScanText,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      title: 'OCR for scanned PDFs',
      desc: 'Tesseract.js with 300 DPI preprocessing handles image-only PDFs and multi-language documents.',
    },
    {
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      title: 'Rich PDF output',
      desc: 'Cell styles, bold/italic, custom fonts, logos, headers, footers, and per-sheet orientation.',
    },
    {
      icon: Shield,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      title: 'Privacy-first',
      desc: 'Excel → PDF runs entirely in your browser. Your spreadsheet data never leaves your machine.',
    },
    {
      icon: Globe,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      title: 'GitHub integration',
      desc: 'Browse any public GitHub repo and convert Excel files directly — no download needed.',
    },
    {
      icon: Clock,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      title: 'Batch processing',
      desc: 'Drop multiple PDFs at once. Each file gets its own job with live progress and download.',
    },
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Built for real-world documents — messy layouts, scanned pages, multi-sheet workbooks.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', f.bg)}>
              <f.icon className={cn('w-5 h-5', f.color)} />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection({ onGetStarted }: { onGetStarted: () => void }) {
  const steps = [
    { n: '01', title: 'Upload your file', desc: 'Drop a PDF or Excel file. Up to 50 MB, any number of pages or sheets.' },
    { n: '02', title: 'Choose your mode', desc: 'Pick Basic, Advanced layout, or OCR for scanned documents.' },
    { n: '03', title: 'Convert instantly', desc: 'Watch live progress in the terminal. Download your file when done.' },
  ];

  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
          <p className="text-muted-foreground">Three steps, no account required.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((s, i) => (
            <div key={s.n} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] right-0 h-px bg-border" />
              )}
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-4 shadow-lg shadow-primary/25 z-10">
                {s.n}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <Button size="lg" className="h-12 px-10 font-semibold shadow-lg shadow-primary/20" onClick={onGetStarted}>
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Open the Converter
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── PDF → Excel Panel ────────────────────────────────────────────────────────

function PdfToExcelPanel() {
  const { toast } = useToast();
  const [mode, setMode] = useState('advanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const abortRef = useRef(false);

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev, makeLog(level, message)]);
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    abortRef.current = false;
    setIsProcessing(true);
    setShowLogs(true);
    setLogs([]);
    addLog('info', `Starting conversion of ${files.length} file(s)…`);
    const newResults: ConversionResult[] = [];

    for (const file of files) {
      if (abortRef.current) { addLog('warning', 'Conversion cancelled by user.'); break; }
      addLog('info', `Uploading "${file.name}" (${(file.size / 1024).toFixed(1)} KB)…`);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        const uploadRes = await fetch('/api/jobs/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({ error: uploadRes.statusText }));
          throw new Error(err.error || 'Upload failed');
        }
        const { jobId } = await uploadRes.json();
        addLog('info', `Job created (${jobId.slice(0, 8)}…). Processing…`);

        let job: any = null;
        const maxWait = 120_000;
        const started = Date.now();
        while (Date.now() - started < maxWait) {
          if (abortRef.current) break;
          await new Promise(r => setTimeout(r, 1500));
          const statusRes = await fetch(`/api/jobs/${jobId}`);
          if (!statusRes.ok) continue;
          job = await statusRes.json();
          const pct = job.progress ?? 0;
          addLog('info', `[${file.name}] ${pct}% — ${(job.metadata as any)?.statusMessage || job.status}`);
          if (job.status === 'completed' || job.status === 'failed') break;
        }

        if (!job || job.status !== 'completed') throw new Error(job?.errorMessage || 'Processing timed out or failed');

        const tablesRes = await fetch(`/api/jobs/${jobId}/tables`);
        const tablesData = tablesRes.ok ? await tablesRes.json() : { data: [] };
        const tableCount = tablesData.data?.length ?? 0;
        addLog('success', `"${file.name}" → ${tableCount} table(s) extracted successfully.`);
        newResults.push({ id: jobId, originalName: file.name, excelName: file.name.replace(/\.pdf$/i, '.xlsx'), tableCount, jobId, status: 'completed' });
      } catch (err: any) {
        addLog('error', `"${file.name}" failed: ${err.message}`);
        newResults.push({ id: Math.random().toString(36).slice(2), originalName: file.name, excelName: '', tableCount: 0, jobId: '', status: 'failed', errorMessage: err.message });
      }
    }

    setResults(prev => [...newResults, ...prev]);
    setIsProcessing(false);
    const succeeded = newResults.filter(r => r.status === 'completed').length;
    const failed = newResults.filter(r => r.status === 'failed').length;
    if (succeeded > 0) toast({ title: `${succeeded} file(s) converted to Excel` });
    if (failed > 0) toast({ title: `${failed} file(s) failed`, variant: 'destructive' });
  }, [mode, addLog, toast]);

  const handleDownload = async (result: ConversionResult) => {
    try {
      const res = await fetch(`/api/jobs/${result.jobId}/download`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = result.excelName;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: `Downloading ${result.excelName}` });
    } catch (err: any) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Upload PDF Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader onFilesSelected={handleFilesSelected} disabled={isProcessing} />
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Extraction Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversionOptions mode={mode} setMode={setMode} disabled={isProcessing} />
        </CardContent>
      </Card>

      {isProcessing && (
        <div className="flex items-center gap-3 px-1">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Processing…</span>
          <Button variant="outline" size="sm" onClick={() => { abortRef.current = true; }}>Cancel</Button>
        </div>
      )}

      <LogTerminal logs={logs} isOpen={showLogs} />

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Conversion Results</h3>
            <Button variant="ghost" size="sm" onClick={() => { setResults([]); setLogs([]); setShowLogs(false); }}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
          {results.map(r => (
            <Card key={r.id} className="p-4 border-border/60">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {r.status === 'completed'
                    ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.originalName}</p>
                    {r.status === 'completed'
                      ? <p className="text-xs text-muted-foreground">{r.tableCount} table{r.tableCount !== 1 ? 's' : ''} → {r.excelName}</p>
                      : <p className="text-xs text-red-500 truncate">{r.errorMessage}</p>}
                  </div>
                </div>
                {r.status === 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => handleDownload(r)}>
                    <FileDown className="w-4 h-4 mr-1" /> Download Excel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Excel → PDF Panel ────────────────────────────────────────────────────────

function ExcelToPdfPanel() {
  const { toast } = useToast();
  const [data, setData] = useState<ParsedData | null>(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
    title: 'Data Export', subtitle: '', orientation: 'portrait', fontSize: 10,
    includeHeader: true, includeRowNumbers: false, selectedColumns: [],
    pageSize: 'a4',
    header: { left: '', center: '', right: '' },
    footer: { left: '', center: '{page_of_total}', right: '{date}' },
    margins: { top: 40, right: 40, bottom: 40, left: 40 },
    logo: null, sheetOrientations: {},
  });

  const handleFileSelect = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      setData(parsed); setActiveSheetIdx(0);
      setPdfSettings(prev => ({ ...prev, title: parsed.filename.replace(/\.[^/.]+$/, ''), selectedColumns: parsed.sheets[0]?.columns || [] }));
    } catch (err: any) { toast({ title: 'Failed to parse file', description: err.message, variant: 'destructive' }); }
  };

  const handleBufferSelect = (buffer: ArrayBuffer, filename: string) => {
    try {
      const parsed = parseExcelBuffer(buffer, filename);
      setData(parsed); setActiveSheetIdx(0);
      setPdfSettings(prev => ({ ...prev, title: filename.replace(/\.[^/.]+$/, ''), selectedColumns: parsed.sheets[0]?.columns || [] }));
    } catch (err: any) { toast({ title: 'Failed to parse file', description: err.message, variant: 'destructive' }); }
  };

  const handleBatchExport = (files: Array<{ buffer: ArrayBuffer; filename: string }>) => {
    try {
      const allSheets = files.flatMap(f => parseExcelBuffer(f.buffer, f.filename).sheets);
      if (allSheets.length === 0) return;
      exportToPdf(allSheets, pdfSettings, 'batch-export');
      toast({ title: `Exported ${allSheets.length} sheets from ${files.length} files` });
    } catch (err: any) { toast({ title: 'Batch export failed', description: err.message, variant: 'destructive' }); }
  };

  const handleSheetChange = (idx: number) => {
    setActiveSheetIdx(idx);
    if (data) setPdfSettings(prev => ({ ...prev, selectedColumns: data.sheets[idx].columns }));
  };

  const handleExport = () => {
    if (!data) return;
    exportToPdf(data.sheets, pdfSettings, pdfSettings.title || 'Export');
  };

  const handlePreview = useCallback(() => {
    if (!data) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = previewPdf(data.sheets, pdfSettings, pdfSettings.title || 'Export');
    setPreviewUrl(url); setPreviewing(true);
  }, [data, pdfSettings, previewUrl]);

  const canExport = !!data && pdfSettings.selectedColumns.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 flex flex-col gap-6">
        {!data ? (
          <Card className="flex-1 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Select Excel / CSV Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full max-w-md mx-auto mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="github">GitHub Repo</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-6">
                  <FileUpload onFileSelect={handleFileSelect} />
                </TabsContent>
                <TabsContent value="github" className="mt-6">
                  <GitHubBrowser onFileSelect={handleBufferSelect} onBatchExport={handleBatchExport} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold">{data.filename}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Layers className="w-4 h-4" />{data.sheets.length} sheet{data.sheets.length !== 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground">{data.sheets[activeSheetIdx].data.length} rows</span>
                <span className="text-muted-foreground">{data.sheets[activeSheetIdx].columns.length} cols</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setData(null)}>Change File</Button>
            </div>
            <div className="flex-1 min-h-[400px]">
              <DataTable data={data} onSheetChange={handleSheetChange} />
            </div>
          </>
        )}
      </div>

      <div className="lg:col-span-4">
        <Card className="h-full flex flex-col sticky top-6 border-border/60 shadow-sm">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="text-base">PDF Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto py-4">
            {data ? (
              <PdfSettingsPanel
                settings={pdfSettings} onChange={setPdfSettings}
                availableColumns={data.sheets[activeSheetIdx].columns}
                availableSheets={data.sheets.map(s => s.name)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center py-12">
                Load a spreadsheet to configure PDF settings.
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t bg-muted/10 flex flex-col gap-2">
            <Button variant="outline" className="w-full" disabled={!canExport} onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" /> Preview PDF
            </Button>
            <Button className="w-full font-semibold py-5 shadow-md shadow-primary/20" size="lg" disabled={!canExport} onClick={handleExport}>
              <Download className="w-5 h-5 mr-2" /> Generate & Download PDF
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={previewing} onOpenChange={open => { if (!open) setPreviewing(false); }}>
        <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> PDF Preview — {pdfSettings.title || 'Export'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/30 p-4">
            {previewUrl && <iframe src={previewUrl} className="w-full h-full rounded border bg-white" title="PDF Preview" />}
          </div>
          <div className="px-6 py-4 border-t shrink-0 flex justify-between items-center bg-card">
            <p className="text-xs text-muted-foreground">Close and adjust settings, then preview again.</p>
            <Button onClick={handleExport}><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Converter workspace ──────────────────────────────────────────────────────

function ConverterWorkspace() {
  return (
    <section id="converter" className="max-w-[1600px] mx-auto px-6 py-12">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3">
          Converter
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      <Tabs defaultValue="pdf-to-excel" className="w-full">
        <TabsList className="mb-8 h-12 p-1 bg-muted/50 border border-border/60 rounded-xl w-fit">
          <TabsTrigger
            value="pdf-to-excel"
            className="gap-2 px-6 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
          >
            <FileText className="w-4 h-4" />
            PDF → Excel
          </TabsTrigger>
          <TabsTrigger
            value="excel-to-pdf"
            className="gap-2 px-6 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel → PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf-to-excel">
          <PdfToExcelPanel />
        </TabsContent>
        <TabsContent value="excel-to-pdf">
          <ExcelToPdfPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/20 mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">PDF ↔ Excel</span>
          <span>— Dual-purpose conversion tool</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            Excel→PDF runs locally
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            No account required
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const converterRef = useRef<HTMLDivElement>(null);

  const scrollToConverter = () => {
    converterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shadow-primary/30">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight">PDF ↔ Excel</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button
              onClick={scrollToConverter}
              className="hover:text-foreground transition-colors"
            >
              Converter
            </button>
            <a href="#features" className="hover:text-foreground transition-colors"
              onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors"
              onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>
              How it works
            </a>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" className="h-8 px-4 text-xs font-semibold shadow-sm shadow-primary/20" onClick={scrollToConverter}>
              Open Converter
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <HeroSection onGetStarted={scrollToConverter} />

      {/* ── Features ── */}
      <div id="features">
        <FeaturesSection />
      </div>

      {/* ── How it works ── */}
      <div id="how-it-works">
        <HowItWorksSection onGetStarted={scrollToConverter} />
      </div>

      {/* ── Converter workspace ── */}
      <div ref={converterRef}>
        <ConverterWorkspace />
      </div>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
