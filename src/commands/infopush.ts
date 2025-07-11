import { defineCommand } from '../Command';
import { prisma } from '../Prisma';
import { Message } from 'oceanic.js';

export default defineCommand({
    name: 'infopush',
    description: 'Show item price trends or big daily changes',
    aliases: [],
    run: async (message: Message) => {
        const args = message.content.split(' ').slice(1).map(arg => arg.toLowerCase());

        const validTypes = ['tool', 'material', 'refined', 'product', 'assembly'];
        const mode = args[0]; // could be "+40", "-40", or undefined
        const category = args.find(arg => validTypes.includes(arg)); // check for type

        // Validate category
        if (category && !validTypes.includes(category)) {
            return message.channel?.createMessage({
                content: ` Invalid category. Valid types: ${validTypes.join(', ')}.`
            });
        }

        // Base query
        const items = await prisma.idleItem.findMany({
            where: {
                percent: { not: null },
                percentHistory: { not: undefined },
                ...(category ? { type: category } : {})
            }
        });

        let resultItems: typeof items = [];

        if (mode === '+40') {
            resultItems = items.filter(item => item.percent !== null && item.percent >= 40);
        } else if (mode === '-40') {
            resultItems = items.filter(item => item.percent !== null && item.percent <= -40);
        } else {
            // default: 3-day upward trend
            resultItems = items.filter(item => {
                if (!Array.isArray(item.percentHistory)) return false;

                const history = (item.percentHistory as number[]).filter(x => typeof x === 'number');
                if (history.length < 2 || item.percent === null) return false;

                const [day1, day2] = history.slice(-2);
                const day3 = item.percent;

                return day1 < day2 && day2 < day3;
            });
        }

        if (resultItems.length === 0) {
            const typeText = category ? ` (${category})` : '';
            const modeText = mode ? `${mode} trend` : '3-day increase';
            return message.channel?.createMessage({
                content: `No items found with ${modeText}${typeText}.`
            });
        }

        const result = resultItems
            .map(item => {
                const changeDisplay = mode === '+40' || mode === '-40'
                    ? `${item.percent! > 0 ? '+' : ''}${item.percent}%`
                    : `${(item.percentHistory as number[]).slice(-2).join('% → ')}% → ${item.percent}%`;

                return `**${item.name}**: \`${changeDisplay}\``;
            })
            .join('\n');

        return message.channel?.createMessage({
            content: ` Items ${mode === '+40' ? '≥ +40%' : mode === '-40' ? '≤ -40%' : 'with rising price for 3 days'}${category ? ` (category: ${category})` : ''}:\n${result}`
        });
    }
});
