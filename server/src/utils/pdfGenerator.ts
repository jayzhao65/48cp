import puppeteer from 'puppeteer-core';
import path from 'path';
import { getReportTemplate, formatReportData } from './htmlTemplate';
import fs from 'fs';
import { marked } from 'marked';

export const generatePDFFromReport = async (reportContent: string, questionnaire: any) => {
  console.log('开始处理报告内容');

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
    
    // 将报告内容转换为 markdown 格式
    const markdownContent = reportSections.map((section: { title: string; content: string }) => {
      return `## ${section.title}\n\n${section.content}`;
    }).join('\n\n');
    
    // 使用 marked 将 markdown 转换为 HTML
    const htmlContent = await marked(markdownContent);
    
    // 准备模板数据
    const templateData = formatReportData(htmlContent, questionnaire);
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
      content: templateData.cssContent
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
      });
    });

    // 给字体加载一些时间
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 检查实际渲染效果
    await page.screenshot({
      path: 'debug-screenshot.png',
      fullPage: true
    });

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

    console.log('Styles:', styles);

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

    await browser.close();
    
    // 直接返回 buffer，删除保存文件的代码
    return {
      buffer: pdf,
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}; 