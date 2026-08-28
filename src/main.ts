import QRCode from 'qrcode';
import './style.css';
import { addCadence, buildOutlook, dueLabel, formatDate, reconcileChore, todayISO } from './rotation';
import { emptyHousehold, loadHousehold, saveHousehold, validateImport, deleteDemoHousehold } from './storage';
import { sampleHousehold } from './demo';
import { checkoutUrl, FREE_CHORE_LIMIT, FREE_PEOPLE_LIMIT, isUnlocked, acceptLicenseFromUrl, storeAndVerify, verifyLicense } from './license';
import { readSnapshot, snapshotUrl } from './share';
import type { Activity, BoardSnapshot, CadenceUnit, Chore } from './types';

const root = document.querySelector<HTMLDivElement>('#app')!;
let data = emptyHousehold();
let view: 'board' | 'people' | 'chores' | 'activity' | 'settings' = 'board';
let unlocked = false;
let storageError = '';
let deferredInstall: BeforeInstallPromptEvent | null = null;
const demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
const knownPaths = new Set(['/', '/demo', '/privacy', '/terms']);

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const escapeHtml = (input: string): string => input.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]!));

const id = (): string => crypto.randomUUID();

function icon(name: 'check' | 'swap' | 'calendar' | 'share' | 'plus' | 'download'): string {
  const paths = {
    check: '<path d="m5 12 4 4L19 7"/>',
    swap: '<path d="m7 7 3-3 3 3M10 4v12M17 17l-3 3-3-3M14 20V8"/>',
    calendar: '<path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/>',
    share: '<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v13m-5-5 5 5 5-5M4 20h16"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function appShell(content: string): string {
  const legal = location.pathname === '/privacy' || location.pathname === '/terms';
  return `
    <header class="masthead">
      <a class="brand" href="/" aria-label="Fair Turn home"><span class="brand-title">Fair<span>Turn</span><i aria-hidden="true">↻</i></span></a>
      <div class="header-actions">
        <span class="local-pill"><b aria-hidden="true"></b> Local only</span>
        <button class="icon-button" id="theme-toggle" type="button" aria-label="Change color theme">◐</button>
      </div>
    </header>
    <div class="offline-banner" id="offline-banner" role="status" ${navigator.onLine ? 'hidden' : ''}>Offline — everything still works on this device.</div>
    ${demoMode && !legal ? demoBanner() : ''}
    ${!legal && knownPaths.has(location.pathname) && data.householdName ? navigation() : ''}
    <main id="main" tabindex="-1">${content}</main>
    <footer>
      <p><strong>Fair Turn</strong> keeps the board, not the score.</p>
      <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><button class="text-button" data-action="install" ${deferredInstall ? '' : 'hidden'}>Install app</button></nav>
      <p class="disclosure">The paper-collage artwork was generated for Fair Turn. No household data leaves this device unless you export or share it.</p>
    </footer>
    <div id="toast" class="toast" role="status" aria-live="polite" aria-atomic="true"></div>
    <dialog id="dialog"><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close dialog">×</button><div id="dialog-body"></div></dialog>`;
}

function demoBanner(): string {
  return `<aside class="demo-banner" aria-label="Sample data notice"><p><strong>Demo — sample data, nothing is saved</strong></p><div><button class="text-button" data-action="reset-demo">Reset demo</button><button class="button secondary" data-action="start-real">Start for real</button></div></aside>`;
}

function navigation(): string {
  const tabs: Array<[typeof view, string]> = [
    ['board', 'Board'], ['people', 'People & away'], ['chores', 'Chores'], ['activity', 'History'], ['settings', 'Own your data'],
  ];
  return `<nav class="tabs" aria-label="Household sections">${tabs.map(([key, label]) =>
    `<button type="button" data-view="${key}" ${view === key ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</nav>`;
}

function welcome(): string {
  return `<section class="welcome" aria-labelledby="welcome-title">
    <div class="welcome-copy">
      <p class="eyebrow">A shared-home utility</p>
      <h1 id="welcome-title">Rotate chores<br><mark>fairly at home.</mark></h1>
      <p class="lede">For adults sharing a home who need clear turns, dated absences, and agreed swaps.</p>
      <div class="try-demo"><a class="button primary" href="/demo">Try it with sample data</a><span>See a working household board in one click.</span></div>
      <form id="start-form" class="start-form">
        <div class="field"><label for="household-name">What should we call this household?</label><input id="household-name" name="household" required maxlength="48" autocomplete="organization" placeholder="e.g. Flat 4B"></div>
        <div class="field"><label for="people-names">Who shares the rotation?</label><span class="hint" id="people-hint">Use commas between names. You can change this later.</span><input id="people-names" name="people" required aria-describedby="people-hint" placeholder="Sam, Alex, Jo"></div>
        <p class="form-error" id="start-error" role="alert" aria-live="polite"></p>
        <button class="button primary" type="submit">Make our board ${icon('plus')}</button>
      </form>
      <ul class="principles" aria-label="Product facts"><li><b>Private.</b> Your board stays in this browser.</li><li><b>Offline.</b> Reopen it without a connection.</li><li><b>Free to start.</b> Four people and six chores.</li></ul>
    </div>
    <figure class="hero-art">
      <picture><source srcset="/assets/rotation-board.webp" type="image/webp"><img src="/assets/rotation-board.jpg" width="960" height="640" fetchpriority="high" decoding="async" alt="Three paper chore cards circling a track while an away marker lifts one out of turn"></picture>
      <figcaption>When someone is away, the turn moves on — without losing the rotation.</figcaption>
    </figure>
  </section>`;
}

function board(): string {
  if (!data.chores.length) return `<section class="section-head"><div><p class="eyebrow">Current board</p><h1>No chores on the board yet.</h1><p class="lede small">Add one recurring job and Fair Turn will assign its first turn.</p></div><button class="button primary" data-action="add-chore">Add a chore ${icon('plus')}</button></section>${howItWorks()}`;
  const names = new Map(data.people.map((person) => [person.id, person.name]));
  return `<section>
    <div class="section-head"><div><p class="eyebrow">${escapeHtml(data.householdName)} · current board</p><h1>Here’s the next turn.</h1><p>Assignments advance when a chore is marked done. Away dates are skipped automatically.</p></div><button class="button secondary" data-action="share">Share board ${icon('share')}</button></div>
    ${storageError ? `<p class="error-box" role="alert">${escapeHtml(storageError)} Changes may not survive a refresh. Export a backup now.</p>` : ''}
    <div class="assignment-grid">${data.chores.map((chore, index) => {
      const due = dueLabel(chore.nextDue);
      const person = chore.currentPersonId ? names.get(chore.currentPersonId) : null;
      return `<article class="assignment-card card-${index % 8}">
        <div class="assignment-top"><span class="turn-label">Turn ${String(index + 1).padStart(2, '0')}</span><span class="due ${due.status}">${escapeHtml(due.text)}</span></div>
        <h2 class="item-heading">${escapeHtml(chore.title)}</h2>
        <p class="assigned-name">${person ? escapeHtml(person) : 'No one available'}</p>
        ${person ? '' : '<p class="availability-note">Everyone eligible is away on this due date. Add another person or adjust an absence.</p>'}
        <p class="cadence">Every ${chore.cadenceValue} ${escapeHtml(chore.cadenceUnit.replace(/s$/, chore.cadenceValue === 1 ? '' : 's'))}</p>
        <div class="card-actions">
          <button class="button primary" data-action="complete" data-id="${chore.id}" ${person ? '' : 'disabled'}>${icon('check')} Mark done</button>
          <button class="button secondary" data-action="swap" data-id="${chore.id}" ${person ? '' : 'disabled'}>${icon('swap')} Swap</button>
        </div>
      </article>`;
    }).join('')}</div>
    <div class="board-foot"><p><strong>${data.absences.filter((absence) => absence.end >= todayISO()).length}</strong> current or upcoming away ${data.absences.length === 1 ? 'entry' : 'entries'}</p><button class="text-button" data-view="people">Review away dates →</button></div>
  </section>${unlocked ? outlook() : upgradeStrip()}`;
}

function outlook(): string {
  const rows = buildOutlook(data).slice(0, 24);
  return `<section class="outlook"><div class="section-head compact"><div><p class="eyebrow">Unlocked · 8-week outlook</p><h2>See the hand-offs ahead.</h2></div></div>
    ${rows.length ? `<div class="outlook-list">${rows.map((item) => `<div><time datetime="${item.due}">${formatDate(item.due)}</time><b>${escapeHtml(item.choreTitle)}</b><span>${escapeHtml(item.personName)}</span></div>`).join('')}</div>` : '<p>Add a chore to see the outlook.</p>'}
  </section>`;
}

function upgradeStrip(): string {
  return `<aside class="upgrade-strip"><div><p class="eyebrow">Keep it for good</p><h2>Fair Turn Plus · $12 once</h2><p>Unlimited people and chores, plus an eight-week rotation outlook. Core rotation, sharing, accessibility, and exports stay free.</p></div><div class="upgrade-actions"><a class="button ink" href="${checkoutUrl()}">Buy once</a><button class="text-button" data-view="settings">Restore a license</button></div></aside>`;
}

function peopleView(): string {
  const today = todayISO();
  return `<section><div class="section-head"><div><p class="eyebrow">People & away</p><h1>Who can take a turn?</h1><p>Away dates only affect assignments due inside that range.</p></div><div class="button-row"><button class="button secondary" data-action="add-person">Add person ${icon('plus')}</button><button class="button primary" data-action="add-absence">Add away dates ${icon('calendar')}</button></div></div>
    <div class="split-layout"><section><h2>People</h2><ul class="plain-list people-list">${data.people.map((person) => `<li><span class="avatar" aria-hidden="true">${escapeHtml(person.name.slice(0, 1).toUpperCase())}</span><b>${escapeHtml(person.name)}</b><button class="text-button danger-text" data-action="delete-person" data-id="${person.id}">Remove</button></li>`).join('')}</ul></section>
    <section><h2>Away dates</h2>${data.absences.length ? `<ul class="plain-list absence-list">${[...data.absences].sort((a,b) => a.start.localeCompare(b.start)).map((absence) => {
      const person = data.people.find((item) => item.id === absence.personId);
      const past = absence.end < today;
      return `<li class="${past ? 'past' : ''}"><div><b>${escapeHtml(person?.name ?? 'Removed person')}</b><span>${formatDate(absence.start)}–${formatDate(absence.end)}</span>${absence.note ? `<small>${escapeHtml(absence.note)}</small>` : ''}</div><button class="text-button danger-text" data-action="delete-absence" data-id="${absence.id}">Remove</button></li>`;
    }).join('')}</ul>` : '<div class="mini-empty"><p>No away dates recorded.</p><button class="text-button" data-action="add-absence">Add the first one →</button></div>'}</section></div></section>`;
}

function choresView(): string {
  return `<section><div class="section-head"><div><p class="eyebrow">Rotation rules</p><h1>Recurring chores</h1><p>Each chore keeps its own fair round-robin order.</p></div><button class="button primary" data-action="add-chore">Add a chore ${icon('plus')}</button></div>
    ${data.chores.length ? `<div class="chore-list">${data.chores.map((chore) => `<article><div><h2>${escapeHtml(chore.title)}</h2><p>Every ${chore.cadenceValue} ${escapeHtml(chore.cadenceUnit)} · ${chore.eligibleIds.length} eligible · next ${formatDate(chore.nextDue)}</p></div><div><button class="text-button" data-action="edit-chore" data-id="${chore.id}">Edit</button><button class="text-button danger-text" data-action="delete-chore" data-id="${chore.id}">Delete</button></div></article>`).join('')}</div>` : '<div class="mini-empty"><p>Nothing recurs yet.</p></div>'}
  </section>${howItWorks()}`;
}

function howItWorks(): string {
  return `<section class="explainer"><p class="eyebrow">The rule is simple</p><h2>Fairness you can inspect.</h2><ol><li><span>01</span><div><b>Take the next eligible person.</b><p>Each chore remembers its own order.</p></div></li><li><span>02</span><div><b>Skip a dated absence.</b><p>The absent person stays in the future rotation.</p></div></li><li><span>03</span><div><b>Write down exceptions.</b><p>Swaps and completions stay in local history.</p></div></li></ol></section>`;
}

function historyView(): string {
  return `<section><div class="section-head"><div><p class="eyebrow">Local activity</p><h1>An answer when memory differs.</h1><p>This log stays on this device and records actions, never points.</p></div><button class="button secondary" data-action="export-csv">Export CSV ${icon('download')}</button></div>
    ${data.activity.length ? `<ol class="history-list">${data.activity.map((item) => `<li><time datetime="${item.at}">${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.at))}</time><div><b>${activityTitle(item)}</b>${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}</div></li>`).join('')}</ol>` : '<div class="mini-empty"><p>No activity yet. A completion or swap will appear here.</p></div>'}
  </section>`;
}

function activityTitle(item: Activity): string {
  if (item.type === 'completed') return `${escapeHtml(item.personName ?? 'Someone')} completed ${escapeHtml(item.choreTitle ?? 'a chore')}`;
  if (item.type === 'swapped') return `${escapeHtml(item.choreTitle ?? 'A chore')} moved from ${escapeHtml(item.fromPersonName ?? 'someone')} to ${escapeHtml(item.toPersonName ?? 'someone')}`;
  if (item.type === 'absence_skip') return `${escapeHtml(item.fromPersonName ?? 'Someone')} was skipped while away; ${escapeHtml(item.toPersonName ?? 'no one')} took ${escapeHtml(item.choreTitle ?? 'the turn')}`;
  if (item.type === 'deleted') return `${escapeHtml(item.choreTitle ?? 'An item')} was removed`;
  return `${escapeHtml(item.choreTitle ?? 'A chore')} was added to the rotation`;
}

function settingsView(): string {
  return `<section><div class="section-head"><div><p class="eyebrow">Own your data</p><h1>Portable by design.</h1><p>Back up the complete household or move it to another device. Imports replace the current board only after confirmation.</p></div></div>
    <div class="settings-grid"><section><h2>Backup & transfer</h2><p>JSON preserves the full board. CSV is a readable activity ledger.</p><div class="button-stack"><button class="button primary" data-action="export-json">Export backup ${icon('download')}</button><label class="button secondary file-button">Import backup<input id="import-file" type="file" accept="application/json,.json"></label><button class="text-button" data-action="export-csv">Export activity CSV</button></div></section>
    <section><h2>${unlocked ? 'Plus is active' : 'Fair Turn Plus'}</h2><p>${unlocked ? 'Unlimited people and chores and the eight-week outlook are unlocked on this device.' : 'A $12 one-time purchase unlocks unlimited people and chores and the eight-week outlook. No subscription.'}</p>
      ${unlocked ? '<p class="success-box">License verified or available from a recent cached verification.</p>' : `<a class="button ink" href="${checkoutUrl()}">Buy Fair Turn Plus · $12 once</a><form id="license-form" class="license-form"><label for="license-token">Have a license? Paste it here</label><div><input id="license-token" name="license" required autocomplete="off"><button class="button secondary" type="submit">Verify</button></div><p class="hint">Sociobot/Dodo is the merchant of record. Refunds are handled there and revoke the license.</p></form>`}
    </section><section><h2>Storage & privacy</h2><p>The board is stored in this browser’s IndexedDB. Fair Turn has no account, analytics, trackers, or sync server.</p><p><a href="/privacy">Read privacy details</a> · <a href="/terms">Read terms</a></p></section></div>
    <section class="danger-zone"><h2>Start over</h2><p>Download a backup first. This removes every person, chore, absence, and history entry from this browser.</p><button class="button danger" data-action="reset">Delete this household</button></section>
  </section>`;
}

function legalPage(kind: 'privacy' | 'terms'): string {
  if (kind === 'privacy') return `<article class="legal"><p class="eyebrow">Plain-language policy · August 28, 2026</p><h1>Privacy</h1><p><strong>Fair Turn does not collect household data.</strong> Names, chores, absences, and activity are stored in IndexedDB on your device. There are no accounts, trackers, advertising cookies, or analytics.</p><h2>What leaves your device</h2><p>Nothing leaves automatically. Exported files and QR links leave only when you choose to share them. A shared board link contains a read-only snapshot in its URL fragment. Browsers do not send that fragment to our server.</p><p>If you buy or verify Plus, your license token is sent to Sociobot’s billing API. Sociobot/Dodo acts as merchant of record and handles purchase information under its own policies. Fair Turn stores the token and a daily verification result in local storage.</p><h2>Your controls</h2><p>Export data at any time, remove individual items, or use “Delete this household” to erase the board from this browser. Clearing site data also removes it.</p><p><a href="/">Return to Fair Turn</a></p></article>`;
  return `<article class="legal"><p class="eyebrow">Plain-language terms · August 28, 2026</p><h1>Terms</h1><p>Fair Turn is a household coordination utility provided “as is.” It suggests a rotation based only on the rules entered on this device. Household members remain responsible for agreeing on chores, swaps, safety, and whether a task is appropriate.</p><h2>Respectful use</h2><p>Do not use Fair Turn to coerce, harass, monitor, or assign unsafe work. Names and history can be removed. The product intentionally has no scores, public profiles, or surveillance features.</p><h2>Purchase</h2><p>Fair Turn Plus costs $12 as a one-time purchase for the listed features. Sociobot/Dodo is the merchant of record and handles payment and refunds. A refunded or revoked license stops Plus features. Core rotation and export remain available.</p><h2>Warranty and liability</h2><p>To the extent permitted by law, the software has no warranty. Its authors are not liable for losses arising from its use. These terms do not limit rights that cannot legally be limited.</p><p><a href="/">Return to Fair Turn</a></p></article>`;
}

function sharedBoard(snapshot: BoardSnapshot): string {
  return `<section class="shared"><p class="eyebrow">Shared snapshot · read only</p><h1>${escapeHtml(snapshot.household)}’s current board</h1><p>Shared ${new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(snapshot.sharedAt))}. This link does not update automatically.</p>
    <div class="assignment-grid">${snapshot.assignments.map((item, index) => `<article class="assignment-card"><div class="assignment-top"><span class="turn-label">Turn ${String(index + 1).padStart(2, '0')}</span><span class="due upcoming">${formatDate(item.due)}</span></div><h2 class="item-heading">${escapeHtml(item.chore)}</h2><p class="assigned-name">${escapeHtml(item.person)}</p></article>`).join('')}</div>
    <a class="button primary" href="/">Make your own board</a></section>`;
}

function notFound(): string {
  return `<section class="not-found"><p class="eyebrow">404 · board not found</p><h1>This turn went missing.</h1><p>The address does not match a Fair Turn page.</p><a class="button primary" href="/">Return to the board</a></section>`;
}

function updateMetadata(): void {
  const route = location.pathname;
  const titles: Record<string, string> = {
    '/': 'Fair Turn — rotate household chores fairly',
    '/demo': 'Demo — Fair Turn',
    '/privacy': 'Privacy — Fair Turn',
    '/terms': 'Terms — Fair Turn',
  };
  const title = demoMode ? titles['/demo'] : titles[route] ?? 'Page not found — Fair Turn';
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `https://fair-turn.sociobot.in${demoMode ? '/demo' : knownPaths.has(route) ? route : '/404'}`);
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = `https://fair-turn.sociobot.in${demoMode ? '/demo' : knownPaths.has(route) ? route : '/404'}`;
}

