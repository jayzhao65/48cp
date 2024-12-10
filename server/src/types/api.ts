export interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface AxiosResponse<T = any> {
  data: T;
}

export interface AnthropicResponse {
  content: {
    text: string;
  }[];
}

// 用户信息接口
export interface UserInfo {
  name: string;
  gender: string;
  birth_date: string;
  zodiac: string;
  mbti: string;
  occupation: string;
  self_intro: string;
  images: string[];  // base64 格式的图片数组
}

// Coze API 响应接口
export interface CozeResponse {
  id: string;
  conversation_id: string;
  created_at: number;
  role: string;
  type: string;
  content: {
    type: string;
    text: string;
  }[];
  status: string;
}

interface CozeRetrieveResponse {
  code: number;
  data: {
    bot_id: string;
    completed_at: number;
    conversation_id: string;
    created_at: number;
    id: string;
    status: string;
    usage: {
      input_count: number;
      output_count: number;
      token_count: number;
    }
  };
  msg: string;
}

interface PDFReport {
  url: string;
  generated_at: string;
}

interface PersonalityReport {
  content?: {
    raw_response?: string;
  };
  generated_at: string;
  generation_count: number;
  pdf_reports?: PDFReport[];
  pdf_path?: string;
}
