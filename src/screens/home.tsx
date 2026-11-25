import React, { useState, useMemo, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import Gradient from 'ink-gradient';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useColorWave } from '../hooks/use-color-wave.js';
import { useKonamiCode } from '../hooks/use-konami-code.js';
import { playJingle } from '../audio/jingle.js';
import { ScreenContainer } from '../components/screen-container.js';
import { MatrixRain } from '../components/matrix-rain.js';
import { useTerminalSize } from '../hooks/use-terminal-size.js';
import { useStore } from '../store/index.js';
import { isUnfinished, sortHistory } from '../store/history.js';
import { formatDuration } from '../theme/format.js';
import { startEpisodePlayback } from '../player/start-episode.js';
import { useFlashMessage } from '../hooks/use-flash-message.js';

const BANNER_CODE = `\
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗
██║     ██║   ██║██║  ██║██╔══╝
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝`;

const BANNER_KLETS = `\
██╗  ██╗██╗     ███████╗████████╗███████╗
██║ ██╔╝██║     ██╔════╝╚══██╔══╝██╔════╝
█████╔╝ ██║     █████╗     ██║   ███████╗
██╔═██╗ ██║     ██╔══╝     ██║   ╚════██║
██║  ██╗███████╗███████╗   ██║   ███████║
╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚══════╝`;

const RESUME_KEY = 'resume';

interface MenuItem {
	label: string;
	screen:
		| 'episodes-list'
		| 'topics-list'
		| 'persons-list'
		| 'search'
		| 'favorites'
		| 'history'
		| 'moments';
	description: string;
}

const menuItems: MenuItem[] = [
	{
		label: 'Afleveringen',
		screen: 'episodes-list',
		description: 'Bekijk alle afleveringen',
	},
	{
		label: 'Hoogtepunten',
		screen: 'moments',
		description: 'Beste momenten uit de podcast',
	},
	{
		label: 'Onderwerpen',
		screen: 'topics-list',
		description: 'Browse op onderwerp',
	},
	{
		label: 'Personen',
		screen: 'persons-list',
		description: 'Gasten en hosts',
	},
	{
		label: 'Favorieten',
		screen: 'favorites',
		description: 'Opgeslagen afleveringen',
	},
	{
		label: 'Geschiedenis',
		screen: 'history',
		description: 'Eerder beluisterde afleveringen',
	},
	{
		label: 'Zoeken',
		screen: 'search',
		description: 'Zoek in afleveringen',
	},
];

