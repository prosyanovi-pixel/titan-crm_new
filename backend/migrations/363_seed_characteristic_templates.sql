-- Seed basic characteristic templates for products module
INSERT INTO module_settings (module_id, setting_key, value, updated_at)
VALUES (
    'products', 
    'characteristicTemplates', 
    '[
      {
        "id": "cnc_metal_x_axis",
        "name": "Х-осевые станки металлообработка с ЧПУ",
        "characteristics": [
          { "section": "Ось Х", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось Х", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось Х", "name": "Максимальная скорость перемещения", "value": "", "unit": "м/мин" },
          { "section": "Ось Y", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось Y", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось Y", "name": "Максимальная скорость перемещения", "value": "", "unit": "м/мин" },
          { "section": "Ось Z", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось Z", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось Z", "name": "Максимальная скорость перемещения", "value": "", "unit": "м/мин" },
          { "section": "Ось А", "name": "Перемещение", "value": "", "unit": "град" },
          { "section": "Ось А", "name": "Разрешение", "value": "", "unit": "град" },
          { "section": "Ось А", "name": "Максимальная скорость перемещения", "value": "", "unit": "об/мин" },
          { "section": "Ось B", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось B", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось B", "name": "Максимальная скорость перемещения", "value": "", "unit": "об/мин" },
          { "section": "Ось С (ось вращения заготовки)", "name": "Разрешение", "value": "", "unit": "град" },
          { "section": "Ось С (ось вращения заготовки)", "name": "Максимальная скорость вращения", "value": "", "unit": "об/мин" },
          { "section": "Точность", "name": "Допуск диаметра кромки (партия)", "value": "", "unit": "мм" },
          { "section": "Точность", "name": "Допуск на биение", "value": "", "unit": "мм" },
          { "section": "Точность", "name": "Допуск длины кромки", "value": "", "unit": "мм" },
          { "section": "Манипулятор", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Манипулятор", "name": "Максимальная рабочая скорость", "value": "", "unit": "м/мин" },
          { "section": "Шпиндель", "name": "Скорость вращения шпинделя", "value": "", "unit": "об/мин" },
          { "section": "Шпиндель", "name": "Мощность двигателя", "value": "", "unit": "кВт" },
          { "section": "Шпиндель", "name": "Макс. количество шлифовальных кругов", "value": "", "unit": "шт" },
          { "section": "Шпиндель", "name": "Макс. диаметр шлифовального круга", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Тип цанги", "value": "", "unit": "тип" },
          { "section": "Параметры шлифования", "name": "Диаметр инструментального хвостовика", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Шлифуемый диаметр", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Длина заготовки (автоматический/ручной)", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Макс вес заготовки", "value": "", "unit": "грамм" },
          { "section": "Параметры шлифования", "name": "Диаметр режущей кромки инструмента D", "value": "", "unit": "мм" },
          { "section": "Общие параметры", "name": "Электропитание", "value": "", "unit": "" },
          { "section": "Общие параметры", "name": "Мощность", "value": "", "unit": "кВт" },
          { "section": "Общие параметры", "name": "Габариты", "value": "", "unit": "мм" },
          { "section": "Общие параметры", "name": "Вес", "value": "", "unit": "кг" },
          { "section": "Общие параметры", "name": "Давление подачи СОЖ", "value": "", "unit": "МПа" },
          { "section": "Общие параметры", "name": "Давление воздуха", "value": "", "unit": "Бар" }
        ]
      },
      {
        "id": "aggregate_machines",
        "name": "Агрегатные станки",
        "characteristics": [
          { "section": "Основные", "name": "Производительность", "value": "", "unit": "шт/час" },
          { "section": "Основные", "name": "Количество рабочих станций", "value": "", "unit": "шт" },
          { "section": "Основные", "name": "Количество шпинделей", "value": "", "unit": "шт" },
          { "section": "Габариты заготовки", "name": "Максимальный размер (ДхШхВ)", "value": "", "unit": "мм" },
          { "section": "Габариты заготовки", "name": "Максимальный вес", "value": "", "unit": "кг" },
          { "section": "Точность", "name": "Позиционирование", "value": "", "unit": "мм" },
          { "section": "Точность", "name": "Повторяемость", "value": "", "unit": "мм" },
          { "section": "Электропитание", "name": "Напряжение", "value": "380", "unit": "В" },
          { "section": "Электропитание", "name": "Суммарная мощность", "value": "", "unit": "кВт" },
          { "section": "Общие параметры", "name": "Габариты станка", "value": "", "unit": "мм" },
          { "section": "Общие параметры", "name": "Вес станка", "value": "", "unit": "кг" }
        ]
      },
      {
        "id": "tooling_and_accessories",
        "name": "Сопутствующие товары и оснастка",
        "characteristics": [
          { "section": "Общие параметры", "name": "Материал", "value": "", "unit": "" },
          { "section": "Общие параметры", "name": "Покрытие", "value": "", "unit": "" },
          { "section": "Размеры", "name": "Диаметр", "value": "", "unit": "мм" },
          { "section": "Размеры", "name": "Общая длина", "value": "", "unit": "мм" },
          { "section": "Размеры", "name": "Длина рабочей части", "value": "", "unit": "мм" },
          { "section": "Совместимость", "name": "Тип крепления / хвостовика", "value": "", "unit": "" },
          { "section": "Совместимость", "name": "Подходит для станков", "value": "", "unit": "" },
          { "section": "Упаковка", "name": "Количество в упаковке", "value": "", "unit": "шт" },
          { "section": "Упаковка", "name": "Вес брутто", "value": "", "unit": "кг" }
        ]
      }
    ]'::jsonb, 
    CURRENT_TIMESTAMP
)
ON CONFLICT (module_id, setting_key) 
DO NOTHING;
