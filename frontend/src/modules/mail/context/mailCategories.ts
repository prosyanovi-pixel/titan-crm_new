export interface MailCategory {
  id: string;
  name: string;
  keywords: string;
  icon: string;
  isSystem?: boolean;
}

export type MailCategorySettings = MailCategory[];

export const defaultCategories: MailCategorySettings = [
  { id: 'social', name: 'Социальные сети', keywords: 'facebook, instagram, vk, вконтакте, linkedin, twitter, ok.ru, pinterest, social', icon: 'Share2', isSystem: true },
  { id: 'newsletters', name: 'Рассылки', keywords: 'newsletter, no-reply, info@, рассылка, promo, news, sale, акция', icon: 'Megaphone', isSystem: true },
  { id: 'government', name: 'Госписьма', keywords: 'гос, gos, nalog, налог, mos.ru, gosuslugi, госуслуги, pfr, пфр', icon: 'Landmark', isSystem: true },
  { id: 'orders', name: 'Заказы', keywords: 'order, заказ, delivery, доставка, покупка, чек, receipt, tracking', icon: 'ShoppingBag', isSystem: true },
  { id: 'finance', name: 'Финансы', keywords: 'bank, банк, card, карта, invoice, счет, payment, оплата, tinkoff, sber, сбер, vtb', icon: 'CreditCard', isSystem: true },
];
