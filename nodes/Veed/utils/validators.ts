/**
 * Input validation utilities for Veed node
 */

export function validateImageUrl(url: string): void {
	if (!url) {
		throw new Error('Image URL is required');
	}

	if (!isValidUrl(url)) {
		throw new Error('Invalid image URL format');
	}

	const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
	const hasValidExtension = validExtensions.some((ext) => url.toLowerCase().includes(ext));

	if (!hasValidExtension) {
		throw new Error('Image URL must point to a valid image file (JPG, PNG, WebP)');
	}
}

export function validateAudioUrl(url: string): void {
	if (!url) {
		throw new Error('Audio URL is required');
	}

	if (!isValidUrl(url)) {
		throw new Error('Invalid audio URL format');
	}

	const validExtensions = ['.mp3', '.wav', '.m4a', '.aac'];
	const hasValidExtension = validExtensions.some((ext) => url.toLowerCase().includes(ext));

	if (!hasValidExtension) {
		throw new Error('Audio URL must point to a valid audio file (MP3, WAV, M4A, AAC)');
	}
}

function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}
