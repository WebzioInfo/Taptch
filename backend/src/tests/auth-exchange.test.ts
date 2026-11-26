import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../modules/auth/auth.service';
import { AuthController } from '../modules/auth/auth.controller';

describe('AuthService & AuthController — Single-Use Ticket Exchange Flow', () => {
  let authService: AuthService;
  let authController: AuthController;
  let mockDbService: any;
  let mockRedisService: any;
  let cacheStore: Map<string, string>;

  beforeEach(() => {
    cacheStore = new Map();
    mockDbService = {
      db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
      },
    };

    mockRedisService = {
      getCacheStatus: vi.fn().mockReturnValue({ mode: 'in-memory', status: 'operational', connected: false }),
      set: vi.fn().mockImplementation((key, val) => {
        cacheStore.set(key, val);
        return Promise.resolve();
      }),
      get: vi.fn().mockImplementation((key) => {
        return Promise.resolve(cacheStore.get(key) || null);
      }),
      del: vi.fn().mockImplementation((key) => {
        cacheStore.delete(key);
        return Promise.resolve();
      }),
    };

    authService = new AuthService(mockDbService, mockRedisService);
    authController = new AuthController(authService);
  });

  it('createExchangeCode should generate a random ticket and store it in cache', async () => {
    const code = await authService.createExchangeCode('session_token_123', 'user_id_456');

    expect(code).toBeDefined();
    expect(typeof code).toBe('string');
    expect(mockRedisService.set).toHaveBeenCalledWith(
      `auth:code:${code}`,
      JSON.stringify({ token: 'session_token_123', userId: 'user_id_456' }),
      60,
    );
  });

  it('consumeExchangeCode should be strictly single-use and destroy code immediately', async () => {
    const code = await authService.createExchangeCode('session_token_123', 'user_id_456');

    // First consumption: Success
    const consumed = await authService.consumeExchangeCode(code);
    expect(consumed).toEqual({ token: 'session_token_123', userId: 'user_id_456' });
    expect(mockRedisService.del).toHaveBeenCalledWith(`auth:code:${code}`);

    // Second consumption: Fails (atomic destruction)
    const secondTry = await authService.consumeExchangeCode(code);
    expect(secondTry).toBeNull();
  });

  it('exchangeCode controller endpoint should exchange valid code and set HttpOnly cookie', async () => {
    const code = await authService.createExchangeCode('session_token_123', 'user_id_456');

    vi.spyOn(authService, 'getSession').mockResolvedValueOnce({
      user: { id: 'user_id_456', email: 'test@example.com', name: 'Test User', systemRole: 'user', accountType: 'personal' },
      session: { token: 'session_token_123', expiresAt: new Date(Date.now() + 10000) } as any,
    });

    const mockResponse = {
      cookie: vi.fn(),
    };

    const res = await authController.exchangeCode({ code }, mockResponse as any);

    expect(res).toBeDefined();
    expect(res.user?.email).toBe('test@example.com');
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'better-auth.session_token',
      'session_token_123',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });
});
