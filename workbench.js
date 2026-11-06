'use strict';

const projectTypes = {
  website: {
    deliverables: ['Responsive website', 'Contact form'],
    checks: ['Check desktop and mobile layouts against the approved design.', 'Send a test submission and verify delivery.'],
    excluded: 'Hosting, copywriting, payment processing.',
    patterns: 'Extra pages, added integrations, and ongoing maintenance.'
  },
  app: {
    deliverables: ['Core app screens', 'Account sign-in'],
    checks: ['Complete the agreed user journeys on supported devices.', 'Verify sign-in, sign-out and failed sign-in behavior.'],
    excluded: 'Store fees, new platforms, and third-party API charges.',
    patterns: 'New platforms, account roles, offline sync, and integrations.'
  },
  design: {
    deliverables: ['Brand design files', 'Usage guide'],
    checks: ['Check that the agreed file formats open correctly.', 'Verify the guide includes agreed colors, typography and usage rules.'],
    excluded: 'Printing, stock licenses, and extra concepts.',
    patterns: 'Extra concepts, formats, assets and revision rounds.'
  },
  content: {
    deliverables: ['Draft copy', 'Final edited copy'],
    checks: ['Check the draft against the approved brief and word count.', 'Deliver edited copy in the agreed format.'],
    excluded: 'Publication, translation, and new topic research.',
    patterns: 'Added topics, longer copy, translations and publication support.'
  }
};

function lines(text) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function contractChecks(text) {
  const clauses = lines(text);
  const revisions = clauses.filter(line => /\b(?:\d+|one|two|three|four|five|unlimited|no)\s+(?:(?:included|free)\s+)?(?:rounds?\s+of\s+)?revisions?\b|\brevisions?\s*(?::|limit(?:ed)?\s+to|is capped at)\s*(?:\d+|one|two|three|four|five|unlimited|none)/i.test(line));
  const exclusions = [];
  let block = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { block = false; continue; }
    if (block && /^[-*•]/.test(line)) { exclusions.push(line); continue; }
    block = /^(?:exclusions?|out of scope|not included)\s*:?$/i.test(line);
    if (!block && /\b(?:exclusions?|excludes?|excluded|out of scope|not included)\b/i.test(line)) exclusions.push(line);
  }
  const missing = [
    ['Deliverables', /\b(?:deliverables?|scope of work|included work)\b/i],
    ['Payment terms', /\b(?:payment|invoice|fee|rate)\b/i],
    ['Schedule', /\b(?:deadline|schedule|delivery date|milestone)\b/i],
    ['Change approval', /\b(?:change approval|change requests?|amendments?)\b/i]
  ].filter(([, pattern]) => !pattern.test(text)).map(([name]) => name);
  if (!revisions.length) missing.push('Revision limits');
  if (!exclusions.length) missing.push('Exclusions');
  return {revisions, exclusions, missing};
}

function compareVersions(before, after) {
  const left = lines(before), right = lines(after);
  function difference(source, reference) {
    const counts = new Map();
    for (const line of reference) counts.set(line, (counts.get(line) || 0) + 1);
    return source.filter(line => {
      const count = counts.get(line) || 0;
      if (!count) return true;
      counts.set(line, count - 1);
      return false;
    });
  }
  return {added:difference(right, left), removed:difference(left, right)};
}

function statement(data) {
  return ['Statement of work: ' + data.project, 'Excluded work:\n' + data.excluded,
    'Included deliverables:\n' + data.deliverables, 'Acceptance checks:\n' + data.acceptance,
    'Delivery date: ' + data.delivery, 'Payment terms: ' + data.payment,
    'Included revision rounds: ' + data.rounds,
    'Scope changes require separate written approval.'].join('\n\n');
}

function amendment(data) {
  return ['Proposed amendment to ' + data.agreement, 'Requested change:\n' + data.change,
    'Cost impact: ' + data.cost, 'Schedule impact: ' + data.schedule,
    'All other terms stay as agreed. Please confirm acceptance in writing.'].join('\n\n');
}

function reminder(data, today) {
  if (data.due >= today) return '';
  return 'Hi, a quick reminder that invoice ' + data.invoice + ' for ' + data.amount
    + ' was due on ' + data.due + '. Could you confirm the payment status or let me know if you need a copy? Thank you.';
}

const clauseSuggestions = {
  Deliverables: 'List each included deliverable and its acceptance criteria.',
  'Payment terms': 'State the fee, invoice dates and payment due dates.',
  Schedule: 'Record delivery dates and dependencies.',
  'Change approval': 'Name the approver and require written approval for cost and schedule changes.',
  'Revision limits': 'State the included revision rounds and how extra rounds are quoted.',
  Exclusions: 'List work, fees and services outside the agreement.'
};

function scopeReview(text) {
  const checks = contractChecks(text);
  const included = [];
  let inScope = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (inScope && /^[-*•]/.test(line)) { included.push(line.replace(/^[-*•]\s*/, '')); continue; }
    inScope = /^(?:included(?: work)?|deliverables?|scope of work)\s*:?$/i.test(line);
    const inline = line.match(/^(?:included(?: work)?|deliverables?|scope of work)\s*:\s*(.+)$/i);
    if (inline) included.push(inline[1]);
  }
  return {
    ...checks, included,
    risk: Math.round(checks.missing.length / Object.keys(clauseSuggestions).length * 100),
    suggestions: checks.missing.map(name => name + ': ' + clauseSuggestions[name])
  };
}

