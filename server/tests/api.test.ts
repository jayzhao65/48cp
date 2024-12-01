import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// 测试提交问卷
async function testSubmitQuestionnaire() {
  try {
    // 准备测试数据
    const testData = {
      name: "测试用户",
      phone: "13800138000",
      wechat: "test123",
      birth_date: "1990-01",
      zodiac: "白羊座",
      mbti: "INFP",
      location: "北京",
      gender: "male",
      orientation: "straight",
      occupation: "工程师",
      self_intro: "这是一个测试自我介绍，长度需要超过20个字符才能通过验证。",
      images: ["http://example.com/test.jpg"]
    };

    console.log('开始测试提交问卷...');
    console.log('发送数据:', testData);

    const response = await axios.post(`${API_URL}/questionnaire`, testData);
    
    console.log('提交问卷测试结果:', response.data.success ? '通过' : '失败');
    console.log('服务器响应:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('提交问卷测试失败:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
}

// 运行测试
async function runTests() {
  console.log('=== 开始API测试 ===');
  
  try {
    await testSubmitQuestionnaire();
    console.log('所有测试完成');
  } catch (error) {
    console.error('测试过程出错:', error);
  }
}

// 执行测试
runTests();