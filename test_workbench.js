const assert = require('node:assert/strict');
const {contractChecks, compareVersions, statement, amendment, reminder, projectTypes, scopeReview, readContract, billingTotals, ratePrice, profitTotals, parseBillingMilestones, followupStatus, workLogTotals, courtesyGoal, weeklyDigest, neutralSummary, caseStudy, timeDifference, stakeholderKey, authorityMessage, nextClientSendTime, changeRequest, notionMarkdown, matchDeliverable, validProjectProfile, recordRecentProject, feedbackReport} = require('./workbench');

const scanned = contractChecks('Deliverables: website\nTwo revision rounds\nExclusions:\n- Hosting\n- SEO\n\nDeadline: Friday');
assert.deepEqual(scanned.revisions, ['Two revision rounds']);
assert.deepEqual(scanned.exclusions, ['- Hosting', '- SEO']);
assert.deepEqual(scanned.missing, ['Payment terms', 'Change approval']);
assert.deepEqual(contractChecks('Not included: hosting').missing,
  ['Deliverables', 'Payment terms', 'Schedule', 'Change approval', 'Revision limits']);
assert.deepEqual(compareVersions('one\ntwo\ntwo', 'one\nthree\ntwo'), {added:['three'], removed:['two']});
const sow = statement({project:'Demo', excluded:'Hosting', deliverables:'Website', acceptance:'Test form',
  delivery:'2026-11-10', payment:'On delivery', rounds:'0'});
assert.match(sow, /Excluded work:\nHosting/);
assert.match(sow, /Included revision rounds: 0/);
assert.match(amendment({agreement:'Demo', change:'Checkout', cost:'₹3,000', schedule:'1 day'}), /confirm acceptance in writing/);
assert.match(reminder({invoice:'INV-1', amount:'₹3,000', due:'2026-11-01'}, '2026-11-07'), /INV-1.*₹3,000/);
assert.equal(reminder({due:'2026-11-07'}, '2026-11-07'), '');
for (const name of ['website', 'app', 'design', 'content']) {
  assert.equal(projectTypes[name].deliverables.length, projectTypes[name].checks.length);
  assert.ok(projectTypes[name].patterns);
}
const review = scopeReview('Deliverables:\n- Website\n- Contact form\n\nPayment on delivery');
assert.deepEqual(review.included, ['Website', 'Contact form']);
assert.equal(review.risk, 67);
assert.ok(review.suggestions.some(line => line.startsWith('Exclusions:')));
assert.deepEqual(scopeReview('Included work: Logo').included, ['Logo']);
assert.deepEqual(billingTotals('fixed', 1000, 9, 300), {revenue:100000, profit:70000});
assert.deepEqual(billingTotals('retainer', 1000, 3, 3200), {revenue:300000, profit:-20000});
assert.equal(ratePrice({design:1500, support:200}, 'design', 2.5), 375000);
assert.deepEqual(profitTotals([{kind:'income', cents:30000}, {kind:'cost', cents:12000}]),
  {income:30000, cost:12000, profit:18000, recovered:0});
assert.deepEqual(parseBillingMilestones('Launch | 3000.50'), [{name:'Launch', cents:300050, billed:false}]);
assert.throws(() => parseBillingMilestones('Launch | -10'), /milestone name/);
assert.equal(followupStatus({status:'Awaiting reply', followup:'2026-11-06'}, '2026-11-07'), 'Follow-up overdue since 2026-11-06');
assert.equal(followupStatus({status:'Accepted', followup:'2026-11-06'}, '2026-11-07'), '');
assert.equal(followupStatus({status:'Awaiting reply', followup:'2026-11-07'}, '2026-11-07'), 'Follow-up due today');
const work = [
  {kind:'billable', date:'2026-11-07', hours:2, cents:300000},
  {kind:'courtesy', date:'2026-11-07', hours:1, cents:150000},
  {kind:'courtesy', date:'2026-10-31', hours:0.5, cents:75000}
];
assert.deepEqual(workLogTotals(work).courtesy, {hours:1.5, cents:225000, count:2});
assert.deepEqual(workLogTotals(work, '2026-11').courtesy, {hours:1, cents:150000, count:1});
assert.deepEqual(workLogTotals(work, '2026-11').billable, {hours:2, cents:300000, count:1});
assert.equal(workLogTotals(work, '2026-12').courtesy.count, 0);
assert.deepEqual(courtesyGoal(work, '2026-10', '2026-11', 20),
  {previous:0.5, latest:1, target:0.4, reached:false});
