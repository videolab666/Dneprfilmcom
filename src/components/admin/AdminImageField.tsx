import { useRef, useState } from 'react';
import { Image as ImageIcon, Library, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadLibraryImage } from '../../lib/mediaUpload';
import { registerMediaAsset, type MediaLibraryAsset } from '../../lib/mediaLibrary';
import { ResponsiveImage } from '../ResponsiveImage';
import { MediaLibraryPicker } from './MediaLibraryPicker';

type PreviewShape = 'wide' | 'square' | 'portrait';

interface AdminImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  placeholder?: string;
  previewAlt?: string;
  previewShape?: PreviewShape;
  disabled?: boolean;
}

const previewShapeClass: Record<PreviewShape, string> = {
  wide: 'aspect-video',
  square: 'aspect-square max-w-xs',
  portrait: 'aspect-[3/4] max-w-xs',
};

export function AdminImageField({
  label,
  value,
  onChange,
  helperText,
  placeholder = 'https://...',
  previewAlt = 'Предпросмотр изображения',
  previewShape = 'wide',
  disabled = false,
}: AdminImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadLibraryImage(file);
      await registerMediaAsset(uploaded, file.name);
      onChange(uploaded.url);
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const chooseFromLibrary = (asset: MediaLibraryAsset) => {
    if (asset.assetType !== 'image') return;
    onChange(asset.url);
    setPickerOpen(false);
    setError('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-700">
        {label}
        <input
          type="url"
          value={value || ''}
          onChange={event => onChange(event.target.value)}
          disabled={disabled || uploading}
          placeholder={placeholder}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
        />
      </label>

      {helperText && <p className="text-xs leading-relaxed text-slate-500">{helperText}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={event => void upload(event.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Загрузка…' : 'Загрузить фото'}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Library className="h-4 w-4" />
          Из медиатеки
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Убрать фото
          </button>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}

      {value ? (
        <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${previewShapeClass[previewShape]}`}>
          <ResponsiveImage
            src={value}
            alt={previewAlt}
            displayWidth={960}
            sizes="(max-width: 768px) 100vw, 720px"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-300 ${previewShapeClass[previewShape]}`}>
          <ImageIcon className="h-9 w-9" />
        </div>
      )}

      {pickerOpen && (
        <MediaLibraryPicker
          type="image"
          title={label}
          onClose={() => setPickerOpen(false)}
          onSelect={chooseFromLibrary}
        />
      )}
    </div>
  );
}
