import puppeteer from 'puppeteer-core';
import path from 'path';
import { getReportTemplate, formatReportData } from './htmlTemplate';
import fs from 'fs';
import { marked } from 'marked';
const templatePath = path.join(__dirname, '../../templates/report.html');

const getChromeExecutablePath = () => {
  // 开发环境 Mac
  if (process.env.NODE_ENV === 'development') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  
  // 生产环境 Linux
  return process.env.CHROME_PATH || '/usr/bin/google-chrome';
};

export const generatePDFFromReport = async (reportContent: string, questionnaire: any) => {
  console.log('开始处理报告内容');
  let browser;
  try {
    // 新增：提取JSON内容的函数
    const extractJSON = (str: string) => {
      try {
        const matches = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return matches ? matches[0] : str;
      } catch (error) {
        return str;
      }
    };
    // 在JSON.parse之前先提取JSON内容
    const jsonContent = extractJSON(reportContent);
    const reportSections = JSON.parse(jsonContent);
    
    console.log('开始转换为 Markdown');
    const markdownContent = reportSections.map((section: { title: string; content: string }) => {
      return `## ${section.title}\n\n${section.content}`;
    }).join('\n\n');

    console.log('开始转换为 HTML');
    const htmlContent = await marked(markdownContent);
    
    // 准备模板数据
    const templateData = formatReportData(htmlContent, questionnaire);
    const template = getReportTemplate();
    const html = template(templateData);
    
    // 使用 Puppeteer 生成 PDF
    console.log('Chrome 路径:', getChromeExecutablePath());
    
    console.log('启动 Puppeteer 浏览器');
    browser = await puppeteer.launch({
      headless: true,
      channel: 'chrome',
      executablePath: getChromeExecutablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--allow-file-access-from-files',
        '--disable-web-security'
      ]
    });

    try {
      console.log('浏览器启动成功');
      
      const page = await browser.newPage();
      console.log('新页面已创建');

      
      // 设置视口大小
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });

      console.log('设置页面内容');
      await page.setContent(html, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 90000
      });
      
      console.log('注入 CSS 和字体');
      await page.addStyleTag({
        content: templateData.cssContent
      });

      // 注入字体
      console.log('字体文件路径:', templateData.fontBase64);  // 检查字体路径

      // 在注入字体之前添加日志
      console.log('准备注入字体样式');
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

      // 添加字体加载状态检查
      await page.evaluate(() => {
        console.log('开始检查字体加载状态');
        return document.fonts.ready.then(() => {
          const fonts = document.fonts;
          console.log('已加载的字体:', Array.from(fonts.values()).map(f => f.family));
          console.log('字体加载状态:', fonts.status);
          return fonts.status;
        });
      });

      console.log('等待字体加载');
      await page.evaluate(() => {
        document.fonts.ready.then(() => {
        });
      });

      // 给字体加载一些时间
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 在生成 PDF 之前添加调试代码（在 page.pdf 之前）
      const styles = await page.evaluate(() => {
        const bodyStyles = window.getComputedStyle(document.body);
        const sectionContent = document.querySelector('.section-content');
        const sectionStyles = sectionContent ? window.getComputedStyle(sectionContent) : null;

        return {
          body: {
            margin: bodyStyles.margin,
            padding: bodyStyles.padding,
            fontSize: bodyStyles.fontSize,
            background: bodyStyles.background
          },
          sectionContent: sectionStyles ? {
            width: sectionStyles.width,
            margin: sectionStyles.margin,
            padding: sectionStyles.padding,
            fontSize: sectionStyles.fontSize,
            textAlign: sectionStyles.textAlign,
            lineHeight: sectionStyles.lineHeight
          } : null,
          printMediaQuery: window.matchMedia('print').matches
        };
      });

      // 生成 PDF
      await page.emulateMediaType('print');
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm'
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

      console.log('PDF 生成成功');
      return {
        buffer: pdf,
      };
    } catch (error) {
      console.error('Error during PDF generation:', error);
      throw error;
    } finally {
      if (browser) {
        console.log('正在关闭浏览器实例');
        await browser.close();
        console.log('浏览器实例已关闭');
      }
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}; 