import mongoose, { Schema, Document } from 'mongoose';

export interface ICouple extends Document {
  coupleId: number;  // CP编号，自增
  user1: Schema.Types.ObjectId;  // 关联到第一个用户
  user2: Schema.Types.ObjectId;  // 关联到第二个用户
  matchedAt: Date;  // 匹配时间
  task: {
    content: any;  // JSON格式的任务内容
    generatedAt: Date;  // 任务生成时间
    generationCount: number;  // 生成次数
  };
  createdAt: Date;
  updatedAt: Date;
}

const CoupleSchema = new Schema({
  coupleId: {
    type: Number,
    required: true,
    unique: true,
    default: 1
  },
  user1: {
    type: Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: true
  },
  user2: {
    type: Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: true
  },
  matchedAt: {
    type: Date,
    required: true
  },
  task: {
    content: Schema.Types.Mixed,
    generatedAt: Date,
    generationCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// 添加自增 coupleId 的中间件
CoupleSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const lastCouple = await Couple.findOne().sort({ coupleId: -1 });
      this.coupleId = lastCouple ? lastCouple.coupleId + 1 : 1;
      console.log('生成的新 coupleId:', this.coupleId);
    }
    next();
  } catch (error:any) {
    console.error('生成 coupleId 失败:', error);
    next(error);
  }
});

export const Couple = mongoose.model<ICouple>('Couple', CoupleSchema);
