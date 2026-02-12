import { useInput, useApp } from 'ink';
import { useNavigation } from './use-navigation.js';
import { stop as stopPlayer } from '../player/index.js';

export function useGlobalKeybindings() {
	const { exit } = useApp();
	const { goBack, current, stack } = useNavigation();

	useInput((input, key) => {
		// Don't intercept q/backspace on the search screen (needs text input)
		const onSearch = current.screen === 'search';

		if (input === 'q' && !onSearch) {
			stopPlayer();
			exit();
			setTimeout(() => process.exit(0), 100);
			return;
		}

		if (key.escape && stack.length > 1) {
			goBack();
		}
	});
}
