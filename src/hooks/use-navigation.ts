import { useStore } from '../store/index.js';
import type { ScreenName } from '../store/navigation.js';

export function useNavigation() {
	const navigate = useStore((s) => s.navigate);
	const goBack = useStore((s) => s.goBack);
	const resetTo = useStore((s) => s.resetTo);
	const stack = useStore((s) => s.stack);
	const current = stack[stack.length - 1]!;

	return { navigate, goBack, resetTo, current, stack };
}

export function useNavigateTo(
	screen: ScreenName,
	params?: Record<string, unknown>,
) {
	const navigate = useStore((s) => s.navigate);
	return () => navigate(screen, params);
}
