import { Message } from 'oceanic.js';
import { client } from '../Client';
import { IDLEFARM_ID } from '../constants';
import { prisma } from '../Prisma';

client.on('messageCreate', handleStonkLog);

async function handleStonkLog(message: Message) {
	if (message.author.id !== IDLEFARM_ID) return;
	if (!message.embeds.length) return;
	if (!message.embeds[0].title?.toLowerCase().includes('investments')) return;

	const { fields } = message.embeds[0];
	if (!fields?.length) return;

	const today0UTC = new Date().setUTCHours(0, 0, 0, 0);
	const lastUpdate = Date.now();

	for (const field of fields) {
		const name = field.name.match(/^\w+(?= stonk)/)?.[0]; // Alpha, Beta, etc
		const period = field.name.includes('daily') ? 'daily' : field.name.includes('weekly') ? 'weekly' : undefined;
		const percentMatch = field.value.match(/[+-]\d+(\.\d+)?(?=%)/);
		const riskMatch = field.value.match(/Risk level: ([\d.]+)/);

		if (!name || !percentMatch || !riskMatch || !period) continue;

		const returnPercent = parseFloat(percentMatch[0]);
		const riskLevel = parseFloat(riskMatch[1]);

		const existing = await prisma.idleStonk.findUnique({ where: { name } });

		if (existing && existing.lastUpdate && existing.lastUpdate < today0UTC) {
			let history: number[] = Array.isArray(existing.percentHistory) ? existing.percentHistory.filter(x => typeof x === 'number') : [];
			if (existing.returnPercent !== null) history.push(existing.returnPercent);
			if (history.length > 99) history.shift();

			await prisma.idleStonk.upsert({
				where: { name },
				update: {
					returnPercent,
					period,
					riskLevel,
					lastUpdate,
					percentHistory: history
				},
				create: {
					name,
					period,
					returnPercent,
					riskLevel,
					lastUpdate,
					percentHistory: history
				}
			});
		} else {
			await prisma.idleStonk.upsert({
				where: { name },
				update: {
					returnPercent,
					period,
					riskLevel,
					lastUpdate
				},
				create: {
					name,
					period,
					returnPercent,
					riskLevel,
					lastUpdate
				}
			});
		}
	}
}
