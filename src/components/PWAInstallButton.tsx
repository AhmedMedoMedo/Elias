import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-600/30 px-3 py-2 text-xs font-bold hover:bg-blue-600/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>تثبيت التطبيق على الجهاز</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Share className="w-3.5 h-3.5" />
          <span>تثبيت على iPhone / iPad</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  تثبيت التطبيق على iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed list-decimal list-inside">
                <li>
                  اضغط على زر <strong>المشاركة (Share)</strong> أسفل متصفح Safari.
                </li>
                <li>
                  مرّر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                </li>
                <li>
                  اضغط <strong>إضافة</strong> لتشغيل النظام كتطبيق مستقل يعمل بدون إنترنت.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-500 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
