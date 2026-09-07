import { readFile } from 'node:fs/promises';
import { ReplitConnectors } from '@replit/connectors-sdk';

const input = await readFile(0, 'utf8');
const email = JSON.parse(input);
const connectors = new ReplitConnectors();
const response = await connectors.proxy('resend', '/emails', {
  method: 'POST',
  body: email,
});

const responseText = await response.text();
if (!response.ok) {
  console.error(`Resend returned ${response.status}: ${responseText}`);
  process.exit(1);
}

process.stdout.write(responseText);