import { useRef } from 'react';
import { Upload, FileSpreadsheet, XCircle, Loader2 } from 'lucide-react';

interface ExcelUploadCardProps {
  title: string;
  description: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  onFileSelect: (file: File) => void;
  acceptedFormats?: string;
  progress?: number;
  currentRows?: number;
  totalRows?: number;
}

export default function ExcelUploadCard({
  title,
  description,
  status,
  errorMessage,
  onFileSelect,
  acceptedFormats = ".xls, .xlsx, .xlsm",
  progress = 0,
  currentRows = 0,
  totalRows = 0
}: ExcelUploadCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      if (fileRef.current) fileRef.current.value = ''; // Reset input so same file can be uploaded again if needed
    }
  };

  return (
    <div className="relative bg-white border border-gray-100 shadow-sm shadow-green-900/5 rounded-xl px-6 py-4 flex items-center justify-between gap-6 z-50 h-full">
      <div className="flex items-center gap-5 flex-1">
        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <Upload size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-800 leading-none mb-1.5 tracking-tight">{title}</h3>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            {description}
          </p>

          {status === 'loading' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-tight">
                <span className="text-emerald-600">
                  Data: {currentRows.toLocaleString('id-ID')} / {totalRows.toLocaleString('id-ID')}
                </span>
                <span className="text-gray-400">{progress}% Selesai</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <input 
          type="file" 
          accept={acceptedFormats}
          className="hidden" 
          ref={fileRef}
          onChange={onFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={status === 'loading'}
          className="px-6 h-11 bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-green-100 tracking-wide"
        >
          {status === 'loading' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <FileSpreadsheet size={18} />
          )}
          <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
        </button>
      </div>

      {status === 'error' && errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shadow-sm shadow-rose-900/5 text-[11px] font-bold flex items-start gap-3 animate-in slide-in-from-top-2 z-20 uppercase tracking-widest">
          <XCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}



