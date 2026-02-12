import React from 'react';
import { Box } from 'ink';
import { useStore } from './store/index.js';
import { useGlobalKeybindings } from './hooks/use-keybindings.js';
import { Header } from './components/header.js';
import { Footer } from './components/footer.js';
import { PlayerBar } from './components/player-bar.js';
import { HomeScreen } from './screens/home.js';
import { EpisodesListScreen } from './screens/episodes-list.js';
import { EpisodeDetailScreen } from './screens/episode-detail.js';

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
		default:
			return <HomeScreen />;
	}
}

export function App() {
	useGlobalKeybindings();

	return (
		<Box flexDirection="column" minHeight={20}>
			<Header />
			<ScreenRouter />
			<PlayerBar />
			<Footer />
		</Box>
	);
}
