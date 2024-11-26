import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './SuccessModal.module.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleConfirm = () => {
    onClose();
    navigate('/questionnaire/success');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={24} />
        </button>

        <div className={styles.content}>
          <CheckCircle className={styles.icon} size={48} />
          <h2 className={styles.title}>提交成功！</h2>
          <p className={styles.message}>
            感谢你的参与！我们会在48小时内审核你的信息。
          </p>
          <p className={styles.submessage}>
            请保持手机畅通，我们会通过微信或电话与你联系。
          </p>
        </div>

        <button onClick={handleConfirm} className={styles.confirmButton}>
          我知道了
        </button>
      </div>
    </div>
  );
}