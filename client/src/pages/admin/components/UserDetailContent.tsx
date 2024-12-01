import React from 'react';
import { Button, Descriptions, Image } from 'antd';
import { UserData } from '../../../services/questionnaire';
import commonStyles from '../common.module.css';

interface UserDetailContentProps {
  user: UserData;
}

export function UserDetailContent({ user }: UserDetailContentProps) {
  return (
    <div className={commonStyles.drawerContent}>
      {/* 基本信息部分 */}
      <section className={commonStyles.section}>
        <h3 className={commonStyles.sectionTitle}>基本信息</h3>
        <Descriptions column={2}>
          <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
          <Descriptions.Item label="性别">
            <span className={`${commonStyles.genderTag} ${user.gender === 'male' ? commonStyles.genderMale : commonStyles.genderFemale}`}>
              {user.gender === 'male' ? '男' : '女'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="手机">{user.phone}</Descriptions.Item>
          <Descriptions.Item label="微信">{user.wechat}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{user.birth_date}</Descriptions.Item>
          <Descriptions.Item label="星座">{user.zodiac}</Descriptions.Item>
          <Descriptions.Item label="MBTI">{user.mbti}</Descriptions.Item>
          <Descriptions.Item label="所在地">{user.location}</Descriptions.Item>
          <Descriptions.Item label="职业">{user.occupation}</Descriptions.Item>
          <Descriptions.Item label="性取向">
            {(() => {
              const config = {
                straight: { text: '异性恋', className: commonStyles.orientationStraight },
                gay: { text: '同性恋', className: commonStyles.orientationGay },
                bisexual: { text: '双性恋', className: commonStyles.orientationBisexual }
              };
              const orientationConfig = config[user.orientation as keyof typeof config];
              return (
                <span className={`${commonStyles.orientationTag} ${orientationConfig.className}`}>
                  {orientationConfig.text}
                </span>
              );
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {(() => {
              const statusConfig = {
                submitted: { className: commonStyles.statusSubmitted, text: '已提交' },
                reported: { className: commonStyles.statusReported, text: '已报告' },
                matched: { className: commonStyles.statusMatched, text: '已匹配' }
              };
              const config = statusConfig[user.status as keyof typeof statusConfig];
              return (
                <span className={`${commonStyles.statusTag} ${config.className}`}>
                  {config.text}
                </span>
              );
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="年龄">{user.age}岁</Descriptions.Item>
        </Descriptions>
      </section>

      {/* 自我介绍部分 */}
      <section className={commonStyles.section}>
        <h3 className={commonStyles.sectionTitle}>自我介绍</h3>
        <p>{user.self_intro}</p>
      </section>

      {/* 照片展示部分 */}
      <section className={commonStyles.section}>
        <h3 className={commonStyles.sectionTitle}>照片</h3>
        <div className={commonStyles.imageGrid}>
          {user.images.map((url, index) => (
            <Image
              key={index}
              src={url}
              width={120}
              height={120}
              style={{ objectFit: 'cover' }}
            />
          ))}
        </div>
      </section>
    </div>
  );
} 