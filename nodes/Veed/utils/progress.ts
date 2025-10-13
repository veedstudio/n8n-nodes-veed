import type { FalLogEntry } from './api';

/**
 * Progress extraction utility for fal.ai logs
 */
export function extractProgress(logs: FalLogEntry[]): number | null {
	if (!logs || !logs.length) {
		return null;
	}

	const lastMessage = logs[logs.length - 1]?.message;
	if (!lastMessage) {
		return null;
	}

	// Extract progress from "Diffusing: 45%" pattern
	const match = lastMessage.match(/Diffusing:\s+(\d+)(?=%)/);

	return match ? parseInt(match[1], 10) : null;
}
