import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('*/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          token: 'fake-token-123',
          user: { _id: '1', username: 'testuser', email: 'test@test.com', persona: 'general' }
        }
      })
    );
  }),
  rest.post('*/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          token: 'fake-token-123',
          user: { _id: '2', username: 'newuser', email: 'new@test.com', persona: 'developer' }
        }
      })
    );
  }),
  rest.get('*/auth/me', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: { _id: '1', username: 'testuser', email: 'test@test.com', persona: 'general' }
      })
    );
  }),

  // Document endpoints
  rest.get('*/documents', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        count: 2,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2, limit: 10 },
        data: [
          { _id: 'd1', title: 'Doc 1', fileType: 'PDF', aiStatus: 'Analyzed', cognitiveLoad: 'Light', tags: [] },
          { _id: 'd2', title: 'Doc 2', fileType: 'Image', aiStatus: 'Pending', cognitiveLoad: 'Medium', tags: [] }
        ]
      })
    );
  }),

  // AI endpoints
  rest.post('*/ai/organize-folder', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: { folder: '/organized' }
      })
    );
  }),
  rest.post('*/folders/propose', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: { folders: [] }
      })
    );
  }),
  rest.post('*/ai/synthesize', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: { synthesis: 'This is a mocked synthesis' }
      })
    );
  }),
  rest.put('*/ai/apply-folders', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Folders applied'
      })
    );
  }),
];
