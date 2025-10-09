import { describe, it, expect } from 'vitest';
import { validateImageUrl, validateAudioUrl } from '../../../../nodes/Veed/utils/validators';

describe('Validators', () => {
	describe('validateImageUrl', () => {
		it('should throw error for empty URL', () => {
			expect(() => validateImageUrl('')).toThrow('Image URL is required');
		});

		it('should throw error for invalid URL format', () => {
			expect(() => validateImageUrl('not-a-url')).toThrow('Invalid image URL format');
		});

		it('should throw error for non-image file', () => {
			expect(() => validateImageUrl('https://example.com/file.pdf')).toThrow(
				'Image URL must point to a valid image file',
			);
		});

		it('should accept valid JPG URL', () => {
			expect(() => validateImageUrl('https://example.com/image.jpg')).not.toThrow();
		});

		it('should accept valid PNG URL', () => {
			expect(() => validateImageUrl('https://example.com/image.png')).not.toThrow();
		});

		it('should accept valid WebP URL', () => {
			expect(() => validateImageUrl('https://example.com/image.webp')).not.toThrow();
		});

		it('should be case-insensitive for extensions', () => {
			expect(() => validateImageUrl('https://example.com/image.JPG')).not.toThrow();
			expect(() => validateImageUrl('https://example.com/image.PNG')).not.toThrow();
		});
	});

	describe('validateAudioUrl', () => {
		it('should throw error for empty URL', () => {
			expect(() => validateAudioUrl('')).toThrow('Audio URL is required');
		});

		it('should throw error for invalid URL format', () => {
			expect(() => validateAudioUrl('invalid-url')).toThrow('Invalid audio URL format');
		});

		it('should throw error for non-audio file', () => {
			expect(() => validateAudioUrl('https://example.com/file.txt')).toThrow(
				'Audio URL must point to a valid audio file',
			);
		});

		it('should accept valid MP3 URL', () => {
			expect(() => validateAudioUrl('https://example.com/audio.mp3')).not.toThrow();
		});

		it('should accept valid WAV URL', () => {
			expect(() => validateAudioUrl('https://example.com/audio.wav')).not.toThrow();
		});

		it('should accept valid M4A URL', () => {
			expect(() => validateAudioUrl('https://example.com/audio.m4a')).not.toThrow();
		});

		it('should accept valid AAC URL', () => {
			expect(() => validateAudioUrl('https://example.com/audio.aac')).not.toThrow();
		});

		it('should be case-insensitive for extensions', () => {
			expect(() => validateAudioUrl('https://example.com/audio.MP3')).not.toThrow();
		});
	});
});
