'use client';

import { PointerEvent, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Check, Eye, EyeOff, RotateCcw, Save } from 'lucide-react';
import {
  type CertificateTemplateConfig,
  type CertificateTemplateFieldKey,
  certificateTemplateFieldLabels,
  CERTIFICATE_TEMPLATE_HEIGHT,
  CERTIFICATE_TEMPLATE_WIDTH,
  defaultCertificateTemplateConfig,
  normalizeCertificateTemplateConfig,
} from '@/lib/certificate-template';
import { updateCertificateTemplateConfig } from '../../actions';

type Props = {
  trainingId: number;
  trainingTitle: string;
  templateUrl: string | null;
  initialConfig: CertificateTemplateConfig;
};

const textFieldKeys = ['participantName', 'trainingTitle', 'certificateNumber', 'issueDate', 'expiryDate'] as const;
const fieldKeys = [...textFieldKeys, 'qrCode'] as CertificateTemplateFieldKey[];

const sampleValues: Record<CertificateTemplateFieldKey, string> = {
  participantName: 'Mulyanto',
  trainingTitle: 'Keselamatan Kerja Dasar',
  certificateNumber: 'PST/KPLH/2026/0001',
  issueDate: '30 Mei 2026',
  expiryDate: '30 Mei 2027',
  qrCode: 'QR',
};

function isTextField(key: CertificateTemplateFieldKey): key is typeof textFieldKeys[number] {
  return key !== 'qrCode';
}

function toPreviewStyle(config: CertificateTemplateConfig, key: CertificateTemplateFieldKey) {
  const field = config.fields[key];
  const width = key === 'qrCode' ? field.size ?? 100 : 220;
  const height = key === 'qrCode' ? field.size ?? 100 : field.fontSize ?? 14;
  const left = (field.x / CERTIFICATE_TEMPLATE_WIDTH) * 100;
  const top = ((CERTIFICATE_TEMPLATE_HEIGHT - field.y - height) / CERTIFICATE_TEMPLATE_HEIGHT) * 100;

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: key === 'qrCode' ? `${(width / CERTIFICATE_TEMPLATE_WIDTH) * 100}%` : 'auto',
    height: key === 'qrCode' ? `${(height / CERTIFICATE_TEMPLATE_HEIGHT) * 100}%` : 'auto',
    fontSize: isTextField(key) ? `${field.fontSize}px` : undefined,
    transform: isTextField(key) && field.align === 'center'
      ? 'translateX(-50%)'
      : isTextField(key) && field.align === 'right'
        ? 'translateX(-100%)'
        : undefined,
  };
}

