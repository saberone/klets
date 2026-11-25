import { useState, useEffect, useRef } from 'react';
import { colors } from '../theme/colors.js';

function hexToRgb(hex: string): [number, number, number] {
	const n = Number.parseInt(hex.slice(1), 16);
	return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
	return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Linear blend between two hex colours, t in [0, 1]. */
export function mixHex(from: string, to: string, t: number): string {
	const a = hexToRgb(from);
	const b = hexToRgb(to);
	return rgbToHex([
		Math.round(a[0] + (b[0] - a[0]) * t),
		Math.round(a[1] + (b[1] - a[1]) * t),
		Math.round(a[2] + (b[2] - a[2]) * t),
	]);
}

/**
 * A looping wave from `from` to `to` and back, with `steps` intermediate
 * colours each way: [from, …steps…, to, …steps reversed…].
 */
export function buildWavePalette(from: string, to: string, steps = 2): string[] {
	const forward: string[] = [];
	for (let i = 0; i <= steps + 1; i++) {
		forward.push(mixHex(from, to, i / (steps + 1)));
	}
	const back = forward.slice(1, -1).reverse();
	return [...forward, ...back];
}

// cyan → #51d7e7 → #a3bfd0 → coral → #a3bfd0 → #51d7e7
export const PALETTE = buildWavePalette(colors.cyan, colors.coral);

interface UseColorWaveOptions {
	active?: boolean;
	speed?: number;
}

export function useColorWave({
	active = true,
	speed = 200,
}: UseColorWaveOptions = {}): string[] {
	const [offset, setOffset] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!active) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		intervalRef.current = setInterval(() => {
			setOffset((prev) => (prev + 1) % PALETTE.length);
		}, speed);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [active, speed]);

	const colors: string[] = [];
	for (let i = 0; i < PALETTE.length; i++) {
		colors.push(PALETTE[(i + offset) % PALETTE.length]!);
	}

	return colors;
}
