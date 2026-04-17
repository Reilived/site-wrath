const copyIpBtn = document.getElementById('copyIpBtn');
const copyModal = document.getElementById('copyModal');
const closeCopyModal = document.getElementById('closeCopyModal');

if (closeCopyModal) {
  closeCopyModal.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("OK button clicked via listener");
    if (copyModal) close(copyModal);
  });
}

    if (copyIpBtn) {
      copyIpBtn.addEventListener('click', () => {
        const text = "Wrathpvp.pro:19132";
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            if (copyModal) open(copyModal);
          }).catch(err => {
            fallbackCopyText(text);
          });
        } else {
          fallbackCopyText(text);
        }
      });
    }

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (copyModal) open(copyModal);
  } catch (err) {
  }
  document.body.removeChild(textArea);
}
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const submitCode = document.getElementById('submitCode');
const codeInput = document.getElementById('codeInput');
const loginError = document.getElementById('loginError');

const accountSub = document.getElementById('accountSub');
const accountMain = document.getElementById('accountMain');
const accountAvatar = document.getElementById('accountAvatar');

const statusBtn = document.getElementById('statusBtn');
const statusDrawer = document.getElementById('statusDrawer');
const closeStatus = document.getElementById('closeStatus');
const metrics = document.getElementById('metrics');
const playerList = document.getElementById('playerList');

const playerSearch = document.getElementById('playerSearch');
const searchBtn = document.getElementById('searchBtn');

const searchActionModal = document.getElementById('searchActionModal');
const searchActionDesc = document.getElementById('searchActionDesc');
const searchGoProfile = document.getElementById('searchGoProfile');
const searchGoHistory = document.getElementById('searchGoHistory');
const searchCancel = document.getElementById('searchCancel');

const historyHeader = document.getElementById('historyHeader');
const historyContent = document.getElementById('historyContent');
const historyRankedTab = document.getElementById('historyRankedTab');
const historyUnrankedTab = document.getElementById('historyUnrankedTab');

let lastSearchName = '';
let historyMode = 'ranked';
let historyPage = 1;
const matchesPerPage = 10;

if (playerSearch) {
  playerSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      console.log("Enter pressed in search box");
      handleSearch();
    }
  });
}
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    console.log("Search button clicked");
    handleSearch();
  });
}

function open(el){ el.setAttribute('aria-hidden','false'); }
function close(el){ el.setAttribute('aria-hidden','true'); }

function setHistoryTab(mode){
  historyMode = mode;
  if(historyRankedTab) historyRankedTab.classList.toggle('active', mode === 'ranked');
  if(historyUnrankedTab) historyUnrankedTab.classList.toggle('active', mode === 'unranked');
}