function render(): void {
  const snapshot = readSnapshot();
  let content: string;
  if (!knownPaths.has(location.pathname)) content = notFound();
  else if (location.pathname === '/privacy') content = legalPage('privacy');
  else if (location.pathname === '/terms') content = legalPage('terms');
  else if (snapshot) content = sharedBoard(snapshot);
  else if (!data.householdName) content = welcome();
  else if (view === 'board') content = board();
  else if (view === 'people') content = peopleView();
  else if (view === 'chores') content = choresView();
  else if (view === 'activity') content = historyView();
  else content = settingsView();
  root.innerHTML = appShell(content);
  updateMetadata();
  bindEvents();
}

function toast(message: string): void {
  const element = document.querySelector<HTMLDivElement>('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 4000);
}

async function persist(message?: string): Promise<void> {
  try { data = await saveHousehold(data, demoMode); storageError = ''; }
  catch (error) { storageError = error instanceof Error ? error.message : 'Local save failed.'; }
  render();
  if (message) toast(message);
}

function openDialog(content: string, opener?: HTMLElement): void {
  const dialog = document.querySelector<HTMLDialogElement>('#dialog')!;
  document.querySelector<HTMLDivElement>('#dialog-body')!.innerHTML = content;
  dialog.dataset.opener = opener?.id ?? '';
  dialog.showModal();
  dialog.querySelector<HTMLElement>('input, select, button:not(.dialog-close)')?.focus();
}

function closeDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#dialog');
  dialog?.close();
}

