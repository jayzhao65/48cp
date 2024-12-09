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
