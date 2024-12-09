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

export const formatReportData = (reportContent: any, questionnaire: any) => {
    // 读取并转换 logo 为 base64
    const logoPath = path.join(__dirname, '../../assets/images/logo.png');
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

    // 读取 CSS 文件
    const cssPath = path.join(__dirname, '../../assets/styles/report.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // 读取字体文件
    const fontPath = path.join(__dirname, '../../assets/fonts/Huiwen_mingchao.otf');
    const fontBase64 = fs.readFileSync(fontPath, { encoding: 'base64' });

    // 添加背景纹理
    const textureBase64 = generateTextureBase64();

    // 添加背景模式
    const backgroundPattern = generateBackgroundPattern();

    // 修改这一行，添加 Markdown 处理
    const sections = reportContent.analysis.map((section: any) => {
        // 确保 section 是字符串
        const sectionStr = typeof section === 'string' ? section : JSON.stringify(section);
        const titleMatch = sectionStr.match(/^(\d+\.\d+)\s+([^：\n]+)：/);
        
        if (titleMatch) {
            const [fullMatch, number, title] = titleMatch;
            const content = sectionStr.slice(fullMatch.length).trim();
            
            return {
                title: `${number} ${title}`,
                content: marked(content, {
                    breaks: true,
                    gfm: true
                })
            };
        }
        
        // 如果没有匹配到标题格式，整个内容作为 content
        return {
            title: '',
            content: marked(sectionStr, {
                breaks: true,
                gfm: true
            })
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
        sections: sections,  // 使用处理后的 sections
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