function personChecks(selected: string[] = data.people.map((person) => person.id)): string {
  return `<fieldset><legend>Who can do this chore?</legend><div class="check-grid">${data.people.map((person) => `<label><input type="checkbox" name="eligible" value="${person.id}" ${selected.includes(person.id) ? 'checked' : ''}><span>${escapeHtml(person.name)}</span></label>`).join('')}</div></fieldset>`;
}

function choreDialog(chore?: Chore): string {
  const due = chore?.nextDue ?? todayISO();
  return `<form id="chore-form" class="dialog-form" data-id="${chore?.id ?? ''}"><p class="eyebrow">${chore ? 'Edit rotation' : 'New rotation'}</p><h2>${chore ? 'Adjust this chore' : 'Add a recurring chore'}</h2>
    <div class="field"><label for="chore-title">Chore name</label><input id="chore-title" name="title" required maxlength="60" value="${escapeHtml(chore?.title ?? '')}" placeholder="e.g. Take bins out"></div>
    <div class="field"><label for="chore-due">Next due date</label><input id="chore-due" name="due" type="date" required value="${due}"></div>
    <fieldset><legend>How often?</legend><div class="cadence-input"><input aria-label="Cadence amount" name="value" type="number" min="1" max="365" required value="${chore?.cadenceValue ?? 1}"><select aria-label="Cadence unit" name="unit"><option value="days" ${chore?.cadenceUnit === 'days' ? 'selected' : ''}>days</option><option value="weeks" ${!chore || chore.cadenceUnit === 'weeks' ? 'selected' : ''}>weeks</option><option value="months" ${chore?.cadenceUnit === 'months' ? 'selected' : ''}>months</option></select></div></fieldset>
    ${personChecks(chore?.eligibleIds)}<p class="form-error" aria-live="polite"></p><button class="button primary" type="submit">${chore ? 'Save changes' : 'Assign first turn'}</button></form>`;
}

