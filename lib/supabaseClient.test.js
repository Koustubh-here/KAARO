import { supabase } from './supabaseClient';

describe('supabase client', () => {
	it('initializes and exposes from()', () => {
		expect(supabase).toBeTruthy();
		expect(typeof supabase.from).toBe('function');
	});
});
