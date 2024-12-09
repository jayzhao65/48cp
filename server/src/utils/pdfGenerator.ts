import puppeteer from 'puppeteer-core';
import path from 'path';
import { getReportTemplate } from './htmlTemplate';
import fs from 'fs';
import { marked } from 'marked';

export const generatePDFFromReport = async (reportContent: any, questionnaire: any) => {
  console.log('开始处理报告内容');

  let analysisContent;
  try {
    const textContent = reportContent.toString();
    
    // 查找 JSON 的实际开始和结束位置
    const startIndex = textContent.indexOf('{');
    const endIndex = textContent.lastIndexOf('}') + 1;
    
    if (startIndex === -1 || endIndex <= startIndex) {
      throw new Error('未找到有效的 JSON 数据');
    }
    
    // 只提取 JSON 部分
    const jsonStr = textContent.substring(startIndex, endIndex);
    const parsedContent = JSON.parse(jsonStr);
    
    // 验证并获取 analysis 数组
    if (!parsedContent.analysis || !Array.isArray(parsedContent.analysis)) {
      throw new Error('无效的报告格式：缺少 analysis 数组');
    }

    // 处理每个 section
    analysisContent = parsedContent.analysis.map((section: any) => {
      // 验证 section 格式
      if (!section.title || !section.content) {
        throw new Error('无效的 section 格式：缺少 title 或 content');
      }

      // 处理 content 中的 Markdown
      const contentWithMarkdown = marked(section.content, {
        breaks: true,
        gfm: true
      });

      return {
        title: section.title,
        content: contentWithMarkdown
      };
    });

    console.log('成功处理 Markdown 内容');
  } catch (error) {
    console.error('报告内容解析失败:', error);
    throw error;
  }

  try {
    // 准备模板数据
    const logoPath = path.join(__dirname, '../../assets/images/logo.png');
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

    const cssPath = path.join(__dirname, '../../assets/styles/report.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // 读取字体文件并转换为 Base64
    const fontPath = path.join(__dirname, '../../assets/fonts/Huiwen_mingchao.otf');
    const fontBase64 = fs.readFileSync(fontPath, { encoding: 'base64' });

    const templateData = {
      name: questionnaire.name,
      gender: questionnaire.gender === 'male' ? '男' : '女',
      birthDate: questionnaire.birth_date,
      location: questionnaire.location || '未填写',
      generateTime: new Date().toLocaleString('zh-CN'),
      sections: analysisContent,
      logoPath: `data:image/png;base64,${logoBase64}`,
      fontPath: `file://${path.join(__dirname, '../../assets/fonts/Huiwen_mingchao.otf').replace(/\\/g, '/')}`,
      cssContent: cssContent,
      fontBase64: `data:font/otf;base64,${fontBase64}`
    };

    const template = getReportTemplate();
    const html = template(templateData);
    
    // 使用 Puppeteer 生成 PDF
    const browser = await puppeteer.launch({
      headless: true,
      channel: 'chrome',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--allow-file-access-from-files',
        '--disable-web-security'
      ]
    });
    
    const page = await browser.newPage();
    await page.setBypassCSP(true);

    // 监听所有资源请求
    //page.on('request', request => console.log('Request:', request.url()));
    page.on('requestfailed', request => {
      console.log(`❌ 资源加载失败: ${request.url()}`);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 页面错误:', msg.text());
      }
    });
    
    // 设置视口大小
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    // 设置内容并等待加载
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });
    
    // 直接注入CSS内容
    await page.addStyleTag({
      content: cssContent
    });

    // 注入字体
    await page.addStyleTag({
      content: `
        @font-face {
          font-family: 'Huiwen_mingchao';
          src: url('${templateData.fontBase64}') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
      `
    });

    // 等待字体加载
    await page.evaluate(() => {
      document.fonts.ready.then(() => {
        console.log('Fonts have loaded!');
      });
    });

    // 给字体加载一些时间
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 检查实际渲染效果
    await page.screenshot({
      path: 'debug-screenshot.png',
      fullPage: true
    });

    // 生成 PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; padding: 0 15mm; width: 100%; text-align: center; color: #666;">
          <span>© Crush & Beyond - 让爱更有见地</span>
          <span style="margin-left: 20px;">第 <span class="pageNumber"></span> 页</span>
        </div>
      `
    });

    await browser.close();
    
    // 创建保存目录（如果不存在）
    const reportsDir = path.join(__dirname, '../../public/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // 生成文件名（使用时间戳和用户名）
    const timestamp = new Date().getTime();
    const fileName = `${questionnaire.name}_${timestamp}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // 保存 PDF 文件
    fs.writeFileSync(filePath, pdf);
    
    console.log('PDF generation completed and saved to:', filePath);
    
    // 返回文件信息
    return {
      buffer: pdf,           // 原始 buffer（如果其他地方需要）
      fileName: fileName,    // 文件名
      filePath: filePath    // 完整路径
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}; 