jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
    clear: jest.fn(async () => {}),
  },
}));

// Mock ESM-only RN polyfill in Jest
jest.mock('react-native-url-polyfill/auto', () => ({}));

// Mock env vars used by Supabase client
jest.mock('@env', () => ({
  SUPABASE_URL: 'http://localhost',
  SUPABASE_ANON_KEY: 'anon',
}));


