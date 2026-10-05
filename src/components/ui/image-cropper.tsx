'use client';
import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ImageCropperProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src: string | null;
  aspect?: number; // width/height, default 1 (square)
  labels: {
    title: string;
    apply: string;
    cancel: string;
    zoom: string;
    move: string;
  };
  outputSize?: number; // final pixel size for width (height derived by aspect)
  onCropped: (file: File) => void;
};

type CropperBodyProps = {
  src: string | null;
  aspect: number;
  labels: ImageCropperProps['labels'];
  outputSize: number;
  onCropped: (file: File) => void;
  onClose: () => void;
};

/**
 * Crop body. Text alignment, control order and the footer buttons all mirror
 * through logical utilities and inherited direction, so the Persian dialog is
 * the English one flipped — no hand-rolled `flex-row-reverse` to double-mirror.
 */
function CropperBody({ src, aspect, labels, outputSize, onCropped, onClose }: CropperBodyProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, cropped: Area) => {
    setCroppedAreaPixels(cropped);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!src || !croppedAreaPixels) return;
    const image = new Image();
    const blob = await new Promise<Blob | null>(resolve => {
      image.onload = () => {
        const outW = outputSize;
        const outH = Math.round(outputSize / aspect);
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const { x, y, width, height } = croppedAreaPixels;
        ctx.drawImage(image, x, y, width, height, 0, 0, outW, outH);
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92);
      };
      image.src = src;
    });
    if (!blob) return;
    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
    onCropped(file);
    onClose();
  }, [src, croppedAreaPixels, outputSize, aspect, onCropped, onClose]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{labels.title}</DialogTitle>
        {/* Doubles as the dialog description, which is what makes the dialog
            announce itself to a screen reader instead of warning. */}
        <DialogDescription>{labels.move}</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        {/* The viewport is a coordinate space, not text: pinning it to LTR keeps
            the library's absolute offsets and drag vectors exact in RTL. */}
        <div dir="ltr" className="relative h-[280px] w-full overflow-hidden rounded-md bg-muted">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              objectFit="contain"
              showGrid={false}
              cropShape="rect"
              classes={{ containerClassName: '!bg-background' }}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="image-cropper-zoom" className="whitespace-nowrap text-sm text-muted-foreground">
            {labels.zoom}
          </label>
          <input
            id="image-cropper-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button type="button" onClick={applyCrop}>
          {labels.apply}
        </Button>
      </DialogFooter>
    </>
  );
}

export default function ImageCropperDialog({ open, onOpenChange, src, aspect = 1, labels, outputSize = 512, onCropped }: ImageCropperProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        {open ? (
          <CropperBody
            key={src ?? 'no-src'}
            src={src}
            aspect={aspect}
            labels={labels}
            outputSize={outputSize}
            onCropped={onCropped}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
