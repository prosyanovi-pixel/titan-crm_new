import { detectLegalFormFromName } from '../contractor-utils';

describe('contractor-utils', () => {
  describe('detectLegalFormFromName', () => {
    const legalFormsList = [
      { id: 'ooo', keywords: 'ооо, общество с ограниченной ответственностью', groupId: 'legal' },
      { id: 'ip', keywords: 'ип, индивидуальный предприниматель', groupId: 'individual' },
      { id: 'pao', keywords: 'пао, публичное акционерное общество', groupId: 'legal' },
    ];

    it('should detect ООО from full name', () => {
      const result = detectLegalFormFromName('Общество с ограниченной ответственностью "Ромашка"', legalFormsList);
      expect(result).toEqual({ id: 'ooo', groupId: 'legal' });
    });

    it('should detect ИП from short name', () => {
      const result = detectLegalFormFromName('ИП Иванов Иван Иванович', legalFormsList);
      expect(result).toEqual({ id: 'ip', groupId: 'individual' });
    });

    it('should detect ПАО from full name', () => {
      const result = detectLegalFormFromName('Публичное акционерное общество "Газпром"', legalFormsList);
      expect(result).toEqual({ id: 'pao', groupId: 'legal' });
    });

    it('should return null if no keywords match', () => {
      const result = detectLegalFormFromName('Unknown Entity "Test"', legalFormsList);
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const result = detectLegalFormFromName('ооо "вектор"', legalFormsList);
      expect(result?.id).toBe('ooo');
    });

    it('should return null on empty name', () => {
      const result = detectLegalFormFromName('', legalFormsList);
      expect(result).toBeNull();
    });
  });
});
