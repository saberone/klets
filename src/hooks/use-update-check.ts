import { useState, useEffect } from 'react';
import { checkForUpdate } from '../update/check.js';
import { isGloballyInstalled } from '../update/install.js';

interface UpdateCheckState {
	updateAvailable: boolean;
	latestVersion: string | null;
	canAutoUpdate: boolean;
	checking: boolean;
}

export function useUpdateCheck(): UpdateCheckState {
	const [state, setState] = useState<UpdateCheckState>({
		updateAvailable: false,
		latestVersion: null,
		canAutoUpdate: false,
		checking: true,
	});

	useEffect(() => {
		let cancelled = false;

		checkForUpdate()
			.then((result) => {
				if (cancelled) return;
				setState({
					updateAvailable: result.updateAvailable,
					latestVersion: result.latestVersion,
					canAutoUpdate:
						result.updateAvailable && isGloballyInstalled(),
					checking: false,
				});
			})
			.catch(() => {
				if (cancelled) return;
				setState((prev) => ({ ...prev, checking: false }));
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return state;
}
