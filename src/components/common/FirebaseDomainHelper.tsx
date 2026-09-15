import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, KeyRound, Globe } from 'lucide-react';
import { getCurrentHostname } from '../../services/firebase';

interface FirebaseDomainHelperProps {
  projectId?: string;
  onBypass?: () => void;
  bypassLabel?: string;
  className?: string;
}

export const FirebaseDomainHelper: React.FC<FirebaseDomainHelperProps> = ({
  projectId = 'gen-lang-client-0694832781',
  onBypass,
  bypassLabel = 'Sign in with Demo Credentials',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const hostname = getCurrentHostname();

  const handleCopy = () => {
    if (hostname && navigator.clipboard) {
      navigator.clipboard.writeText(hostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  return (
    <div
      className={`rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
            <span>Domain Not Authorized in Firebase Auth</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-xs">
            Firebase Google Sign-In blocks popups until this domain is registered in your Firebase project&apos;s authorized domain list.
          </p>
        </div>
      </div>

      {/* Domain Copy Box */}
      <div className="bg-white/90 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <Globe className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="font-mono text-[11px] font-bold text-slate-800 truncate select-all">
            {hostname || 'Current Domain'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-amber-700" />
              <span>Copy Domain</span>
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="text-[11px] text-amber-800/90 space-y-1 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200/60 font-medium">
        <div className="font-bold text-amber-950">How to fix in 30 seconds:</div>
        <ol className="list-decimal list-inside space-y-0.5 text-amber-900">
          <li>
            Open{' '}
            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-amber-950 inline-flex items-center gap-0.5 hover:text-amber-800"
            >
              Firebase Auth Settings
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          </li>
          <li>Under <strong>Authorized domains</strong>, click <strong>Add domain</strong>.</li>
          <li>Paste <strong>{hostname || 'this domain'}</strong> and save.</li>
        </ol>
      </div>

      {/* Bypass Action */}
      {onBypass && (
        <button
          type="button"
          onClick={onBypass}
          className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          <span>{bypassLabel}</span>
        </button>
      )}
    </div>
  );
};