function bindEvents(): void {
  document.querySelector('#theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : current === 'light' ? 'dark' : matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('fair-turn-theme', next);
  });
  document.querySelectorAll<HTMLElement>('[data-view]').forEach((element) => element.addEventListener('click', () => {
    view = element.dataset.view as typeof view;
    render();
    document.querySelector('#main')?.scrollIntoView();
  }));
  document.querySelectorAll<HTMLElement>('[data-action]').forEach((element) => element.addEventListener('click', () => void handleAction(element)));
  document.querySelector<HTMLFormElement>('#start-form')?.addEventListener('submit', startHousehold);
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', restoreLicense);
  document.querySelector<HTMLInputElement>('#import-file')?.addEventListener('change', importBackup);
  const dialog = document.querySelector<HTMLDialogElement>('#dialog');
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
}

async function handleAction(element: HTMLElement): Promise<void> {
  const action = element.dataset.action;
  const itemId = element.dataset.id;
  if (action === 'close-dialog') return closeDialog();
  if (action === 'add-chore') {
    if (!unlocked && data.chores.length >= FREE_CHORE_LIMIT) { view = 'settings'; render(); return toast(`The free board includes ${FREE_CHORE_LIMIT} chores. Plus removes the limit.`); }
    openDialog(choreDialog(), element); bindDialogForm(); return;
  }
  if (action === 'edit-chore' && itemId) { openDialog(choreDialog(data.chores.find((item) => item.id === itemId)), element); bindDialogForm(); return; }
  if (action === 'complete' && itemId) return completeChore(itemId);
  if (action === 'swap' && itemId) return openSwap(itemId, element);
  if (action === 'add-person') return openPerson(element);
  if (action === 'add-absence') return openAbsence(element);
  if (action === 'delete-person' && itemId) return deletePerson(itemId);
  if (action === 'delete-absence' && itemId) { data.absences = data.absences.filter((item) => item.id !== itemId); reconcileAll(); return persist('Away dates removed.'); }
  if (action === 'delete-chore' && itemId) return deleteChore(itemId);
  if (action === 'share') return openShare(element);
  if (action === 'export-json') return exportJson();
  if (action === 'export-csv') return exportCsv();
  if (action === 'reset') return resetHousehold();
  if (action === 'reset-demo') { data = sampleHousehold(); await persist('Sample board reset.'); return; }
  if (action === 'start-real') { await deleteDemoHousehold(); location.assign('/'); return; }
  if (action === 'install' && deferredInstall) { await deferredInstall.prompt(); deferredInstall = null; render(); }
}

