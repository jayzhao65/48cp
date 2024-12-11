import { CheckCircle } from 'lucide-react';
import styles from './success.module.css';

export default function SuccessPage() {
  // 关闭当前页面的函数
  const handleClose = () => {
    window.close();
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <CheckCircle className={styles.icon} size={48} />
        <h2 className={styles.title}>提交成功！</h2>
        <p className={styles.message}>
          感谢你的参与！我们会在48小时内审核你的信息。
        </p>
        <p className={styles.submessage}>
          请保持手机畅通，我们会通过微信或电话与你联系。
        </p>
        <button onClick={handleClose} className={styles.confirmButton}>
          我知道了
        </button>
      </div>
    </div>
  );
}