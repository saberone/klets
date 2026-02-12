import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { useScrollableList } from '../hooks/use-scrollable-list.js';
import { getPersons } from '../api/persons.js';
import { ScreenContainer } from '../components/screen-container.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import { EmptyState } from '../components/empty-state.js';
import type { PaginatedResponse, PersonListItem } from '../api/types.js';

export function PersonsListScreen() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { navigate } = useNavigation();

	const fetcher = useCallback(() => getPersons(), []);
	const { data, loading, error, refetch } = useApi<
		PaginatedResponse<PersonListItem>
	>(fetcher, 'persons', 60 * 60 * 1000);

	const persons = data?.data ?? [];
	const { visibleRange, hasMoreAbove, hasMoreBelow, aboveCount, belowCount } =
		useScrollableList(persons.length, selectedIndex);

	useInput((input, key) => {
		if (loading) return;

		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, persons.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && persons[selectedIndex]) {
			navigate('person-detail', { id: persons[selectedIndex]!.id });
		} else if (input === 'r' && error) {
			refetch();
		}
	});

	return (
		<ScreenContainer>
			<Box paddingY={1}>
				<Text color={colors.cyan} bold>
					Personen
				</Text>
			</Box>

			{loading && <Loading message="Personen laden..." />}
			{error && <ErrorDisplay message={error} onRetry={refetch} />}

			{!loading && !error && persons.length === 0 && (
				<EmptyState message="Geen personen gevonden." />
			)}

			{!loading && !error && persons.length > 0 && (
				<Box flexDirection="column">
					{hasMoreAbove && (
						<Text color={colors.textSubtle} dimColor>
							{'  '}▲ {aboveCount} meer
						</Text>
					)}
					{persons.slice(visibleRange[0], visibleRange[1]).map((person, vi) => {
						const i = visibleRange[0] + vi;
						const isSelected = i === selectedIndex;
						return (
							<Box key={person.id} flexDirection="column" paddingLeft={1}>
								<Box gap={1}>
									<Text
										color={isSelected ? colors.cyan : colors.textSubtle}
									>
										{isSelected ? '▸' : ' '}
									</Text>
									<Text
										color={isSelected ? colors.cyan : colors.text}
										bold={isSelected}
									>
										{person.name}
									</Text>
									{person.jobTitle && (
										<Text color={colors.textMuted}>
											· {person.jobTitle}
										</Text>
									)}
									<Text color={colors.textSubtle}>
										({person.episodeCount})
									</Text>
								</Box>
							</Box>
						);
					})}
					{hasMoreBelow && (
						<Text color={colors.textSubtle} dimColor>
							{'  '}▼ {belowCount} meer
						</Text>
					)}
				</Box>
			)}
		</ScreenContainer>
	);
}