function bindDialogForm(): void {
  document.querySelector<HTMLFormElement>('#chore-form')?.addEventListener('submit', saveChore);
  document.querySelector<HTMLFormElement>('#person-form')?.addEventListener('submit', savePerson);
  document.querySelector<HTMLFormElement>('#absence-form')?.addEventListener('submit', saveAbsence);
  document.querySelector<HTMLFormElement>('#swap-form')?.addEventListener('submit', saveSwap);
  document.querySelector<HTMLButtonElement>('[data-action="close-dialog"]')?.addEventListener('click', closeDialog);
}

function startHousehold(event: SubmitEvent): void {
  event.preventDefault();
  const form = new FormData(event.currentTarget as HTMLFormElement);
  const names = String(form.get('people')).split(',').map((name) => name.trim()).filter(Boolean);
  const householdName = String(form.get('household')).trim();
  const householdInput = document.querySelector<HTMLInputElement>('#household-name')!;
  const error = document.querySelector<HTMLElement>('#start-error')!;
  if (!householdName) {
    householdInput.setAttribute('aria-invalid', 'true');
    householdInput.setAttribute('aria-describedby', 'start-error');
    error.textContent = 'Enter a household name with at least one visible character.';
    householdInput.focus();
    return;
  }
  if (names.length < 2) return toast('Add at least two names to make a rotation.');
  const limited = unlocked ? names : names.slice(0, FREE_PEOPLE_LIMIT);
  data = { ...emptyHousehold(), householdName, people: limited.map((name) => ({ id: id(), name })) };
  void persist(names.length > limited.length ? `Started with ${FREE_PEOPLE_LIMIT} people; Plus allows larger households.` : 'Your board is ready. Add the first chore.');
}

