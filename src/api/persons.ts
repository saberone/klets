import { api } from './client.js';
import type {
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

export async function getPerson(
	id: number,
): Promise<SingleResponse<PersonDetail>> {
	return api.get(`persons/${id}`).json<SingleResponse<PersonDetail>>();
}
