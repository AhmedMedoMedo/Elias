export interface ProcessedImage {
  url: string;
  w: number;
  h: number;
}

export function compressImageFile(file: File, maxDimension = 900, quality = 0.85): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== 'string') {
        reject(new Error('تعذر قراءة الصورة'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDimension || h > maxDimension) {
          const ratio = Math.min(maxDimension / w, maxDimension / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر معالجة الصورة'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          url: canvas.toDataURL('image/jpeg', quality),
          w,
          h,
        });
      };
      img.onerror = () => reject(new Error('ملف صورة غير صالح'));
      img.src = src;
    };
    reader.onerror = () => reject(new Error('فشل تحميل الملف'));
    reader.readAsDataURL(file);
  });
}

export function rotateDataUrl(dataUrl: string, degrees: 90 | -90 = 90): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = h;
      canvas.height = w;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('تعذر تدوير الصورة'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2);
      resolve({
        url: canvas.toDataURL('image/jpeg', 0.88),
        w: canvas.width,
        h: canvas.height,
      });
    };
    img.onerror = () => reject(new Error('فشل تدوير الصورة'));
    img.src = dataUrl;
  });
}

export function stripFileExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').trim();
}