function saveChore(event: SubmitEvent): void {
  event.preventDefault();
  const target = event.currentTarget as HTMLFormElement;
  const form = new FormData(target);
  const eligibleIds = form.getAll('eligible').map(String);
  const error = target.querySelector<HTMLElement>('.form-error')!;
  const title = String(form.get('title')).trim();
  if (!title) { error.textContent = 'Enter a chore name with at least one visible character.'; target.querySelector<HTMLInputElement>('#chore-title')?.focus(); return; }
  if (!eligibleIds.length) { error.textContent = 'Choose at least one eligible person.'; return; }
  const existingId = target.dataset.id;
  const existing = data.chores.find((item) => item.id === existingId);
  const due = String(form.get('due'));
  const unit = String(form.get('unit')) as CadenceUnit;
  const chore: Chore = {
    id: existing?.id ?? id(), title, cadenceValue: Number(form.get('value')), cadenceUnit: unit,
    eligibleIds, nextDue: due, lastPersonId: existing?.lastPersonId ?? null,
    currentPersonId: existing?.currentPersonId && eligibleIds.includes(existing.currentPersonId) ? existing.currentPersonId : null,
  };
  const reconciled = reconcileChore(chore, data.absences);
  if (existing) data.chores = data.chores.map((item) => item.id === existing.id ? reconciled : item);
  else {
    data.chores.push(reconciled);
    data.activity.unshift({ id: id(), at: new Date().toISOString(), type: 'created', choreId: chore.id, choreTitle: chore.title, due });
  }
  closeDialog();
  void persist(existing ? 'Rotation updated.' : 'First turn assigned.');
}

function completeChore(choreId: string): void {
  const chore = data.chores.find((item) => item.id === choreId);
  if (!chore?.currentPersonId) return;
  const person = data.people.find((item) => item.id === chore.currentPersonId);
  data.activity.unshift({ id: id(), at: new Date().toISOString(), type: 'completed', choreId, choreTitle: chore.title, personId: person?.id, personName: person?.name, due: chore.nextDue });
  chore.lastPersonId = chore.currentPersonId;
  chore.nextDue = addCadence(chore.nextDue, chore.cadenceValue, chore.cadenceUnit);
  chore.currentPersonId = null;
  Object.assign(chore, reconcileChore(chore, data.absences));
  void persist(`${person?.name ?? 'Turn'} marked ${chore.title} done. Next turn assigned.`);
}

function openSwap(choreId: string, opener: HTMLElement): void {
  const chore = data.chores.find((item) => item.id === choreId)!;
  const available = data.people.filter((person) => chore.eligibleIds.includes(person.id) && person.id !== chore.currentPersonId);
  openDialog(`<form id="swap-form" class="dialog-form" data-id="${choreId}"><p class="eyebrow">Explicit exception</p><h2>Swap ${escapeHtml(chore.title)}</h2><div class="field"><label for="swap-person">Move this turn to</label><select id="swap-person" name="person" required>${available.map((person) => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join('')}</select></div><div class="field"><label for="swap-note">Note <span>(optional)</span></label><input id="swap-note" name="note" maxlength="120" placeholder="e.g. traded for dinner"></div>${available.length ? '<button class="button primary" type="submit">Record swap</button>' : '<p class="error-box">No other eligible person is available. Edit the chore first.</p>'}</form>`, opener);
  bindDialogForm();
}

