import { defineCommand } from '../Command';
import { Message } from 'oceanic.js';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/17IFqM0jRAiuGKcalQdC6JRpl9S8PBmlkQAEx216b80E/edit?usp=sharing'; // ← your real link

export default defineCommand({
    name: 'sheetlink',
    description: 'Get the link to the item price sheet',
    run: async (message: Message) => {
        await message.channel?.createMessage({
            content: ` Price log sheet:\n${SPREADSHEET_URL}`
        });
    }
});
