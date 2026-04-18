const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const dgram = require("dgram");
const sqlite3 = require("sqlite3").verbose();

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BRIDGE_URL = "http://104.204.217.170:19000/request";
const BRIDGE_SECRET = "site_secret_99";
const HUB_HOST = "104.204.217.170";
const HUB_PORT = 25566;

const LADDERS = [
  'HCTeams', 'NoDebuff', 'Boxing', 'Sumo', 'Combo', 'BuildUHC', 'Bedfight', 'Skywars', 'Soup', 'Bridge', 'Fist', 'Knockback', 'Gset', 'SG', 'Resistance', 'Midfight', 'Sniper', 'Spleef', 'TopFight'
];

// Use a fixed order for display, merging Moderator/Mod
const STAFF_RANKS = ['Owner', 'Developer', 'Manager', 'Admin', 'Moderator', 'Helper'];

const MANUAL_STAFF = {
  Owner: ['Ilyxt', 'xZeroVIII'],
  Developer: ['Huncho', 'SFYC', 'qMoon', 'ItzToxic'],
  Manager: ['Flyiqn', 'Itzl1ghtning', 'Maqteo'],
  Admin: ['D5qc'],
  Moderator: [],
  Mod: [],
  Helper: []
};

function buildStaffGroupsFromManual() {
  const groups = {};
  for (const r of STAFF_RANKS) groups[r] = [];
  for (const [rank, names] of Object.entries(MANUAL_STAFF)) {
    // Map 'Mod' manual entries to 'Moderator' group
    let targetRank = rank === 'Mod' ? 'Moderator' : rank;
    const matched = STAFF_RANKS.find((sr) => sr.toLowerCase() === String(targetRank).toLowerCase());
    if (!matched) continue;
    for (const n of names) {
      groups[matched].push({ name: n, rank: matched });
    }
  }
  return groups;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label || "timeout"}`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

async function bridgeRequest(type, data = {}) {
  const isLeaderboard = type === "leaderboards";
  const timeoutMs = isLeaderboard ? 60000 : 15000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log(`[Bridge] Sending request: type=${type}`);
    const res = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: BRIDGE_SECRET, type, data }),
      signal: controller.signal,
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log(`[Bridge] Received response for ${type}: success=${json.success}`);
      return json;
    } catch (e) {
      console.error(`[Bridge] JSON Parse Error for ${type}. Raw body:`, text.substring(0, 500));
      throw new Error("Invalid JSON response from bridge");
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[Bridge] Request TIMEOUT for ${type} after ${timeoutMs}ms`);
      return { success: false, error: "timeout" };
    }
    console.error(`[Bridge] Request failed for ${type}:`, err.message);
    throw err;
  } finally {
    clearTimeout(t);
  }
}

function pingHub() {
  return new Promise((resolve) => {
    const client = dgram.createSocket("udp4");
    const port = HUB_PORT;
    const host = HUB_HOST;

    const packet = Buffer.alloc(35);
    packet.writeUInt8(0x01, 0);
    packet.writeBigInt64BE(BigInt(Date.now()), 1); // ts
    Buffer.from("00ffff00fefefefefdfdfdfd12345678", "hex").copy(packet, 9);
    packet.writeBigInt64BE(BigInt(0), 25);

    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        client.close();
        resolve({ online: 0, max: 0, reachable: false });
      }
    }, 2000);

    client.on("message", (msg) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      client.close();

      try {
        const data = msg.toString("utf8", 35).split(";");
        if (data[0] === "MCPE") {
          resolve({
            online: parseInt(data[4]) || 0,
            max: parseInt(data[5]) || 0,
            reachable: true
          });
        } else {
          resolve({ online: 0, max: 0, reachable: false });
        }
      } catch (e) {
        resolve({ online: 0, max: 0, reachable: false });
      }
    });

    client.send(packet, 0, packet.length, port, host, (err) => {
      if (err && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        client.close();
        resolve({ online: 0, max: 0, reachable: false });
      }
    });
  });
}

async function requireAuth(req, res, next) {
  const xuid = req.cookies && req.cookies.sid;
  if (!xuid) return res.status(401).json({ ok: false });
  try {
    const out = await bridgeRequest("account_get", { xuid });
    if (!out.success) return res.status(401).json({ ok: false });

    // ranked info yhk 
    const bridgeRes = await bridgeRequest("ranks_batch", { players: [out.player] });
    const rankInfo = bridgeRes.success ? bridgeRes.ranks[out.player] : { name: "Player", color: "#ffffff" };

    req.user = {
      ...out,
      rankName: rankInfo.name,
      rankColor: rankInfo.color
    };
    next();
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}

app.post("/api/login", async (req, res) => {
  const code = String((req.body && req.body.code) || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ ok: false, error: "missing_code" });

  try {
    const out = await bridgeRequest("link_claim", { code });
    if (!out.success) {
      return res.status(400).json({ ok: false, error: out.error || "failed" });
    }

    res.cookie("sid", out.xuid, { httpOnly: true, sameSite: "lax" });
    res.json({ ok: true, player: out.player, xuid: out.xuid, skinBase64: out.skinBase64 });
  } catch (err) {
    res.status(500).json({ ok: false, error: "bridge_error" });
  }
});

