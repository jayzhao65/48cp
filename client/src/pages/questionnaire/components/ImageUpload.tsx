import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export default function ImageUpload({ 
  value = [], 
  onChange, 
  maxFiles = 10,
  maxSize = 10 
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
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
    
    // 检查文件数量
    if (value.length + files.length > maxFiles) {
      setError(`最多只能上传${maxFiles}张图片`);
      return;
    }

    // 验证每个文件
    const validFiles = files.filter(validateFile);
    if (validFiles.length !== files.length) {
      return;
    }

    // 创建预览URL
    const newPreviews = await Promise.all(
      validFiles.map(file => URL.createObjectURL(file))
    );

    setPreviews(prev => [...prev, ...newPreviews]);
    onChange?.([...value, ...validFiles]);
    setError('');
  };

  // 处理图片删除
  const handleDelete = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = value.filter((_, i) => i !== index);
    
    // 释放不再使用的预览URL
    URL.revokeObjectURL(previews[index]);
    
    setPreviews(newPreviews);
    onChange?.(newFiles);
  };

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      {/* 上传按钮 */}
      <input
        type="file"
        ref={fileInputRef}
        className={styles.fileInput}
        accept="image/*"
        multiple
        onChange={handleFileSelect}
      />
      
      <div className={styles.uploadArea} onClick={handleClick}>
        <Upload className={styles.uploadIcon} />
        <div className={styles.uploadText}>
          <p>点击或拖拽上传图片</p>
          <p className={styles.uploadHint}>
            支持jpg/png格式，每张大小不超过{maxSize}MB
          </p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && <div className={styles.error}>{error}</div>}

      {/* 图片预览区域 */}
      <div className={styles.previewArea}>
        {previews.map((preview, index) => (
          <div key={preview} className={styles.previewItem}>
            <img src={preview} alt={`Preview ${index + 1}`} />
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => handleDelete(index)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}