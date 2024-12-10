import React, { useState } from 'react';
import { Button, Space, Modal } from 'antd';
import { UserData } from '../../../services/questionnaire';
import commonStyles from '../common.module.css';

interface PersonalityReportProps {
  user: UserData;
  onGenerate: () => void;
  onGeneratePDF: () => void;
  loading: boolean;
  pdfLoading: boolean;
}

export const PersonalityReport: React.FC<PersonalityReportProps> = ({ 
  user, 
  onGenerate, 
  onGeneratePDF,
  loading,
  pdfLoading 
}) => {
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  const handleRegenerateClick = () => {
    if (user.personality_report?.content?.raw_response) {
      setIsConfirmModalVisible(true);
    } else {
      onGenerate();
    }
  };

  return (
    <section className={commonStyles.section}>
      <div className={commonStyles.sectionHeader}>
        <h3 className={commonStyles.sectionTitle}>性格报告</h3>
        <Space>
          <Button 
            type="primary" 
            onClick={handleRegenerateClick}
            loading={loading}
          >
            {user.personality_report?.content?.raw_response ? '重新生成报告' : '生成报告'}
          </Button>
          <Button 
            type="primary" 
            onClick={onGeneratePDF} 
            loading={pdfLoading}
            disabled={!user.personality_report?.content?.raw_response}
          >
            生成 PDF 报告
          </Button>
        </Space>
      </div>

      <Modal
        title="重新生成报告"
        open={isConfirmModalVisible}
        onOk={() => {
          setIsConfirmModalVisible(false);
          onGenerate();
        }}
        onCancel={() => setIsConfirmModalVisible(false)}
        okText="确认重新生成"
        cancelText="取消"
      >
        <p>重新生成报告将会：</p>
        <ul>
          <li>覆盖现有的报告内容</li>
          <li>删除已生成的 PDF 文件</li>
          <li>需要重新生成 PDF 文件</li>
        </ul>
        <p>确定要继续吗？</p>
      </Modal>

      {user.personality_report?.content?.raw_response && (
        <div className={commonStyles.reportSection}>
          <div className={commonStyles.reportMeta}>
            <span>生成时间：{new Date(user.personality_report.generated_at).toLocaleString()}</span>
            <span>生成次数：{user.personality_report.generation_count}</span>
          </div>
          <div className={commonStyles.reportContent}>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {user.personality_report.content.raw_response}
            </div>
          </div>
          
          {/* 修改 PDF 链接区域 */}
          {user.personality_report?.pdf_reports && user.personality_report.pdf_reports.length > 0 && (
            <div className={commonStyles.pdfSection}>
              <h4>PDF 报告列表</h4>
              <div className={commonStyles.pdfList}>
                {user.personality_report.pdf_reports.map((report, index) => (
                  <div key={index} className={commonStyles.pdfItem}>
                    <a 
                      href={report.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {new Date(report.generated_at).toLocaleString()}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}; 