function saveSwap(event: SubmitEvent): void {
  event.preventDefault();
  const target = event.currentTarget as HTMLFormElement;
  const form = new FormData(target);
  const chore = data.chores.find((item) => item.id === target.dataset.id)!;
  const oldPerson = data.people.find((item) => item.id === chore.currentPersonId);
  const newPerson = data.people.find((item) => item.id === String(form.get('person')))!;
  chore.currentPersonId = newPerson.id;
  data.activity.unshift({ id: id(), at: new Date().toISOString(), type: 'swapped', choreId: chore.id, choreTitle: chore.title, fromPersonName: oldPerson?.name, toPersonName: newPerson.name, note: String(form.get('note')).trim(), due: chore.nextDue });
  closeDialog(); void persist(`Swap recorded: ${newPerson.name} has this turn.`);
}

function openPerson(opener: HTMLElement): void {
  if (!unlocked && data.people.length >= FREE_PEOPLE_LIMIT) { view = 'settings'; render(); toast(`The free board includes ${FREE_PEOPLE_LIMIT} people. Plus removes the limit.`); return; }
  openDialog(`<form id="person-form" class="dialog-form"><p class="eyebrow">Household</p><h2>Add a person</h2><div class="field"><label for="person-name">Name</label><input id="person-name" name="name" required maxlength="40" autocomplete="off" aria-describedby="person-error"></div><p class="form-error" id="person-error" role="alert" aria-live="polite"></p><button class="button primary" type="submit">Add person</button></form>`, opener); bindDialogForm();
}

function savePerson(event: SubmitEvent): void {
  event.preventDefault(); const target = event.currentTarget as HTMLFormElement; const form = new FormData(target); const name = String(form.get('name')).trim();
  if (!name) { target.querySelector<HTMLElement>('.form-error')!.textContent = 'Enter a name with at least one visible character.'; target.querySelector<HTMLInputElement>('#person-name')?.focus(); return; }
  data.people.push({ id: id(), name }); closeDialog(); void persist('Person added. Choose their eligible chores when ready.');
}

function openAbsence(opener: HTMLElement): void {
  openDialog(`<form id="absence-form" class="dialog-form"><p class="eyebrow">Temporary exception</p><h2>Add away dates</h2><div class="field"><label for="away-person">Who is away?</label><select id="away-person" name="person">${data.people.map((person) => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join('')}</select></div><div class="date-pair"><div class="field"><label for="away-start">From</label><input id="away-start" name="start" type="date" value="${todayISO()}" required></div><div class="field"><label for="away-end">Through</label><input id="away-end" name="end" type="date" value="${todayISO()}" required></div></div><div class="field"><label for="away-note">Note <span>(optional)</span></label><input id="away-note" name="note" maxlength="80" placeholder="e.g. work trip"></div><p class="form-error" aria-live="polite"></p><button class="button primary" type="submit">Skip turns in this range</button></form>`, opener); bindDialogForm();
}

function saveAbsence(event: SubmitEvent): void {
  event.preventDefault(); const target = event.currentTarget as HTMLFormElement; const form = new FormData(target);
  const start = String(form.get('start')); const end = String(form.get('end'));
  if (end < start) { target.querySelector<HTMLElement>('.form-error')!.textContent = 'The end date must be on or after the start date.'; return; }
  const before = new Map(data.chores.map((chore) => [chore.id, chore.currentPersonId]));
  data.absences.push({ id: id(), personId: String(form.get('person')), start, end, note: String(form.get('note')).trim() });
  reconcileAll();
  data.chores.forEach((chore) => {
    const priorId = before.get(chore.id); if (priorId && priorId !== chore.currentPersonId) {
      data.activity.unshift({ id: id(), at: new Date().toISOString(), type: 'absence_skip', choreId: chore.id, choreTitle: chore.title, fromPersonName: data.people.find((person) => person.id === priorId)?.name, toPersonName: data.people.find((person) => person.id === chore.currentPersonId)?.name, due: chore.nextDue });
    }
  });
  closeDialog(); void persist('Away dates added. Affected turns were reassigned.');
}

function reconcileAll(): void { data.chores = data.chores.map((chore) => reconcileChore(chore, data.absences)); }

function deletePerson(personId: string): void {
  const person = data.people.find((item) => item.id === personId); if (!person) return;
  if (data.people.length <= 1) return toast('A board needs at least one person. Delete the household instead.');
  if (!confirm(`Remove ${person.name}? They will also be removed from every chore and away entry.`)) return;
  data.people = data.people.filter((item) => item.id !== personId); data.absences = data.absences.filter((item) => item.personId !== personId);
  data.chores = data.chores.map((chore) => reconcileChore({ ...chore, eligibleIds: chore.eligibleIds.filter((candidate) => candidate !== personId), currentPersonId: chore.currentPersonId === personId ? null : chore.currentPersonId, lastPersonId: chore.lastPersonId === personId ? null : chore.lastPersonId }, data.absences));
  void persist(`${person.name} removed.`);
}

