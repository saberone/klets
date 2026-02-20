import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { formatEpisodeNumber } from '../theme/format.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useStore } from '../store/index.js';
import { ScreenContainer } from '../components/screen-container.js';

export function FavoritesScreen() {
	const { navigate } = useNavigation();
	const favorites = useStore((s) => s.favorites);
	const toggleFavorite = useStore((s) => s.toggleFavorite);
	const [selectedIndex, setSelectedIndex] = useState(0);

	useInput((input, key) => {
		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, favorites.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && favorites[selectedIndex]) {
			navigate('episode-detail', {
				slug: favorites[selectedIndex]!.slug,
			});
		} else if (input === 'b' && favorites[selectedIndex]) {
			const fav = favorites[selectedIndex]!;
			toggleFavorite(
				fav.slug,
				fav.title,
				fav.seasonNumber,
				fav.episodeNumber,
			);
			// Adjust selection if we removed the last item
			if (selectedIndex >= favorites.length - 1 && selectedIndex > 0) {
				setSelectedIndex(selectedIndex - 1);
			}
		}
	});

	return (
		<ScreenContainer>
			<Box paddingY={1} gap={2}>
				<Text color={colors.cyan} bold>
					Favorieten
				</Text>
				<Text color={colors.textSubtle}>
					{favorites.length} afleveringen
				</Text>
			</Box>

			{favorites.length === 0 ? (
				<Text color={colors.textMuted}>
					Nog geen favorieten. Druk op <Text color={colors.cyan}>b</Text> bij
					een aflevering om deze toe te voegen.
				</Text>
			) : (
				<Box flexDirection="column">
					{favorites.map((fav, i) => {
						const isSelected = i === selectedIndex;
						return (
							<Box key={fav.slug} gap={1} paddingLeft={1}>
								<Text
									color={
										isSelected
											? colors.cyan
											: colors.textSubtle
									}
								>
									{isSelected ? '▸' : ' '}
								</Text>
								<Text color={colors.warning}>★</Text>
								<Text color={colors.purple}>
									{formatEpisodeNumber(
										fav.seasonNumber,
										fav.episodeNumber,
									)}
								</Text>
								<Text
									color={isSelected ? colors.cyan : colors.text}
									bold={isSelected}
								>
									{fav.title}
								</Text>
							</Box>
						);
					})}
				</Box>
			)}

			{favorites.length > 0 && (
				<Box paddingTop={1} gap={2}>
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>enter</Text> openen
					</Text>
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>b</Text> verwijderen
					</Text>
				</Box>
			)}
		</ScreenContainer>
	);
}
