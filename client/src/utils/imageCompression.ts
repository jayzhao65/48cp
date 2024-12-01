interface CompressOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  minQuality: number;
  fileType?: string;
}

interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions?: {
    width: number;
    height: number;
  };
  quality: number;
}

export const compressImage = async (
  file: File,
  options: CompressOptions = {
    maxSizeMB: 0.5,         // 压缩到 500KB
    maxWidthOrHeight: 2400,  // 适应长图
    minQuality: 0.6,
    fileType: 'image/jpeg'
  }
): Promise<{ file: File; compressionInfo: CompressionInfo }> => {
  // 验证文件大小
  if (file.size > 10 * 1024 * 1024) { // 10MB
    throw new Error('图片大小不能超过10MB');
  }

  // 如果原图小于500KB，直接返回
  if (file.size <= options.maxSizeMB * 1024 * 1024) {
    return {
      file,
      compressionInfo: {
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        quality: 1
      }
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 处理长图，保持宽高比
        const aspectRatio = width / height;
        if (aspectRatio < 0.3 || aspectRatio > 3) {
          // 对于长图，允许更大的边长
          const maxDimension = 3600;
          if (width > height) {
            width = maxDimension;
            height = width / aspectRatio;
          } else {
            height = maxDimension;
            width = height * aspectRatio;
          }
        } else {
          // 普通图片使用标准限制
          const scale = Math.min(
            1,
            options.maxWidthOrHeight / Math.max(width, height)
          );
          width *= scale;
          height *= scale;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const compressRecursively = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('压缩失败'));
                return;
              }

              if (blob.size > options.maxSizeMB * 1024 * 1024 && quality > options.minQuality) {
                quality -= 0.1;
                compressRecursively();
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: options.fileType,
                lastModified: Date.now()
              });

              resolve({
                file: compressedFile,
                compressionInfo: {
                  originalSize: file.size,
                  compressedSize: compressedFile.size,
                  compressionRatio: +(file.size / compressedFile.size).toFixed(2),
                  dimensions: { width, height },
                  quality
                }
              });
            },
            options.fileType,
            quality
          );
        };

        compressRecursively();
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}; 