const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('index.html', 'utf8');
const start = source.indexOf('async function readRequestFile(');
const end = source.indexOf('function importRequestFiles(', start);
const read = vm.runInNewContext(source.slice(start, end) + '\nreadRequestFile', {TextDecoder});
const redactStart = source.indexOf('function redactContactDetails(');
const redactEnd = source.indexOf("$('redact-request').onclick", redactStart);
const redact = vm.runInNewContext(source.slice(redactStart, redactEnd) + '\nredactContactDetails');
assert.equal(redact('Contact demo+work@example.com or +91 98765 43210.'),
  'Contact [email redacted] or [phone redacted].');
assert.equal(redact('Call (415) 555-2671 or 9876543210.'), 'Call [phone redacted] or [phone redacted].');
assert.equal(redact('Invoice ₹3000 dated 2026-10-14.'), 'Invoice ₹3000 dated 2026-10-14.');
const scanStart = source.indexOf('function scanMessage(');
const scanEnd = source.indexOf('const scanResults', scanStart);
const scan = vm.runInNewContext(source.slice(scanStart, scanEnd) + '\nscanMessage');
assert.equal(scan("I'll add that. Thanks.", 'freelancer')[0].label, 'Possible commitment');
assert.ok(!scan("I'll add that.", 'client').some(signal => signal.label === 'Possible commitment'));
assert.equal(scan('I want a full refund. I will file a complaint.', 'client').length, 2);
assert.equal(scan('Can we review this tomorrow?', 'client').length, 0);
const labels = text => Array.from(scan(text, 'client'), signal => signal.label);
assert.ok(labels('Could you add Stripe before launch?').includes('Request'));
assert.ok(labels('Could you add Stripe before launch?').includes('Urgency wording'));
assert.ok(labels('I approve the revised draft.').includes('Approval wording'));
assert.ok(labels('No thanks.').includes('Refusal'));
assert.ok(labels('I can offer access.').includes('Offer'));
assert.ok(labels('The existing checkout is broken.').includes('Possible bug report'));
assert.ok(labels('Please add a new feature.').includes('Possible change request'));
assert.ok(labels('Please add a new screen because checkout is broken.').includes('Mixed bug/change wording'));
assert.ok(labels('I am frustrated.').includes('Frustration wording'));
assert.ok(labels('We approved it during our call.').includes('Verbal approval mentioned · verify in writing'));
assert.ok(!labels('We approved it in writing.').includes('Verbal approval mentioned · verify in writing'));
const relatedStart = source.indexOf('function similarRequests(');
const relatedEnd = source.indexOf('function requestCategory(', relatedStart);
const similar = vm.runInNewContext(source.slice(relatedStart, relatedEnd) + '\nsimilarRequests');
const original = {id:'a', request:'Add Razorpay checkout to the website'};
const result = similar(original, [original,
  {id:'b', request:'Update Razorpay checkout on our website'},
  {id:'c', request:'Fix a broken contact form'},
  {id:'d', request:'Razorpay checkout', archived:true},
  {id:'e', request:original.request}]);
assert.equal(result.length, 1);
assert.equal(result[0].row.id, 'b');
const cutoffStart = source.indexOf('function historyThrough(');
const cutoffEnd = source.indexOf('function renderHistory(', cutoffStart);
const through = vm.runInNewContext(source.slice(cutoffStart, cutoffEnd) + '\nhistoryThrough');
const history = [{date:'2026-10-03'}, {date:'2026-10-14'}];
assert.equal(through(history, '2026-10-13').length, 1);
assert.equal(through(history, '2026-10-14').length, 2);
assert.equal(through(history, '').length, 2);
const whatsappStart = source.indexOf('function whatsappExcerpt(');
const whatsappEnd = source.indexOf('function importThread(', whatsappStart);
const whatsapp = vm.runInNewContext(source.slice(whatsappStart, whatsappEnd) + '\nwhatsappExcerpt');
assert.equal(whatsapp('07/11/2026, 10:30 - Client: Add checkout\nMore details\n[07/11/2026, 10:31:04] Sam: Let me check'),
  'Client: Add checkout\nMore details\nSam: Let me check');