assert.equal(courtesyGoal(work, '2026-10', '2026-12', 100).reached, true);
assert.throws(() => courtesyGoal(work, '2026-11', '2026-11', 20), /earlier/);
assert.throws(() => courtesyGoal(work, '2026-09', '2026-11', 20), /baseline month/);
const digest = weeklyDigest(work, '2026-11-01');
assert.equal(digest.end, '2026-11-07');
assert.equal(digest.courtesy.cents, 150000);
assert.equal(digest.billable.count, 1);
assert.equal(weeklyDigest(work, '2026-11-08').billable.count, 0);
assert.deepEqual(profitTotals([{kind:'income', cents:30000}, {kind:'recovered', cents:9000}, {kind:'cost', cents:12000}]),
  {income:39000, cost:12000, profit:27000, recovered:9000});
const neutral = neutralSummary({client:'Included in price', freelancer:'Extra work', facts:'Quote dated Oct 3', questions:'Was checkout approved?'});
assert.match(neutral, /Client position \(as provided\)\nIncluded in price/);
assert.match(neutral, /Freelancer position \(as provided\)\nExtra work/);
assert.match(neutral, /Questions still open\nWas checkout approved/);
assert.match(caseStudy({project:'Demo', challenge:'Scope change', action:'Checked quote', result:'Written approval', lesson:'Keep a record'}),
  /Observed result\nWritten approval/);
assert.equal(timeDifference(12.5, 7.25, 4), 21);
assert.equal(timeDifference(5, 6, 3), -3);
const stakeholders = [{client:'Studio', person:'Alex', authority:'no'}, {client:'Other', person:'Alex', authority:'yes'}];
assert.equal(stakeholderKey(' Studio ', 'ALEX'), stakeholderKey('studio', 'alex'));
assert.match(authorityMessage(stakeholders, 'Studio', 'alex'), /unable to approve/);
assert.match(authorityMessage(stakeholders, 'Other', 'Alex'), /as an approver/);
assert.match(authorityMessage(stakeholders, 'Third', 'Alex'), /unverified/);
assert.equal(nextClientSendTime('Asia/Kolkata', Date.parse('2026-11-06T04:00:00Z')).toISOString(), '2026-11-09T03:30:00.000Z');
assert.equal(nextClientSendTime('America/New_York', Date.parse('2026-10-30T15:00:00Z')).toISOString(), '2026-11-02T14:00:00.000Z');
assert.throws(() => nextClientSendTime('Invalid/Zone', Date.now()), RangeError);
const change = changeRequest({project:'Studio', requester:'Client', date:'2026-11-07',
  change:'Add checkout', reason:'Support payment', impact:'₹3,000 and two days'});
assert.match(change, /Requested change:\nAdd checkout/);
assert.match(change, /Status: Proposed/);
assert.match(notionMarkdown(sow), /^# Statement of work: Demo\n\n## Excluded work\n\nHosting/);
assert.equal(notionMarkdown('   '), '');
const baseline = [{name:'Contact form', description:'Collect enquiry details', status:'Planned'},
  {name:'Homepage', description:'Show company information', status:'Delivered'}];
assert.equal(matchDeliverable('Please update the contact form', baseline).entry.name, 'Contact form');
assert.equal(matchDeliverable('Can you add Stripe checkout?', baseline), null);
assert.equal(matchDeliverable('Contact form', [...baseline, {...baseline[0]}]), null);
const profile = {client:'Studio', project:'Website', start:'2026-11-07', rate:'1500.50', accent:'#681f35'};
assert.equal(validProjectProfile(profile), true);
assert.equal(validProjectProfile({...profile, start:'2026-02-30'}), false);
assert.equal(validProjectProfile({...profile, rate:'-1'}), false);
assert.equal(validProjectProfile({...profile, accent:'red'}), false);
assert.deepEqual(recordRecentProject(['a','b','c','d','e'], 'c'), ['c','a','b','d','e']);
assert.deepEqual(recordRecentProject(['a','b','c','d','e'], 'f'), ['f','a','b','c','d']);
assert.match(feedbackReport('Bug', '  Form does not open. ', '2026-11-07'),
  /Date: 2026-11-07\nType: Bug\n\nForm does not open\./);
const file = (name, bytes) => ({name, size:bytes.length, arrayBuffer:async () => bytes});
(async () => {
  assert.equal(await readContract(file('demo.txt', Buffer.from(' Deliverables: Website '))), 'Deliverables: Website');
  await assert.rejects(readContract(file('demo.pdf', Buffer.from('text'))), /UTF-8/);
  await assert.rejects(readContract(file('demo.txt', Buffer.from([255]))), /Could not read/);
  console.log('Workbench assertions passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
