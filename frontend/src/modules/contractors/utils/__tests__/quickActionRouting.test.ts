import { getContractorQuickSheetKind } from '../quickActionRouting';

describe('quickActionRouting', () => {
  it('maps task aliases to the task sheet', () => {
    expect(getContractorQuickSheetKind('task')).toBe('task');
    expect(getContractorQuickSheetKind('create_task')).toBe('task');
  });

  it('maps claim aliases to the claim sheet', () => {
    expect(getContractorQuickSheetKind('claim')).toBe('claim');
    expect(getContractorQuickSheetKind('create_claim')).toBe('claim');
  });

  it('maps project, event and reminder aliases', () => {
    expect(getContractorQuickSheetKind('project')).toBe('project');
    expect(getContractorQuickSheetKind('create_project')).toBe('project');
    expect(getContractorQuickSheetKind('event')).toBe('event');
    expect(getContractorQuickSheetKind('create_event')).toBe('event');
    expect(getContractorQuickSheetKind('reminder')).toBe('reminder');
    expect(getContractorQuickSheetKind('create_reminder')).toBe('reminder');
  });

  it('returns null for unrelated actions', () => {
    expect(getContractorQuickSheetKind('send_email')).toBeNull();
    expect(getContractorQuickSheetKind('archive')).toBeNull();
  });
});
