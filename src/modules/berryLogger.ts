import { google } from 'googleapis';
import fs from 'fs';
import { format } from 'date-fns-tz';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS = JSON.parse(fs.readFileSync('google-credentials.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: CREDENTIALS, scopes: SCOPES });
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '17IFqM0jRAiuGKcalQdC6JRpl9S8PBmlkQAEx216b80E'; // replace with your actual sheet ID
const SHEET_NAME = 'EpicnessProgression'; // update if different

export async function logBerryProgress(epicness: number, berry: number, breeds: number, link: string) {
  const dateHK = format(new Date(), 'M/d/yyyy', { timeZone: 'Asia/Hong_Kong' });

  const values = [[
    epicness,
    dateHK,
    berry,
    breeds,
    link
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values
    }
  });

  return true;
}
