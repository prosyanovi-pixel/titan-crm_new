const axios = require('axios');
const db = require('../../../db');

class AiAdapter {
  constructor() {
    this.defaultModel = 'gpt-4o-mini';
  }

  async getSettings() {
    const { rows } = await db.query(`
      SELECT setting_key, value 
      FROM system_settings 
      WHERE setting_key IN ('ai.provider', 'ai.api_key', 'ai.model')
    `);
    
    const settings = {
      provider: 'mock',
      apiKey: '',
      model: this.defaultModel
    };

    rows.forEach(row => {
      const val = row.value?.value || '';
      if (row.setting_key === 'ai.provider') settings.provider = val;
      if (row.setting_key === 'ai.api_key') settings.apiKey = val;
      if (row.setting_key === 'ai.model') settings.model = val;
    });

    // Also check env vars as fallback
    if (!settings.apiKey && process.env.OPENAI_API_KEY) {
      settings.apiKey = process.env.OPENAI_API_KEY;
      if (settings.provider === 'mock') settings.provider = 'openai';
    }

    return settings;
  }

  async generateInsight(entityType, entityData, insightType) {
    const settings = await this.getSettings();

    if (settings.provider === 'openai' && settings.apiKey) {
      return this._generateWithOpenAI(settings, entityType, entityData, insightType);
    }

    // Fallback to mock
    return this._generateMockInsight(entityType, entityData, insightType);
  }

  async _generateWithOpenAI(settings, entityType, entityData, insightType) {
    let prompt = '';
    
    if (insightType === 'win_probability' && (entityType === 'projects' || entityType === 'project')) {
      prompt = `Оцени вероятность успеха (в процентах от 0 до 100) проекта со следующими данными: ${JSON.stringify(entityData)}. 
Ответь в формате JSON: { "score": 85, "factors": ["фактор 1", "фактор 2"], "recommendation": "текст" }`;
    } else if (insightType === 'summary' && entityType === 'mail') {
      prompt = `Сделай краткое резюме следующего письма/цепочки писем: ${JSON.stringify(entityData)}.
Ответь в формате JSON: { "summary": "текст", "action_items": ["задача 1", "задача 2"] }`;
    } else {
      prompt = `Сгенерируй инсайт типа "${insightType}" для сущности "${entityType}" с данными: ${JSON.stringify(entityData)}. Верни JSON.`;
    }

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: settings.model || this.defaultModel,
        messages: [
          { role: 'system', content: 'You are an analytical AI assistant for a CRM system. You must ALWAYS respond with raw valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }, {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI Error:', error?.response?.data || error.message);
      // Fallback to mock on error
      return this._generateMockInsight(entityType, entityData, insightType);
    }
  }

  _generateMockInsight(entityType, entityData, insightType) {
    if (insightType === 'win_probability') {
      const budget = parseFloat(entityData?.budget) || 0;
      let score = 50;
      const factors = ['Средний приоритет'];
      
      if (budget > 100000) {
        score += 20;
        factors.push('Крупный бюджет повышает приоритет сделки');
      }
      
      if (entityData?.priority === 'High') {
        score += 15;
        factors.push('Высокий приоритет от клиента');
      }

      return {
        score: Math.min(score, 99),
        factors,
        recommendation: 'Рекомендуется связаться с ЛПР для подтверждения бюджета.'
      };
    }

    if (insightType === 'summary') {
      return {
        summary: 'Это сгенерированное (mock) саммари письма. Отправитель просит уточнить детали договора.',
        action_items: ['Подготовить договор', 'Отправить ответное письмо']
      };
    }

    return { message: 'Mock data generated successfully', originalData: entityData };
  }
}

module.exports = new AiAdapter();
