import { useInput, useApp } from 'ink';
import { useNavigation } from './use-navigation.js';

export function useGlobalKeybindings() {
	const { exit } = useApp();
	const { goBack, stack } = useNavigation();

	useInput((input, key) => {
		if (input === 'q') {
			exit();
			return;
		}

		if (key.escape || (key.backspace && stack.length > 1)) {
			goBack();
		}
	});
}
