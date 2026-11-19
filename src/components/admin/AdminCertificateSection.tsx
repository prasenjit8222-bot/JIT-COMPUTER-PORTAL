import React, { useMemo, useState } from 'react';
import { Upload, Save, Trash2, Eye } from 'lucide-react';
import { AppData, CertificateConfig } from '../../types';
import { CertificateRenderer } from '../CertificateRenderer';

interface AdminCertificateSectionProps {
  data: AppData;
  onUpdateCertificateConfig: (config: CertificateConfig) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

export const AdminCertificateSection: React.FC<AdminCertificateSectionProps> = ({
  data,
  onUpdateCertificateConfig,
  onNotify,
}) => {
  const [draft, setDraft] = useState<CertificateConfig>(data.certificateConfig);

  const approvedStudents = useMemo(
    () => data.students.filter((s) => s.approvalStatus === 'Approved'),
    [data.students]
  );

  const defaultPreviewStudent = useMemo(
    () =>
      approvedStudents.find((s) => s.courseStatus === 'Completed') ||
      approvedStudents[0] ||
      data.students[0],
    [approvedStudents, data.students]
  );

  const [previewStudentId, setPreviewStudentId] = useState<string>(defaultPreviewStudent?.id || '');

  const previewStudent = useMemo(
    () => data.students.find((s) => s.id === previewStudentId) || defaultPreviewStudent,
    [data.students, previewStudentId, defaultPreviewStudent]
  );

  const previewCourse = useMemo(
    () => data.courses.find((c) => c.id === previewStudent?.courseId),
    [data.courses, previewStudent]
  );

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'customBackgroundDataUrl' | 'directorSignatureDataUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onNotify('warning', 'Image File Too Large', 'Please choose an image under 2 MB for LocalStorage persistence.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined;
      if (!result) return;
      setDraft((prev) => ({
        ...prev,
        [field]: result,
        ...(field === 'customBackgroundDataUrl' ? { templateMode: 'custom' as const } : {}),
      }));
      onNotify(
        'info',
        field === 'customBackgroundDataUrl' ? 'Custom Template Loaded' : 'Director Signature Loaded',
        'Click "Save Certificate Template" to publish it to all completed students.'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCertificateConfig(draft);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Configuration Form */}
        <form
          onSubmit={handleSave}
          className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4 h-fit no-print"
        >
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Certificate Template Setup
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize the institute template. Student Name, Course, Roll ID, Date, and Grade auto-populate upon completion.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Template Style</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'classic_gold', label: 'Classic Gold' },
                { id: 'royal_clean', label: 'Royal Blue' },
                { id: 'custom', label: 'Custom Upload' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      templateMode: opt.id as CertificateConfig['templateMode'],
                    }))
                  }
                  className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    draft.templateMode === opt.id
                      ? 'bg-blue-900 border-blue-900 text-white'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institute Name</label>
            <input
              type="text"
              required
              value={draft.instituteName}
              onChange={(e) => setDraft({ ...draft, instituteName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Accreditation</label>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Number</label>
            <input
              type="text"
              value={draft.registrationNo}
              onChange={(e) => setDraft({ ...draft, registrationNo: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Director Name</label>
              <input
                type="text"
                value={draft.directorName}
                onChange={(e) => setDraft({ ...draft, directorName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Director Title</label>
              <input
                type="text"
                value={draft.directorTitle}
                onChange={(e) => setDraft({ ...draft, directorTitle: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Seal Label</label>
            <input
              type="text"
              value={draft.sealText}
              onChange={(e) => setDraft({ ...draft, sealText: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          {/* Custom Background Upload */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custom Certificate Background Image (Optional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {draft.customBackgroundDataUrl ? 'Replace Background Image' : 'Upload Background (JPG/PNG)'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'customBackgroundDataUrl')}
                    className="hidden"
                  />
                </label>
                {draft.customBackgroundDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        customBackgroundDataUrl: undefined,
                        templateMode: 'classic_gold',
                      }))
                    }
                    aria-label="Remove custom background"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-slate-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Director Signature Image (Optional PNG)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {draft.directorSignatureDataUrl ? 'Replace Signature Image' : 'Upload Signature Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'directorSignatureDataUrl')}
                    className="hidden"
                  />
                </label>
                {draft.directorSignatureDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, directorSignatureDataUrl: undefined }))
                    }
                    aria-label="Remove signature image"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-slate-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Certificate Template
          </button>
        </form>

        {/* Right Live Auto-Populated Preview */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 no-print">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-900" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Live Auto-Generator Preview
              </h3>
            </div>
            {approvedStudents.length > 0 ? (
              <div className="flex items-center gap-2">
                <label htmlFor="preview-student" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  Preview Student:
                </label>
                <select
                  id="preview-student"
                  value={previewStudent?.id || ''}
                  onChange={(e) => setPreviewStudentId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {approvedStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.rollId}) — {st.courseStatus}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                Template Layout Preview (No enrolled students yet)
              </span>
            )}
          </div>

          <CertificateRenderer
            student={
              previewStudent || {
                id: 'template-placeholder',
                rollId: 'JIT-2026-XXX',
                name: 'Student Name',
                phone: '',
                email: '',
                courseId: data.courses[0]?.id || '',
                admissionDate: new Date().toISOString().slice(0, 10),
                completionDate: new Date().toISOString().slice(0, 10),
                approvalStatus: 'Approved',
                courseStatus: 'Completed',
                scheduledDays: [],
                attendance: [],
                feeStatus: 'Paid',
                autoReminderEnabled: false,
                feeHistory: [],
                examPoints: 100,
                examHistory: [],
                mandatoryExamDue: false,
                notifications: [],
              }
            }
            course={previewCourse || data.courses[0]}
            config={draft}
            showActions={Boolean(previewStudent)}
            onActionSuccess={(msg) => onNotify('success', 'Certificate Preview', msg)}
          />
        </section>
      </div>
    </div>
  );
};
