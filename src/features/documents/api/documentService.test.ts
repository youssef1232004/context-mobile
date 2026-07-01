import { documentService } from './documentService';

describe('documentService', () => {
  it('should fetch documents from API', async () => {
    const res = await documentService.getAll();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
  });
});