assert.throws(() => whatsapp('Plain text without headers'), /No WhatsApp message lines/);
const heatStart = source.indexOf('function requestCategory(');
const heatEnd = source.indexOf('function renderHeatmap(', heatStart);
const heatmap = vm.runInNewContext(source.slice(heatStart, heatEnd) + '\nrequestHeatmap');
const activity = heatmap([
  {request:'Add Razorpay checkout', date:'2026-11-07'},
  {request:'Review logo color', date:'2026-11-06'},
  {request:'Add Stripe checkout', date:'2026-11-06', archived:true}
]);
assert.equal(activity.dates.join(','), '2026-11-06,2026-11-07');
assert.equal(activity.rows.find(row => row.category === 'Payments').values.join(','), '0,1');
assert.equal(activity.rows.find(row => row.category === 'Design').values.join(','), '1,0');
assert.equal(heatmap([]).dates.length, 0);
assert.equal(heatmap(Array.from({length:20}, (_, i) => ({
  request:'Unknown', date:'2026-11-' + String(i + 1).padStart(2, '0')
}))).dates.length, 14);
const entitiesStart = source.indexOf('function extractRequestEntities(');
const entities = vm.runInNewContext(source.slice(entitiesStart, scanStart) + '\nextractRequestEntities');
assert.equal(Array.from(entities('Add a razor pay payment gateway and Whats App button.'), item => item.name).join(','),
  'Checkout,Contact button,WhatsApp,Razorpay');
const healthStart = source.indexOf('function scopeHealth(');
const healthEnd = source.indexOf('function renderScopeHealth(', healthStart);
const health = vm.runInNewContext(source.slice(healthStart, healthEnd) + '\nscopeHealth');
assert.equal(health([{verdicts:['Included','Needs Review']},{archived:true,verdicts:['Billable']}]).percentage, 50);
assert.equal(health([]).percentage, null);
const marketStart = source.indexOf('function marketplaceExcerpt(');
const marketEnd = source.indexOf("$('marketplace-preview').onclick", marketStart);
const marketplace = vm.runInNewContext(source.slice(marketStart, marketEnd) + '\nmarketplaceExcerpt');
assert.equal(marketplace('Upwork', 'Upwork Messages\r\nView contract\r\nAdd checkout\r\nView contract'),
  'Add checkout\nView contract');
assert.equal(marketplace('Fiverr', 'Fiverr Inbox\nView order\nPlease add a page.'), 'Please add a page.');
assert.throws(() => marketplace('Fiverr', 'Fiverr Inbox'), /request text/);
assert.throws(() => marketplace('Upwork', 'x'.repeat(4001)), /4,000/);
const implicitStart = source.indexOf('function refersToEarlierScope(');
const implicit = vm.runInNewContext(source.slice(implicitStart, scanEnd) + '\nrefersToEarlierScope');
assert.equal(implicit('As we discussed, add checkout.'), true);
assert.equal(implicit('Per our last call, please change the site.'), true);
assert.equal(implicit('Could you add checkout?'), false);
const file = (name, bytes) => ({name, size: bytes.length, arrayBuffer: async () => bytes});
(async () => {
  assert.equal(await read(file('chat.TXT', Buffer.from('  Quote ₹3,000  '))), 'Quote ₹3,000');
  await assert.rejects(read(file('chat.pdf', Buffer.from('text'))), /Choose a UTF-8/);
  await assert.rejects(read(file('chat.txt', Buffer.from([255]))), /Could not read/);
  await assert.rejects(read(file('chat.txt', Buffer.from('x'.repeat(4001)))), /Import 1/);
  await assert.rejects(read(file('chat.txt', Buffer.from('   '))), /Import 1/);
  console.log('Chat intake assertions passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
