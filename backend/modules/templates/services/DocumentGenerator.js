const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const expressions = require('angular-expressions');
const assign = require('lodash/assign');

// Настраиваем кастомный парсер для поддержки условной логики {#paymentType === 'prepayment'}
function angularParser(tag) {
  if (tag === '.') {
    return {
      get: function(s) { return s; }
    };
  }
  const expr = expressions.compile(
    tag.replace(/(’|‘)/g, "'").replace(/(“|”)/g, '"')
  );
  return {
    get: function(scope, context) {
      let obj = {};
      const scopeList = context.scopeList;
      const num = context.num;
      for (let i = 0, len = num + 1; i < len; i++) {
        obj = assign(obj, scopeList[i]);
      }
      return expr(scope, context);
    }
  };
}

class DocumentGenerator {
  /**
   * Генерирует документ на основе шаблона и данных
   * @param {string} templatePath - Путь к исходному файлу .docx (шаблону)
   * @param {Object} data - Объект с данными для подстановки (плейсхолдеры)
   * @returns {Buffer} - Буфер сгенерированного документа
   */
  static generate(templatePath, data) {
    try {
      // 1. Читаем файл шаблона
      const content = fs.readFileSync(path.resolve(templatePath), 'binary');

      // 2. Распаковываем как zip
      const zip = new PizZip(content);

      // 2.5 Настраиваем модуль для работы с картинками
      const imageOptions = {
        centered: false,
        getImage: function (tagValue, tagName) {
          // Если значение это base64
          if (tagValue && tagValue.startsWith('data:image')) {
            const base64Data = tagValue.replace(/^data:image\/\w+;base64,/, '');
            return Buffer.from(base64Data, 'base64');
          }
          // Если значение это локальный путь (не рекомендуется для безопасности, но возможно)
          if (tagValue && fs.existsSync(tagValue)) {
            return fs.readFileSync(tagValue);
          }
          // Фоллбек
          return Buffer.from('');
        },
        getSize: function (img, tagValue, tagName) {
          // Дефолтный размер картинки (ширина, высота в пикселях)
          return [150, 150];
        }
      };
      
      const imageModule = new ImageModule(imageOptions);

      // 3. Создаем инстанс docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        parser: angularParser,
        modules: [imageModule]
      });

      // 4. Подставляем данные
      doc.render(data);

      // 5. Генерируем новый документ как Buffer
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      return buf;
    } catch (error) {
      console.error('Ошибка при генерации документа:', error);
      throw new Error('Не удалось сгенерировать документ');
    }
  }
}

module.exports = DocumentGenerator;