function deleteChore(choreId: string): void {
  const chore = data.chores.find((item) => item.id === choreId); if (!chore || !confirm(`Delete “${chore.title}”? Its past activity will remain in the log.`)) return;
  data.chores = data.chores.filter((item) => item.id !== choreId); data.activity.unshift({ id: id(), at: new Date().toISOString(), type: 'deleted', choreTitle: chore.title }); void persist(`${chore.title} deleted.`);
}

async function openShare(opener: HTMLElement): Promise<void> {
  const url = snapshotUrl(data);
  openDialog(`<section class="share-dialog"><p class="eyebrow">Read-only snapshot</p><h2>Share the current board</h2><p>Scan this QR or copy the link. It includes names, chore titles, and due dates as they look right now — no history or away notes.</p><canvas id="qr" width="240" height="240" aria-label="QR code for the current board"></canvas><label for="share-link">Board link</label><div class="copy-row"><input id="share-link" readonly value="${escapeHtml(url)}"><button class="button secondary" id="copy-link">Copy</button></div><p class="hint">Anyone with the link can read this snapshot. It does not update automatically.</p></section>`, opener);
  bindDialogForm();
  try { await QRCode.toCanvas(document.querySelector<HTMLCanvasElement>('#qr')!, url, { width: 240, margin: 1, color: { dark: '#171713', light: '#FFFDF6' }, errorCorrectionLevel: 'M' }); }
  catch { document.querySelector<HTMLCanvasElement>('#qr')?.replaceWith(Object.assign(document.createElement('p'), { className: 'error-box', textContent: 'The board is too large for a QR code. Copy the link instead.' })); }
  document.querySelector('#copy-link')?.addEventListener('click', async () => { await navigator.clipboard.writeText(url); toast('Board link copied.'); });
}

function download(name: string, content: string, type: string): void {
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportJson(): void { download(`fair-turn-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json'); toast('Backup downloaded.'); }

function exportCsv(): void {
  const quote = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = [['date', 'action', 'chore', 'person', 'from', 'to', 'due', 'note'], ...data.activity.map((item) => [item.at, item.type, item.choreTitle, item.personName, item.fromPersonName, item.toPersonName, item.due, item.note])];
  download(`fair-turn-activity-${todayISO()}.csv`, rows.map((row) => row.map(quote).join(',')).join('\n'), 'text/csv'); toast('Activity CSV downloaded.');
}

async function importBackup(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
  try {
    const imported = validateImport(JSON.parse(await file.text()));
    if (!confirm(`Replace this board with the backup for “${imported.householdName}”? This cannot be undone unless you exported the current board.`)) return;
    data = imported; await persist('Backup imported.'); view = 'board'; render();
  } catch (error) { toast(error instanceof Error ? error.message : 'Could not import that backup.'); }
  input.value = '';
}

async function restoreLicense(event: SubmitEvent): Promise<void> {
  event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement); const button = (event.currentTarget as HTMLFormElement).querySelector<HTMLButtonElement>('button')!;
  button.disabled = true; button.textContent = 'Checking…'; const verdict = await storeAndVerify(String(form.get('license'))); unlocked = verdict.valid; render(); toast(verdict.valid ? 'Plus unlocked on this device.' : verdict.reason === 'offline' ? 'Could not verify while offline. Try again when connected.' : verdict.reason === 'rate_limited' ? 'License checks are busy. Try again in a minute.' : 'That license is not active for Fair Turn.');
}

function resetHousehold(): void {
  if (!confirm(`Delete “${data.householdName}” and all of its local data? This cannot be undone.`)) return;
  data = emptyHousehold(); void persist('Household deleted from this browser.');
}

function setupConnectivity(): void {
  const update = () => { const banner = document.querySelector<HTMLElement>('#offline-banner'); if (banner) banner.hidden = navigator.onLine; };
  addEventListener('online', () => { update(); toast('Back online. Local work was kept.'); }); addEventListener('offline', update);
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstall = event as BeforeInstallPromptEvent;
    document.querySelector<HTMLElement>('[data-action="install"]')?.removeAttribute('hidden');
  });
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const registration = await navigator.serviceWorker.register('/sw.js');
  let refreshingForUpdate = false;
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing; worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        toast('An update is ready. Reload to use it.');
        refreshingForUpdate = true;
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshingForUpdate) location.reload(); });
}

async function init(): Promise<void> {
  const savedTheme = localStorage.getItem('fair-turn-theme'); if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  const licenseArrived = demoMode ? false : acceptLicenseFromUrl(); unlocked = demoMode ? false : isUnlocked();
  try {
    data = await loadHousehold(demoMode);
    if (demoMode && !data.householdName) data = await saveHousehold(sampleHousehold(), true);
  } catch (error) { storageError = error instanceof Error ? error.message : 'Local storage is unavailable.'; }
  render(); setupConnectivity(); void registerServiceWorker();
  if (licenseArrived) toast('License received. Checking it now…');
  if (!demoMode && navigator.onLine) { const verdict = await verifyLicense(); const changed = unlocked !== verdict.valid; unlocked = verdict.valid; if (changed) render(); if (licenseArrived) toast(verdict.valid ? 'Plus unlocked on this device.' : 'This license is not active for Fair Turn.'); }
}

void init();
