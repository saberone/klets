import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { colors } from '../theme/colors.js';
import { useUpdateCheck } from '../hooks/use-update-check.js';
import { performUpdate } from '../update/install.js';
import { stop as stopPlayer } from '../player/index.js';
import { useStore } from '../store/index.js';

export function UpdateBanner() {
	const { updateAvailable, latestVersion, canAutoUpdate, checking } =
		useUpdateCheck();
	const { exit } = useApp();
	const currentScreen = useStore((s) => s.stack[s.stack.length - 1]!.screen);
	const [updating, setUpdating] = useState(false);

	useInput(
		(input) => {
			if (
				input === 'u' &&
				canAutoUpdate &&
				!updating &&
				currentScreen !== 'search'
			) {
				setUpdating(true);
				stopPlayer();
				exit();

				// Let Ink unmount, then run npm install
				setTimeout(async () => {
					const result = await performUpdate();
					if (result.success) {
						console.log(`\n✓ klets is bijgewerkt naar v${latestVersion}!`);
					} else {
						console.error(`\n✗ Update mislukt: ${result.message}`);
					}
					process.exit(result.success ? 0 : 1);
				}, 150);
			}
		},
		{ isActive: updateAvailable && canAutoUpdate },
	);

	if (checking || !updateAvailable) return null;

	if (updating) {
		return (
			<Box paddingX={1}>
				<Text color={colors.warning}>⟳ Bezig met bijwerken…</Text>
			</Box>
		);
	}

	return (
		<Box paddingX={1}>
			<Text color={colors.warning}>▲ </Text>
			{canAutoUpdate ? (
				<Text color={colors.text}>
					Nieuwe versie beschikbaar:{' '}
					<Text color={colors.warning} bold>
						{latestVersion}
					</Text>
					<Text color={colors.textMuted}>
						{' '}
						— druk op <Text bold>u</Text> om bij te werken
					</Text>
				</Text>
			) : (
				<Text color={colors.text}>
					Nieuwe versie beschikbaar:{' '}
					<Text color={colors.warning} bold>
						{latestVersion}
					</Text>
					<Text color={colors.textMuted}>
						{' '}
						— npm install -g klets@latest
					</Text>
				</Text>
			)}
		</Box>
	);
}