export function CertificateTemplateEditor({ trainingId, trainingTitle, templateUrl, initialConfig }: Props) {
  const [config, setConfig] = useState(() => normalizeCertificateTemplateConfig(initialConfig));
  const [selectedKey, setSelectedKey] = useState<CertificateTemplateFieldKey>('participantName');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const previewRef = useRef<HTMLDivElement>(null);
  const activeField = config.fields[selectedKey];

  const configPayload = useMemo(() => JSON.stringify(config), [config]);

  function updateField(key: CertificateTemplateFieldKey, patch: Partial<CertificateTemplateConfig['fields'][CertificateTemplateFieldKey]>) {
    setConfig((current) => normalizeCertificateTemplateConfig({
      fields: {
        ...current.fields,
        [key]: { ...current.fields[key], ...patch },
      },
    }));
  }

  function moveField(event: PointerEvent<HTMLButtonElement>, key: CertificateTemplateFieldKey) {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const field = config.fields[key];
    const height = key === 'qrCode' ? field.size ?? 100 : field.fontSize ?? 14;

    const applyPosition = (clientX: number, clientY: number) => {
      const relativeX = Math.min(rect.width, Math.max(0, clientX - rect.left));
      const relativeY = Math.min(rect.height, Math.max(0, clientY - rect.top));
      const x = (relativeX / rect.width) * CERTIFICATE_TEMPLATE_WIDTH;
      const y = CERTIFICATE_TEMPLATE_HEIGHT - ((relativeY / rect.height) * CERTIFICATE_TEMPLATE_HEIGHT) - height;
      updateField(key, { x: Math.round(x), y: Math.round(y) });
    };

    setSelectedKey(key);
    event.currentTarget.setPointerCapture(event.pointerId);
    applyPosition(event.clientX, event.clientY);

    const target = event.currentTarget;
    const pointerId = event.pointerId;
    const onMove = (moveEvent: globalThis.PointerEvent) => applyPosition(moveEvent.clientX, moveEvent.clientY);
    const onUp = () => {
      target.releasePointerCapture(pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function saveTemplate(formData: FormData) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateCertificateTemplateConfig(formData);
      if (result && 'error' in result && typeof result.error === 'string') {
        setError(result.error);
        return;
      }
      setMessage('Template tersimpan.');
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div ref={previewRef} className="relative mx-auto aspect-[842/595] w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-white shadow-inner">
          {templateUrl ? (
            <Image src={templateUrl} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-white">
              <div className="absolute inset-6 rounded-md border-4 border-primary/70" />
              <div className="absolute left-0 right-0 top-[12%] text-center text-xl font-bold text-primary">PST Learning Management System</div>
              <div className="absolute left-0 right-0 top-[24%] text-center text-4xl font-bold text-gray-800">CERTIFICATE OF COMPLETION</div>
            </div>
          )}

          {fieldKeys.map((key) => {
            const field = config.fields[key];
            if (field.visible === false) return null;
            const isSelected = selectedKey === key;
            const text = key === 'trainingTitle' ? trainingTitle || sampleValues[key] : sampleValues[key];

            return (
              <button
                key={key}
                type="button"
                onPointerDown={(event) => moveField(event, key)}
                onClick={() => setSelectedKey(key)}
                className={`absolute z-10 cursor-move select-none rounded border px-2 py-1 text-left font-semibold shadow-sm transition ${
                  isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-blue-300 bg-white/80 text-gray-900 hover:border-primary'
                } ${key === 'qrCode' ? 'grid place-items-center p-1' : ''}`}
                style={toPreviewStyle(config, key)}
              >
                {key === 'qrCode' ? (
                  <span className="grid h-full w-full place-items-center border-2 border-dashed border-gray-700 text-xs font-bold">QR</span>
                ) : (
                  <span className="whitespace-nowrap">{text}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <form action={saveTemplate} className="space-y-5">
          <input type="hidden" name="trainingId" value={trainingId} />
          <input type="hidden" name="config" value={configPayload} />

          <div className="space-y-2">
            <label className="text-sm font-medium">Elemen</label>
            <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value as CertificateTemplateFieldKey)} className="w-full rounded-md border border-border bg-background px-3 py-2">
              {fieldKeys.map((key) => (
                <option key={key} value={key}>{certificateTemplateFieldLabels[key]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm font-medium">
              X
              <input type="number" value={Math.round(activeField.x)} onChange={(event) => updateField(selectedKey, { x: Number(event.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Y
              <input type="number" value={Math.round(activeField.y)} onChange={(event) => updateField(selectedKey, { y: Number(event.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
          </div>

          {isTextField(selectedKey) ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm font-medium">
                Ukuran
                <input type="number" min="8" max="72" value={activeField.fontSize ?? 14} onChange={(event) => updateField(selectedKey, { fontSize: Number(event.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Rata
                <select value={activeField.align ?? 'left'} onChange={(event) => updateField(selectedKey, { align: event.target.value as 'left' | 'center' | 'right' })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                  <option value="left">Kiri</option>
                  <option value="center">Tengah</option>
                  <option value="right">Kanan</option>
                </select>
              </label>
            </div>
          ) : (
            <label className="space-y-1 text-sm font-medium block">
              Ukuran QR
              <input type="number" min="32" max="240" value={activeField.size ?? 100} onChange={(event) => updateField(selectedKey, { size: Number(event.target.value) })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => updateField(selectedKey, { visible: activeField.visible === false })} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              {activeField.visible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {activeField.visible === false ? 'Tampilkan' : 'Sembunyikan'}
            </button>
            <button type="button" onClick={() => setConfig(defaultCertificateTemplateConfig)} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {message && <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700"><Check className="h-4 w-4" />{message}</div>}
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}

          <button type="submit" disabled={isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            <Save className="h-4 w-4" />
            {isPending ? 'Menyimpan...' : 'Simpan Template'}
          </button>
        </form>
      </div>
    </div>
  );
}