async function readContract(file) {
  if (!/\.txt$/i.test(file.name) || file.size > 80003) {
    throw Error('Choose a UTF-8 .txt contract up to 20,000 characters.');
  }
  let text;
  try { text = new TextDecoder('utf-8', {fatal:true}).decode(await file.arrayBuffer()).trim(); }
  catch { throw Error('Could not read the contract as UTF-8.'); }
  if (!text || text.length > 20000) throw Error('Enter 1–20,000 contract characters.');
  return text;
}

function billingTotals(mode, fee, months, cost) {
  const revenue = Math.round(fee * 100) * (mode === 'retainer' ? months : 1);
  return {revenue, profit:revenue - Math.round(cost * 100)};
}

function ratePrice(rates, type, hours) {
  return Math.round(Math.round(rates[type] * 100) * hours);
}

function profitTotals(entries) {
  let income = 0, cost = 0, recovered = 0;
  for (const entry of entries) {
    if (entry.kind === 'income' || entry.kind === 'recovered') income += entry.cents;
    if (entry.kind === 'recovered') recovered += entry.cents;
    if (entry.kind === 'cost') cost += entry.cents;
  }
  return {income, cost, profit:income - cost, recovered};
}

function parseBillingMilestones(text) {
  const rows = lines(text);
  if (!rows.length || rows.length > 12) throw Error('Enter between 1 and 12 billing milestones.');
  return rows.map(line => {
    const fields = line.split('|').map(part => part.trim());
    if (fields.length !== 2 || !fields[0] || fields[0].length > 100 || !/^\d{1,8}(?:\.\d{1,2})?$/.test(fields[1])) {
      throw Error('Use milestone name | INR amount on each line, for example Launch | 3000.');
    }
    return {name:fields[0], cents:Math.round(Number(fields[1]) * 100), billed:false};
  });
}

function followupStatus(quote, today) {
  if (quote.status !== 'Awaiting reply' || !quote.followup) return '';
  if (quote.followup < today) return 'Follow-up overdue since ' + quote.followup;
  if (quote.followup === today) return 'Follow-up due today';
  return 'Follow-up scheduled for ' + quote.followup;
}

function localDate() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth()+1, now.getDate()]
    .map(value => String(value).padStart(2, '0')).join('-');
}

function workLogTotals(entries, month = '') {
  const totals = {billable: {hours:0, cents:0, count:0}, courtesy: {hours:0, cents:0, count:0}};
  for (const entry of entries) {
    if (month && !entry.date.startsWith(month + '-')) continue;
    const category = totals[entry.kind];
    category.hours += entry.hours;
    category.cents += entry.cents;
    category.count++;
  }
  return totals;
}

function courtesyGoal(entries, baseline, current, reduction) {
  if (!baseline || !current || baseline >= current) throw Error('Choose a baseline month earlier than the report month.');
  const previous = workLogTotals(entries, baseline).courtesy;
  const latest = workLogTotals(entries, current).courtesy;
  if (!previous.hours) throw Error('Log courtesy hours in the baseline month before comparing.');
  const target = previous.hours * (1 - reduction / 100);
  return {previous:previous.hours, latest:latest.hours, target,
    reached:latest.hours <= target + 1e-9};
}

function weeklyDigest(entries, start) {
  const end = new Date(Date.parse(start) + 6 * 86400000).toISOString().slice(0, 10);
  return {end, ...workLogTotals(entries.filter(entry => entry.date >= start && entry.date <= end))};
}

function neutralSummary(data) {
  return [
    'Client position (as provided)\n' + data.client,
    'Freelancer position (as provided)\n' + data.freelancer,
    'Facts both sides agree on (as provided)\n' + data.facts,
    'Questions still open\n' + data.questions,
    'Next step: check the original records together and document any agreed resolution.'
  ].join('\n\n');
}

function caseStudy(data) {
  return ['Case study: ' + data.project, 'Starting scope and challenge\n' + data.challenge,
    'Evidence and action\n' + data.action, 'Observed result\n' + data.result,
    'Lesson learned\n' + data.lesson].join('\n\n');
}

function timeDifference(before, after, count) {
  return Math.round((before - after) * count * 100) / 100;
}

function stakeholderKey(client, person) {
  return JSON.stringify([client.trim().toLowerCase(), person.trim().toLowerCase()]);
}

function authorityMessage(records, client, person) {
  const key = stakeholderKey(client, person);
  const match = records.find(record => stakeholderKey(record.client, record.person) === key);
  if (!match || match.authority === 'unknown') {
    return 'Approval authority is unverified. Ask the client to confirm the authorized approver.';
  }
  if (match.authority === 'no') return 'Warning: This person is recorded as unable to approve changes.';
  return 'The register lists this person as an approver. Verify the specific approval separately.';
}

function nextClientSendTime(zone, now) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone:zone, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  });
  const minute = 60000;
  const start = Math.ceil(now / minute) * minute;
  for (let offset = 0; offset <= 8 * 1440; offset++) {
    const date = new Date(start + offset * minute);
    const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
    if (parts.hour === '09' && parts.minute === '00' && !['Sat','Sun'].includes(parts.weekday)) return date;
  }
  throw Error('No available weekday found.');
}

function changeRequest(data) {
  return ['Change request: ' + data.project, 'Requested by: ' + data.requester,
    'Date: ' + data.date, 'Requested change:\n' + data.change,
    'Business reason:\n' + data.reason, 'Cost and schedule impact:\n' + data.impact,
    'Status: Proposed. Requires written approval before work starts.'].join('\n\n');
}

