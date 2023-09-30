import { readdirSync } from 'node:fs';
import { run } from 'node:test';
import process from 'node:process';
import { spec as Spec } from 'node:test/reporters';
import { basename } from 'node:path';
import { cpus } from 'node:os';

function runner() {
	const files = readdirSync('lib/utils/')
		.filter((file) => file.endsWith('.test.ts') && file !== basename(__filename))
		.map((file) => `${'lib/utils/'}/${file}`)
	const testStream = run({
		files,
		timeout: 60 * 1000,
		concurrency: cpus().length,
	});
	const failures: string[] = [];
	const s = new Spec();
	testStream.compose(s).pipe(process.stdout);
	testStream.on('test:fail', (data) => {
		const error = data.details.error
		failures.push(
			`${data.file} - "${data.name}" (${Math.round(data.details.duration_ms,)}ms)\n${error.toString()}`
		);
	});
	testStream.on('test:stderr', (data) => {
		failures.push(`${data.file} - Error:\n${data.message} `);
	});
	testStream.once('end', () => {
		if (failures.length) {
			console.error('\x1b[31m%s\x1b', '\n✖ failing tests:\n');
			console.error(failures.join('\n\n'));
		}
		process.exit(failures.length ? 1 : 0);
	});
}

runner();