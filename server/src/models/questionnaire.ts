import mongoose, { Schema, Document } from 'mongoose';

// 定义问卷状态枚举
export enum QuestionnaireStatus {
    SUBMITTED = 'submitted',    // 已提交
    REPORTED = 'reported',      // 已生成报告
    MATCHED = 'matched'         // 已匹配
  }

// 定义星座枚举
const ZodiacEnum = [
  '白羊座', '金牛座', '双子座', '巨蟹座', 
  '狮子座', '处女座', '天秤座', '天蝎座', 
  '射手座', '摩羯座', '水瓶座', '双鱼座'
] as const;

// 年龄计算函数
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export interface IQuestionnaire extends Document {
  name: string;
  phone: string;
  wechat: string;
  birth_date: string;
  zodiac: string;
  mbti: string;
  location: string;
  gender: 'male' | 'female';
  orientation: 'straight' | 'gay' | 'bisexual';
  occupation: string;
  self_intro: string;
  images: string[];
  status: QuestionnaireStatus;
  personality_report?: {
    content?: {
      raw_response?: string;
    };
    generated_at: Date;
    generation_count: number;
  };
  matched_with?: Schema.Types.ObjectId | null;
  matched_at?: Date | null;
  age?: number;
}

const questionnaireSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  wechat: { type: String, required: true },
  birth_date: { type: String, required: true },
  zodiac: { 
    type: String, 
    enum: ZodiacEnum,
    required: true 
  },
  mbti: { type: String, required: true },
  location: { type: String, required: true },
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true 
  },
  orientation: { 
    type: String, 
    enum: ['straight', 'gay', 'bisexual'], 
    required: true 
  },
  occupation: { type: String, required: true },
  self_intro: { type: String, required: true },
  images: [{ type: String, required: true }],
  status: {
    type: String,
    enum: Object.values(QuestionnaireStatus),
    default: QuestionnaireStatus.SUBMITTED
  },
  personality_report: {
    content: { type: Object },
    generated_at: { type: Date },
    generation_count: { type: Number, default: 0 }
  },
  matched_with: {
    type: Schema.Types.ObjectId,
    ref: 'Questionnaire',
    default: null
  },
  matched_at: {
    type: Date,
    default: null
  },
  age: { type: Number }
}, {
  timestamps: true
});

// 只在创建和更新时计算年龄
questionnaireSchema.pre('save', function(next) {
  if (this.birth_date) {
    this.age = calculateAge(this.birth_date);
  }
  next();
});

export const Questionnaire = mongoose.model<IQuestionnaire>('Questionnaire', questionnaireSchema);