import { describe, it, expect } from 'vitest';
import { validateUrl } from '../../../../nodes/Veed/utils/validators';

describe('Validators', () => {
	describe('validateUrl', () => {
		it('should throw error for empty URL', () => {
			expect(() => validateUrl('', 'Image URL')).toThrow('Image URL is required');
		});

		it('should throw error for invalid URL format', () => {
			expect(() => validateUrl('not-a-url', 'Image URL')).toThrow('Invalid image url format');
		});

		it('should throw error for non-HTTP(S) protocol', () => {
			expect(() => validateUrl('ftp://example.com/file.jpg', 'Image URL')).toThrow(
				'Invalid image url format',
			);
		});

		it('should accept valid HTTP URL', () => {
			expect(() => validateUrl('http://example.com/image.jpg', 'Image URL')).not.toThrow();
		});

		it('should accept valid HTTPS URL', () => {
			expect(() => validateUrl('https://example.com/image.jpg', 'Image URL')).not.toThrow();
		});

		it('should accept URLs without file extensions (CDN URLs)', () => {
			expect(() =>
				validateUrl('https://images.unsplash.com/photo-123?w=800&h=800', 'Image URL'),
			).not.toThrow();
		});

		it('should work with different field names', () => {
			expect(() => validateUrl('', 'Audio URL')).toThrow('Audio URL is required');
			expect(() => validateUrl('not-a-url', 'Audio URL')).toThrow('Invalid audio url format');
			expect(() => validateUrl('https://example.com/audio.mp3', 'Audio URL')).not.toThrow();
		});
	});
});