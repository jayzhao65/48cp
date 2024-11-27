import React, { useState } from 'react';
import { Users } from 'lucide-react';
import styles from './index.module.css';
import ImageUpload from './components/ImageUpload';
import SuccessModal from './components/SuccessModal';
import { questionnaireApi, QuestionnaireData } from '../../services/questionnaire';
import { uploadApi } from '../../services/ImageUpload';


interface FormData {
  name: string;
  phone: string;
  wechat: string;
  birth_date: string;
  zodiac: string;
  mbti: string;
  location: string;
  gender: 'male' | 'female' | '';
  orientation: 'straight' | 'gay' | 'bisexual' | '';
  occupation: string;
  self_intro: string;
  images: File[];
}

interface FormErrors {
  [key: string]: string;
}

export default function QuestionnairePage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    wechat: '',
    birth_date: '',
    zodiac: '',
    mbti: '',
    location: '',
    gender: '',
    orientation: '',
    occupation: '',
    self_intro: '',
    images: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);



  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value) return '请输入姓名';
        if (value.length < 2 || value.length > 20) return '姓名长度必须在2-20个字符之间';
        break;
      case 'phone':
        if (!value) return '请输入手机号';
        if (!/^1[3-9]\d{9}$/.test(value)) return '请输入正确的手机号格式';
        break;
      case 'wechat':
        if (!value) return '请输入微信号';
        if (value.length < 6 || value.length > 20) return '微信号长度必须在6-20个字符之间';
        break;
      case 'birth_date':
        if (!value) return '请选择出生日期';
        if (new Date(value) > new Date()) return '出生日期不能是将来时间';
        if (new Date(value) > new Date('2006-12-31')) return '此活动仅对18岁以上开放';
        break;
      case 'zodiac':
        if (!value) return '请选择星座';
        if (!['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', 
             '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'].includes(value)) {
          return '请选择有效的星座';
        }
        break;
      case 'mbti':
        if (!value) return '请输入MBTI类型';
        if (!/^[IiEe][NnSs][FfTt][JjPp]$/.test(value)) return '请输入正确的MBTI格式';
        break;
      case 'location':
        if (!value) return '请输入所在地';
        if (value.length < 2 || value.length > 50) return '所在地长度必须在2-50个字符之间';
        break;
      case 'gender':
        if (!value) return '请选择性别';
        break;
      case 'orientation':
        if (!value) return '请选择性取向';
        break;
      case 'occupation':
        if (!value) return '请输入职业/专业';
        if (value.length < 2 || value.length > 50) return '职业/专业长度必须在2-50个字符之间';
        break;
      case 'self_intro':
        if (!value) return '请输入自我介绍';
        if (value.length < 20 || value.length > 1000) return '自我介绍长度必须在20-1000个字符之间';
        break;
      case 'images':
        if (!value.length) return '请至少上传一张图片';
        if (value.length > 10) return '最多只能上传10张图片';
        const invalidFormat = value.some((file: File) => 
          !['image/jpeg', 'image/png'].includes(file.type)
        );
        if (invalidFormat) return '只支持 JPG/PNG 格式的图片';
        break;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    try {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);


      // 验证所有字段
      const newErrors: FormErrors = {};
      Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key as keyof FormData]);
        if (error) newErrors[key] = error;
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      // 应该先验证图片是否上传成功
      const uploadResult = await uploadApi.uploadImages(formData.images);
      if (!uploadResult || !uploadResult.length) {
        throw new Error('图片上传失败');
      }
      
      const submitData: QuestionnaireData = {
        name: formData.name,
        phone: formData.phone,
        wechat: formData.wechat,
        birth_date: formData.birth_date,
        zodiac: formData.zodiac, // 注意字段名转换
        mbti: formData.mbti.toUpperCase(),
        location: formData.location,
        gender: formData.gender as 'male' | 'female',
        orientation: formData.orientation as 'straight' | 'gay' | 'bisexual',
        occupation: formData.occupation,
        self_intro: formData.self_intro,
        images: uploadResult.map(result => result.url)
      };
      const result = await questionnaireApi.submit(submitData);
      if (!result.success) {
        throw new Error(result.error);
      }
      setIsSuccessModalOpen(true); // 提交成功后显示弹窗
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交失败，请重试';
      setSubmitError(errorMessage);
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>48CP</h1>
            <h2 className={styles.title}>MATCHING 2024</h2>
          </div>
          <Users className="w-24 h-24 text-gray-800" />
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>姓名</label>
            <input
              type="text"
              name="name"
              className={styles.input}
              value={formData.name}
              onChange={handleChange}
              placeholder="请输入你的名字"
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>手机号码</label>
            <input
              type="tel"
              name="phone"
              className={styles.input}
              value={formData.phone}
              onChange={handleChange}
              placeholder="请输入手机号"
            />
            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>微信号</label>
            <input
              type="text"
              name="wechat"
              className={styles.input}
              value={formData.wechat}
              onChange={handleChange}
              placeholder="请输入微信号"
            />
            {errors.wechat && <span className={styles.error}>{errors.wechat}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>出生日期</label>
            <input
              type="date"
              name="birth_date"
              className={styles.input}
              value={formData.birth_date}
              onChange={handleChange}
            />
            {errors.birth_date && <span className={styles.error}>{errors.birth_date}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>星座</label>
            <select
              name="zodiac"
              className={styles.input}
              value={formData.zodiac || ''}
              onChange={handleChange}
            >
              <option value="">���选择星座</option>
              {[
                '白羊座', '金牛座', '双子座', '巨蟹座',
                '狮子座', '处女座', '天秤座', '天蝎座',
                '射手座', '摩羯座', '水瓶座', '双鱼座'
              ].map(zodiac => (
                <option key={zodiac} value={zodiac}>
                  {zodiac}
                </option>
              ))}
            </select>
            {errors.zodiac && <span className={styles.error}>{errors.zodiac}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>MBTI类型</label>
            <input
              type="text"
              name="mbti"
              className={styles.input}
              value={formData.mbti}
              onChange={handleChange}
              placeholder="例如：INFP"
            />
            {errors.mbti && <span className={styles.error}>{errors.mbti}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>所在地</label>
            <input
              type="text"
              name="location"
              className={styles.input}
              value={formData.location}
              onChange={handleChange}
              placeholder="请输入所在地"
            />
            {errors.location && <span className={styles.error}>{errors.location}</span>}
          </div>

          {/* 性别选项 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>性别</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <div className={styles.radioButton}>男性</div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <div className={styles.radioButton}>女性</div>
              </label>
            </div>
            {errors.gender && <span className={styles.error}>{errors.gender}</span>}
          </div>

          {/* 性取向选项 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>性取向</label>
            <div className={styles.radioGroup}>
              {[
                { value: 'straight', label: '异性恋' },
                { value: 'gay', label: '同性恋' },
                { value: 'bisexual', label: '双性恋' }
              ].map(option => (
                <label key={option.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="orientation"
                    value={option.value}
                    checked={formData.orientation === option.value}
                    onChange={handleChange}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioButton}>{option.label}</div>
                </label>
              ))}
            </div>
            {errors.orientation && <span className={styles.error}>{errors.orientation}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>职业/专业</label>
            <input
              type="text"
              name="occupation"
              className={styles.input}
              value={formData.occupation}
              onChange={handleChange}
              placeholder="请输入你的职业或专业"
            />
            {errors.occupation && <span className={styles.error}>{errors.occupation}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>自我介绍</label>
            <textarea
              name="self_intro"
              className={styles.textarea}
              value={formData.self_intro}
              onChange={handleChange}
              placeholder="请分享三件你喜欢的和三件不喜欢的事..."
            />
            {errors.self_intro && <span className={styles.error}>{errors.self_intro}</span>}
          </div>

          {/* TODO: Add ImageUpload component */}
          <div className={styles.formGroup}>
            <label className={styles.label}>社交媒体截图</label>
            <ImageUpload
              value={formData.images}
              onChange={(files) => setFormData(prev => ({ ...prev, images: files }))}
              maxFiles={10}
              maxSize={10}
            />
            {errors.images && <span className={styles.error}>{errors.images}</span>}
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交问卷'}
          </button>
          <SuccessModal 
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
          />
        </form>
      </div>
    </div>
  );
}