import { generatePDF } from './utils/pdfGenerator';

const testData = {
  "analysis": [
    {
      "title": "情感画像 (Emotional Portrait)",
      "content": "这是一段测试内容\n包含多行文本\n用来测试PDF生成功能"
    },
    {
      "title": "关系需求 (Relationship Needs)",
      "content": "这是第二部分的测试内容\n测试换行和格式"
    },
    {
      "title": "情感密码 (Emotional Code)",
      "content": "这是最后一部分的测试内容\n测试中文显示"
    }
  ]
};

async function testPDFGeneration() {
  try {
    const pdfFilename = await generatePDF(JSON.stringify(testData), 'test-user-123');
    console.log('PDF generated successfully:', pdfFilename);
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
}

testPDFGeneration(); 