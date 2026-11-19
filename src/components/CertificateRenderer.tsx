import React, { useState } from 'react';
import { Award, Download, Printer } from 'lucide-react';
import { CertificateConfig, Course, Student } from '../types';
import { DEFAULT_CERT_BG_IMAGE, INSTITUTE_LOGO_IMAGE } from '../data/seedData';
import { computeStudentGrade, formatReadableDate } from '../utils/helpers';

interface CertificateRendererProps {
  student: Student;
  course?: Course;
  config: CertificateConfig;
  showActions?: boolean;
  onActionSuccess?: (message: string) => void;
}

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  student,
  course,
  config,
  showActions = true,
  onActionSuccess,
}) => {
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const courseName = course ? `${course.name} (${course.code})` : 'Computer Applications Program';
  const issueDate = formatReadableDate(student.completionDate || student.admissionDate);
  const grade = computeStudentGrade(student.examPoints);

  const activeBgSrc =
    config.templateMode === 'custom' && config.customBackgroundDataUrl
      ? config.customBackgroundDataUrl
      : config.templateMode === 'classic_gold'
        ? DEFAULT_CERT_BG_IMAGE
        : undefined;

  const handlePrint = () => {
    window.print();
    onActionSuccess?.('Print dialog opened — choose "Save as PDF" to export your certificate.');
  };

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1130;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Base warm ivory parchment
      ctx.fillStyle = '#FCFBF7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      let bgDrawn = false;
      if (activeBgSrc && !imgError) {
        try {
          const bgImg = await loadImg(activeBgSrc);
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
          bgDrawn = true;
        } catch {
          bgDrawn = false;
        }
      }

      if (!bgDrawn) {
        // Architectural Royal Blue & Gold classic border fallback
        ctx.strokeStyle = '#1E3A8A';
        ctx.lineWidth = 22;
        ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);

        ctx.strokeStyle = '#B4882E';
        ctx.lineWidth = 5;
        ctx.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);

        ctx.strokeStyle = '#1E3A8A';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(86, 86, canvas.width - 172, canvas.height - 172);
      }

      // Soft ivory center backing plate for crisp legibility over custom templates
      if (config.templateMode === 'custom') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.fillRect(180, 165, canvas.width - 360, canvas.height - 330);
      }

      // Official Institute Logo at Top Center
      try {
        const logoImg = await loadImg(INSTITUTE_LOGO_IMAGE);
        const targetH = 112;
        const aspect = logoImg.width > 0 && logoImg.height > 0 ? logoImg.width / logoImg.height : 1;
        const targetW = targetH * aspect;
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(logoImg, canvas.width / 2 - targetW / 2, 172, targetW, targetH);
        ctx.restore();
      } catch {
        // Fallback smoothly if logo fails to load
      }

      // Institute Header
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'bold 38px Georgia, serif';
      ctx.fillText(config.instituteName.toUpperCase(), canvas.width / 2, 326);

      ctx.fillStyle = '#475569';
      ctx.font = '500 19px sans-serif';
      ctx.fillText(config.subtitle, canvas.width / 2, 360);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 16px monospace';
      ctx.fillText(config.registrationNo, canvas.width / 2, 388);

      // Divider rule
      ctx.strokeStyle = '#C59B38';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(540, 412);
      ctx.lineTo(1060, 412);
      ctx.stroke();

      // Certificate Title
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.fillText('CERTIFICATE OF COURSE COMPLETION', canvas.width / 2, 468);

      ctx.fillStyle = '#475569';
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillText('This is to proudly certify that', canvas.width / 2, 518);

      // Student Name
      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'bold 54px Georgia, serif';
      ctx.fillText(student.name, canvas.width / 2, 588);

      // Name underline
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(420, 608);
      ctx.lineTo(1180, 608);
      ctx.stroke();

      // Course description
      ctx.fillStyle = '#334155';
      ctx.font = '22px sans-serif';
      ctx.fillText(
        'has successfully completed the prescribed curriculum and examination for',
        canvas.width / 2,
        654
      );

      ctx.fillStyle = '#312E81';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(courseName, canvas.width / 2, 702);

      // Structured Metadata Row
      ctx.fillStyle = '#475569';
      ctx.font = '600 19px monospace';
      ctx.fillText(
        `Roll ID: ${student.rollId}   ·   Score: ${student.examPoints} Pts   ·   Grade: ${grade}`,
        canvas.width / 2,
        754
      );

      // Footer Row: Issue Date | Seal | Director Signature
      // Left: Issue Date
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 21px monospace';
      ctx.fillText(issueDate, 240, 888);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(240, 902);
      ctx.lineTo(490, 902);
      ctx.stroke();
      ctx.fillStyle = '#64748B';
      ctx.font = '600 17px sans-serif';
      ctx.fillText('Date of Issue', 240, 930);

      // Center: Official Seal Circle
      const sealX = canvas.width / 2;
      const sealY = 880;
      ctx.beginPath();
      ctx.arc(sealX, sealY, 58, 0, Math.PI * 2);
      ctx.fillStyle = '#FEF9E7';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#B4882E';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sealX, sealY, 48, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1E3A8A';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('JIT', sealX, sealY - 8);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('VERIFIED', sealX, sealY + 10);
      ctx.font = '600 10px monospace';
      ctx.fillText('OFFICIAL SEAL', sealX, sealY + 26);

      // Right: Director Signature
      if (config.directorSignatureDataUrl) {
        try {
          const sigImg = await loadImg(config.directorSignatureDataUrl);
          ctx.drawImage(sigImg, 1110, 822, 230, 70);
        } catch {
          ctx.textAlign = 'right';
          ctx.fillStyle = '#1E3A8A';
          ctx.font = 'italic 32px Georgia, serif';
          ctx.fillText(config.directorName, 1360, 888);
        }
      } else {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1E3A8A';
        ctx.font = 'italic 32px Georgia, serif';
        ctx.fillText(config.directorName, 1360, 888);
      }

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1090, 902);
      ctx.lineTo(1360, 902);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(config.directorName, 1360, 930);
      ctx.fillStyle = '#64748B';
      ctx.font = '500 16px sans-serif';
      ctx.fillText(config.directorTitle, 1360, 954);

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `JIT-Certificate-${student.rollId}-${student.name.replace(/\s+/g, '_')}.png`;
      link.href = url;
      link.click();
      onActionSuccess?.(`Certificate image downloaded for ${student.name}.`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-sm text-slate-600">
            Certificate ID <span className="font-mono-num font-semibold text-slate-900">{student.rollId}</span> · Issued {issueDate}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Generating PNG...' : 'Download PNG'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      )}

      {/* Printable Certificate Canvas */}
      <div className="print-only-area relative w-full aspect-[4/3] max-w-4xl mx-auto overflow-hidden rounded-xl border border-slate-200 bg-[#FCFBF7] shadow-sm select-none">
        {activeBgSrc && !imgError ? (
          <img
            src={activeBgSrc}
            alt="Certificate border template"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 p-4 sm:p-6">
            <div className="w-full h-full border-[6px] sm:border-[10px] border-blue-950 p-1.5 sm:p-2">
              <div className="w-full h-full border-2 border-amber-600 p-1.5">
                <div className="w-full h-full border border-blue-900/40" />
              </div>
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div
          className={`relative z-10 h-full w-full flex flex-col items-center justify-between text-center px-8 py-6 sm:px-16 sm:py-12 ${
            config.templateMode === 'custom' ? 'bg-white/80 backdrop-blur-[1px]' : ''
          }`}
        >
          {/* Top Institute Branding with Official Logo */}
          <div className="space-y-0.5 sm:space-y-1 max-w-2xl">
            <img
              src={INSTITUTE_LOGO_IMAGE}
              alt="Jharna Institute of Technology (JIT) Official Logo"
              referrerPolicy="no-referrer"
              className="h-10 sm:h-14 md:h-16 w-auto object-contain mx-auto mix-blend-multiply"
            />
            <h2 className="font-cert-serif text-sm sm:text-xl md:text-2xl font-bold tracking-wide text-blue-950 leading-tight">
              {config.instituteName}
            </h2>
            <p className="text-[9px] sm:text-xs md:text-sm text-slate-600 font-medium">
              {config.subtitle}
            </p>
            <p className="font-mono-num text-[8px] sm:text-[11px] text-slate-500">
              {config.registrationNo}
            </p>
          </div>

          {/* Center Awardee Details */}
          <div className="space-y-2 sm:space-y-3 my-auto w-full max-w-2xl">
            <div className="w-24 sm:w-40 h-px bg-amber-600/70 mx-auto" />
            <p className="font-cert-serif text-xs sm:text-lg md:text-xl font-semibold tracking-wider text-slate-800 uppercase">
              Certificate of Course Completion
            </p>
            <p className="font-cert-serif italic text-[11px] sm:text-sm md:text-base text-slate-600">
              This is to proudly certify that
            </p>
            <p className="font-cert-serif text-xl sm:text-3xl md:text-4xl font-bold text-blue-950 pb-1 border-b border-slate-300 inline-block px-6">
              {student.name}
            </p>
            <p className="text-[10px] sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto">
              has successfully completed the prescribed training &amp; practical assessments in
            </p>
            <p className="font-display text-xs sm:text-lg md:text-xl font-bold text-indigo-950">
              {courseName}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] sm:text-xs font-mono-num text-slate-600 pt-1">
              <span>Roll ID: {student.rollId}</span>
              <span aria-hidden="true">·</span>
              <span>Exam Points: {student.examPoints}</span>
              <span aria-hidden="true">·</span>
              <span>Grade: {grade}</span>
            </div>
          </div>

          {/* Bottom Signatures & Seal */}
          <div className="w-full max-w-2xl grid grid-cols-3 items-end gap-2 sm:gap-4 pt-2">
            {/* Issue Date */}
            <div className="text-left">
              <p className="font-mono-num text-[10px] sm:text-xs font-semibold text-slate-900 pb-1 border-b border-slate-400">
                {issueDate}
              </p>
              <p className="text-[9px] sm:text-xs text-slate-500 mt-1">Date of Issue</p>
            </div>

            {/* Official Seal */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-amber-600 bg-amber-50/80 flex flex-col items-center justify-center p-1 shadow-xs">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-900" />
                <span className="text-[7px] sm:text-[9px] font-bold tracking-tight text-blue-950 leading-none mt-0.5 text-center">
                  VERIFIED
                </span>
              </div>
              <span className="text-[8px] sm:text-[10px] font-medium text-slate-500 mt-1 truncate max-w-full">
                {config.sealText}
              </span>
            </div>

            {/* Director Signature */}
            <div className="text-right">
              <div className="h-7 sm:h-10 flex items-end justify-end pb-1 border-b border-slate-400">
                {config.directorSignatureDataUrl ? (
                  <img
                    src={config.directorSignatureDataUrl}
                    alt="Director Signature"
                    referrerPolicy="no-referrer"
                    className="max-h-full object-contain"
                  />
                ) : (
                  <span className="font-cert-serif italic text-xs sm:text-base text-blue-950">
                    {config.directorName}
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-xs font-semibold text-slate-800 mt-1 truncate">
                {config.directorName}
              </p>
              <p className="text-[8px] sm:text-[11px] text-slate-500 truncate">{config.directorTitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
