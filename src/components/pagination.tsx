import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import type { PaginationMeta } from '../api/types.js';

interface PaginationProps {
	meta: PaginationMeta;
}

export function Pagination({ meta }: PaginationProps) {
	return (
		<Box paddingX={1} gap={1}>
			<Text color={colors.textSubtle}>
				Pagina {meta.page}/{meta.totalPages}
			</Text>
			<Text color={colors.textSubtle}>·</Text>
			<Text color={colors.textSubtle}>{meta.total} afleveringen</Text>
			{meta.page > 1 && (
				<Text color={colors.cyan}>[h] vorige</Text>
			)}
			{meta.hasMore && (
				<Text color={colors.cyan}>[l] volgende</Text>
			)}
		</Box>
	);
}
