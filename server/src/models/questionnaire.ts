import mongoose from 'mongoose';

// 定义星座枚举
const ZodiacEnum = [
  '白羊座', '金牛座', '双子座', '巨蟹座', 
  '狮子座', '处女座', '天秤座', '天蝎座', 
  '射手座', '摩羯座', '水瓶座', '双鱼座'
] as const;

const questionnaireSchema = new mongoose.Schema({
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
}, {
  timestamps: true
});

export const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema);