/**
 * Input validation utilities for Veed node
 */

export function validateUrl(url: string, fieldName: string): void {
	if (!url) {
		throw new Error(`${fieldName} is required`);
	}

	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			throw new Error(`Invalid ${fieldName.toLowerCase()} format`);
		}
	} catch {
		throw new Error(`Invalid ${fieldName.toLowerCase()} format`);
	}
}
