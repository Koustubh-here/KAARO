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
  REACT_APP_UNSPLASH_ACCESS_KEY: 'test-unsplash-key',
}));

// Mock datetimepicker for Jest (avoid ESM parsing from node_modules)
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock react-native-image-picker (avoid ESM parsing and native APIs in Jest)
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ assets: [] })),
  launchCamera: jest.fn(async () => ({ assets: [] })),
}));


