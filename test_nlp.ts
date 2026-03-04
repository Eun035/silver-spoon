import { parseToDraft } from './src/services/nlpParser';
import * as fs from 'fs';

const testCases = [
    "다음주 오후 3시 회의",
    "다음주 월요일 오전 10시",
    "다음주",
    "담주 금요일 저녁약속",
    "내일 오전 11시",
    "3일 뒤 오후 2시",
    "다음 주 점심",
    "오늘 저녁 7시 운동",
    "2/20 오후 1시 치과"
];

const now = new Date("2026-02-11T12:00:00+09:00");

const results = testCases.map(input => {
    const { draft, error } = parseToDraft(input, now);
    return { input, draft, error };
});

fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
console.log('Results written to test_results.json');
