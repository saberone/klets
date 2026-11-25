import { useRef } from 'react';
import { useInput } from 'ink';

type InputHandler = Parameters<typeof useInput>[0];
type InputOptions = Parameters<typeof useInput>[1];

/**
 * useInput with a stable subscription that always calls the handler from the
 * latest render. Ink re-subscribes a changing handler in an effect, so a key
 * pressed right after a state change could otherwise reach a stale closure
 * (e.g. "l" ignored because the handler still thinks the episode is loading).
 */
export function useStableInput(
	handler: InputHandler,
	options?: InputOptions,
): void {
	const ref = useRef(handler);
	ref.current = handler;
	const stable = useRef<InputHandler>((input, key) => ref.current(input, key));
	useInput(stable.current, options);
}
