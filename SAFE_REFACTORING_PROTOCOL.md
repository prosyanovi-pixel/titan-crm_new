 Вот протокол «Безопасного рефакторинга», который я рекомендую использовать в будущем:

  1. Этап «Инвентаризация» (Анализ связей)
  Перед тем как менять код на бэкенде, нужно провести поиск всех упоминаний этих
  эндпоинтов:
   * Где искать: В папке frontend/src и в файлах тестов backend/tests или api/__tests__.
   * Что искать: Строки вида /api/statuses, /api/admin, api.get('....
   * Инструмент: grep_search по коду фронтенда дает точный список того, что «сломается»
     после смены пути.

  2. Принцип «Legacy First» (Совместимость)
  При рефакторинге архитектуры (переход на модули) всегда нужно закладывать слой
  совместимости:
   * Если вы переносите /api/users в модуль administration (где он становится
     /api/administration/users), в основном файле index.js должен остаться «алиас» или
     редирект.
   * Как это делать технически: Использовать промежуточное ПО (middleware) или просто
     монтировать тот же роутер по двум путям (как мы сделали сейчас).

  3. Автоматизированная проверка (Smoke Tests)
  До и после рефакторинга полезно иметь список «контрольных точек»:
   * Создать простой скрипт (например, check-routes.sh или тест в Jest), который просто
     проверяет 200 OK для списка критических эндпоинтов.
   * Если после изменений тест выдает 404, значит, слой совместимости не настроен.

  4. Использование Констант (Shared API Map)
  В идеале, пути к API не должны быть разбросаны строками по всему фронтенду.
   * Рекомендация: Создать файл api-map.ts, где описаны все эндпоинты. Тогда при
     рефакторинге бэкенда нужно будет изменить путь только в одном месте на фронтенде.

  Почему это произошло в случае с administration-module.md?
  План administration-module.md фокусировался на внутренней чистоте бэкенда (структура
  папок, разделение ответственности), но не учитывал внешние контракты (API, которое
  ожидает фронтенд). 

  Мой совет: В следующий раз при выполнении подобного плана, я буду первым делом
  составлять таблицу соответствия:
  ┌───────────────┬───────────────────────────┬──────────────────────────┐
  │ Старый путь   │ Новый путь в модуле       │ Требуется алиас?         │
  ├───────────────┼───────────────────────────┼──────────────────────────┤
  │ /api/users    │ /api/administration/users │ Да (фронтенд использует) │
  │ /api/statuses │ /api/settings/statuses    │ Да (фронтенд использует) │

  Полная таблица соответствий backend-контрактов

  ┌───────────────────────────┬──────────────────────────────────────────────┬──────────────────────────────────────────────┬──────────────────────────────┬──────────────┐
  │ Домейн                    │ Фронтенд путь                                │ Текущий backend путь                         │ Канонический/целевой путь    │ Статус       │
  ├───────────────────────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┼──────────────────────────────┼──────────────┤
  │ auth                      │ /auth/*                                      │ /api/auth/*                                  │ /api/auth/*                  │ keep         │
  │ auth profile alias        │ /auth/me, /profile                           │ /api/auth/me, /api/profile                   │ /api/profile                 │ migrate+alias │
  │ profile                   │ /profile/*                                   │ /api/profile/*                               │ /api/profile/*               │ keep         │
  │ administration users      │ /users/*                                     │ /api/users/*                                 │ /api/administration/users/*  │ migrate+alias │
  │ administration roles      │ /roles/*                                     │ /api/roles/*                                 │ /api/administration/roles/*  │ migrate+alias │
  │ administration perms      │ /permissions/*                               │ /api/permissions/*                           │ /api/administration/permissions/* │ migrate+alias │
  │ administration employees  │ /employees/*                                 │ /api/employees/*                             │ /api/administration/employees/* │ migrate+alias │
  │ administration org        │ /org/*                                       │ /api/org/*                                   │ /api/administration/org/*    │ migrate+alias │
  │ administration company    │ /company/*                                   │ /api/company/*                               │ /api/administration/company/* │ migrate+alias │
  │ administration legacy     │ /admin/*                                     │ /api/admin/*                                 │ /api/administration/*        │ migrate+alias │
  │ settings statuses         │ /settings/statuses                           │ /api/statuses/*, /api/settings/statuses/*    │ /api/settings/statuses/*     │ migrate+alias │
  │ settings tags              │ /settings/tags                               │ /api/tags/*, /api/settings/tags/*            │ /api/settings/tags/*         │ migrate+alias │
  │ settings priorities        │ /settings/priorities                         │ /api/priorities/*, /api/settings/priorities/* │ /api/settings/priorities/*   │ migrate+alias │
  │ settings quick actions     │ /quick-actions/*                             │ /api/quick-actions/*                         │ /api/quick-actions/*         │ keep         │
  │ settings relations         │ /relationship-types/*                        │ /api/relationship-types/*                    │ /api/relationship-types/*    │ keep         │
  │ settings user settings     │ /user-settings/*                             │ /api/user-settings/*                         │ /api/user-settings/*         │ keep         │
  │ settings contractor types  │ /contractor-types/*                          │ /api/contractor-types/*                      │ /api/contractor-types/*      │ keep         │
  │ settings legal forms       │ /legal-forms/*                               │ /api/legal-forms/*                           │ /api/legal-forms/*           │ keep         │
  │ module settings            │ /module-settings/*                           │ /api/module-settings/*                       │ /api/module-settings/*       │ keep         │
  │ system settings            │ /system-settings/*                           │ /api/system-settings/*                       │ /api/system-settings/*       │ keep         │
  │ notifications              │ /notifications/*                             │ /api/notifications/*                         │ /api/notifications/*         │ keep         │
  │ case outcomes              │ /case-outcomes/*                             │ /api/case-outcomes/*                         │ /api/case-outcomes/*         │ keep         │
  │ documents                  │ /documents/*                                 │ /api/documents/*                             │ /api/documents/*             │ keep         │
  │ documents file download    │ /documents/download/:id                      │ /api/documents/download/:id                  │ /api/documents/download/:id  │ keep         │
  │ documents checks           │ /documents/check-exists                      │ /api/documents/check-exists                  │ /api/documents/check-exists  │ keep         │
  │ contractors                │ /contractors/*                               │ /api/contractors/*                           │ /api/contractors/*           │ keep         │
  │ contractors references     │ /references/*                                │ /api/references/*                            │ /api/references/*            │ keep         │
  │ tasks                      │ /tasks/*                                     │ /api/tasks/*                                 │ /api/tasks/*                 │ keep         │
  │ lawyers                    │ /lawyers/*                                   │ /api/lawyers/*                               │ /api/lawyers/*               │ keep         │
  │ legal cases                │ /legal-cases/*                               │ /api/legal-cases/*                           │ /api/legal-cases/*           │ keep         │
  │ legal cases files          │ /legal-cases/documents/files/*               │ /api/legal-cases/documents/files/*           │ /api/legal-cases/documents/files/* │ keep   │
  │ calendar                   │ /calendar/events/*                           │ /api/calendar/events/*                       │ /api/calendar/events/*       │ keep         │
  │ projects                   │ /projects/*                                  │ /api/projects/*                              │ /api/projects/*              │ keep         │
  │ finance invoices           │ /finance/invoices/*                          │ /api/finance/invoices/*                      │ /api/finance/invoices/*      │ keep         │
  │ finance payments           │ /finance/payments/*                          │ /api/finance/payments/*                      │ /api/finance/payments/*      │ keep         │
  │ finance categories         │ /finance/categories/*                        │ /api/finance/categories/*                    │ /api/finance/categories/*    │ keep         │
  │ finance statements         │ /finance/statements/*                        │ /api/finance/statements/*                    │ /api/finance/statements/*    │ keep         │
  │ finance imports            │ /finance/import/*                            │ /api/finance/import/*                        │ /api/finance/import/*        │ keep         │
  │ finance reports            │ /finance/reports/*                           │ /api/finance/reports/*                       │ /api/finance/reports/*       │ keep         │
  │ finance project summary    │ /finance/projects/:id/summary                │ /api/finance/projects/:id/summary            │ /api/finance/projects/:id/summary │ keep   │
  │ finance calendar payments  │ /finance/calendar-payments                   │ /api/finance/calendar-payments               │ /api/finance/calendar-payments │ keep       │
  │ reports                    │ /reports/*                                   │ /api/reports/*                               │ /api/reports/*               │ keep         │
  │ workflow                   │ /workflows/*                                 │ /api/workflows/*                             │ /api/workflows/*             │ keep         │
  │ mail                       │ /mail/*                                      │ /api/mail/*                                  │ /api/mail/*                  │ keep         │
  │ backup                     │ /backup/*                                    │ /api/backup/*                                │ /api/backup/*                │ keep         │
  │ logs                       │ /logs/*                                      │ /api/logs/*                                  │ /api/logs/*                  │ keep         │
  │ dashboard                  │ /dashboard/*                                 │ /api/dashboard/*                             │ /api/dashboard/*             │ keep         │
  │ registry                   │ /registry/*                                  │ /api/registry/*                              │ /api/registry/*              │ keep         │
  │ contracts                  │ /contracts/*                                 │ /api/contracts/*                             │ /api/contracts/*             │ keep         │
  │ courts                     │ /courts/*                                    │ /api/courts/*                                │ /api/courts/*                │ keep         │
  │ auth login/reset           │ /auth/login, /auth/forgot-password, /auth/reset-password │ /api/auth/login, /api/auth/forgot-password, /api/auth/reset-password │ /api/auth/* │ keep │
  └───────────────────────────┴──────────────────────────────────────────────┴──────────────────────────────────────────────┴──────────────────────────────┴──────────────┘

  Примечания к таблице:
   * `frontend путь` показан в логике модуля; если используется внутренний `api`-клиент,
     фактический сетевой URL обычно уже включает `/api` автоматически.
   * Для `administration` и `settings` зафиксирован переходный режим: новый модульный
     путь уже существует, но старые алиасы пока нужны для совместимости.
   * Строки со статусом `keep` означают, что путь уже совпадает с целевым и не требует
     миграции, кроме возможной стандартизации тестов и документации.

  Старые роуты, которые обязательно учитывать в плане рефакторинга
   * Локальные legacy-алиасы из `backend/index.js`:
     /api/users, /api/roles, /api/permissions, /api/employees, /api/org, /api/company,
     /api/profile, /api/auth/me, /api/admin, /api/statuses, /api/tags, /api/priorities.
   * Старые сервисные и доменные маршруты, которые сейчас монтируются из `routes/*`:
     /api/references, /api/courts, /api/contracts, /api/quick-actions, /api/user-settings,
     /api/module-settings, /api/system-settings, /api/notifications, /api/case-outcomes.
   * Служебные API, которые уже активно используются фронтендом и должны попасть в smoke
     tests до удаления legacy-слоя: /api/mail, /api/logs, /api/backup, /api/documents,
     /api/contractors, /api/legal-cases, /api/projects, /api/tasks, /api/lawyers,
     /api/calendar, /api/finance, /api/reports, /api/workflows, /api/registry,
     /api/dashboard.
   * Правило планирования: сначала обновляем старые роуты, у которых есть явный новый
     модульный домен и уже существует alias-совместимость; потом переносим остальные
     `routes/*` в модули; только после этого удаляем старые подключения.

    Порядок обновления старых роутов в самом плане рефакторинга
    1. Сначала алиасы, уже прикрытые новыми модулями и тестами:
      /api/users, /api/roles, /api/permissions, /api/employees, /api/org, /api/company,
      /api/statuses, /api/tags, /api/priorities, /api/profile, /api/auth/me.
      Причина: у них уже есть явный целевой домен, и их проще всего перевести на новый
      путь без изменения бизнес-логики.
    2. Затем legacy-роуты из `routes/*`, которые имеют понятный модульный домен:
      /api/user-settings, /api/module-settings, /api/system-settings, /api/notifications,
      /api/case-outcomes, /api/references, /api/quick-actions.
      Причина: эти маршруты можно по одному вынести в соответствующие modules/* без
      затрагивания остальных доменов.
    3. Потом домены, где фронтенд уже широко использует стабильный контракт и важны
      smoke-тесты:
      /api/documents, /api/contractors, /api/legal-cases, /api/projects, /api/tasks,
      /api/lawyers, /api/calendar, /api/finance, /api/reports, /api/workflows,
      /api/registry, /api/dashboard, /api/mail, /api/logs, /api/backup.
      Причина: эти API критичны для приложения, поэтому их лучше трогать только после
      того, как будет готова система проверок и таблица соответствий.
    4. В конце — оставшиеся технические и вспомогательные маршруты, которые не видны
      как прямой бизнес-контракт, но все еще живут в старой архитектуре.
      Причина: их проще мигрировать, когда основной public API уже стабилен.

    Как использовать этот порядок в рабочем плане
    * В каждый спринт или этап брать только один блок из списка выше.
    * Для каждого пути перед изменением фиксировать: текущий маршрут, новый маршрут,
      нужен ли alias, есть ли frontend usage, есть ли smoke-test.
    * Не переходить к следующему блоку, пока для текущего блока не закрыты тесты и
      совместимость.
  
  5. План рефакторинга backend для текущего проекта
  Короткий вывод по состоянию backend:
   * Сейчас это гибридная схема: часть API уже живет в modules/* с prefix, а часть
     все еще подключается из root index.js и routes/*. Это нормально для переходного
     периода, но главный риск — случайно сломать публичные URL.
   * root index.js перегружен: там одновременно проверка env, проверка БД, middleware,
     регистрация legacy-алиасов и запуск сервисов. Это нужно разнести по ролям.
   * Модульная основа уже есть: settings, administration, profile, auth, logs, backup
     и ряд доменных модулей. Значит, рефакторинг должен идти через укрепление этой
     структуры, а не через переписывание всего backend сразу.

  Этап 1. Инвентаризация контрактов
   * Составить карту всех публичных эндпоинтов backend: новый путь, старый путь,
     где используется во frontend, есть ли тест.
   * Отдельно пометить legacy-алиасы из index.js: /api/users, /api/roles,
     /api/permissions, /api/employees, /api/org, /api/company, /api/statuses,
     /api/tags, /api/priorities, /api/admin, /api/profile, /api/auth/me.
   * Для каждого маршрута решить один из трех статусов: keep, migrate with alias,
     retire.

  Этап 2. Разделение композиционного слоя
   * Вынести сборку приложения из index.js в отдельный bootstrap/app composition
     слой.
   * Оставить в index.js только запуск: загрузка env, создание app/server,
     подключение bootstrap, start listen.
   * Разнести побочные эффекты по отдельным модулям: env validation, db health check,
     logging, websocket, cacheCleaner, syncScheduler, enrichment resume.

  Этап 3. Укрепление модульной схемы
   * Для модулей, которые уже имеют prefix, сделать единый контракт экспорта:
     router, prefix, optional subrouters/legacy aliases.
   * Для старых routes/* либо перенести код в соответствующие modules/*, либо явно
     пометить как transitional layer, чтобы не смешивать их с новыми модулями.
   * Для administration/settings довести структуру до единого стандарта и убрать
     ручную регистрацию дочерних роутов из root index.js по мере миграции.

  Этап 4. Legacy compatibility
   * Сохранить алиасы для публичных контрактов до тех пор, пока frontend и тесты не
     перейдут на новые пути.
   * Для каждого алиаса добавить комментарий или таблицу в протоколе с датой
     пересмотра и условием удаления.
   * Не удалять старый путь, пока нет smoke-теста на новый путь и подтверждения, что
     frontend его уже использует.

  Этап 5. Smoke tests
   * Сделать минимальный набор проверок на 200 OK для критических маршрутов:
     auth, profile, administration, settings, documents, contractors, legal cases,
     finance, logs.
   * Добавить отдельный тест на legacy alias paths, чтобы рефакторинг не ломал
     совместимость.
   * После каждого крупного шага запускать этот набор как обязательную проверку.

  Этап 6. Shared API map
   * Вынести пути API во frontend в единый map-конфиг, чтобы путь менялся в одном
     месте.
   * Это особенно важно для маршрутов settings и administration, где сейчас есть
     риск расхождения между новым и старым путями.

  Этап 7. Критерии готовности
   * Все публичные маршруты либо работают через новый модульный путь, либо имеют
     задокументированный alias.
   * Root index.js не содержит доменной логики, только композицию и запуск.
   * Есть smoke-тесты на критические маршруты и legacy-алиасы.
   * Нет скрытых переходов между modules/* и routes/* без явного ownership.

  Рекомендуемый порядок работ:
   1) инвентаризация и таблица маршрутов;
   2) выделение bootstrap/app composition;
   3) унификация modules/settings и modules/administration;
   4) перенос старых routes/* в модули;
   5) smoke-тесты и только затем удаление legacy-алиасов.