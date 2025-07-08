interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // アスペクト比を保持してリサイズ
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);

      // 最適化された画像を生成
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          // ファイル名を生成
          const extension = format === 'jpeg' ? 'jpg' : format;
          const fileName = file.name.replace(/\.[^/.]+$/, '') + `_optimized.${extension}`;

          // 新しいFileオブジェクトを作成
          const optimizedFile = new File([blob], fileName, {
            type: `image/${format}`,
            lastModified: Date.now(),
          });

          resolve(optimizedFile);
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export async function compressImage(
  file: File,
  targetSizeKB: number = 500
): Promise<File> {
  let quality = 0.8;
  let optimizedFile = await optimizeImage(file, { quality });

  // 目標サイズに達するまで品質を下げる
  while (optimizedFile.size > targetSizeKB * 1024 && quality > 0.1) {
    quality -= 0.1;
    optimizedFile = await optimizeImage(file, { quality });
  }

  return optimizedFile;
}

export function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  sizeKB: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        sizeKB: file.size / 1024,
        aspectRatio: img.width / img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 