function timeAgo(ts){
  if(!ts) return '';
  const n = Number(ts);
  const t = n > 1000000000000 ? Math.floor(n/1000) : n;
  const now = Math.floor(Date.now()/1000);
  const d = Math.max(0, now - t);
  if(d < 60) return `${d}s ago`;
  if(d < 3600) return `${Math.floor(d/60)}m ago`;
  if(d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

function renderMatchHistory(matches){
  if(!historyContent) return;
  
  const startIndex = (historyPage - 1) * matchesPerPage;
  const pageMatches = matches.slice(startIndex, startIndex + matchesPerPage);

  if(!pageMatches || pageMatches.length === 0){
    historyContent.innerHTML = '<div class="history-loading">No matches found.</div>';
    return;
  }

  let html = pageMatches.map((m, idx) => {
    const wDelta = m.winnerDelta;
    const lDelta = m.loserDelta;
    const isRanked = historyMode === 'ranked';
    const wDeltaHtml = (!isRanked || wDelta === null || wDelta === undefined || wDelta === '') ? '' : ` <span class="match-delta ${Number(wDelta) >= 0 ? 'pos' : 'neg'}">(${Number(wDelta) >= 0 ? '+' : ''}${wDelta})</span>`;
    const lDeltaHtml = (!isRanked || lDelta === null || lDelta === undefined || lDelta === '') ? '' : ` <span class="match-delta ${Number(lDelta) >= 0 ? 'pos' : 'neg'}">(${Number(lDelta) >= 0 ? '+' : ''}${lDelta})</span>`;
    const wElo = (m.winnerElo === null || m.winnerElo === undefined || m.winnerElo === '') ? '' : `${m.winnerElo}`;
    const lElo = (m.loserElo === null || m.loserElo === undefined || m.loserElo === '') ? '' : `${m.loserElo}`;
    const wEloHtml = !isRanked ? '' : `${wElo}`;
    const lEloHtml = !isRanked ? '' : `${lElo}`;
    const lad = escapeHtml(m.ladder || '');
    const ago = escapeHtml(timeAgo(m.time));

    return `
      <div class="match-row" onclick="renderProfile('${String(m.winner||'').replace(/'/g,"\\'")}'); showPage('profile');">
        <div class="match-side">
          <div class="match-head" id="mh-w-${idx}"></div>
          <div class="match-names">
            <div class="match-name" style="color:var(--green)">${escapeHtml(m.winner || '')}</div>
            <div class="match-elo">${wEloHtml}${wDeltaHtml}</div>
          </div>
        </div>
        <div class="match-mid">
          <div class="match-vs">VS</div>
          <div class="match-meta">${lad}${lad && ago ? '  ' : ''}${ago}</div>
        </div>
        <div class="match-side right">
          <div class="match-names" style="text-align:right;">
            <div class="match-name" style="color:var(--red)">${escapeHtml(m.loser || '')}</div>
            <div class="match-elo">${lEloHtml}${lDeltaHtml}</div>
          </div>
          <div class="match-head" id="mh-l-${idx}"></div>
        </div>
      </div>
    `;
  }).join('');

  html += `
    <div class="pagination-controls" style="display:flex; justify-content:center; gap:20px; margin-top:20px; padding-bottom:20px;">
      <button class="nav-item" id="prevPage" ${historyPage <= 1 ? 'disabled style="opacity:0.5; cursor:default;"' : ''}>Previous</button>
      <span style="align-self:center; color:var(--muted); font-weight:600;">Page ${historyPage}</span>
      <button class="nav-item" id="nextPage" ${startIndex + matchesPerPage >= matches.length ? 'disabled style="opacity:0.5; cursor:default;"' : ''}>Next</button>
    </div>
  `;

  historyContent.innerHTML = html;

  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  if(prev) prev.onclick = () => { if(historyPage > 1) { historyPage--; renderMatchHistory(matches); historyContent.scrollIntoView({behavior:'smooth'}); } };
  if(next) next.onclick = () => { if(startIndex + matchesPerPage < matches.length) { historyPage++; renderMatchHistory(matches); historyContent.scrollIntoView({behavior:'smooth'}); } };

  pageMatches.forEach((m, idx) => {
    const w = document.getElementById(`mh-w-${idx}`);
    const l = document.getElementById(`mh-l-${idx}`);
    if(w){
      w.innerHTML = '';
      if(m.winnerSkin){
        const c = makeHeadCanvas(m.winnerSkin);
        c.style.width = '44px'; c.style.height = '44px';
        w.appendChild(c);
      }
    }
    if(l){
      l.innerHTML = '';
      if(m.loserSkin){
        const c = makeHeadCanvas(m.loserSkin);
        c.style.width = '44px'; c.style.height = '44px';
        l.appendChild(c);
      }
    }
  });
}

async function refreshMatchHistory(){
  if(!historyContent || !lastSearchName) return;
  historyContent.innerHTML = '<div class="history-loading">Loading match history...</div>';
  try {
    const data = await api(`/api/matches/${encodeURIComponent(lastSearchName)}?mode=${encodeURIComponent(historyMode)}&limit=25`, { timeoutMs: 25000 });
    if(!data.success){
      historyContent.innerHTML = '<div class="history-loading" style="color:var(--red)">Failed to load match history.</div>';
      return;
    }
    renderMatchHistory(data.matches);
  } catch(e){
    historyContent.innerHTML = '<div class="history-loading" style="color:var(--red)">Failed to load match history.</div>';
  }
}

function showMatchHistory(name){
  lastSearchName = name;
  historyPage = 1;
  if(historyHeader) historyHeader.textContent = `Viewing match history for ${name}`;
  setHistoryTab(historyMode || 'ranked');
  showPage('history');
  refreshMatchHistory();
}

function openSearchAction(name){
  lastSearchName = name;
  if(searchActionDesc) searchActionDesc.textContent = `Choose what you want to view for ${name}.`;
  if(searchActionModal) open(searchActionModal);
}

if(searchCancel && searchActionModal){
  searchCancel.addEventListener('click', () => close(searchActionModal));
  searchActionModal.addEventListener('click', (e) => { if(e.target === searchActionModal) close(searchActionModal); });
}
if(searchGoProfile && searchActionModal){
  searchGoProfile.addEventListener('click', () => {
    close(searchActionModal);
    renderProfile(lastSearchName);
    showPage('profile');
  });
}
if(searchGoHistory && searchActionModal){
  searchGoHistory.addEventListener('click', () => {
    close(searchActionModal);
    showMatchHistory(lastSearchName);
  });
}
if(historyRankedTab){
  historyRankedTab.addEventListener('click', () => {
    setHistoryTab('ranked');
    refreshMatchHistory();
  });
}
if(historyUnrankedTab){
  historyUnrankedTab.addEventListener('click', () => {
    setHistoryTab('unranked');
    refreshMatchHistory();
  });
}

function bytesFromBase64(b64){
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function makeHeadCanvas(skinBase64){
  if(!skinBase64){
    const img = document.createElement('img');
    img.src = 'assets/skin.png';
    img.style.imageRendering = 'pixelated';
    img.style.objectFit = 'cover';
    img.style.width = '100%';
    img.style.height = '100%';
    return img;
  }
  const bytes = bytesFromBase64(skinBase64);
  const w = 64, h = 64;
  if(bytes.length < w*h*4){
    const img = document.createElement('img');
    img.src = 'assets/skin.png';
    img.style.imageRendering = 'pixelated';
    img.style.objectFit = 'cover';
    img.style.width = '100%';
    img.style.height = '100%';
    return img;
  }

  const src = document.createElement('canvas');
  src.width = w; src.height = h;
  const sctx = src.getContext('2d');
  const img = sctx.createImageData(w,h);
  img.data.set(bytes);
  sctx.putImageData(img,0,0);

  const out = document.createElement('canvas');
  out.width = 32; out.height = 32;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(src, 8,8,8,8, 0,0,32,32);
  ctx.drawImage(src, 40,8,8,8, 0,0,32,32);

  return out;
}

async function api(path, opts){
  const controller = new AbortController();
  const timeoutMs = (opts && typeof opts.timeoutMs === 'number') ? opts.timeoutMs : 15000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try{
    const realOpts = { ...(opts || {}) };
    if (realOpts && Object.prototype.hasOwnProperty.call(realOpts, 'timeoutMs')) delete realOpts.timeoutMs;
    const r = await fetch(path, { credentials:'include', signal: controller.signal, ...(realOpts||{}) });
    const out = await r.json();
    return out;
  } finally {
    clearTimeout(t);
  }
}

let currentUser = null;

function setDropdownOpen(open) {
  const c = document.querySelector('.account-dropdown-container');
  if (!c) return;
  if (open) c.classList.add('open');
  else c.classList.remove('open');
}

function setLoggedOut(){
  currentUser = null;
  accountSub.textContent = 'Currently not logged in';
  accountSub.style.color = 'var(--muted)';
  accountMain.textContent = 'Log in';
  accountAvatar.innerHTML = '';
  setDropdownOpen(false);
}

function setLoggedIn(user){
  currentUser = user;
  accountSub.textContent = user.player;
  accountSub.style.color = user.rankColor || '#ffffff';
  accountMain.textContent = 'Logged in';
  accountAvatar.innerHTML = '';
  if(user.skinBase64){
    const c = makeHeadCanvas(user.skinBase64);
    c.style.width = '34px';
    c.style.height = '34px';
    accountAvatar.appendChild(c);
  }
}

async function handleLogout() {
  try {
    await api('/api/logout', { method: 'POST' });
    setLoggedOut();
  } catch(e) {
    console.error("Logout failed:", e);
  }
}

function showMyProfile() {
  if (currentUser && currentUser.player) {
    showPage('profile');
    renderProfile(currentUser.player);
  }
}

function showMyMatchHistory() {
  if (currentUser && currentUser.player) {
    showMatchHistory(currentUser.player);
  }
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  
  const pg = document.getElementById(name + 'Page');
  if(pg) pg.classList.add('active');
  
  const btn = Array.from(document.querySelectorAll('.nav-item')).find(b => {
    const text = b.textContent.trim().toLowerCase();
    return text === name.toLowerCase() || (name === 'status' && text.includes('status'));
  });
  if(btn) btn.classList.add('active');

  if(name === 'leaderboard') refreshLeaderboards();
  if(name === 'staff') refreshStaffPage();
  if(name === 'status') {
    refreshStatusPage();
    if(window.statusInterval) clearInterval(window.statusInterval);
    window.statusInterval = setInterval(refreshStatusPage, 1000);
  } else {
    if(window.statusInterval) {
      clearInterval(window.statusInterval);
      window.statusInterval = null;
    }
  }
}

async function refreshMe(){
  try {
    const data = await api('/api/me');
    if (data.ok && data.user) {
      setLoggedIn(data.user);
    } else {
      setLoggedOut();
    }
  } catch (err) {
    setLoggedOut();
  }
}

loginBtn.addEventListener('click', async () => {
  if (currentUser) {
    const container = document.querySelector('.account-dropdown-container');
    if (container) {
      container.classList.toggle('open');
    }
    return;
  }
  loginError.textContent = '';
  codeInput.value = '';
  open(loginModal);
  codeInput.focus();
});

document.addEventListener('click', (e) => {
  const container = document.querySelector('.account-dropdown-container');
  if (!container) return;
  if (!container.classList.contains('open')) return;
  if (container.contains(e.target)) return;
  container.classList.remove('open');
});

closeLogin.addEventListener('click', () => close(loginModal));
loginModal.addEventListener('click', (e) => { if(e.target === loginModal) close(loginModal); });

submitCode.addEventListener('click', async () => {
  const code = codeInput.value.trim();
  if(!code){ loginError.textContent = 'Enter a code.'; return; }
  loginError.textContent = '';
  try{
    const out = await api('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code }) });
    close(loginModal);
    await refreshMe();
  }catch(err){
    loginError.textContent = err && err.error ? `Login failed: ${err.error}` : 'Login failed.';
  }
});

if (statusBtn) {
  statusBtn.addEventListener('click', async () => {
    showPage('status');
  });
}
if (closeStatus) closeStatus.addEventListener('click', () => close(statusDrawer));
if (statusDrawer) statusDrawer.addEventListener('click', (e) => { if(e.target === statusDrawer) close(statusDrawer); });

const lbGrid = document.getElementById('lbGrid');

async function refreshLeaderboards() {
  if (!lbGrid) return;

  lbGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">Loading ladders...</div>';
  
  try {
    const data = await api('/api/leaderboards', { timeoutMs: 70000 });

    if (!data || data.success === false) {
      lbGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--red)">Failed to load leaderboards.</div>';
      return;
    }

    lbGrid.innerHTML = '';
    
    const rawData = data.data || {};
    
    const ladderKeys = Object.keys(rawData).sort((a,b) => {
      const order = ['Global', 'HCT Ranked', 'NoDebuff', 'FFA'];
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if(ia !== -1 && ib !== -1) return ia - ib;
      if(ia !== -1) return -1;
      if(ib !== -1) return 1;
      return a.localeCompare(b);
    });

    if (ladderKeys.length === 0) {
      lbGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">No leaderboard data available yet.</div>';
      return;
    }

    ladderKeys.forEach((l, i) => {
      const card = document.createElement('div');
      card.className = 'lb-card';
      const entries = Array.isArray(rawData[l]) ? rawData[l] : [];
      
      card.innerHTML = `
        <div class="lb-title">${l}</div>
        <div class="lb-entries">
          ${entries.length > 0 ? entries.map((e, idx) => {
            const isTop3 = idx < 3;
            const rankColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#aaaaaa';
            const rankIcon = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`;
            
            const statsHtml = `
              <div class="lb-elo" style="color: #fff; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${Number(e.elo).toLocaleString()}</div>
              <div class="lb-wl" style="font-size: 11px; opacity: 0.7;">
                <span class="w" style="color: #4ade80;">${e.wins || 0}</span><span style="margin: 0 2px; color: #555;">/</span><span class="l" style="color: #f87171;">${e.losses || 0}</span>
              </div>
            `;

            return `
            <div class="lb-entry ${isTop3 ? 'top-rank' : ''}" style="${isTop3 ? `border-left: 3px solid ${rankColor}; cursor: pointer;` : 'cursor: pointer;'}" onclick="renderProfile('${e.player.replace(/'/g, "\\'")}'); showPage('profile');">
              <div class="lb-left">
                <div class="lb-rank" style="color: ${rankColor}; font-weight: 800; min-width: 32px; text-align: center;">${rankIcon}</div>
                <div class="lb-player">
                  <div class="head" data-player="${escapeHtml(e.player)}"></div>
                  <div class="lb-name">
                    <span class="player-name-text" style="color:${e.rankColor || '#ffffff'}; font-weight: 600;">${escapeHtml(e.player)}</span>
                    <div class="player-rank-label" style="color:rgba(255,255,255,0.4); font-size:10px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: -2px;">${escapeHtml(e.rankName || 'Player')}</div>
                  </div>
                </div>
              </div>
              <div class="lb-stats">
                ${statsHtml}
              </div>
            </div>
          `}).join('') : '<div style="color:var(--muted);font-size:13px;text-align:center;padding:30px;font-style:italic;">No data recorded yet</div>'}
        </div>
      `;
      lbGrid.appendChild(card);
      
      setTimeout(() => {
        card.classList.add('visible');
      }, i * 50);
    });

    try {
      const headEls = Array.from(document.querySelectorAll('.lb-card .head[data-player]'));
      const names = Array.from(new Set(headEls.map(el => (el.getAttribute('data-player') || '').trim()).filter(Boolean)));
      if (names.length > 0) {
        const skinsRes = await api('/api/skins_batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players: names }),
          timeoutMs: 30000
        });
        const skins = (skinsRes && skinsRes.success && skinsRes.skins) ? skinsRes.skins : {};
        headEls.forEach(el => {
          const n = (el.getAttribute('data-player') || '').trim();
          const skin = skins && n ? skins[n] : '';
          el.innerHTML = '';
          if (skin) {
            const canvas = makeHeadCanvas(skin);
            canvas.style.width = '30px';
            canvas.style.height = '30px';
            el.appendChild(canvas);
          } else {
            const img = document.createElement('img');
            img.src = 'assets/skin.png';
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.imageRendering = 'pixelated';
            img.style.borderRadius = '4px';
            el.appendChild(img);
          }
        });
      }
    } catch(e) {}
  } catch(e) {
    const msg = (e && e.error === 'timeout')
      ? 'Leaderboard request timed out'
      : 'Failed to load leaderboards';
    lbGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--red)">${msg}</div>`;
  }
}

async function refreshStatusPage() {
  try {
    const s = await api('/api/status');
    
    const pDot = document.getElementById('practiceDot');
    const pOnline = document.getElementById('practiceOnline');
    const pTPS = document.getElementById('practiceTPS');
    const pLoad = document.getElementById('practiceLoad');
    const pPlayers = document.getElementById('practicePlayers');

    if (s.offline || s.error) {
      if (pDot) pDot.className = 'status-dot offline';
      if (pOnline) pOnline.textContent = 'Offline';
      if (pTPS) pTPS.textContent = '0.00';
      if (pLoad) pLoad.textContent = '0%';
      if (pPlayers) pPlayers.innerHTML = '<div style="color:var(--muted);grid-column:1/-1">Server unreachable</div>';
    } else {
      if (pDot) pDot.className = 'status-dot online';
      if (pOnline) pOnline.textContent = `${s.online}/${s.max}`;
      if (pTPS) pTPS.textContent = Number(s.tps).toFixed(2);
      if (pLoad) pLoad.textContent = `${s.load}%`;
      
      if (pPlayers) {
        pPlayers.innerHTML = '';
        if (!s.players || s.players.length === 0) {
          pPlayers.innerHTML = '<div style="color:var(--muted);font-size:14px;grid-column:1/-1">No players online</div>';
        } else {
          s.players.forEach(p => {
            const row = document.createElement('div');
            row.className = 'player-row';
            row.style.cursor = 'pointer';
            row.onclick = () => { renderProfile(p.name); showPage('profile'); };
            
            const head = document.createElement('div');
            head.className = 'head';
            if (p.skinBase64) {
              const canvas = makeHeadCanvas(p.skinBase64);
              canvas.style.width = '24px';
              canvas.style.height = '24px';
              head.appendChild(canvas);
            }
            
            const info = document.createElement('div');
            info.className = 'player-info';
            info.innerHTML = `
              <span class="name" style="color:${p.rankColor || '#ffffff'}">${escapeHtml(p.displayName || p.name)}</span>
              <span class="ping" style="color:var(--muted);font-size:11px;font-weight:600">
                <span style="color:#aaa">(${escapeHtml(p.rankName || 'Player')})</span> ${p.ping}ms
              </span>
            `;
            
            row.appendChild(head);
            row.appendChild(info);
            pPlayers.appendChild(row);
          });
        }
      }
    }

    const hDot = document.getElementById('hubDot');
    const hOnline = document.getElementById('hubOnline');
    const hState = document.getElementById('hubState');

    if (s.hub === 0 && s.hubMax === 0) {
      if (hDot) hDot.className = 'status-dot offline';
      if (hOnline) hOnline.textContent = 'Offline';
      if (hState) hState.textContent = 'Offline';
    } else {
      if (hDot) hDot.className = 'status-dot online';
      if (hOnline) hOnline.textContent = `${s.hub}/${s.hubMax}`;
      if (hState) hState.textContent = 'Online';
    }
  } catch (e) {
    console.error("Status page error:", e);
  }
}

async function handleSearch() {
  const playerSearch = document.getElementById('playerSearch');
  if (!playerSearch) return;
  const name = playerSearch.value.trim();
  if (!name) return;
  openSearchAction(name);
}

async function renderProfile(name){
  const container = document.getElementById('profileContent');
  const header = document.getElementById('profileHeader');
  if (!container || !header) return;
  
  container.innerHTML = '<div class="profile-loading">Loading profile for ' + escapeHtml(name) + '...</div>';
  header.innerText = 'Viewing profile of ' + name;

    try {
      const data = await api('/api/profile/' + encodeURIComponent(name), { timeoutMs: 30000 });
      
      if (!data || !data.success || !data.profile) {
        container.innerHTML = `<div class="profile-loading" style="color:#ef4444;font-style:normal;font-weight:700">Error: ${escapeHtml(data?.error || 'Player profile data missing')}</div>`;
        return;
      }

    const profile = data.profile;
    
    container.innerHTML = `
      <div class="profile-card">
        <div class="profile-top">
          <div class="profile-head" id="profileHeadContainer"></div>
          <div class="profile-info">
            <div class="profile-name" style="color:${profile.rankColor || '#fff'}">${escapeHtml(profile.name)}</div>
            <div class="profile-rank">${escapeHtml(profile.rankName || 'Player')}</div>
            <div class="profile-badges">
              ${profile.tag ? `<div class="profile-badge" style="background:rgba(239,68,68,0.1);color:#ef4444">${escapeHtml(profile.tag)}</div>` : ''}
              ${profile.division ? `<div class="profile-badge" style="background:rgba(59,130,246,0.1);color:#3b82f6">${escapeHtml(profile.division)}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="profile-section-title">Global Statistics</div>
        <div class="profile-stats-main">
          <div class="stat-box">
            <span class="label">Average Elo</span>
            <span class="value">${Number(profile.elo).toLocaleString()}</span>
          </div>
          <div class="stat-box">
            <span class="label">Total Wins</span>
            <span class="value">${Number(profile.wins ?? 0).toLocaleString()}</span>
          </div>
          <div class="stat-box">
            <span class="label">Total Kills</span>
            <span class="value">${Number(profile.kills).toLocaleString()}</span>
          </div>
          <div class="stat-box">
            <span class="label">Playtime</span>
            <span class="value">${profile.playtimeFormatted || profile.playtime || '0h'}</span>
          </div>
        </div>

        <div class="profile-section-title">Competitive Ladders</div>
        <div class="profile-ladders">
          ${Object.entries(profile.ladders).map(([name, stats]) => `
            <div class="ladder-stat">
              <span class="name">${escapeHtml(name)}</span>
              <span class="elo">${stats.elo}</span>
              <span class="record">${stats.wins !== undefined ? `${stats.wins}W/${stats.losses}L` : `${stats.kills}K/${stats.deaths}D`}</span>
            </div>
          `).join('')}
        </div>

        ${profile.ffa ? `
        <div class="profile-section-title">FFA Statistics</div>
        <div class="profile-stats-main">
          <div class="stat-box">
            <span class="label">FFA Elo</span>
            <span class="value">${Number(profile.ffa.elo).toLocaleString()}</span>
          </div>
          <div class="stat-box">
            <span class="label">FFA Kills</span>
            <span class="value">${Number(profile.ffa.kills).toLocaleString()}</span>
          </div>
          <div class="stat-box">
            <span class="label">FFA Deaths</span>
            <span class="value">${Number(profile.ffa.deaths).toLocaleString()}</span>
          </div>
          <div class="stat-box">
            <span class="label">Best Streak</span>
            <span class="value">${Number(profile.ffa.streak).toLocaleString()}</span>
          </div>
        </div>
        ` : ''}
      </div>
    `;

    const headTarget = document.getElementById('profileHeadContainer');
    if (headTarget) {
      if (profile.skinBase64) {
        const skinCanvas = makeHeadCanvas(profile.skinBase64);
        skinCanvas.style.width = '100%';
        skinCanvas.style.height = '100%';
        headTarget.innerHTML = '';
        headTarget.appendChild(skinCanvas);
      } else {
        const img = document.createElement('img');
        img.src = 'assets/skin.png';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.imageRendering = 'pixelated';
        headTarget.innerHTML = '';
        headTarget.appendChild(img);
      }
    }

  } catch (e) {
    container.innerHTML = '<div class="profile-loading" style="color:#ef4444">Failed to load profile. Please try again later.</div>';
  }
}

function makeBodyCanvas(skinBase64) {
  if(!skinBase64){
    const img = document.createElement('img');
    img.src = 'assets/skin.png';
    img.style.imageRendering = 'pixelated';
    img.style.objectFit = 'contain';
    img.style.width = '100%';
    img.style.height = '100%';
    return img;
  }
  const bytes = bytesFromBase64(skinBase64);
  const w = 64, h = 64;
  if(bytes.length < w*h*4){
    const img = document.createElement('img');
    img.src = 'assets/skin.png';
    img.style.imageRendering = 'pixelated';
    img.style.objectFit = 'contain';
    img.style.width = '100%';
    img.style.height = '100%';
    return img;
  }

  const src = document.createElement('canvas');
  src.width = w; src.height = h;
  const sctx = src.getContext('2d');
  const img = sctx.createImageData(w,h);
  img.data.set(bytes);
  sctx.putImageData(img,0,0);

  const out = document.createElement('canvas');
  out.width = 64; out.height = 128;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(src, 8,8,8,8, 16,0,32,32);
  ctx.drawImage(src, 40,8,8,8, 16,0,32,32);

  ctx.drawImage(src, 20,20,8,12, 16,32,32,48);
  ctx.drawImage(src, 20,36,8,12, 16,32,32,48);

  ctx.drawImage(src, 44,20,4,12, 0,32,16,48);
  ctx.drawImage(src, 44,36,4,12, 0,32,16,48);

  ctx.drawImage(src, 32,48,4,12, 48,32,16,48);
  ctx.drawImage(src, 48,48,4,12, 48,32,16,48);

  ctx.drawImage(src, 4,20,4,12, 16,80,16,48);
  ctx.drawImage(src, 4,36,4,12, 16,80,16,48);

  ctx.drawImage(src, 19,48,4,12, 32,80,16,48);
  // EPSTEIN RAPER NIGGERS
  ctx.drawImage(src, 0,48,4,12, 32,80,16,48);

  return out;
}

async function refreshStaffPage() {
  const container = document.getElementById('staffContent');
  if (!container) return;
  container.innerHTML = '<div class="staff-loading">Loading staff team...</div>';

  try {
    const data = await api('/api/staff');
    if (!data.success || !data.groups) {
      container.innerHTML = '<div class="staff-loading">No staff members found.</div>';
      return;
    }

    container.innerHTML = '';
    const groups = data.groups;
    
    // FETCH LIVE SKINS for the manual list from the server status or a generic skin API
    // We'll also try to see if the server status currently has them online
    let liveStatus = { players: [] };
    try {
      liveStatus = await api('/api/status');
    } catch(e){}

    let offlineSkins = {};
    try {
      const allNames = Array.from(new Set(Object.values(groups).flat().map(s => s.name)));
      if (allNames.length > 0) {
        const skinsRes = await api('/api/skins_batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ players: allNames }) });
        if (skinsRes && skinsRes.success && skinsRes.skins) offlineSkins = skinsRes.skins;
      }
    } catch(e){}

    const findSkin = (name) => {
      const p = liveStatus.players.find(x => x.name.toLowerCase() === name.toLowerCase());
      return p ? p.skinBase64 : "";
    };

    const findOfflineSkin = (name) => {
      if (!name) return '';
      return offlineSkins[name] || offlineSkins[Object.keys(offlineSkins).find(k => k.toLowerCase() === name.toLowerCase())] || '';
    };

    const staffOrder = ['Owner', 'Developer', 'Manager', 'Admin', 'Moderator', 'Mod', 'Helper'];
    const sortedRanks = Object.keys(groups).sort((a,b) => {
      const ia = staffOrder.indexOf(a);
      const ib = staffOrder.indexOf(b);
      return ia - ib;
    });

    sortedRanks.forEach((rank, gi) => {
      const staffArr = groups[rank];
      
      const groupDiv = document.createElement('div');
      groupDiv.className = 'staff-group';
      groupDiv.style.opacity = '0';
      groupDiv.style.transform = 'translateY(20px)';
      groupDiv.style.transition = 'all 0.5s ease';

      groupDiv.innerHTML = `
        <div class="staff-group-header">
          <div class="staff-group-title">${rank}</div>
        </div>
        <div class="staff-list" id="staff-list-${rank}">
          ${staffArr.length === 0 ? `<div style="color:var(--muted); font-style:italic; font-size:14px; padding: 10px 0;">Currently there are no staff with ${rank.toLowerCase()}.</div>` : ''}
        </div>
      `;

      container.appendChild(groupDiv);
      const listDiv = document.getElementById(`staff-list-${rank}`);

      staffArr.forEach((s, si) => {
        const card = document.createElement('div');
        card.className = 'staff-card';
        card.onclick = () => { renderProfile(s.name); showPage('profile'); };

        card.innerHTML = `
          <div class="staff-name-top" style="color:${s.rankColor}">${escapeHtml(s.name)}</div>
          <div class="staff-avatar-full" id="staff-body-${rank}-${si}"></div>
          <div class="staff-rank-bottom">${escapeHtml(s.rankName)}</div>
        `;

        listDiv.appendChild(card);

        // Render 3D body
        const bodyTarget = document.getElementById(`staff-body-${rank}-${si}`);
        let skinToUse = s.skinBase64 || findSkin(s.name) || findOfflineSkin(s.name);

        if (skinToUse) {
          const canvas = makeBodyCanvas(skinToUse);
          canvas.style.height = '100%';
          bodyTarget.appendChild(canvas);
        } else {
          // Absolute fallback: assets/skin.png
          const img = document.createElement('img');
          img.src = 'assets/skin.png';
          img.style.height = '240px';
          img.style.imageRendering = 'pixelated';
          img.style.objectFit = 'contain';
          bodyTarget.appendChild(img);
        }
      });

      setTimeout(() => {
        groupDiv.style.opacity = '1';
        groupDiv.style.transform = 'translateY(0)';
      }, gi * 150);
    });

  } catch (e) {
    console.error("Staff page error:", e);
    container.innerHTML = '<div class="staff-loading" style="color:var(--red)">Failed to load staff team.</div>';
  }
}
function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;'}[c]));
}

refreshMe();
