import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('got', () => ({ default: vi.fn() }));
vi.mock('../../../src/utils/persistence.js', () => ({
	loadJson: vi.fn(),
	saveJson: vi.fn().mockResolvedValue(undefined),
}));

import got from 'got';
import { loadJson, saveJson } from '../../../src/utils/persistence.js';
import {
	isNewerVersion,
	isValidVersion,
	checkForUpdate,
} from '../../../src/update/check.js';

const mockGot = vi.mocked(got) as unknown as ReturnType<typeof vi.fn>;
const mockLoadJson = vi.mocked(loadJson);
const mockSaveJson = vi.mocked(saveJson);

function registryReturns(body: unknown) {
	mockGot.mockReturnValue({ json: () => Promise.resolve(body) });
}

describe('isNewerVersion', () => {
	it('returns true when major is higher', () => {
		expect(isNewerVersion('1.0.0', '2.0.0')).toBe(true);
	});

	it('returns true when minor is higher', () => {
		expect(isNewerVersion('1.0.0', '1.1.0')).toBe(true);
	});

	it('returns true when patch is higher', () => {
		expect(isNewerVersion('1.0.0', '1.0.1')).toBe(true);
	});

	it('returns false when versions are equal', () => {
		expect(isNewerVersion('1.2.3', '1.2.3')).toBe(false);
	});

	it('returns false when current is newer (major)', () => {
		expect(isNewerVersion('2.0.0', '1.0.0')).toBe(false);
	});

	it('returns false when current is newer (minor)', () => {
		expect(isNewerVersion('1.2.0', '1.1.0')).toBe(false);
	});

	it('returns false when current is newer (patch)', () => {
		expect(isNewerVersion('1.0.5', '1.0.3')).toBe(false);
	});

	it('handles multi-digit version numbers', () => {
		expect(isNewerVersion('1.9.0', '1.10.0')).toBe(true);
		expect(isNewerVersion('1.10.0', '1.9.0')).toBe(false);
	});
});

describe('isValidVersion', () => {
	it('accepts plain and pre-release semver versions', () => {
		for (const v of ['0.0.0', '1.2.3', '10.20.30', '1.0.0-beta.1', '1.0.0+build.5']) {
			expect(isValidVersion(v)).toBe(true);
		}
	});

	it('rejects anything else', () => {
		for (const v of [
			'',
			'1.2',
			'v1.2.3',
			'01.2.3',
			'1.2.3 ',
			'1.2.3\u001b[31m',
			'1.2.3\n',
			'latest',
			null,
			123,
		]) {
			expect(isValidVersion(v)).toBe(false);
		}
	});
});

describe('checkForUpdate', () => {
	beforeEach(() => {
		mockGot.mockReset();
		mockLoadJson.mockReset().mockResolvedValue(null);
		mockSaveJson.mockClear();
	});

	it('stores and returns a valid registry version', async () => {
		registryReturns({ version: '99.0.0' });
		const result = await checkForUpdate();
		expect(result).toMatchObject({ updateAvailable: true, latestVersion: '99.0.0' });
		expect(mockSaveJson).toHaveBeenCalledWith(
			'update-check.json',
			expect.objectContaining({ latestVersion: '99.0.0' }),
		);
	});

	it('neither shows nor stores a version that does not match semver', async () => {
		registryReturns({ version: '99.0.0\u001b]52;c;aGFsbG8=\u0007' });
		await expect(checkForUpdate()).rejects.toThrow();
		expect(mockSaveJson).not.toHaveBeenCalled();
	});

	it('ignores a cached version that does not match semver', async () => {
		mockLoadJson.mockResolvedValue({ latestVersion: '99.0.0 extra', checkedAt: Date.now() });
		registryReturns({ version: '0.0.1' });
		const result = await checkForUpdate();
		expect(result).toMatchObject({ updateAvailable: false, latestVersion: '0.0.1' });
		expect(mockGot).toHaveBeenCalled();
	});
});