export function HomeScreen() {
	// Selection is kept by key, so it stays on the same item when the
	// "Verder luisteren" row appears or disappears. null = first item.
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const { navigate } = useNavigation();
	const history = useStore((s) => s.history);
	const playingSlug = useStore((s) => s.currentEpisodeSlug);
	const [flash, showFlash] = useFlashMessage();

	// "Verder luisteren": the most recent entry, when it is unfinished
	const resumeEntry = useMemo(() => {
		const latest = sortHistory(history)[0];
		// Not for the episode that is playing right now: history is updated
		// every 10 s during playback, so it would offer what you hear.
		return latest && isUnfinished(latest) && latest.slug !== playingSlug
			? latest
			: null;
	}, [history, playingSlug]);
	const offset = resumeEntry ? 1 : 0;
	const itemKeys = useMemo(
		() => [...(resumeEntry ? [RESUME_KEY] : []), ...menuItems.map((m) => m.screen)],
		[resumeEntry],
	);
	const keyIndex = selectedKey === null ? -1 : itemKeys.indexOf(selectedKey);
	// A vanished resume row falls back to the first menu item
	const selectedIndex = keyIndex === -1 ? 0 : keyIndex;
	const { activated } = useKonamiCode();
	const { rows: terminalRows, columns: terminalColumns } = useTerminalSize();
	const waveColors = useColorWave({ speed: activated ? 50 : 200 });
	const rainHeight = Math.max(3, terminalRows - 20);
	const rainWidth = Math.min(terminalColumns, 80);

	// Play jingle when Konami code activates
	const [jinglePlayed, setJinglePlayed] = useState(false);
	if (activated && !jinglePlayed) {
		playJingle();
		setJinglePlayed(true);
	}
	if (!activated && jinglePlayed) {
		setJinglePlayed(false);
	}

	// Ink re-subscribes handlers in an effect: read the latest selection through
	// a ref so quick key presses never act on a stale index.
	const latest = useRef({ selectedIndex, itemKeys, resumeEntry });
	latest.current = { selectedIndex, itemKeys, resumeEntry };

	useInput((input, key) => {
		const { selectedIndex, itemKeys, resumeEntry } = latest.current;
		const itemCount = itemKeys.length;
		const offset = resumeEntry ? 1 : 0;
		const select = (index: number) =>
			setSelectedKey(itemKeys[Math.max(0, Math.min(index, itemCount - 1))]!);
		if (input === 'j' || key.downArrow) {
			select(selectedIndex + 1);
		} else if (input === 'k' || key.upArrow) {
			select(selectedIndex - 1);
		} else if (key.return) {
			const index = selectedIndex;
			if (resumeEntry && index === 0) {
				startEpisodePlayback(resumeEntry.slug, {
					startAt: resumeEntry.position,
				}).then((res) => {
					if (res.ok) {
						showFlash(
							`Hervat bij ${formatDuration(res.startAt)}`,
							'success',
							3000,
						);
					} else {
						showFlash(res.message, 'error', 3000);
					}
				});
				return;
			}
			const item = menuItems[index - offset];
			if (item) navigate(item.screen);
		}
	});

	return (
		<ScreenContainer>
			<Box flexDirection="column" alignItems="center" paddingY={1}>
				<Gradient colors={waveColors}>
					{BANNER_CODE + '\n' + BANNER_KLETS}
				</Gradient>
				{activated && (
					<Box paddingTop={1}>
						<Gradient colors={waveColors}>
							{'🎮 Geheime modus geactiveerd! 🎮'}
						</Gradient>
					</Box>
				)}
					{activated && (
					<MatrixRain width={rainWidth} height={rainHeight} active={activated} />
				)}
				<Box paddingTop={1}>
					<Text color={colors.textMuted} italic>
						// Nederlandse Podcast voor Developers
					</Text>
				</Box>
			</Box>

			<Box
				flexDirection="column"
				paddingY={1}
				paddingX={2}
				alignItems="center"
			>
				{resumeEntry && (
					<Box flexDirection="column" alignItems="center" paddingBottom={1}>
						<Box gap={1}>
							<Text color={selectedIndex === 0 ? colors.cyan : colors.textSubtle}>
								{selectedIndex === 0 ? '▸' : ' '}
							</Text>
							<Text color={selectedIndex === 0 ? colors.cyan : colors.text} bold>
								Verder luisteren
							</Text>
							<Text color={colors.textMuted}>— {resumeEntry.title}</Text>
						</Box>
						<Text color={colors.textSubtle}>
							{formatDuration(resumeEntry.position)}
							{resumeEntry.duration > 0
								? ` / ${formatDuration(resumeEntry.duration)}`
								: ''}
						</Text>
					</Box>
				)}
				{flash && (
					<Box paddingBottom={1}>
						<Text color={flash.tone === 'error' ? colors.error : colors.success} bold>
							{flash.text}
						</Text>
					</Box>
				)}
				{menuItems.map((item, mi) => {
					const isSelected = mi + offset === selectedIndex;
					return (
						<Box key={item.screen} gap={1}>
							<Text color={isSelected ? colors.cyan : colors.textSubtle}>
								{isSelected ? '▸' : ' '}
							</Text>
							<Text
								color={isSelected ? colors.cyan : colors.text}
								bold={isSelected}
							>
								{item.label}
							</Text>
							{isSelected && (
								<Text color={colors.textMuted}> — {item.description}</Text>
							)}
						</Box>
					);
				})}
			</Box>
		</ScreenContainer>
	);
}
