import React from 'react';
import { Button } from 'antd';
import { UserData } from '../../../services/questionnaire';
import commonStyles from '../common.module.css';

interface PersonalityReportProps {
  user: UserData;
  onGenerate: () => void;
  loading: boolean;
}

export function PersonalityReport({ user, onGenerate, loading }: PersonalityReportProps) {
  return (
    <section className={commonStyles.section}>
      <div className={commonStyles.sectionHeader}>
        <h3 className={commonStyles.sectionTitle}>性格报告</h3>
        <Button
          type="primary"
          onClick={onGenerate}
          loading={loading}
          disabled={loading}
        >
          {user.personality_report?.content?.raw_response ? '重新生成报告' : '生成报告'}
        </Button>
      </div>

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
        </div>
      )}
    </section>
  );
} 