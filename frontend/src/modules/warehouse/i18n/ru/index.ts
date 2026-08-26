export const warehouse = {
  title: "Склад",
  subtitle: "Управление складом",
  breadcrumb: "Склад",
  tabs: {
    balances: "Остатки",
    warehouses: "Склады",
    transactions: "Движения"
  },
  types: {
    main: "Основной",
    retail: "Розничный",
    transit: "Транзитный"
  },
  balances: {
    save_product_first: "Сначала сохраните товар, чтобы увидеть остатки",
    no_data: "Нет данных об остатках для этого товара"
  },
  create_success: "Склад успешно создан",
  create_error: "Ошибка при создании склада",
  update_success: "Склад успешно обновлен",
  update_error: "Ошибка при обновлении склада",
  columns: {
    balances: {
      skuInternal: "Артикул",
      productName: "Товар",
      warehouseName: "Склад",
      quantity: "В наличии",
      reservedQuantity: "В резерве",
      available: "Доступно",
    },
    warehouses: {
      name: "Название",
      type: "Тип",
      address: "Адрес",
      status: "Статус",
    },
    transactions: {
      createdAt: "Дата",
      type: "Тип",
      productName: "Товар",
      warehouseName: "Склад",
      quantity: "Количество",
    },
  },
  warehouse: {
    type: "Тип",
    address: "Адрес",
    sku: "Артикул",
    product: "Товар",
    warehouse: "Склад",
    quantity: "В наличии",
    reserved: "В резерве",
    available: "Доступно",
    date: "Дата"
  },
  transaction: {
    receipt: "Приход",
    shipment: "Расход",
    transfer: "Перемещение",
    adjustment: "Корректировка",
    reserve: "Резерв",
    unreserve: "Снятие резерва",
    new: "Новое движение",
    created: "Движение создано",
  },
  warehouse_new: "Новый склад",
  actions: {
    edit: "Редактировать",
    delete: "Удалить",
    cancel: "Отмена",
    save: "Сохранить",
    coming_soon: "В разработке...",
  },
  toolbar: {
    search_placeholder: "Поиск...",
    filter_all: "Все",
  },
  lists: {
    empty_balances: "Нет остатков на складах",
    empty_warehouses: "Нет складов",
    empty_transactions: "Нет движений",
  },
  form: {
    title_edit: "Редактировать движение",
    title_add: "Новое движение",
    description: "Заполните данные о движении товара",
    errors: {
      transaction_created: "Движение создано",
      transaction_created_error: "Не удалось создать движение",
    },
    schema: {
      required_field: "Обязательное поле",
      quantity_min: "Количество должно быть больше 0",
    },
  },
  common: {
    coming_soon: "В разработке..."
  }
};
