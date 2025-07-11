import { defineCommand } from '../Command';
import { reply } from '../utils';
import { Message } from 'oceanic.js';

interface Response {
	translation: string;
	sourceLanguage: string;
}

defineCommand({
	name: 'translate',
	aliases: ['t'],
	description: 'Translate between English and Indonesian',
	usages: ['t en <text>', 't id <text>', 't en (as reply)', 't id (as reply)'],
	rawContent: true,
	async run(message: Message, args: string[]) {
		const lang = args[0]?.toLowerCase();
		if (lang !== 'id' && lang !== 'en') {
			await reply(message, 'Please specify a valid language: `id` or `en`.\nExample: `?t id hello` or reply with `?t id`.');
			return;
		}

		const text = args.slice(1).join(' ') || message.referencedMessage?.content;
		if (!text) {
			await reply(message, 'Please provide text to translate or reply to a message.');
			return;
		}

		const sourceLang = lang === 'id' ? 'en' : 'id';
		const targetLang = lang;

		const url = 'https://translate-pa.googleapis.com/v1/translate?' + new URLSearchParams({
			'params.client': 'gtx',
			'dataTypes': 'TRANSLATION',
			'key': 'AIzaSyDLEeFI5OtFBwYBIoK_jj5m32rZK5CkCXA',
			'query.sourceLanguage': sourceLang,
			'query.targetLanguage': targetLang,
			'query.text': text
		});

		try {
			const res = await fetch(url).then(res => res.json()) as Response;
			await reply(message, res.translation);
		} catch (err) {
			console.error(err);
			await reply(message, 'Failed to translate. Please try again later.');
		}
	}
});
