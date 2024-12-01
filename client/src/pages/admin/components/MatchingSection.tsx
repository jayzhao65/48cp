import React from 'react';
import { Button, Empty } from 'antd';
import { UserData } from '../../../services/questionnaire';  // 导入 UserData 类型
import styles from '../matching.module.css';
import commonStyles from '../common.module.css';

interface MatchingSectionProps {
  currentUser: UserData;
  allUsers: UserData[];
  onViewDetails: (user: UserData) => void;
  onMatch: (targetUserId: string) => void;
}

export function MatchingSection({ 
  currentUser, 
  allUsers, 
  onViewDetails, 
  onMatch 
}: MatchingSectionProps) {
  // 获取符合条件的用户
  const getMatchableUsers = () => {
    return allUsers.filter(user => {
      // 基本条件：不能是自己且未被匹配
      const basicCondition = user._id !== currentUser._id && !user.matched_with;
      
      // 根据性取向判断性别匹配条件
      let genderMatch = false;
      
      switch(currentUser.orientation) {
        case 'straight':
          // 异性恋：只匹配异性且对方也是异性恋
          genderMatch = user.gender !== currentUser.gender && user.orientation === 'straight';
          break;
        case 'gay':
          // 同性恋：只匹配同性且对方也是同性恋
          genderMatch = user.gender === currentUser.gender && user.orientation === 'gay';
          break;
        case 'bisexual':
          // 双性恋：可以匹配异性恋的异性或同性恋的同性
          genderMatch = (user.gender !== currentUser.gender && user.orientation === 'straight') || 
                      (user.gender === currentUser.gender && user.orientation === 'gay');
          break;
      }
      
      return basicCondition && genderMatch;
    });
  };

  const matchableUsers = getMatchableUsers();

  return (
    <section className={commonStyles.section}>
      <div className={commonStyles.sectionHeader}>
        <h3 className={commonStyles.sectionTitle}>匹配 CP</h3>
        <p className={styles.matchingRule}>
          当前匹配规则：异性恋只能匹配异性恋异性，同性恋只能匹配同性恋同性，双性恋可匹配异性恋异性或同性恋同性
        </p>
      </div>

      {matchableUsers.length > 0 ? (
        <div className={styles.matchingGrid}>
          {matchableUsers.map(user => (
            <div key={user._id} className={styles.userCard}>
              <div className={styles.cardHeader}>
                <span className={styles.userName}>{user.name} · {user.age}岁</span>
                <span className={styles.location}>{user.location}</span>
              </div>
              
              <div className={styles.userInfo}>
                <div>{user.mbti} · {user.zodiac}</div>
                <div className={styles.intro}>{user.self_intro}</div>
              </div>

              <div className={styles.cardActions}>
                <Button onClick={() => onViewDetails(user)}>
                  查看详情
                </Button>
                <Button type="primary" onClick={() => onMatch(user._id)}>
                  选择匹配
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty description="暂无符合条件的用户" />
      )}
    </section>
  );
} 