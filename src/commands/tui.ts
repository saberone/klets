import type { EpisodeDetail } from '../api/types.js';

/**
 * Starts the interactive TUI. With an episode (`klets play`), it opens on that
 * episode's detail screen and starts playback, resuming an unfinished episode.
 */
export async function startTui(
	options: { episode?: EpisodeDetail } = {},
): Promise<void> {
	const React = await import('react');
	const { render } = await import('ink');
	const { App } = await import('../app.js');
	const { initBackend } = await import('../player/index.js');
	const { useStore } = await import('../store/index.js');

	await initBackend();

	if (options.episode) {
		const { startEpisodePlayback } = await import('../player/start-episode.js');
		const store = useStore.getState();
		await store.loadHistory();
		store.resetTo('home');
		store.navigate('episode-detail', { slug: options.episode.slug });
		render(React.createElement(App));
		const result = await startEpisodePlayback(options.episode, {
			startAt: 'resume',
		});
		if (!result.ok) {
			// Shown as a flash message by the episode detail screen
			const { stack, setCurrentParams } = useStore.getState();
			const top = stack[stack.length - 1];
			if (
				top?.screen === 'episode-detail' &&
				top.params?.['slug'] === options.episode.slug
			) {
				setCurrentParams({ playError: result.message });
			}
		}
		return;
	}

	const { playJingle } = await import('../audio/jingle.js');
	playJingle();
	render(React.createElement(App));
}
