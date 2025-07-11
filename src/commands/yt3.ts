import { defineCommand } from '../Command';
import { reply } from '../utils';
import fetch from 'node-fetch';

defineCommand({
    name: 'ytmp3',
    aliases: ['yta', 'ytaudio'],
    description: 'Download a YouTube video as MP3 audio',
    usages: ['<YouTube URL or Video ID>'],
    async run(message, args) {
        const input = args[0];
        if (!input) return reply(message, ' Provide a YouTube video link or ID.');

        // Extract video ID from URL or plain ID
        const match = input.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/) || input.match(/^([0-9A-Za-z_-]{11})$/);
        const videoId = match?.[1];
        if (!videoId) return reply(message, ' Invalid YouTube video link or ID.');

        const url = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '56d4b158a8msh47d5a65f88a3e5cp1bd5d1jsnc61ab94ea852',
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);
            const text = await response.text();

            let data: {
                status?: string;
                title?: string;
                link?: string;
                filesize?: number;
            };

            try {
                data = JSON.parse(text);
            } catch {
                return reply(message, ' Could not parse response from the API.');
            }

            if (data.status !== 'ok' || !data.link || !data.title) {
                return reply(message, ' No download link available for this video.');
            }

            // File size in MB
            const sizeMB = data.filesize ? (data.filesize / (1024 * 1024)).toFixed(2) : 'Unknown';

            await reply(message, ` **${data.title}**\n Size: ${sizeMB} MB\n [Download MP3](${data.link})`);
        } catch (err) {
            console.error('[ytmp3] Fetch failed:', err);
            await reply(message, ' Failed to fetch the download link.');
        }
    }
});
