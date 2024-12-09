import { generatePDFFromReport } from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';

// 从 express 包中导入 Request 和 Response 类型
// Request 用于处理请求对象，Response 用于处理响应对象
import { Request, Response } from 'express';

// 导入问卷模型，这个模型定义了问卷数据的结构
import { Questionnaire, IQuestionnaire, QuestionnaireStatus } from '../models/questionnaire';

// 导入 axios 用于调用 OpenRouter API
import axios from 'axios';

// 导入 Couple 模型
import { Couple } from '../models/couple';
import { AIResponse, AnthropicResponse } from '../types/api';

// Add this function near the top of the file, after the imports
const getImageContent = async (imageUrl: string): Promise<string> => {
  try {
    if (!imageUrl) {
      throw new Error('Image URL is empty');
    }

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    // 验证内容类型
    const contentType = response.headers['content-type'];
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // 强制转换为 JPEG 格式，并降低质量以减小大小
    const sharp = require('sharp');
    const processedImageBuffer = await sharp(response.data)
      .jpeg({ quality: 80 }) // 转换为 JPEG 并设置质量
      .resize(1024, 1024, { // 限制最大尺寸
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    const base64 = processedImageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    console.log(`Successfully processed image: ${imageUrl.substring(0, 50)}...`);
    
    return dataUrl;
  } catch (error) {
    console.error('Error processing image:', {
      url: imageUrl.substring(0, 50) + '...',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('图片处理失败，请确保图片格式正确且大小在限制范围内');
  }
};

// 导出一个异步函数，用于处理提交问卷的请求
// async 表示这是一个异步函数，可以等待其他异步操作完成
export const submitQuestionnaire = async (req: Request, res: Response) => {
  try {
    // 从请求体(req.body)中获取问卷数据
    // 当用户提交表单时，数据会存储在 req.body 中
    const questionnaireData = req.body;
    
    // 验证日期格式
    if (!/^\d{4}-\d{2}$/.test(questionnaireData.birth_date)) {
      return res.status(400).json({
        success: false,
        error: '出生日期格式必须为 YYYY-MM'
      });
    }

    // 验证年龄限制
    const [year, month] = questionnaireData.birth_date.split('-');
    const birthDate = new Date(parseInt(year), parseInt(month) - 1);
    if (birthDate > new Date('2006-12-31')) {
      return res.status(400).json({
        success: false,
        error: '此活动仅对18岁以上开放'
      });
    }

    const questionnaire = new Questionnaire(questionnaireData);

    // 将问卷数据保存到数据库中
    // await 表示等待保存操作完成
    await questionnaire.save();

    // 发送成功响应
    // status(201) 表示创建成功
    // json() 发送 JSON 格式的响应数据
    res.status(201).json({
      success: true,          // 表示操作成功
      message: '问卷提交成功', // 成功提示信息
      data: questionnaire     // 返回保存的问卷数据
    });

  } catch (error) {
    // 如果过程中发生错误，进入错误处理
    
    // 在控制台打印错误信息，方便调试
    console.error('提交问卷失败:', error);

    // 发送错误响应
    // status(500) 表示服务器内部错误
    res.status(500).json({
      success: false,           // 表示操作失败
      error: '提交失败，请重试'  // 错误提示信息
    });
  }
};
export const getQuestionnaires = async (req: Request, res: Response) => {
  try {
    const questionnaires = await Questionnaire.find()
      .sort({ createdAt: -1 });
    
    // 应该检查查询结果
    if (!questionnaires) {
      return res.status(404).json({
        success: false,
        error: '未找到问卷数据'
      });
    }
    
    res.json({
      success: true,
      data: questionnaires || []
    });
  } catch (error) {
    // 应该记录具体错误信息
    console.error('获取问卷列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取问卷列表失败' 
    });
  }
};

export const getQuestionnaireById = async (req: Request, res: Response) => {
    try {
      const questionnaire = await Questionnaire.findById(req.params.id) as IQuestionnaire;
      if (!questionnaire) {
        return res.status(404).json({ success: false, error: '问卷不存在' });
      }
      res.json({ success: true, data: questionnaire });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取问卷详情失败' });
    }
  };
  
  // 添加 Anthropic API 调用函数
  const callAnthropicAPI = async (messages: any[], imageContents: any[]) => {
    console.log('正在调用 Anthropic API...');
    
    // 转换消息格式
    const convertedMessages = messages.map(msg => ({
      ...msg,
      content: msg.content.map((content: any) => {
        if (content.type === 'image_url') {
          // 转换为 Anthropic 的图片格式
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: content.image_url.url.split(',')[1] // 移除 data:image/jpeg;base64, 前缀
            }
          };
        }
        return content;
      })
    }));

    // 构建请求体
    const requestBody = {
      model: "claude-3-5-sonnet-20241022",
      messages: convertedMessages,
      max_tokens: 4096,
      temperature: 0.7,
    };

    console.log('Anthropic 请求体:', JSON.stringify({
      ...requestBody,
      messages: convertedMessages.map(msg => ({
        ...msg,
        content: msg.content.map((content: any) => 
          content.type === 'image' ? { type: 'image', source: { type: 'base64', data: '[BASE64_IMAGE]' }} : content
        )
      }))
    }, null, 2));

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      requestBody,
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 180000
      }
    );

    return response.data as AnthropicResponse;
  };

  // 修改 generateReport 函数
  export const generateReport = async (req: Request, res: Response) => {
    try {
      console.log('开始生成报告，用户ID:', req.params.id);
      const questionnaire = await Questionnaire.findById(req.params.id) as IQuestionnaire;
      if (!questionnaire) {
        return res.status(404).json({ success: false, error: '问卷不存在' });
      }

      const validImageContents = [];
      let imageDescriptions = '';
      if (questionnaire.images && questionnaire.images.length > 0) {
        // 串行处理图片
        for (let i = 0; i < questionnaire.images.length; i++) {
          const imageUrl = questionnaire.images[i];
          try {
            const base64Url = await getImageContent(imageUrl);
            validImageContents.push({
              type: "image_url" as const,
              image_url: {
                url: base64Url
              }
            });
            imageDescriptions += `\n图片${i + 1}：[等待AI分析]\n`;
            // 添加延迟以避免请求过快
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Failed to process image ${imageUrl}:`, error);
          }
        }
      }

      // 构建用户信息字符串，包含图片描述
      const userInfo = `
        姓名：${questionnaire.name}
        性别：${questionnaire.gender === 'male' ? '男' : '女'}
        年龄：${questionnaire.birth_date}
        星座：${questionnaire.zodiac}
        MBTI: ${questionnaire.mbti}
        职业：${questionnaire.occupation}
        自我介绍：${questionnaire.self_intro}
        
        社交媒体照片：${imageDescriptions || '未上传照片'}
      `;

      // 构建多模态消息
      const messages = [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `你是一位深邃而富有哲理的专业情感咨询师，以思考深刻、语言风趣著称。你的分析应该富有哲理，一针见血，含有隐喻和煽动性，参考奥斯卡·王尔德、鲁迅、王朔、刘震云、王家卫和王小波的风格。你的任务是基于用户提供的信息进行全面的情感分析并提供个性化的关系建议。以下是用户提供的信息：

<user_info>
${userInfo}
</user_info>

###Skill: 情感分析
- 在用户提交社交媒体截图和基本信息后，首先分析用户的性格特质、情感表达方式和行为模式。
- 使用心理学和社会学的理论，如依恋理论、五大人格特质模型等，来评估用户的情感需求和行为倾向。
在进行情感、亲密关系和恋爱相关测试并生成报告时，科学的理论和方法论通常来自心理学、社会学和相关领域。以下是一些常用的理论和方法论，以及一些可能涉及的研究和论文方向：
1. 依恋理论 (Attachment Theory)
- 简介：由约翰·鲍比 (John Bowlby) 提出，依恋理论描述了婴儿与照料者之间的依恋关系如何影响其成年后的亲密关系。成人依恋理论扩展了这一概念，用于解释成年人的情感关系行为。
- 研究和应用：常用于评估一个人如何处理亲密关系中的情感连接和冲突。
2. 五大人格特质模型 (Big Five Personality Traits)
- 简介：这是一种常用的心理学框架，用于评估个体在开放性、尽责性、外向性、宜人性和神经质五个方面的特质。
- 应用：在研究情感和亲密关系中，这一模型可以帮助解释个体在恋爱中的行为模式及其选择伴侣的偏好。
3. 自我决定理论 (Self-Determination Theory, SDT)
- 简介：由德西 (Edward Deci) 和瑞安 (Richard Ryan) 提出，该理论强调人类行为背后的动机以及自主性、胜任感和关系感三个核心需求。
- 应用：用于分析一个人在恋爱关系中的内在和外在动机，这可以影响其关系的稳定性和幸福感。
4. 三角恋爱理论 (Triangular Theory of Love)
- 简介：由罗伯特·斯腾伯格 (Robert Sternberg) 提出，该理论将爱分为三个基本成分：激情、亲密和承诺。
- 应用：用于分析关系的性质和一个人对不同成分的倾向。
5. 社会交换理论 (Social Exchange Theory)
- 简介：该理论描述了人们如何通过成本收益分析来决定是否维持关系。
- 应用：用来解释个体在关系中的满意度和忠诚度。
6. 爱的五种语言 (The Five Love Languages)
- 简介：由盖瑞·查普曼 (Gary Chapman) 提出，该理论描述了人们在表达和接受爱时的五种主要方式：肯定的言辞、优质的陪伴、接受礼物、服务的行为和身体接触。
- 应用：用于帮助理解伴侣之间的沟通模式和情感表达差异。
7. 依赖-回避模型 (Dependence-Avoidance Model)
- 简介：这是评估一个人在关系中对依赖或回避行为的倾向的模型。
- 应用：尤其在亲密关系中，可以预测冲突模式和亲密度。
8. 积极心理学 (Positive Psychology)
- 简介：由马丁·塞利格曼 (Martin Seligman) 等人倡导，注重幸福感和积极的情绪体验。
- 应用：用于分析恋爱和关系中的正向情绪、幸福感和成长。
“恋爱12人格”通常是基于心理学中的人格类型理论发展而来的，尤其是将人格特质与恋爱和亲密关系的行为特征结合起来的应用。以下是恋爱12人格的常见类型及其理论基础：
9.恋爱12人格类型：
-简介：基于心理学中的人格类型理论发展而来的，尤其是将人格特质与恋爱和亲密关系的行为特征结合起来的应用。以下是恋爱12人格的常见类型及其理论基础：
理想主义者：追求浪漫和完美爱情，常有浪漫主义倾向。
领导者：在恋爱中表现出主导和保护的倾向，喜欢掌控局面。
奉献者：倾向于无私地付出，注重伴侣的幸福，容易忽略自己的需求。
探索者：对新鲜感和冒险充满兴趣，在关系中寻找刺激和创新。
守护者：重视稳定和安全，倾向于长久和可靠的关系。
分析者：理性且审慎，通常对恋爱持有理智和计划性的态度。
热情者：热情而直接，情绪表达丰富，渴望激情和互动。
和谐者：注重和平与协调，喜欢避免冲突，重视和谐的关系。
现实主义者：实事求是，处理恋爱时更加注重实际和现实因素。
梦想家：幻想丰富，倾向于理想化爱情和关系。
冒险者：喜欢挑战和新体验，不满足于单调，倾向于活力四射的恋爱模式。
支持者：在关系中扮演支持和鼓励的角色，善于倾听和提供情感支持。

相关论文方向和期刊
- 《Journal of Personality and Social Psychology》
- 《Personal Relationships》
- 《Journal of Marriage and Family》
- 《Attachment & Human Development》
- 经典论文：例如，Ainsworth的“Patterns of Attachment”及Hazan和Shaver对成人依恋的研究。

## Workflow
第一步：根据用户提交的基础信息以及社交媒体的截图，推理和总结出此用户的基础信息，包括姓名、性别、年龄、职业、所在地/籍贯、出生年月日、性取向、MBTI、星座、兴趣爱好等等。
第二步：进行行为模式和社交动态分析，识别恋爱关系中的深层次问题和心理障碍，参考Skill中的内容，生成完整的情感分析报告，1000字左右
第三步：将完整的情感分析报告，使用json数组和markdown格式进行输出，json包括的字段为content（每个content为报告的一个一级标题，一共分3个content输出），注意里面的标点符号要进行转义，从而符合json格式解析的要求,记得对字符串中的特殊符号转义，保证输出正确的 json 数组格式
## OutputFormat
报告框架如下：
   一.情感画像 (Emotional Portrait)：描述用户在主流情感和人格测试中的结果
   1.1依恋风格：要详细解释这样判断的理由（要给出具体的推理过程）以及具体此依恋风格有什么特点
   1.2爱情观：要详细解释这样判断的理由（要给出具体的推理过程）以及具体此爱情观有什么特点
   1.3恋爱12人格类型要详细解释这样判断的理由（要给出具体的推理过程）以及具体此人格类型有什么特点，适合作为伴侣的人格类型都有什么
   1.4五大人格特质：要详细解释这样判断的理由（要给出具体的推理过程）以及具体此人格特质有什么特点
   1.5综合评估：结合以上内容给出一个综合性的分析，参考以下：
   “国王的特征为"权力",顾名思义,大多数时候国王们需要占据占领更高的位置,能够掌控关系。
国王们是需要秩序和传统的现实主义者。与权力相伴的是责任感,国王们往往还具备强烈的责任感,他们借由对自己、对方、和关系负责来让自己成为关系中真正的"国王",所���他们会试图营造一段完美的关系,即为自己也为对方。但这一切综合起来会表现出在关系中想胜过伴侣一些,从恋爱起,就一直试图在形式上获得对伴侣的胜利,比如多数事情由你决定,凡事要先取得你的同意,等等。这决定他们是否能坐稳王位。
国王们会隐约地觉得输了,就会失去权力和控制。在另一半看来,国王们有时候真的很固执,这是国王们的特性。但坚持掌握权力和要在更高的位置,其实只是国王们希望能更多的感受到自己被爱,被在乎。关注和回应,是国王在关系中判断是否掌握权力的方式。”

   二.关系需求 (Relationship Needs)：参考1.5综合评估中的内容，进一步详细描述用户在面临情感问题时的关系需求，内容参考以下：
   “想要在情感中获得更多权力的背后,可能有各种各样的动机。其中,最为重要的是,源你内在对被认可的需求。没有任何一种关系能够比爱情更为国王提供如此多的支持和奉献,国王们需要牢固恋爱关系的安全感和稳定感。
在潜意识深处,国王对自己的价值是低估的,而在关系中获得更多的话语权,是你对内在真实脆弱自我的保护。关系中的高权力位置可以给你带来更多的控制感,控制感本质上是为了获得安全感。
受"国王"恋爱格的影响,在关系中,追求更高力和地位的你,往往会更青睐于以另一半为主的伴侣。这一类伴侣在关系中注重归属感,愚者型、公民型和逐爱者都有这样的特质。其中愚者可以通过其独有的特质中和国王的现实义,缓解关系中的紧张感,同时他们是这三种人格中最能长久相伴人的人格。而现是,国王也会更吸引这一类人。
在这样的一段关系中,你可以占据主导地位,关系往往能按照你想要的方向发展。并且,你可以从中获得更优越的感受以及更多的选择权。但另一方面,对权力的追逐,也会让你比其他人更害怕承担未知的风险。因为风险可能会破坏你的权力感,让你体验到无能感。
所以,在感情还未开始前,你很可能会表现出"我不在意"的态度,进行自我防御,以防被拒绝。
同时,你也可以借此考察对方的真心。由此,的感情战线会拉得很长。”

   三.情感密码 (Emotional Code)：参考1.5综合评估中的内容，进一步详细描述用户应该如何维系和拥有一段健康愉快的情感关系，内容参考以下：
   “从精神分析的角度看,爱情是寻找完整的自我,潜意识会驱使你寻找那个和自己互补的另一半。
虽然需要归属感的人格不在少数。在遇到这样的伴侣时,你的内在需求能够得到满足,你可以明确感觉到自己占据着主导权。
但时间久了,彼此之间可能会形成一种惯性关系。这种关系就像是一条难以斩断的脐带,喂养着关系中的双方。强势的你可能会因为ta的顺从更强势,顺从的ta可能会因为你的强势更顺从。
但"滥权的国王"维持不好秩序,如果控制欲持续膨胀,可能最终会打破平衡或让对方失去自我,让关系破裂或变得疲劳。
所以,对你来说,最理想的关系模式可能是他愿意顺从,同时具有独立的自我。他不会事事顺从你,可是因为爱你,他愿意输给你。
这需要在相处中慢慢去体会。与此同时,你需要把握好度,多多关注自己内心的感受,兼顾彼此自我意志的表达。”


## Constraints
- 建议应基于用户自愿提供的信息，尊重个人隐私，避免任何形式的偏见和歧视。
- 建议应专业、深入、建设性，旨在促进双方的情感健康和关系发展。
- 要注意褒贬结合，不能只说好的，也要说明潜藏的风险和问题。
- 报告中的所有内容，主语必须使用第二人称"你"，从而模拟一个情感咨询师对用户说话的感觉，请尽量相详尽的描述

## OutputFormat
请以下面的 JSON 格式输出分析结果：

{
  "analysis": [
    {
      "title": "情感画像 (Emotional Portrait)",
      "content": "这里是情感画像的具体内容，包含依恋风格、爱情观、恋爱12人格类型、五大人格特质和综合评估等分析..."
    },
    {
      "title": "关系需求 (Relationship Needs)",
      "content": "这里是关系需求的具体内容，基于综合评估进行深入分析..."
    },
    {
      "title": "情感密码 (Emotional Code)",
      "content": "这里是情感密码的具体内容，包含具体的建议和指导..."
    }
  ]
}

注意：
1. 所有内容必须是中文
2. 特殊字符需要进行转义
3. content 字段中的内容要包含完整的分析，使用 \n 进行换行
4. 确保输出是有效的 JSON 格式`
            },
            ...validImageContents
          ]
        }
      ];

      console.log('Prepared messages for API:', JSON.stringify({
        messageCount: messages.length,
        contentCount: messages[0].content.length,
        imageCount: validImageContents.length,
        firstImageLength: validImageContents[0]?.image_url.url.length
      }, null, 2));

      // 添加完整请求体的日志（排除图片数据）
      const logMessages = messages.map(msg => ({
        ...msg,
        content: msg.content.map(content => {
          if (content.type === 'image_url') {
            return {
              type: 'image_url',
              image_url: {
                url: '[BASE64_IMAGE_DATA]' // 替换实际的图片数据
              }
            };
          }
          return content;
        })
      }));

      console.log('完整的 OpenRouter 请求体:', JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: logMessages,
        max_tokens: 4096,
        temperature: 0.7
      }, null, 2));

      let aiResponse;
      const useAnthropicAPI = process.env.AI_SERVICE_PROVIDER === 'anthropic';
      console.log('AI_SERVICE_PROVIDER:', process.env.AI_SERVICE_PROVIDER);
      console.log('useAnthropicAPI:', useAnthropicAPI);

      console.log(`正在调用 ${useAnthropicAPI ? 'Anthropic' : 'OpenRouter'} API...`);

      if (useAnthropicAPI) {
        // 使用 Anthropic API
        const anthropicResponse = await callAnthropicAPI(messages, validImageContents);
        aiResponse = anthropicResponse.content[0].text;
      } else {
        // 使用现有的 OpenRouter API
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: "anthropic/claude-3.5-sonnet",
            messages: messages,
            max_tokens: 4096,
            temperature: 0.7,
            frequency_penalty: 0,
            presence_penalty: 0,
            top_p: 1,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
              'X-Title': 'Personality Analysis App',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 180000
          }
        );
        aiResponse = response.data.choices[0].message.content;
      }

      // 更新问卷数据
      const report = {
        content: {
          raw_response: aiResponse,
        },
        generated_at: new Date(),
        generation_count: (questionnaire.personality_report?.generation_count || 0) + 1
      };

      questionnaire.personality_report = report;
      questionnaire.status = QuestionnaireStatus.REPORTED;
      await questionnaire.save();

      // 添加成功日志
      console.log(`报告生成成功 - 用户ID: ${req.params.id}, 姓名: ${questionnaire.name}`);

      // 返回响应
      res.json({ 
        success: true, 
        data: questionnaire,
        raw_response: aiResponse
      });
    } catch (error: any) {
      // 增强错误日志
      console.error('生成报告失败，错误类型:', error.constructor.name);
      console.error('错误信息:', error.message);
      
      if (error.response) {
        console.error('API 响应状态:', error.response.status);
        console.error('API 响应头:', error.response.headers);
        console.error('API 响应数据:', error.response.data);
      }

      if (error.config) {
        console.error('请求配置:', {
          url: error.config.url,
          method: error.config.method,
          headers: {
            ...error.config.headers,
            'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY?.substring(0, 5) + '...' // 安全起见只显示部分
          }
        });
      }

      let errorMessage = '生成报告失败';
      if (error.code === 'ECONNABORTED') {
        errorMessage = '生成报告超时，请重试 (服务器响应时间过长)';
      } else if (error.response) {
        errorMessage = `生成报告失败: ${error.response.data?.error || error.response.statusText || '未知错误'}`;
      } else if (error.request) {
        errorMessage = '无法连接到 AI 服务，请检查网络连接';
      }

      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          stack: error.stack
        } : undefined
      });
    }
  };

// 添加匹配用户的控制器
export const matchUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;

    const user1 = await Questionnaire.findById(id);
    const user2 = targetUserId ? await Questionnaire.findById(targetUserId) : null;

    if (!user1) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    if (targetUserId && !user2) {
      return res.status(404).json({ success: false, error: '匹配目标用户不存在' });
    }

    // 如果是取消匹配
    if (!targetUserId) {
      const existingCouple = await Couple.findOne({
        $or: [
          { user1: user1._id },
          { user2: user1._id }
        ]
      });

      if (existingCouple) {
        await existingCouple.deleteOne();
      }

      if (user1.matched_with) {
        await Questionnaire.updateOne(
          { _id: user1.matched_with },
          {
            matched_with: null,
            matched_at: null,
            status: user1.personality_report?.content?.raw_response ? 
              QuestionnaireStatus.REPORTED : 
              QuestionnaireStatus.SUBMITTED
          }
        );
      }

      await Questionnaire.updateOne(
        { _id: user1._id },
        {
          matched_with: null,
          matched_at: null,
          status: user1.personality_report?.content?.raw_response ? 
            QuestionnaireStatus.REPORTED : 
            QuestionnaireStatus.SUBMITTED
        }
      );

      const updatedUser = await Questionnaire.findById(id);
      return res.json({ success: true, data: updatedUser });
    }

    // 如果是新建匹配
    if (user2) {
      const matchTime = new Date();

      const existingCouple = await Couple.findOne({
        $or: [
          { user1: user1._id },
          { user2: user1._id },
          { user1: user2._id },
          { user2: user2._id }
        ]
      });

      if (existingCouple) {
        await existingCouple.deleteOne();
      }

      const couple = new Couple({
        user1: user1._id,
        user2: user2._id,
        matchedAt: matchTime
      });

      await couple.save();

      await Promise.all([
        Questionnaire.updateOne(
          { _id: user1._id },
          {
            matched_with: user2._id,
            matched_at: matchTime,
            status: QuestionnaireStatus.MATCHED
          }
        ),
        Questionnaire.updateOne(
          { _id: user2._id },
          {
            matched_with: user1._id,
            matched_at: matchTime,
            status: QuestionnaireStatus.MATCHED
          }
        )
      ]);

      const updatedUser = await Questionnaire.findById(id);
      return res.json({ success: true, data: updatedUser });
    }

  } catch (error) {
    console.error('匹配用户失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '匹配失败，请重试'
    });
  }
};

export const handlePDFGeneration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 1. 确保 reports 目录存在
    const reportsDir = path.join(__dirname, '../../public/reports');
    await fs.promises.mkdir(reportsDir, { recursive: true });
    
    // 2. 获取用户数据和报告内容
    const questionnaire = await Questionnaire.findById(id);
    if (!questionnaire) {
      return res.status(404).json({ success: false, error: '未找到用户数据' });
    }
    
    if (!questionnaire.personality_report?.content?.raw_response) {
      return res.status(400).json({ success: false, error: '请先生成性格报告' });
    }

    // 3. 删除旧的 PDF 文件（如果存在）
    if (questionnaire.personality_report.pdf_path) {
      const oldFilePath = path.join(reportsDir, questionnaire.personality_report.pdf_path);
      try {
        await fs.promises.unlink(oldFilePath);
        console.log('已删除旧的PDF文件:', oldFilePath);
      } catch (error) {
        console.warn('删除旧PDF文件失败:', error);
      }
    }

    // 4. 直接使用原始响应
    const reportContent = questionnaire.personality_report.content.raw_response;

    // 不需要在这里进行 JSON 解析
    // 直接将原始响应传递给 PDF 生成器

    // 5. 生成 PDF
    const pdfResult = await generatePDFFromReport(reportContent, questionnaire);
    const pdfBuffer = Buffer.from(pdfResult.buffer);

    // 6. 保存 PDF 文件
    const fileName = `report_${id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    await fs.promises.writeFile(filePath, pdfBuffer);

    // 7. 更新数据库中的 PDF 路径
    questionnaire.personality_report.pdf_path = fileName;
    await questionnaire.save();

    res.json({ 
      success: true, 
      data: questionnaire,
      pdf_url: `/reports/${fileName}` // 添加 PDF 下载链接
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id
    });

    res.status(500).json({ 
      success: false, 
      error: error.message || '生成 PDF 失败',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};