function notionMarkdown(text) {
  const sections = text.trim().split(/\n\n+/);
  if (!sections[0]) return '';
  return sections.map((section, index) => {
    if (index === 0) return '# ' + section;
    const split = section.match(/^([^:\n]+):(?:\n| )([\s\S]+)$/);
    return split ? '## ' + split[1] + '\n\n' + split[2] : section;
  }).join('\n\n') + '\n';
}

function matchDeliverable(request, entries) {
  const ignore = new Set(['the', 'and', 'for', 'can', 'you', 'this', 'please', 'with']);
  const words = text => new Set((text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter(word => !ignore.has(word)));
  const query = words(request);
  let best = null, score = 0, tied = false;
  for (const entry of entries) {
    const terms = words(entry.name + ' ' + entry.description);
    const shared = [...query].filter(word => terms.has(word)).length;
    const rank = shared >= 2 ? shared / (query.size + terms.size - shared) : 0;
    if (rank > score) { best = entry; score = rank; tied = false; }
    else if (rank && rank === score) tied = true;
  }
  return score >= 0.2 && !tied ? {entry:best, score} : null;
}

function validProjectProfile(profile) {
  return profile && ['client','project'].every(key => typeof profile[key] === 'string'
    && profile[key].trim().length > 0 && profile[key].trim().length <= 100)
    && typeof profile.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(profile.start)
    && Number.isFinite(Date.parse(profile.start))
    && new Date(profile.start).toISOString().slice(0, 10) === profile.start
    && typeof profile.rate === 'string' && /^\d{1,7}(?:\.\d{1,2})?$/.test(profile.rate)
    && Number(profile.rate) <= 1000000
    && typeof profile.accent === 'string' && /^#[0-9a-f]{6}$/i.test(profile.accent);
}

function recordRecentProject(recent, key) {
  return [key, ...recent.filter(item => item !== key)].slice(0, 5);
}

function feedbackReport(category, details, date) {
  return ['ScopeKeeper feedback', 'Date: ' + date, 'Type: ' + category, '', details.trim(), ''].join('\n');
}

if (typeof module !== 'undefined') module.exports = {contractChecks, compareVersions, statement, amendment, reminder, projectTypes, scopeReview, readContract, billingTotals, ratePrice, profitTotals, parseBillingMilestones, followupStatus, workLogTotals, courtesyGoal, weeklyDigest, neutralSummary, caseStudy, timeDifference, stakeholderKey, authorityMessage, nextClientSendTime, changeRequest, notionMarkdown, matchDeliverable, validProjectProfile, recordRecentProject, feedbackReport};

if (typeof document !== 'undefined') {
  const byId = id => document.getElementById(id);
  const sow = byId('sow');
  const selection = () => projectTypes[byId('type').value];
  function showPatterns() {
    byId('patterns').textContent = 'Watch for scope creep: ' + selection().patterns;
  }
  byId('type').onchange = showPatterns;
  showPatterns();
  byId('template').onclick = () => {
    const inputs = ['excluded', 'deliverables', 'acceptance'];
    if (inputs.some(name => sow.elements[name].value.trim()) && !confirm('Replace the current scope template fields?')) return;
    sow.elements.excluded.value = selection().excluded;
    sow.elements.deliverables.value = selection().deliverables.join('\n');
    sow.elements.acceptance.value = selection().checks.join('\n');
  };
  byId('done-suggestions').onclick = () => {
    const items = lines(sow.elements.deliverables.value);
    if (!items.length) { sow.elements.deliverables.focus(); return; }
    if (sow.elements.acceptance.value.trim() && !confirm('Replace current acceptance checks?')) return;
    sow.elements.acceptance.value = items.map(item => {
      const known = selection().deliverables.indexOf(item);
      return item + ': ' + (known >= 0 ? selection().checks[known]
        : 'Verify the agreed format, acceptance criteria and delivery location with the client.');
    }).join('\n');
  };
  function dataOf(form) {
    return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
  }
  function draftForm(formId, outputId, generate) {
    byId(formId).onsubmit = event => {
      event.preventDefault();
      const data = dataOf(event.currentTarget);
      byId(outputId).value = Object.values(data).every(Boolean) ? generate(data) : 'Complete every field.';
    };
  }
  draftForm('neutral-summary', 'neutral-output', neutralSummary);
  draftForm('case-study', 'case-output', caseStudy);
  byId('time-saved').onsubmit = event => {
    event.preventDefault();
    const {before, after, count} = dataOf(event.currentTarget);
    const difference = timeDifference(Number(before), Number(after), Number(count));
    const minutes = new Intl.NumberFormat('en-IN', {maximumFractionDigits:2}).format(Math.abs(difference));
    byId('time-output').value = difference === 0 ? 'No estimated time difference.'
      : 'Estimated ' + minutes + (difference > 0 ? ' minutes saved.' : ' additional minutes.');
  };
  draftForm('change-request', 'change-output', changeRequest);
  byId('notion-export').onclick = () => {
    const markdown = notionMarkdown(byId('sow-output').value);
    const status = byId('notion-status');
    if (!markdown) { status.textContent = 'Build or enter a statement of work first.'; return; }
    const url = URL.createObjectURL(new Blob([markdown], {type:'text/markdown;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scopekeeper-statement-of-work.md';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Markdown download started. Import the file into Notion manually.';
  };
  draftForm('sow', 'sow-output', statement);
  draftForm('amendment', 'amendment-output', amendment);
  draftForm('payment-reminder', 'reminder-output', data => {
    const now = new Date();
    const today = [now.getFullYear(), now.getMonth()+1, now.getDate()].map(value => String(value).padStart(2, '0')).join('-');
    return reminder(data, today) || 'This invoice is not overdue.';
  });
  const risk = byId('risks');
  function showRisks() {
    const checks = [...risk.parentElement.querySelectorAll('input')];
    const open = checks.filter(input => !input.checked).length;
    risk.value = open + ' of ' + checks.length + ' checks still open.';
  }
  risk.parentElement.onchange = showRisks;
  showRisks();
  function list(label, items) {
    return label + ':\n' + (items.length ? items.map(item => '• ' + item).join('\n') : 'None found');
  }
  byId('scan').onclick = () => {
    const text = byId('contract').value.trim();
    if (!text) { byId('contract-result').textContent = 'Paste the current agreement first.'; return; }
    const result = scopeReview(text);
    byId('contract-result').textContent = [list('Revision clauses', result.revisions),
      list('Exclusion clauses', result.exclusions), list('Included work', result.included),
      'Clause gap score: ' + result.risk + '/100. Higher means fewer of six clause categories were detected.',
      list('Suggested clauses to review', result.suggestions)].join('\n\n');
  };
  byId('contract-file').onchange = async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await readContract(file);
      const editor = byId('contract');
      if (editor.value.trim() && !confirm('Replace the current contract text?')) return;
      editor.value = text;
      byId('scan').click();
    } catch (error) { byId('contract-result').textContent = error.message; }
  };
  byId('summary').onclick = () => {
    const text = byId('contract').value.trim();
    if (!text) { byId('contract-result').textContent = 'Paste the current agreement first.'; return; }
    const review = scopeReview(text);
    byId('contract-result').textContent = [
      list('Work the text says is included', review.included),
      list('Work the text says is outside scope', review.exclusions),
      list('What the text says about revisions', review.revisions),
      list('Things to check with the client', review.missing)
    ].join('\n\n');
  };
  byId('compare').onclick = () => {
    const before = byId('old-contract').value, after = byId('contract').value;
    if (!before.trim() || !after.trim()) { byId('contract-result').textContent = 'Paste both versions first.'; return; }
    const diff = compareVersions(before, after);
    byId('contract-result').textContent = [list('Added lines', diff.added), list('Removed lines', diff.removed)].join('\n\n');
  };

  const currency = new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'});
  const money = cents => currency.format(cents / 100);
  const billingForm = byId('billing');
  const monthInput = billingForm.elements.months;
  function syncMonths() {
    monthInput.disabled = billingForm.elements.mode.value !== 'retainer';
    byId('billing-output').value = '';
  }
  billingForm.elements.mode.onchange = syncMonths;
  syncMonths();
  billingForm.onsubmit = event => {
    event.preventDefault();
    const {mode, fee, months, cost} = dataOf(event.currentTarget);
    const totals = billingTotals(mode, Number(fee), Number(months), Number(cost));
    byId('billing-output').value = 'Projected revenue ' + money(totals.revenue)
      + ' · projected profit ' + money(totals.profit);
  };
  byId('rate-card').onsubmit = event => {
    event.preventDefault();
    const {work, hours, ...rates} = dataOf(event.currentTarget);
    byId('rate-output').value = work + ': ' + money(ratePrice(rates, work, Number(hours)));
  };
  const profitKey = 'scopekeeper-profit-v1';
  let entries = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(profitKey) || '[]');
    if (Array.isArray(saved)) entries = saved.filter(entry => entry
      && ['income', 'cost', 'recovered'].includes(entry.kind) && Number.isSafeInteger(entry.cents)
      && entry.cents > 0 && typeof entry.reference === 'string');
  } catch { /* Start empty. */ }
  function renderProfit() {
    const totals = profitTotals(entries);
    byId('profit-output').value = 'Received ' + money(totals.income)
      + ' · paid costs ' + money(totals.cost) + ' · realized profit ' + money(totals.profit) + ' · recovered extra-work revenue ' + money(totals.recovered);
    const list = byId('profit-entries');
    list.replaceChildren();
    for (const [index, entry] of entries.entries()) {
      const row = document.createElement('li');
      row.textContent = (entry.kind === 'cost' ? 'Paid ' : entry.kind === 'recovered' ? 'Recovered ' : 'Received ') + money(entry.cents) + ' · ' + entry.reference + ' ';
      const remove = document.createElement('button');
      remove.textContent = 'Remove entry';
      remove.onclick = () => updateProfit(entries.filter((_, position) => position !== index));
      row.append(remove);
      list.append(row);
    }
  }
  function updateProfit(updated) {
    try { sessionStorage.setItem(profitKey, JSON.stringify(updated)); }
    catch { byId('profit-output').value = 'Browser storage unavailable. Entry changes were not saved.'; return; }
    entries = updated;
    renderProfit();
  }
  byId('profit-tracker').onsubmit = event => {
    event.preventDefault();
    const data = dataOf(event.currentTarget);
    if (!data.reference || entries.length >= 100) {
      byId('profit-output').value = 'Enter a reference. Maximum 100 entries per tab.';
      return;
    }
    updateProfit([...entries, {kind:data.kind, cents:Math.round(Number(data.amount) * 100), reference:data.reference}]);
  };
  renderProfit();

  const quoteKey = 'scopekeeper-quotes-v1';
  const quoteStatuses = ['Awaiting reply', 'Accepted', 'Declined'];
  const quoteNotice = byId('quote-status');
  let quotes = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(quoteKey) || '[]');
    if (Array.isArray(saved)) quotes = saved.filter(quote => quote && typeof quote.reference === 'string'
      && quoteStatuses.includes(quote.status) && typeof quote.followup === 'string'
      && Array.isArray(quote.milestones) && quote.milestones.every(milestone => milestone
        && typeof milestone.name === 'string' && Number.isSafeInteger(milestone.cents)
        && typeof milestone.billed === 'boolean'));
  } catch { /* Start empty. */ }
  function saveQuotes(updated) {
    try { sessionStorage.setItem(quoteKey, JSON.stringify(updated)); }
    catch { quoteNotice.textContent = 'Browser storage unavailable. Quote changes were not saved.'; return false; }
    quotes = updated;
    renderQuotes();
    quoteNotice.textContent = 'Quote tracker updated.';
    return true;
  }
  function renderQuotes() {
    const target = byId('quote-list');
    target.replaceChildren();
    if (!quotes.length) { target.textContent = 'No tracked quotes yet.'; return; }
    for (const [index, quote] of quotes.entries()) {
      const panel = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = quote.reference;
      panel.append(heading);
      const status = document.createElement('select');
      for (const state of quoteStatuses) status.add(new Option(state));
      status.value = quote.status;
      const statusLabel = document.createElement('label');
      statusLabel.textContent = 'Client response ';
      statusLabel.append(status);
      panel.append(statusLabel);
      const followup = document.createElement('input');
      followup.type = 'date';
      followup.value = quote.followup;
      const followupLabel = document.createElement('label');
      followupLabel.textContent = 'Follow-up date ';
      followupLabel.append(followup);
      panel.append(followupLabel);
      const alert = document.createElement('p');
      alert.className = 'quote-followup';
      alert.textContent = followupStatus(quote, localDate());
      panel.append(alert);
      const checks = quote.milestones.map(milestone => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = milestone.billed;
        const label = document.createElement('label');
        label.append(checkbox, ' Billed · ' + milestone.name + ' · ' + money(milestone.cents));
        panel.append(label);
        return checkbox;
      });
      const totals = document.createElement('p');
      const total = quote.milestones.reduce((sum, item) => sum + item.cents, 0);
      const billed = quote.milestones.reduce((sum, item) => sum + (item.billed ? item.cents : 0), 0);
      totals.textContent = 'Quote total ' + money(total) + ' · marked billed ' + money(billed);
      panel.append(totals);
      const preview = document.createElement('button');
      preview.type = 'button';
      preview.textContent = 'Preview mini-quote';
      preview.onclick = () => {
        byId('quote-print-body').textContent = [
          'Quote reference: ' + quote.reference,
          '',
          ...quote.milestones.map(item => item.name + ' · ' + money(item.cents)),
          '',
          'Total: ' + money(total),
          'Draft for review. Confirm scope and payment terms separately.'
        ].join('\n');
        byId('quote-print').hidden = false;
        byId('quote-print-title').focus();
        byId('close-quote-print').onclick = () => {
          byId('quote-print').hidden = true;
          preview.focus();
        };
      };
      panel.append(preview);
      const save = document.createElement('button');
      save.textContent = 'Save quote details';
      save.onclick = () => {
        if (!followup.value || !followup.reportValidity()) {
          quoteNotice.textContent = 'Choose a valid follow-up date.';
          return;
        }
        const updated = {...quote, status:status.value, followup:followup.value,
          milestones:quote.milestones.map((item, position) => ({...item, billed:checks[position].checked}))};
        saveQuotes(quotes.map((item, position) => position === index ? updated : item));
      };
      const remove = document.createElement('button');
      remove.textContent = 'Remove quote';
      remove.onclick = () => {
        if (confirm('Remove this quote and its milestone records?')) saveQuotes(quotes.filter((_, position) => position !== index));
      };
      panel.append(save, remove);
      target.append(panel);
    }
  }
  byId('print-quote').onclick = () => window.print();
  byId('quote-tracker').onsubmit = event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = dataOf(form);
    if (!data.reference || quotes.length >= 50) {
      quoteNotice.textContent = 'Enter a quote reference. Maximum 50 quotes per tab.';
      return;
    }
    try {
      const milestones = parseBillingMilestones(data.milestones);
      if (saveQuotes([...quotes, {reference:data.reference, followup:data.followup, status:'Awaiting reply', milestones}])) form.reset();
    } catch (error) { quoteNotice.textContent = error.message; }
  };
  renderQuotes();
  setInterval(() => {
    const today = localDate();
    byId('quote-list').querySelectorAll('.quote-followup').forEach((alert, index) => {
      const message = followupStatus(quotes[index], today);
      if (alert.textContent !== message) alert.textContent = message;
    });
  }, 60000);

  const workLogKey = 'scopekeeper-work-log-v1';
  const workForm = byId('work-log');
  const workMonth = byId('work-log-month');
  const workNotice = byId('work-log-status');
  let workEntries = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(workLogKey) || '[]');
    if (Array.isArray(saved)) workEntries = saved.filter(entry => entry && ['billable','courtesy'].includes(entry.kind)
      && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && typeof entry.reference === 'string'
      && Number.isFinite(entry.hours) && entry.hours > 0 && Number.isSafeInteger(entry.cents) && entry.cents >= 0);
  } catch { /* Start empty. */ }
  const digestStart = byId('digest-start');
  digestStart.value = localDate();
  function renderDigest() {
    const output = byId('weekly-digest');
    if (!digestStart.value) { output.value = ''; return; }
    const digest = weeklyDigest(workEntries, digestStart.value);
    output.value = digestStart.value + ' to ' + digest.end + ' · '
      + digest.billable.count + ' billable entries (' + hoursText(digest.billable.hours) + ' h) · '
      + digest.courtesy.count + ' courtesy entries (' + hoursText(digest.courtesy.hours) + ' h, '
      + money(digest.courtesy.cents) + ' estimated value).';
  }
  digestStart.onchange = renderDigest;
  workForm.elements.date.value = localDate();
  workMonth.value = localDate().slice(0, 7);
  const hoursText = hours => new Intl.NumberFormat('en-IN', {maximumFractionDigits:2}).format(hours);
  function renderWorkLog() {
    const totals = workLogTotals(workEntries);
    byId('work-log-totals').value = 'All logged work: ' + hoursText(totals.billable.hours)
      + ' billable hours · ' + hoursText(totals.courtesy.hours) + ' courtesy hours · '
      + money(totals.courtesy.cents) + ' estimated courtesy value.';
    const month = workMonth.value;
    const report = workLogTotals(workEntries, month).courtesy;
    byId('work-log-report').textContent = month
      ? month + ': ' + report.count + ' courtesy entries · ' + hoursText(report.hours)
        + ' hours · ' + money(report.cents) + ' estimated value.'
      : 'Select a month for a courtesy report.';
    byId('courtesy-alert').textContent = totals.courtesy.count >= 3
      ? 'Courtesy alert: ' + totals.courtesy.count + ' free-work entries in this tab. Review repeat requests before offering another courtesy.' : '';
    updateCourtesyGoal();
    renderDigest();
    const target = byId('work-log-list');
    target.replaceChildren();
    for (const [index, entry] of workEntries.entries()) {
      if (month && !entry.date.startsWith(month + '-')) continue;
      const row = document.createElement('li');
      row.textContent = entry.date + ' · ' + entry.reference + ' · ' + entry.kind + ' · '
        + hoursText(entry.hours) + ' hours · ' + money(entry.cents) + ' reference value ';
      const remove = document.createElement('button');
      remove.textContent = 'Remove entry';
      remove.onclick = () => saveWorkLog(workEntries.filter((_, position) => position !== index));
      row.append(remove);
      target.append(row);
    }
    if (!target.childElementCount) target.textContent = 'No entries for this view.';
  }
  function saveWorkLog(updated) {
    try { sessionStorage.setItem(workLogKey, JSON.stringify(updated)); }
    catch { workNotice.textContent = 'Browser storage unavailable. Work log changes were not saved.'; return false; }
    workEntries = updated;
    renderWorkLog();
    workNotice.textContent = 'Work log updated.';
    return true;
  }
  workForm.onsubmit = event => {
    event.preventDefault();
    const data = dataOf(workForm);
    if (!data.reference || workEntries.length >= 100) {
      workNotice.textContent = 'Enter a reference. Maximum 100 entries per tab.';
      return;
    }
    const hours = Number(data.hours);
    const entry = {kind:data.kind, date:data.date, reference:data.reference, hours,
      cents:Math.round(Math.round(Number(data.rate) * 100) * hours)};
    if (saveWorkLog([...workEntries, entry])) workForm.elements.reference.value = '';
  };
  const goalForm = byId('courtesy-goal');
  let activeGoal;
  function updateCourtesyGoal() {
    if (!activeGoal) return;
    const output = goalForm.querySelector('output');
    try {
      const goal = courtesyGoal(workEntries, activeGoal.baseline, workMonth.value, activeGoal.reduction);
      output.value = 'Logged baseline ' + hoursText(goal.previous) + ' h · target '
        + hoursText(goal.target) + ' h · logged this month ' + hoursText(goal.latest) + ' h. '
        + (goal.reached ? 'Within target so far.' : 'Above target.');
    } catch (error) { output.value = error.message; }
  }
  goalForm.onsubmit = event => {
    event.preventDefault();
    const data = dataOf(goalForm);
    activeGoal = {baseline:data.baseline, reduction:Number(data.reduction)};
    updateCourtesyGoal();
  };
  goalForm.oninput = () => {
    activeGoal = undefined;
    goalForm.querySelector('output').value = '';
  };
  workMonth.onchange = renderWorkLog;
  renderWorkLog();

  const stakeholdersKey = 'scopekeeper-stakeholders-v1';
  const stakeholderStatus = byId('stakeholder-status');
  let stakeholders = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(stakeholdersKey) || '[]');
    if (Array.isArray(saved)) stakeholders = saved.filter(item => item
      && ['client','person','role'].every(field => typeof item[field] === 'string')
      && ['yes','no','unknown'].includes(item.authority));
  } catch { /* Start empty. */ }
  function renderStakeholders() {
    const filter = byId('stakeholder-filter').value.trim().toLowerCase();
    const list = byId('stakeholder-list');
    list.replaceChildren();
    for (const record of stakeholders) {
      if (!record.client.toLowerCase().includes(filter)) continue;
      const row = document.createElement('li');
      const authority = {yes:'Can approve', no:'Cannot approve', unknown:'Unverified'};
      row.textContent = record.client + ' · ' + record.person + ' · ' + record.role + ' · ' + authority[record.authority] + ' ';
      const remove = document.createElement('button');
      remove.textContent = 'Remove stakeholder';
      remove.onclick = () => saveStakeholders(stakeholders.filter(item => item !== record));
      row.append(remove);
      list.append(row);
    }
    if (!list.childElementCount) list.textContent = 'No matching stakeholders.';
  }
  function saveStakeholders(updated) {
    try { sessionStorage.setItem(stakeholdersKey, JSON.stringify(updated)); }
    catch { stakeholderStatus.textContent = 'Browser storage unavailable. Changes were not saved.'; return; }
    stakeholders = updated;
    renderStakeholders();
    byId('authority-output').value = '';
    stakeholderStatus.textContent = 'Stakeholder register updated.';
  }
  byId('stakeholder-form').onsubmit = event => {
    event.preventDefault();
    const record = dataOf(event.currentTarget);
    if (!record.client || !record.person || !record.role) {
      stakeholderStatus.textContent = 'Enter a client, person and role.';
      return;
    }
    const key = stakeholderKey(record.client, record.person);
    const others = stakeholders.filter(item => stakeholderKey(item.client, item.person) !== key);
    if (others.length >= 100) { stakeholderStatus.textContent = 'Maximum 100 stakeholders per tab.'; return; }
    saveStakeholders([...others, record]);
  };
  byId('stakeholder-filter').oninput = renderStakeholders;
  renderStakeholders();
  byId('authority-check').onsubmit = event => {
    event.preventDefault();
    const {client, person} = dataOf(event.currentTarget);
    byId('authority-output').value = authorityMessage(stakeholders, client, person);
  };
  byId('send-time').onsubmit = event => {
    event.preventDefault();
    const {zone} = dataOf(event.currentTarget);
    const output = byId('send-time-output');
    try {
      const time = nextClientSendTime(zone, Date.now());
      const format = options => new Intl.DateTimeFormat('en-IN', {dateStyle:'medium', timeStyle:'short', ...options}).format(time);
      output.value = 'Client (' + zone + '): ' + format({timeZone:zone}) + ' · Your device: ' + format({});
    } catch (error) {
      output.value = error instanceof RangeError ? 'Enter a valid time zone, such as Asia/Kolkata.' : error.message;
    }
  };

  const deliverableKey = 'scopekeeper-deliverables-v1';
  const deliverableForm = byId('deliverables-register');
  const deliverableNotice = byId('deliverable-status');
  const states = ['Planned', 'In progress', 'Delivered', 'Accepted'];
  let deliverables = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(deliverableKey) || '[]');
    if (Array.isArray(saved)) deliverables = saved.filter(item => item
      && typeof item.name === 'string' && typeof item.description === 'string' && states.includes(item.status));
  } catch { /* Start empty. */ }
  function renderDeliverables() {
    const target = byId('deliverable-list');
    target.replaceChildren();
    for (const [index, item] of deliverables.entries()) {
      const row = document.createElement('li');
      row.textContent = item.name + ' · ' + item.status + ' · ' + item.description + ' ';
      const edit = document.createElement('button');
      edit.textContent = 'Edit deliverable';
      edit.onclick = () => {
        for (const key of ['name','description','status']) deliverableForm.elements[key].value = item[key];
        deliverableForm.elements.description.focus();
      };
      const remove = document.createElement('button');
      remove.textContent = 'Remove deliverable';
      remove.onclick = () => saveDeliverables(deliverables.filter((_, position) => position !== index));
      row.append(edit, remove);
      target.append(row);
    }
    if (!target.childElementCount) target.textContent = 'No deliverables recorded.';
  }
  function saveDeliverables(updated) {
    try { sessionStorage.setItem(deliverableKey, JSON.stringify(updated)); }
    catch { deliverableNotice.textContent = 'Browser storage unavailable. Changes were not saved.'; return; }
    deliverables = updated;
    renderDeliverables();
    byId('deliverable-match').value = '';
    deliverableNotice.textContent = 'Deliverable register updated.';
  }
  deliverableForm.onsubmit = event => {
    event.preventDefault();
    const item = dataOf(deliverableForm);
    if (!item.name || !item.description || !states.includes(item.status)) {
      deliverableNotice.textContent = 'Enter a name, description and status.';
      return;
    }
    const updated = [...deliverables];
    const index = updated.findIndex(row => row.name.toLowerCase() === item.name.toLowerCase());
    if (index >= 0) updated[index] = item;
    else if (updated.length < 100) updated.push(item);
    else { deliverableNotice.textContent = 'Maximum 100 deliverables per tab.'; return; }
    saveDeliverables(updated);
  };
  byId('match-deliverable').onsubmit = event => {
    event.preventDefault();
    const {request} = dataOf(event.currentTarget);
    const match = matchDeliverable(request, deliverables);
    byId('deliverable-match').value = match
      ? match.entry.name + ' · ' + match.entry.status + ' · ' + Math.round(match.score * 100) + '% word overlap. Review manually.'
      : 'No clear match. Check the original scope manually.';
  };
  renderDeliverables();

  const profileKey = 'scopekeeper-project-profiles-v1';
  const recentKey = 'scopekeeper-recent-projects-v1';
  let recentProfiles = [];
  try {
    const recent = JSON.parse(sessionStorage.getItem(recentKey) || '[]');
    if (Array.isArray(recent)) recentProfiles = recent.filter(item => typeof item === 'string').slice(0, 5);
  } catch { /* Start empty. */ }
  const setup = byId('setup-form');
  const setupStatus = byId('setup-status');
  const profileChoice = byId('profile-choice');
  let profiles = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(profileKey) || '[]');
    if (Array.isArray(saved)) profiles = saved.filter(validProjectProfile).slice(0, 50);
  } catch { /* Start empty. */ }
  function setupStep(step) {
    const first = byId('setup-identity');
    const second = byId('setup-planning');
    first.hidden = first.disabled = step !== 1;
    second.hidden = second.disabled = step !== 2;
    setup.elements[step === 1 ? 'client' : 'start'].focus();
  }
  function renderRecentProfiles() {
    const target = byId('recent-profiles');
    target.replaceChildren();
    const heading = document.createElement('p');
    heading.textContent = 'Recent projects';
    target.append(heading);
    for (const key of recentProfiles) {
      const index = profiles.findIndex(profile => stakeholderKey(profile.client, profile.project) === key);
      if (index < 0) continue;
      const profile = profiles[index];
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = profile.client + ' · ' + profile.project;
      button.onclick = () => {
        profileChoice.value = String(index);
        profileChoice.onchange();
        profileChoice.focus();
      };
      target.append(button);
    }
    if (target.childElementCount === 1) heading.textContent = 'Recent projects appear after you apply a profile.';
  }
  function displayProfiles(selected = '') {
    profileChoice.replaceChildren(new Option('Choose a project', ''));
    profiles.forEach((profile, index) => profileChoice.add(new Option(profile.client + ' · ' + profile.project, index)));
    profileChoice.value = selected;
    renderRecentProfiles();
  }
  byId('setup-next').onclick = () => {
    if (setup.reportValidity()) setupStep(2);
  };
  byId('setup-back').onclick = () => setupStep(1);
  setup.onsubmit = event => {
    event.preventDefault();
    if (byId('setup-planning').disabled) { byId('setup-next').click(); return; }
    const profile = Object.fromEntries(['client','project','start','rate','accent'].map(name => [name, setup.elements[name].value.trim()]));
    if (!validProjectProfile(profile)) { setupStatus.textContent = 'Check both setup steps for valid values.'; return; }
    const next = [...profiles];
    const key = stakeholderKey(profile.client, profile.project);
    const existing = next.findIndex(item => stakeholderKey(item.client, item.project) === key);
    if (existing < 0 && next.length >= 50) { setupStatus.textContent = 'Maximum 50 profiles per tab.'; return; }
    const index = existing < 0 ? next.length : existing;
    next[index] = profile;
    try { sessionStorage.setItem(profileKey, JSON.stringify(next)); }
    catch { setupStatus.textContent = 'Browser storage unavailable. Profile was not saved.'; return; }
    profiles = next;
    displayProfiles(String(index));
    byId('project-setup').style.setProperty('--client-accent', profile.accent);
    setupStatus.textContent = 'Profile saved. Apply it to prefill draft fields.';
  };
  profileChoice.onchange = () => {
    const profile = profileChoice.value === '' ? null : profiles[Number(profileChoice.value)];
    byId('project-setup').style.setProperty('--client-accent', profile?.accent ?? '#681f35');
    setupStatus.textContent = profile ? 'Start ' + profile.start + ' · planning rate ₹' + profile.rate + '/h.' : '';
  };
  byId('apply-profile').onclick = () => {
    if (profileChoice.value === '') { setupStatus.textContent = 'Choose a saved project first.'; return; }
    const profile = profiles[Number(profileChoice.value)];
    const fields = [[sow.elements.project, profile.project],
      [byId('change-request').elements.project, profile.project],
      [byId('stakeholder-form').elements.client, profile.client],
      [byId('work-log').elements.rate, profile.rate]];
    if (fields.some(([field, value]) => field.value && field.value !== value)
      && !confirm('Replace the current values in these draft forms?')) return;
    for (const [field, value] of fields) field.value = value;
    recentProfiles = recordRecentProject(recentProfiles, stakeholderKey(profile.client, profile.project));
    try { sessionStorage.setItem(recentKey, JSON.stringify(recentProfiles)); }
    catch { /* Keep recents in memory when storage is disabled. */ }
    renderRecentProfiles();
    setupStatus.textContent = 'Project details applied to draft forms.';
  };
  displayProfiles();

  const feedback = byId('feedback-dialog');
  byId('open-feedback').onclick = () => feedback.showModal();
  byId('close-feedback').onclick = () => feedback.close();
  byId('feedback-form').onsubmit = event => {
    event.preventDefault();
    const {category, details} = dataOf(event.currentTarget);
    const status = byId('feedback-status');
    if (!details) { status.textContent = 'Enter feedback first.'; return; }
    const report = feedbackReport(category, details, localDate());
    const url = URL.createObjectURL(new Blob([report], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scopekeeper-feedback.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Feedback report download started.';
  };

  const key = 'scopekeeper-project-notes-v1';
  const notesTarget = byId('project-notes');
  const status = byId('note-status');
  let notes = [];
  try { notes = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch { /* Start empty. */ }
  function saveNotes(updated) {
    try { sessionStorage.setItem(key, JSON.stringify(updated)); }
    catch { status.textContent = 'Browser storage unavailable. Note changes were not saved.'; return; }
    notes = updated;
    renderNotes();
    status.textContent = 'Project notes updated in this tab.';
  }
  function renderNotes() {
    notesTarget.replaceChildren();
    for (const [index, note] of notes.entries()) {
      const row = document.createElement('p');
      const remove = document.createElement('button');
      remove.textContent = 'Remove note';
      remove.onclick = () => saveNotes(notes.filter((_, position) => position !== index));
      row.textContent = note.project + ' · ' + note.date + ' · '
        + (note.kind === 'consent' ? 'Recording consent: ' : 'Lesson learned: ') + note.note + ' ';
      row.append(remove);
      notesTarget.append(row);
    }
  }
  renderNotes();
  byId('project-note').onsubmit = event => {
    event.preventDefault();
    const data = dataOf(event.currentTarget);
    if (!data.project || !data.note || notes.length >= 100) {
      status.textContent = 'Enter a project and note. Maximum 100 notes per tab.';
      return;
    }
    saveNotes([...notes, data]);
  };
}
