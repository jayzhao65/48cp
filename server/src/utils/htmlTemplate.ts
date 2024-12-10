import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export const getReportTemplate = () => {
    const templatePath = path.join(__dirname, '../templates/report.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    
    // 注册 Handlebars 助手函数
    Handlebars.registerHelper('formatDate', function(date: string) {
        return new Date(date).toLocaleDateString('zh-CN');
    });

    return Handlebars.compile(template);
};

export const formatReportData = (reportContent: string, questionnaire: any) => {
    // 读取资源文件（保持不变）
    const logoPath = path.join(__dirname, '../../assets/images/logo.png');
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

    // 读取 CSS 文件并添加调试日志
    const cssPath = path.join(__dirname, '../../assets/styles/report.css');
    console.log('CSS 文件路径:', cssPath);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    console.log('CSS 内容长度:', cssContent.length);
    console.log('CSS 内容前100个字符:', cssContent.substring(0, 100));

    // 读取字体文件
    const fontPath = path.join(__dirname, '../../assets/fonts/Huiwen_mingchao.otf');
    const fontBase64 = fs.readFileSync(fontPath, { encoding: 'base64' });

    // 添加背景纹理
    const textureBase64 = generateTextureBase64();

    // 添加背景模式
    const backgroundPattern = generateBackgroundPattern();

    // 直接使用传入的 reportContent，因为它已经在 pdfGenerator 中被处理成了 HTML
    const sections = reportContent.split('<h2>').slice(1).map(section => {
        const titleEndIndex = section.indexOf('</h2>');
        const title = section.slice(0, titleEndIndex);
        const content = section.slice(titleEndIndex + 5);  // 5 是 '</h2>' 的长度
        
        return {
            title: title.trim(),
            content: content.trim()
        };
    });

    return {
        name: questionnaire.name,
        gender: questionnaire.gender === 'male' ? '男' : '女',
        birthDate: questionnaire.birth_date,
        location: questionnaire.location || '北京',
        generateTime: new Date().toLocaleString('zh-CN'),
        logoPath: `data:image/png;base64,${logoBase64}`,
        cssContent: cssContent,
        fontBase64: `data:font/otf;base64,${fontBase64}`,
        sections: sections,
        textureBase64: `data:image/svg+xml;base64,${textureBase64}`,
        backgroundPattern: generateBackgroundPattern(),
    };
};

// 添加生成纹理的函数
const generateTextureBase64 = () => {
    // 这里可以返回一个SVG纹理的base64编码
    // 可以是噪点、细线或其他纹理图案
    return Buffer.from(`<svg>...</svg>`).toString('base64');
};

const generateBackgroundPattern = () => {
    const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <!-- 主要装饰圆点 - 增加不透明度 -->
        <pattern id="mainDots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.2" fill="rgba(107, 70, 193, 0.25)"/>
        </pattern>
        
        <!-- 次要装饰圆点 - 增加不透明度 -->
        <pattern id="secondaryDots" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="2" fill="rgba(252, 129, 129, 0.20)"/>
        </pattern>
        
        <!-- 装饰性线条 - 增加不透明度和线条粗细 -->
        <pattern id="lines" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M0 0 L60 60" stroke="rgba(107, 70, 193, 0.15)" stroke-width="0.8" fill="none"/>
            <path d="M60 0 L0 60" stroke="rgba(252, 129, 129, 0.15)" stroke-width="0.8" fill="none"/>
        </pattern>

        <!-- 应用所有图案 -->
        <rect width="100" height="100" fill="url(#mainDots)"/>
        <rect width="100" height="100" fill="url(#secondaryDots)"/>
        <rect width="100" height="100" fill="url(#lines)"/>
    </svg>`;
    
    return Buffer.from(svg).toString('base64');
};
