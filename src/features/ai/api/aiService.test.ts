import { aiService } from './aiService';

describe('aiService', () => {
  it('should generate folder structure', async () => {
    const res = await aiService.generateFolderStructure({ documents: [{ _id: 'd1', title: 'test' }] });
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
  });

  it('should propose global folder structure', async () => {
    const res = await aiService.proposeGlobalFolderStructure();
    expect(res.success).toBe(true);
    expect(res.data.folders).toBeDefined();
  });

  it('should synthesize documents', async () => {
    const res = await aiService.synthesize(['d1', 'd2']);
    expect(res.success).toBe(true);
    expect(res.data.synthesis).toBeDefined();
  });

  it('should apply semantic folders', async () => {
    const res = await aiService.applySemanticFolders([{ documentId: 'd1', newPath: '/new' }]);
    expect(res.success).toBe(true);
  });
});
