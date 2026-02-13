import React from 'react';
import { Box } from 'ink';
import { useStore } from './store/index.js';
import { useGlobalKeybindings } from './hooks/use-keybindings.js';
import { Header } from './components/header.js';
import { Footer } from './components/footer.js';
import { PlayerBar } from './components/player-bar.js';
import { ErrorBoundary } from './components/error-boundary.js';
import { UpdateBanner } from './components/update-banner.js';
import { HomeScreen } from './screens/home.js';
import { EpisodesListScreen } from './screens/episodes-list.js';
import { EpisodeDetailScreen } from './screens/episode-detail.js';
import { TopicsListScreen } from './screens/topics-list.js';
import { TopicDetailScreen } from './screens/topic-detail.js';
import { PersonsListScreen } from './screens/persons-list.js';
import { PersonDetailScreen } from './screens/person-detail.js';
import { SearchScreen } from './screens/search.js';
import { TranscriptScreen } from './screens/transcript.js';

function ScreenRouter() {
	const stack = useStore((s) => s.stack);
	const current = stack[stack.length - 1]!;

	switch (current.screen) {
		case 'home':
			return <HomeScreen />;
		case 'episodes-list':
			return <EpisodesListScreen />;
		case 'episode-detail':
			return <EpisodeDetailScreen />;
		case 'transcript':
			return <TranscriptScreen />;
		case 'topics-list':
			return <TopicsListScreen />;
		case 'topic-detail':
			return <TopicDetailScreen />;
		case 'persons-list':
			return <PersonsListScreen />;
		case 'person-detail':
			return <PersonDetailScreen />;
		case 'search':
			return <SearchScreen />;
		default:
			return <HomeScreen />;
	}
}

export function App() {
	useGlobalKeybindings();
	const stack = useStore((s) => s.stack);

	return (
		<Box flexDirection="column" minHeight={20}>
			<Header />
			<UpdateBanner />
			<ErrorBoundary key={stack.length}>
				<ScreenRouter />
			</ErrorBoundary>
			<PlayerBar />
			<Footer />
		</Box>
	);
}
