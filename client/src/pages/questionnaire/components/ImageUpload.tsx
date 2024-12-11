import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import styles from './ImageUpload.module.css';
import { uploadApi } from '../../../services/ImageUpload'; // 确保路径正确
import { compressImage } from '../../../utils/imageCompression';  // 添加导入

interface ImageUploadProps {
  value?: File[];
  onChange?: (files: File[], urls?: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export default function ImageUpload({ 
  value = [], 
  onChange, 
  maxFiles = 10,
  maxSize = 10
}: ImageUploadProps) {
  console.log('ImageUpload component rendered');
  
  // 使用单一状态来跟踪图片
  const [images, setImages] = useState<Array<{
    file: File;
    preview: string;
    url: string;
  }>>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFile = (file: File) => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`图片大小不能超过${maxSize}MB`);
      return false;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return false;
    }

    return true;
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > maxFiles) {
      setError(`最多只能上传${maxFiles}张图片`);
      return;
    }

    try {
      let updatedImages = [...images]; // 创建一个临时数组来收集所有新图片

      for (const file of files) {
        if (!validateFile(file)) {
          continue;
        }

        const { file: compressedFile } = await compressImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 2400,
          minQuality: 0.6,
          fileType: 'image/jpeg'
        });

        const result = await uploadApi.uploadImage(compressedFile);
        console.log('上传图片响应:', result);
        if (result && result.url) {
          const preview = URL.createObjectURL(compressedFile);
          const newImage = {
            file: compressedFile,
            preview,
            url: result.url
          };
          
          updatedImages = [...updatedImages, newImage]; // 添加新图片到临时数组
        }
      }
      
      // 循环结束后一次性更新所有状态
      setImages(updatedImages);
      const newFiles = updatedImages.map(img => img.file);
      const newUrls = updatedImages.map(img => img.url);
      onChange?.(newFiles, newUrls);
      
      setError('');
    } catch (error) {
      console.error('Upload error:', error);
      setError('上传失败，请重试');
    }
    
    // 清除 input 值，确保可以重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 修改点击处理函数
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();  // 阻止默认行为
    e.stopPropagation();  // 阻止事件冒泡
    console.log('Upload button clicked');
    fileInputRef.current?.click();
  };

  // 修改删除处理函数
  const handleDelete = async (index: number, e: React.MouseEvent) => {
    e.preventDefault();  // 阻止默认行为
    e.stopPropagation();  // 阻止事件冒泡
    try {
      const imageToDelete = images[index];
      if (imageToDelete) {
        // 调用删除 API
        await uploadApi.deleteImage(imageToDelete.url);
        
        // 释放预览 URL
        URL.revokeObjectURL(imageToDelete.preview);
        
        // 更新状态
        setImages(prev => prev.filter((_, i) => i !== index));
        
        // 更新父组件状态
        const newImages = images.filter((_, i) => i !== index);
        const newFiles = newImages.map(img => img.file);
        const newUrls = newImages.map(img => img.url);
        onChange?.(newFiles, newUrls);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('删除失败，请重试');
    }
  };

  // 组件卸载时清理预览 URL
  useEffect(() => {
    return () => {
      images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  return (
    <div className={styles.container} onClick={e => e.stopPropagation()}>
      <input
        type="file"
        ref={fileInputRef}
        className={styles.fileInput}
        accept="image/*"
        multiple
        onChange={handleFileSelect}
      />
      
      {images.length === 0 ? (
        <div className={styles.uploadArea} onClick={(e) => handleClick(e)}>
          <Upload className={styles.uploadIcon} />
          <div className={styles.uploadText}>
            <p>点击或拖拽上传图片</p>
            <p className={styles.uploadHint}>
              支持jpg/png格式，每张大小不超过{maxSize}MB
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.previewArea}>
            {images.map((image, index) => (
              <div key={image.url} className={styles.previewItem}>
                <img src={image.preview} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={(e) => handleDelete(index, e)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {images.length < maxFiles && (
            <button 
              type="button"
              className={styles.uploadMoreButton} 
              onClick={(e) => handleClick(e)}
            >
              <ImageIcon size={14} />
              <span>上传更多图片</span>
            </button>
          )}
        </>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
