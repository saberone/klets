import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';

const KATAKANA_START = 0xff66; // ｦ
const KATAKANA_END = 0xff9d; // ﾝ
const DIGITS = '0123456789';

function randomChar(): string {
	if (Math.random() < 0.3) {
		return DIGITS[Math.floor(Math.random() * DIGITS.length)]!;
	}
	const code =
		KATAKANA_START +
		Math.floor(Math.random() * (KATAKANA_END - KATAKANA_START + 1));
	return String.fromCharCode(code);
}

interface Column {
	head: number;
	speed: number;
	chars: string[];
	delay: number;
}

function createColumn(height: number): Column {
	return {
		head: -Math.floor(Math.random() * height),
		speed: 1 + Math.floor(Math.random() * 2),
		chars: Array.from({ length: height }, () => ' '),
		delay: Math.floor(Math.random() * 10),
	};
}

const HEAD_COLOR = '#00f0ff';
const TRAIL_COLORS = ['#00cc88', '#009966', '#006644', '#003322'];

interface MatrixRainProps {
	width: number;
	height: number;
	active: boolean;
}

export function MatrixRain({ width, height, active }: MatrixRainProps) {
	const [columns, setColumns] = useState<Column[]>([]);
	const tickRef = useRef(0);

	useEffect(() => {
		if (!active) {
			setColumns([]);
			tickRef.current = 0;
			return;
		}

		const cols = Array.from({ length: width }, () => createColumn(height));
		setColumns(cols);

		const interval = setInterval(() => {
			tickRef.current++;
			setColumns((prev) =>
				prev.map((col) => {
					if (col.delay > 0) {
						return { ...col, delay: col.delay - 1 };
					}

					const newChars = [...col.chars];
					const head = col.head;

					if (head >= 0 && head < height) {
						newChars[head] = randomChar();
					}

					const nextHead = head + col.speed;

					if (nextHead > height + 8) {
						return createColumn(height);
					}

					return { ...col, head: nextHead, chars: newChars };
				}),
			);
		}, 100);

		return () => clearInterval(interval);
	}, [active, width, height]);

	if (!active || columns.length === 0) return null;

	return (
		<Box flexDirection="row" justifyContent="center">
			{columns.map((col, x) => (
				<Box key={x} flexDirection="column">
					{col.chars.slice(0, height).map((char, y) => {
						const dist = col.head - y;
						let color: string | undefined;

						if (dist === 0 && col.delay <= 0) {
							color = HEAD_COLOR;
						} else if (dist > 0 && dist <= TRAIL_COLORS.length) {
							color = TRAIL_COLORS[dist - 1];
						}

						return (
							<Text key={y} color={color} dimColor={dist > TRAIL_COLORS.length}>
								{color || char !== ' ' ? char : ' '}
							</Text>
						);
					})}
				</Box>
			))}
		</Box>
	);
}
