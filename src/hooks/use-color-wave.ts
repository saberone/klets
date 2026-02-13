import { useState, useEffect, useRef } from 'react';

const PALETTE = [
	'#00f0ff', // baby blue
	'#4080ff',
	'#8040ff',
	'#bf00ff', // pink
	'#8040ff',
	'#4080ff',
];

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
