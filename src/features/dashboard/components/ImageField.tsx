'use client';

import { Field } from '@/components/ui/field';
import ImageCropperDialog from '@/components/ui/image-cropper';
import Loading from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { cn, isOptimizableImage } from '@/lib/utils';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useId, useRef, useState } from 'react';

/** What the file inputs accept, and what the upload route insists on. */
export const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp';

interface ImageFieldProps {
  label: string;
  /** Alt text for the stored image; the record's own title is the honest choice. */
  alt: string;
  value?: string;
  error?: string;
  hint?: string;
  /** Size and radius of the preview box, e.g. `size-24 rounded-full`. */
  frameClassName?: string;
  /** `contain` for a logo that must not be cropped, `cover` for a photograph. */
  fit?: 'cover' | 'contain';
  aspect: number;
  outputSize: number;
  uploading?: boolean;
  removing?: boolean;
  onUpload: (file: File) => void;
  /** Omitted where a stored image is permanent, e.g. the profile avatar. */
  onRemove?: () => void;
}

/**
 * Preview + upload + crop + remove, as one control.
 *
 * Six sections each grew their own copy of this, and the copies had drifted: three
 * removed an image with a text button, two with an X floating over the thumbnail, and
 * each one re-implemented the object-URL revoke that keeps a cancelled crop from
 * leaking a blob. One component means one behaviour, and the crop labels come from
 * `dashboard.crop` instead of being threaded through every caller.
 *
 * The label is bound to the upload button, so clicking the field's name opens the
 * file picker rather than doing nothing.
 */
export function ImageField({
  label,
  alt,
  value,
  error,
  hint,
  frameClassName = 'size-24 rounded-lg',
  fit = 'cover',
  aspect,
  outputSize,
  uploading,
  removing,
  onUpload,
  onRemove,
}: ImageFieldProps) {
  const t = useTranslations('dashboard.image');
  const td = useTranslations('dashboard');
  const tcrop = useTranslations('dashboard.crop');
  const controlId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const objectClass = fit === 'contain' ? 'object-contain p-1' : 'object-cover';

  const onCropOpenChange = (open: boolean) => {
    setCropOpen(open);
    // A cancelled crop still minted a blob URL; leaving it alive leaks one per attempt.
    if (open || !cropSrc) return;
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Field label={label} id={controlId} error={error} hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed bg-muted/20', frameClassName)}>
          {value ? (
            isOptimizableImage(value) ? (
              <Image src={value} alt={alt} fill sizes="192px" className={objectClass} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt={alt} className={cn('size-full', objectClass)} />
            )
          ) : (
            <ImagePlus className="size-5 text-muted-foreground/40" aria-hidden />
          )}

          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loading size="sm" />
            </span>
          )}
        </div>

        <div className="flex flex-col items-start gap-1">
          <Button
            id={controlId}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="me-2 size-3.5" aria-hidden />
            {t('upload')}
          </Button>

          {value && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              disabled={removing || uploading}
            >
              {removing ? <Loading size="sm" className="me-2" /> : <Trash2 className="me-2 size-3.5" aria-hidden />}
              {t('remove')}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          setCropSrc(URL.createObjectURL(file));
          setCropOpen(true);
        }}
      />

      <ImageCropperDialog
        open={cropOpen}
        onOpenChange={onCropOpenChange}
        src={cropSrc}
        aspect={aspect}
        outputSize={outputSize}
        labels={{ title: tcrop('title'), apply: tcrop('apply'), cancel: td('cancel'), zoom: tcrop('zoom'), move: tcrop('move') }}
        onCropped={onUpload}
      />
    </Field>
  );
}
