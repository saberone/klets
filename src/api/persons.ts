import { api } from './client.js';
import type {
	EpisodeListItem,
	PaginatedResponse,
	PersonDetail,
	PersonListItem,
	SingleResponse,
} from './types.js';

export async function getPersons(): Promise<
	PaginatedResponse<PersonListItem>
> {
	return api.get('persons').json<PaginatedResponse<PersonListItem>>();
}

// API returns { data: { person: {...}, episodes: [...] } }
// We flatten it into SingleResponse<PersonDetail>
interface PersonDetailRaw {
	data: {
		person: PersonListItem;
		episodes: EpisodeListItem[];
	};
}

export async function getPerson(
	id: number,
): Promise<SingleResponse<PersonDetail>> {
	const raw = await api.get(`persons/${id}`).json<PersonDetailRaw>();
	return {
		data: {
			...raw.data.person,
			episodes: raw.data.episodes,
		},
	};
}
