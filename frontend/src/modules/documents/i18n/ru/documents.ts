/**
 * Переводы модуля «Документы»
 */
const documents = {
  title: "Документы",
  subtitle: "Корпоративное хранилище файлов",
  upload: "Загрузить",
  search_placeholder: "Поиск файлов...",
  storage: {
    title: "Хранилище",
    used: "Использовано",
    total: "Всего",
    files: "файлов"
  },
  categories: {
    all: "Все файлы",
    recent: "Недавние",
    starred: "Избранное",
    trash: "Корзина",
    templates: "Шаблоны"
  },
  trash: {
    clear: "Очистить корзину",
    clear_title: "Очистить корзину",
    clear_description: "Удалить безвозвратно все файлы и папки в корзине ({count})?",
    clear_success: "Корзина очищена",
    clear_error: "Не удалось очистить корзину",
  },
  bulk: {
    selected: "Выбрано",
    delete: "Удалить",
    move: "Переместить",
    rename: "Переименовать",
    move_title: "Переместить выбранные файлы",
    move_description: "Выберите папку назначения для выбранных документов.",
    move_target: "Папка назначения",
    move_target_placeholder: "Выберите папку",
    root_folder: "Корневая папка",
    move_success: "Файлы перемещены",
    move_error: "Не удалось переместить файлы",
    move_invalid_target: "Нельзя переместить элемент в сам элемент.",
    rename_title: "Массовое переименование",
    rename_description: "Введите базовое имя. При выборе нескольких файлов к нему будет добавлен порядковый номер.",
    rename_label: "Новое имя",
    rename_placeholder: "Например: Договор",
    rename_hint: "Будет переименовано файлов",
    rename_success: "Файлы переименованы",
    rename_error: "Не удалось переименовать файлы",
    rename_required: "Введите новое имя",
  },
  types: {
    folder: "Папка",
    doc: "Документ",
    image: "Изображение",
    archive: "Архив"
  },
  empty: "В этой папке пока нет файлов",
  preview: {
    not_supported: "Предпросмотр недоступен для этого типа файла",
  },
  versions: {
    title: "История версий",
    empty: "История версий пуста",
    current: "Текущая",
    restore: "Восстановить эту версию"
  },
  dialog: {
    create_folder_title: "Создать папку",
    create_folder_description: "Создайте новую папку для организации документов",
    folder_name: "Название папки",
    folder_name_placeholder: "Введите название папки",
    upload_files_title: "Загрузить файлы",
    upload_files_description: "Загрузите файлы в текущую папку",
    select_files: "Выберите файлы",
    selected_files_count: "Выбрано файлов: {count}"
  },
  toast: {
    load_error: "Не удалось загрузить документы",
    star_success_added: "Добавлено в избранное",
    star_success_removed: "Удалено из избранного",
    star_error: "Ошибка при изменении избранного",
    template_success_added: "Добавлено в шаблоны",
    template_success_removed: "Удалено из шаблонов",
    template_error: "Ошибка при изменении статуса шаблона",
    folder_create_success: "Папка создана",
    folder_create_error: "Ошибка при создании папки",
    delete_success: "Удалено файлов: {count}",
    delete_error: "Ошибка при удалении файлов",
    restore_success: "Восстановлено файлов: {count}",
    restore_error: "Ошибка при восстановлении файлов",
    download_error: "Ошибка при скачивании файла",
    share_success: "Ссылка скопирована",
    share_error: "Ошибка при создании ссылки",
    file_upload_error: "Не удалось загрузить файл {name}",
    files_upload_success: "Загружено файлов: {count}",
    file_missing_warning: "Файл не найден на сервере"
  }
};

export default documents;
export { documents };