app.post("/api/skins_batch", async (req, res) => {
  try {
    const players = (req.body && Array.isArray(req.body.players)) ? req.body.players : [];
    const data = await bridgeRequest("skins_batch", { players });
    res.json(data);
  } catch (err) {
    console.error("[api/skins_batch] Error:", err.message);
    res.json({ success: false, skins: {} });
  }
});

app.post("/api/ranks_batch", async (req, res) => {
  try {
    const players = (req.body && Array.isArray(req.body.players)) ? req.body.players : [];
    const data = await bridgeRequest("ranks_batch", { players });
    res.json(data);
  } catch (err) {
    console.error("[api/ranks_batch] Error:", err.message);
    res.json({ success: false, ranks: {} });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("sid");
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.get("/api/leaderboards", async (req, res) => {
  try {
    const bridgeRes = await bridgeRequest("leaderboards");
    if (!bridgeRes || !bridgeRes.success) return res.json({ success: false, error: bridgeRes && bridgeRes.error ? bridgeRes.error : "bridge_failed", data: {} });
    res.json({ success: true, data: bridgeRes.data || {} });
  } catch (err) {
    res.json({ success: false, error: err && err.message ? err.message : "bridge_failed", data: {} });
  }
});

app.get("/api/profile/:name", async (req, res) => {
  try {
    const data = await bridgeRequest("profile", { player: req.params.name });
    res.json(data);
  } catch (err) {
    console.error("[api/profile] Error:", err.message);
    res.json({ success: false, error: "Bridge request failed" });
  }
});

app.get("/api/stats/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const ladder = req.query.ladder || "NoDebuff";
    const data = await bridgeRequest("player_stats", { player: name, ladder }, 20000);
    res.json(data);
  } catch (err) {
    console.error("[api/stats] Error:", err.message);
    res.json({ success: false, error: err.message });
  }
});

app.get("/api/punishments/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const data = await bridgeRequest("player_punishments", { player: name }, 20000);
    res.json(data);
  } catch (err) {
    console.error("[api/punishments] Error:", err.message);
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/matches/:name', async (req, res) => {
  try {
    const mode = String(req.query.mode || 'ranked').toLowerCase();
    const type = mode === 'ranked' ? 0 : 1;
    const data = await bridgeRequest("match_history", { 
      player: req.params.name, 
      match_type: type,
      limit: 25
    });
    res.json(data);
  } catch (err) {
    console.error("[api/matches] Error:", err.message);
    res.json({ success: false, matches: [] });
  }
});

app.get("/api/staff", async (req, res) => {
  try {
    const manualGroups = buildStaffGroupsFromManual();
    const allPlayers = Array.from(new Set(Object.values(manualGroups).flat().map((x) => x.name)));
    
    let rankMap = {};
    for (const part of chunk(allPlayers, 150)) {
      try {
        const br = await bridgeRequest("ranks_batch", { players: part });
        if (br.success && br.ranks) rankMap = { ...rankMap, ...br.ranks };
      } catch {}
    }

    const groups = {};
    STAFF_RANKS.forEach(r => {
      const lowR = r.toLowerCase();
      const members = [];
      
      const manualNames = [];
      for (const [mRank, names] of Object.entries(MANUAL_STAFF)) {
        if (mRank.toLowerCase() === lowR || (lowR === 'moderator' && mRank.toLowerCase() === 'mod')) {
          manualNames.push(...names);
        }
      }

      manualNames.forEach(pName => {
        const info = rankMap[pName] || {};
        const forcedColors = {
          'owner': '#aa0000', 'manager': '#aa0000', 'developer': '#55ffff',
          'admin': '#0000aa', 'moderator': '#5555ff', 'mod': '#5555ff', 'helper': '#ffff55'
        };
        
        members.push({
          name: pName,
          rankName: info.name || r,
          rankColor: forcedColors[lowR] || info.color || "#ffffff",
          skinBase64: "",
          useOwnerSkin: true
        });
      });
      
      groups[r] = members.sort((a,b) => a.name.localeCompare(b.name));
    });

    res.json({ success: true, groups });
  } catch (err) {
    res.json({ success: true, groups: buildStaffGroupsFromManual() });
  }
});

app.get("/api/status", async (req, res) => {
  try {
    const [bridgeData, hubData] = await Promise.all([
      withTimeout(bridgeRequest("status"), 6500, "status_timeout").catch(() => null),
      pingHub()
    ]);

    if (!bridgeData || !bridgeData.success) {
      return res.json({
        timestamp: nowSec(),
        tps: 0,
        load: 0,
        online: 0,
        max: 0,
        hub: hubData.online,
        hubMax: hubData.max,
        practice: 0,
        players: [],
        offline: true
      });
    }

    const data = bridgeData.data;
    res.json({
      timestamp: data.timestamp,
      tps: data.tps,
      load: data.load,
      online: data.online,
      max: data.max,
      hub: hubData.online,
      hubMax: hubData.max,
      practice: data.online,
      players: data.players
    });
  } catch (err) {
    res.json({ timestamp: nowSec(), tps: 0, load: 0, online: 0, max: 0, hub: 0, practice: 0, players: [], error: true });
  }
});

app.listen(PORT, () => {
  console.log(`Site running on http://localhost:${PORT}`);
});
