import styles from './success.module.css';

export default function SuccessPage() {
  return (
    <div className={styles.container}>
      <img 
        src="/success-image.jpg" 
        alt="Success" 
        className={styles.image}
      />
    </div>
  );
}