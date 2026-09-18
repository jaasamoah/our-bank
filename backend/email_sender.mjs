// Read piped JSON payload from process.stdin
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

const rawInput = Buffer.concat(chunks).toString('utf-8').trim();
if (!rawInput) {
  console.error('No email payload received on stdin.');
  process.exit(1);
}

const email = JSON.parse(rawInput);

// Fallback safety to ensure all outgoing emails reflect the updated brand
if (email.subject && /velmontprivate\s*bank|telosbank/i.test(email.subject)) {
  email.subject = email.subject.replace(/velmontprivate\s*bank|telosbank/gi, 'Velmont Bank');
}

if (email.text && /velmontprivate\s*bank|telosbank/i.test(email.text)) {
  email.text = email.text.replace(/velmontprivate\s*bank|telosbank/gi, 'Velmont Bank');
}

if (email.html && /velmontprivate\s*bank|telosbank/i.test(email.html)) {
  email.html = email.html.replace(/velmontprivate\s*bank|telosbank/gi, 'Velmont Bank');
}

if (!email.from || /velmontprivate\s*bank|telosbank/i.test(email.from)) {
  email.from = 'Velmont Bank <onboarding@resend.dev>';
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('RESEND_API_KEY is not set in environment.');
  process.exit(1);
}

// Directly call Resend's REST API using native fetch
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(email),
});

const responseText = await response.text();

if (!response.ok) {
  console.error(`Resend returned ${response.status}: ${responseText}`);
  process.exit(1);
}

process.stdout.write(responseText);