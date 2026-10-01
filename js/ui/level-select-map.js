/* ========================================
   BEAT RUNNER - Neon District Map Renderer
   Pure presentation: lays out stage nodes along a
   serpentine path and paints the district around it.
   No progression logic lives here.
   ======================================== */

const NeonDistrictMap = (() => {
    const COLS = 3;
    const SEED = 20240611;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const r1 = n => Math.round(n * 10) / 10;

    /** Deterministic RNG so the scenery is identical on every render */
    function createRng(seed) {
        let s = seed;
        return () => {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Compute node positions and map metrics.
     * Rows read 1-2-3, then the path turns and row 2 runs 4-5-6 right-to-left,
     * so consecutive stages are always neighbours on the path.
     * @param {object} opts
     * @param {number} opts.width - Map width in px
     * @param {number} opts.viewportHeight - Visible scroller height in px
     * @param {number} opts.topInset - Height covered by the header
     * @param {number} opts.bottomInset - Height covered by the info bar
     * @param {number} opts.count - Number of stages
     */
    function computeLayout({ width, viewportHeight, topInset, bottomInset, count }) {
        const W = width;
        const rows = Math.ceil(count / COLS);
        const N = clamp(W * 0.17, 62, 92);              // node diameter
        const s = clamp(W * 0.24, N * 1.38, N * 1.75);  // column spacing
        const cx = W / 2;
        const ww = N * 0.66;                            // walkway width
        const topPad = N * 0.62;
        const bottomPad = N * 0.95;

        // Fit rows to the visible area on tall screens, scroll on short ones
        const avail = viewportHeight - topInset - bottomInset;
        const fitP = rows > 1 ? (avail - topPad - bottomPad - N) / (rows - 1) : 0;
        const P = clamp(fitP, N * 1.62, N * 2.05);
        const content = topPad + N + (rows - 1) * P + bottomPad;
        const slack = Math.max(0, avail - content);
        const y0 = topInset + topPad + N / 2 + slack * 0.4;

        const positions = [];
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / COLS);
            const k = i % COLS;
            const col = row % 2 === 0 ? k : COLS - 1 - k;
            positions.push({ x: cx + (col - 1) * s, y: y0 + row * P, row, col });
        }

        const yLast = positions.length ? positions[positions.length - 1].y : y0;
        const H = Math.max(viewportHeight, yLast + N / 2 + bottomPad + bottomInset);

        // U-turn bulge: round, but never past the screen edge
        const maxExt = cx - s - ww / 2 - 4;
        const bend = Math.max(N * 0.4, Math.min(P * 0.66, maxExt / 0.75));

        return { W, H, N, s, P, cx, ww, rows, y0, yLast, bend, positions };
    }

    /**
     * Path segments between consecutive nodes.
     * Each segment is the drawing command that continues from node i to node i+1.
     */
    function buildSegments(L) {
        const segs = [];
        const { positions: p, bend, N, cx } = L;
        for (let i = 0; i < p.length - 1; i++) {
            const a = p[i];
            const b = p[i + 1];
            if (a.row === b.row) {
                const sag = N * 0.09 * (i % 2 === 0 ? 1 : -1);
                segs.push(`Q ${r1((a.x + b.x) / 2)} ${r1(a.y + sag)} ${r1(b.x)} ${r1(b.y)}`);
            } else {
                const dir = a.x > cx ? 1 : -1;
                segs.push(`C ${r1(a.x + dir * bend)} ${r1(a.y)} ${r1(b.x + dir * bend)} ${r1(b.y)} ${r1(b.x)} ${r1(b.y)}`);
            }
        }
        return segs;
    }

    /** Continuous path from node `from` to node `to` (inclusive indices) */
    function pathBetween(L, segs, from, to) {
        const p = L.positions;
        if (!p.length || to <= from) return '';
        return `M ${r1(p[from].x)} ${r1(p[from].y)} ` + segs.slice(from, to).join(' ');
    }

    // ---------- Scenery primitives (SVG strings) ----------

    function defs(L) {
        return `
        <defs>
            <linearGradient id="nd-ground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#140c30" stop-opacity="0"/>
                <stop offset="${r1(Math.min(0.2, (L.y0 - L.N) / L.H))}" stop-color="#140c30"/>
                <stop offset="0.6" stop-color="#110a28"/>
                <stop offset="1" stop-color="#0a0619"/>
            </linearGradient>
            <linearGradient id="nd-water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#0a0b2a"/>
                <stop offset="0.5" stop-color="#151a4d"/>
                <stop offset="1" stop-color="#0b0c2c"/>
            </linearGradient>
            <linearGradient id="nd-stone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#4c4364"/>
                <stop offset="1" stop-color="#2c2541"/>
            </linearGradient>
            <radialGradient id="nd-plat" cx="0.5" cy="0.38" r="0.62">
                <stop offset="0" stop-color="#4d4466"/>
                <stop offset="0.75" stop-color="#352d4b"/>
                <stop offset="1" stop-color="#231c36"/>
            </radialGradient>
            <linearGradient id="nd-win" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffd98a"/>
                <stop offset="1" stop-color="#ff8a2a"/>
            </linearGradient>
            <linearGradient id="nd-roof" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2d3576"/>
                <stop offset="1" stop-color="#181c47"/>
            </linearGradient>
            <radialGradient id="nd-amber"><stop offset="0" stop-color="#ffb04a" stop-opacity="0.55"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
            <radialGradient id="nd-magenta"><stop offset="0" stop-color="#ff3dd8" stop-opacity="0.45"/><stop offset="1" stop-color="#ff3dd8" stop-opacity="0"/></radialGradient>
            <radialGradient id="nd-cyan"><stop offset="0" stop-color="#3ee8ff" stop-opacity="0.35"/><stop offset="1" stop-color="#3ee8ff" stop-opacity="0"/></radialGradient>
            <radialGradient id="nd-violet"><stop offset="0" stop-color="#8a4dff" stop-opacity="0.32"/><stop offset="1" stop-color="#8a4dff" stop-opacity="0"/></radialGradient>
            <linearGradient id="nd-path" gradientUnits="userSpaceOnUse" x1="0" y1="${r1(L.y0)}" x2="0" y2="${r1(Math.max(L.yLast, L.y0 + 1))}">
                <stop offset="0" stop-color="#7ef6ff"/>
                <stop offset="0.3" stop-color="#b58cff"/>
                <stop offset="0.6" stop-color="#ff5fe0"/>
                <stop offset="1" stop-color="#9d7bff"/>
            </linearGradient>
        </defs>`;
    }

    function glow(x, y, rx, ry, id, opacity = 1) {
        return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="url(#${id})" opacity="${opacity}"/>`;
    }

    /** Lit window with mullions */
    function windowRect(x, y, w, h, lit) {
        const fill = lit ? 'url(#nd-win)' : '#2a2346';
        let out = `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="1" fill="${fill}"/>`;
        out += `<path d="M ${r1(x + w / 2)} ${r1(y)} V ${r1(y + h)} M ${r1(x)} ${r1(y + h / 2)} H ${r1(x + w)}" stroke="${lit ? '#7a3a14' : '#1a1430'}" stroke-width="1" opacity="0.8"/>`;
        return out;
    }

    /** Japanese-style house facade with tiled roof. (x, base) is bottom-left. */
    function house(rng, x, base, w, h, { roof = true, litChance = 0.75 } = {}) {
        const top = base - h;
        let out = '';
        out += glow(x + w / 2, base - h * 0.45, w * 0.9, h * 0.75, 'nd-amber', 0.55);
        out += `<rect x="${r1(x)}" y="${r1(top)}" width="${r1(w)}" height="${r1(h)}" fill="#2a1e3e"/>`;
        out += `<rect x="${r1(x)}" y="${r1(top)}" width="${r1(w)}" height="${r1(h)}" fill="#000" opacity="0.15"/>`;
        // timber beams
        out += `<path d="M ${r1(x)} ${r1(top + h * 0.5)} H ${r1(x + w)}" stroke="#3b2a4c" stroke-width="2"/>`;
        const cols = Math.max(1, Math.floor(w / 26));
        const winW = Math.min(18, w / cols - 8);
        const winH = winW * 1.15;
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < cols; c++) {
                const wx = x + (w / cols) * (c + 0.5) - winW / 2;
                const wy = top + h * (r === 0 ? 0.14 : 0.6);
                if (wy + winH > base - 2) continue;
                out += windowRect(wx, wy, winW, winH, rng() < litChance);
            }
        }
        if (roof) {
            const rh = Math.min(h * 0.32, 26);
            const ov = Math.min(10, w * 0.1);
            out += `<path d="M ${r1(x - ov)} ${r1(top + 2)} Q ${r1(x + w / 2)} ${r1(top - 3)} ${r1(x + w + ov)} ${r1(top + 2)} L ${r1(x + w - w * 0.12)} ${r1(top - rh)} L ${r1(x + w * 0.12)} ${r1(top - rh)} Z" fill="url(#nd-roof)"/>`;
            for (let t = x + 4; t < x + w; t += 5) {
                out += `<path d="M ${r1(t)} ${r1(top - rh + 2)} L ${r1(t + (t - x - w / 2) * 0.12)} ${r1(top + 1)}" stroke="#3a4592" stroke-width="1.2" opacity="0.55"/>`;
            }
            out += `<path d="M ${r1(x - ov)} ${r1(top + 2)} Q ${r1(x + w / 2)} ${r1(top - 3)} ${r1(x + w + ov)} ${r1(top + 2)}" stroke="#0d0f2a" stroke-width="2.5" fill="none"/>`;
        }
        return out;
    }

    function neonStroke(d, color, width = 2) {
        return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width * 4}" stroke-linecap="round" stroke-linejoin="round" opacity="0.18"/>` +
            `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width * 2}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>` +
            `<path d="${d}" fill="none" stroke="#ffe4fb" stroke-width="${width * 0.7}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }

    /** Vertical katakana sign: ネオン */
    function neonSignVertical(x, y, w, h) {
        const color = '#ff3fd6';
        let out = glow(x + w / 2, y + h / 2, w * 2.2, h * 0.8, 'nd-magenta', 0.9);
        out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(w * 0.25)}" fill="#1a0a24"/>`;
        out += neonStroke(`M ${r1(x + 3)} ${r1(y + 3)} H ${r1(x + w - 3)} V ${r1(y + h - 3)} H ${r1(x + 3)} Z`, color, 1.4);
        const chars = ['ネ', 'オ', 'ン'];
        const fs = Math.min(w * 0.68, (h - 10) / 3.3);
        chars.forEach((ch, i) => {
            const cy = y + 6 + (h - 12) * ((i + 0.5) / 3) + fs * 0.35;
            const attrs = `x="${r1(x + w / 2)}" y="${r1(cy)}" font-size="${r1(fs)}" text-anchor="middle" font-weight="700" font-family="'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif"`;
            out += `<text ${attrs} fill="none" stroke="${color}" stroke-width="3.2" opacity="0.45">${ch}</text>`;
            out += `<text ${attrs} fill="#ffd9f7" stroke="${color}" stroke-width="0.8">${ch}</text>`;
        });
        return `<g class="nd-flicker">${out}</g>`;
    }

    /** Square ramen-bowl neon sign */
    function neonSignRamen(x, y, size) {
        const color = '#ff3fd6';
        const s = size;
        let out = glow(x + s / 2, y + s / 2, s * 1.3, s * 1.2, 'nd-magenta', 0.9);
        out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(s)}" height="${r1(s)}" rx="${r1(s * 0.16)}" fill="#1a0a24"/>`;
        out += neonStroke(`M ${r1(x + 3)} ${r1(y + 3)} H ${r1(x + s - 3)} V ${r1(y + s - 3)} H ${r1(x + 3)} Z`, color, 1.3);
        const bx = x + s * 0.2, bw = s * 0.6, by = y + s * 0.55;
        out += neonStroke(`M ${r1(bx)} ${r1(by)} H ${r1(bx + bw)} Q ${r1(bx + bw)} ${r1(by + s * 0.28)} ${r1(bx + bw / 2)} ${r1(by + s * 0.28)} Q ${r1(bx)} ${r1(by + s * 0.28)} ${r1(bx)} ${r1(by)} Z`, color, 1.2);
        for (let i = 0; i < 3; i++) {
            const sx = bx + bw * (0.25 + i * 0.25);
            out += neonStroke(`M ${r1(sx)} ${r1(by - 3)} q -3 -4 0 -8 q 3 -4 0 -8`, color, 1);
        }
        out += neonStroke(`M ${r1(bx + bw * 0.55)} ${r1(by + 2)} L ${r1(x + s * 0.88)} ${r1(y + s * 0.2)}`, color, 1);
        return `<g class="nd-flicker nd-flicker--slow">${out}</g>`;
    }

    function torii(x, base, w, h) {
        const post = Math.max(3, w * 0.07);
        const c = '#8e2236';
        let out = `<g opacity="0.85">`;
        out += `<rect x="${r1(x + w * 0.16)}" y="${r1(base - h)}" width="${r1(post)}" height="${r1(h)}" fill="${c}"/>`;
        out += `<rect x="${r1(x + w * 0.84 - post)}" y="${r1(base - h)}" width="${r1(post)}" height="${r1(h)}" fill="${c}"/>`;
        out += `<rect x="${r1(x + w * 0.08)}" y="${r1(base - h * 0.78)}" width="${r1(w * 0.84)}" height="${r1(post * 0.8)}" fill="${c}"/>`;
        out += `<path d="M ${r1(x)} ${r1(base - h - 2)} Q ${r1(x + w / 2)} ${r1(base - h + post * 0.6)} ${r1(x + w)} ${r1(base - h - 2)} L ${r1(x + w * 0.97)} ${r1(base - h + post)} Q ${r1(x + w / 2)} ${r1(base - h + post * 1.6)} ${r1(x + w * 0.03)} ${r1(base - h + post)} Z" fill="#a52a40"/>`;
        out += `</g>`;
        return out;
    }

    function sakura(rng, x, y, radius, { trunk = true } = {}) {
        const pinks = ['#ff8fc8', '#ff6fb5', '#f9a8d4', '#e95aa8', '#ffc2e2', '#ff9ed2'];
        let out = glow(x, y, radius * 1.4, radius * 1.1, 'nd-magenta', 0.5);
        if (trunk) {
            out += `<path d="M ${r1(x - radius * 0.1)} ${r1(y + radius * 1.4)} C ${r1(x)} ${r1(y + radius * 0.8)} ${r1(x - radius * 0.2)} ${r1(y + radius * 0.4)} ${r1(x + radius * 0.1)} ${r1(y)} M ${r1(x)} ${r1(y + radius * 0.6)} Q ${r1(x + radius * 0.5)} ${r1(y + radius * 0.3)} ${r1(x + radius * 0.6)} ${r1(y - radius * 0.1)}" stroke="#3a1f33" stroke-width="${r1(Math.max(3, radius * 0.12))}" fill="none" stroke-linecap="round"/>`;
        }
        const count = Math.round(22 + radius * 0.6);
        for (let i = 0; i < count; i++) {
            const a = rng() * Math.PI * 2;
            const d = Math.sqrt(rng()) * radius;
            const cr = radius * (0.12 + rng() * 0.12);
            out += `<circle cx="${r1(x + Math.cos(a) * d)}" cy="${r1(y + Math.sin(a) * d * 0.75)}" r="${r1(cr)}" fill="#a3367a" opacity="0.8"/>`;
        }
        for (let i = 0; i < count; i++) {
            const a = rng() * Math.PI * 2;
            const d = Math.sqrt(rng()) * radius;
            const cr = radius * (0.07 + rng() * 0.1);
            const col = pinks[Math.floor(rng() * pinks.length)];
            out += `<circle cx="${r1(x + Math.cos(a) * d)}" cy="${r1(y + Math.sin(a) * d * 0.75 - radius * 0.08)}" r="${r1(cr)}" fill="${col}" opacity="${r1(0.7 + rng() * 0.3)}"/>`;
        }
        return out;
    }

    function bush(rng, x, y, size) {
        const greens = ['#16352c', '#1d4636', '#24573f', '#2f6b48'];
        let out = '';
        for (let i = 0; i < 6; i++) {
            const dx = (rng() - 0.5) * size * 1.4;
            const dy = (rng() - 0.5) * size * 0.5;
            const cr = size * (0.22 + rng() * 0.2);
            out += `<circle cx="${r1(x + dx)}" cy="${r1(y + dy)}" r="${r1(cr)}" fill="${greens[i % greens.length]}"/>`;
        }
        return out;
    }

    function streetLamp(x, base, h) {
        let out = glow(x, base - h, h * 0.7, h * 0.6, 'nd-amber', 1);
        out += `<rect x="${r1(x - 1.5)}" y="${r1(base - h)}" width="3" height="${r1(h)}" fill="#1c1426"/>`;
        out += `<rect x="${r1(x - 4)}" y="${r1(base - 3)}" width="8" height="3" fill="#1c1426"/>`;
        out += `<path d="M ${r1(x - 6)} ${r1(base - h - 12)} H ${r1(x + 6)} L ${r1(x + 4.5)} ${r1(base - h)} H ${r1(x - 4.5)} Z" fill="#ffcf73" stroke="#2a1a14" stroke-width="1.2"/>`;
        out += `<path d="M ${r1(x - 8)} ${r1(base - h - 12)} H ${r1(x + 8)} L ${r1(x)} ${r1(base - h - 18)} Z" fill="#1c1426"/>`;
        return out;
    }

    function water(rng, x, y, w, h) {
        if (w <= 0 || h <= 4) return '';
        let out = `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(Math.min(10, h / 2))}" fill="url(#nd-water)"/>`;
        out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(Math.min(10, h / 2))}" fill="none" stroke="#3a3157" stroke-width="2.5"/>`;
        const colors = ['#ffb04a', '#ff5fe0', '#6ef0ff', '#b58cff'];
        const n = Math.max(3, Math.floor(w / 26));
        for (let i = 0; i < n; i++) {
            const rx = x + 8 + rng() * Math.max(1, w - 30);
            const ry = y + 5 + rng() * Math.max(1, h - 10);
            const len = 6 + rng() * 18;
            out += `<path d="M ${r1(rx)} ${r1(ry)} h ${r1(len)}" stroke="${colors[i % colors.length]}" stroke-width="1.5" stroke-linecap="round" opacity="${r1(0.25 + rng() * 0.35)}"/>`;
        }
        return out;
    }

    function scatterPetals(rng, L, count) {
        let out = '';
        for (let i = 0; i < count; i++) {
            const x = rng() * L.W;
            const y = L.y0 - L.N + rng() * (L.H - L.y0 + L.N);
            out += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="2" ry="1.2" fill="#ff9ed2" opacity="${r1(0.35 + rng() * 0.4)}" transform="rotate(${Math.round(rng() * 180)} ${r1(x)} ${r1(y)})"/>`;
        }
        return out;
    }

    // ---------- Composition ----------

    /**
     * Build the full scenery SVG plus positions for animated HTML props.
     * @param {object} L - Layout from computeLayout
     * @param {object} progress - { litUntil: index of the furthest lit segment end,
     *   sparkTo: node index the idle spark runs to,
     *   advance: optional { from, to } node indices; lights the path only up to `from`
     *   and adds a masked segment (from -> to) that the stylesheet reveals on demand }
     * @returns {{ svg: string, lanterns: Array, spark: string }}
     */
    function render(L, { litUntil = 0, sparkTo = 1, advance = null } = {}) {
        const rng = createRng(SEED);
        const { W, H, N, s, P, cx, ww, y0, positions } = L;
        const segs = buildSegments(L);
        const lanterns = [];
        const back = [];
        const mid = [];
        const front = [];

        // Ground
        back.push(`<rect x="0" y="0" width="${r1(W)}" height="${r1(H)}" fill="url(#nd-ground)"/>`);
        back.push(glow(cx, y0 - N * 1.2, W * 0.55, N * 1.4, 'nd-violet', 1));

        // Houses above the first row (under the header)
        const topBase = y0 - ww / 2 + 2;
        const houseH = N * 1.35;
        back.push(house(rng, -12, topBase, W * 0.3, houseH));
        back.push(house(rng, W * 0.72, topBase, W * 0.3, houseH * 1.1));
        back.push(house(rng, W * 0.36, topBase - N * 0.25, W * 0.28, houseH * 0.8, { litChance: 0.5 }));
        lanterns.push({ x: W * 0.31, y: topBase - houseH * 0.85, size: 1 });
        lanterns.push({ x: W * 0.69, y: topBase - houseH * 0.95, size: 1 });

        // Gaps between rows
        for (let g = 0; g < L.rows - 1; g++) {
            const yA = y0 + g * P;
            const yB = yA + P;
            const ym = (yA + yB) / 2;
            const turnRight = g % 2 === 0;
            const openLeft = turnRight;
            const margin = cx - s - N * 0.72;  // free width on the open side

            // Water channel running from the open edge into the bend
            const wy = yA + ww / 2 + 3;
            const wh = (yB - ww / 2 - 3) - wy;
            // reach into the U-turn so the channel's end hides under the curved walkway
            const reach = s + L.bend * 0.75;
            if (openLeft) {
                back.push(water(rng, -12, wy, cx + reach + 12, wh));
            } else {
                back.push(water(rng, cx - reach, wy, W - (cx - reach) + 12, wh));
            }

            // Torii gate standing in the channel, fully visible between walkways
            const type = g % 4;
            const gateH = wh * 0.82;
            if (type === 0) {
                back.push(torii(cx - s * 0.5 - gateH * 0.6, wy + wh - 2, gateH * 1.2, gateH));
            } else if (type === 2) {
                back.push(torii(cx + s * 0.5 - gateH * 0.6, wy + wh - 2, gateH * 1.2, gateH));
            }

            // Scenery on the open side
            const bw = Math.max(36, margin + 6);
            const bx = openLeft ? -10 : W - bw + 10;
            if (type === 0 || type === 1 || type === 3) {
                back.push(house(rng, bx, yB + N * 0.05, bw, P * 0.95, { roof: true }));
            }
            if (type === 0) {
                const sw = clamp(margin * 0.32, 16, 24);
                mid.push(neonSignVertical(clamp(openLeft ? bx + bw - sw - 6 : bx + 6, 2, W - sw - 2), yA + N * 0.35, sw, P * 0.78));
            } else if (type === 1) {
                const size = clamp(margin * 0.62, 30, 46);
                mid.push(neonSignRamen(clamp(openLeft ? bx + bw - size - 4 : bx + 4, 2, W - size - 2), ym - size * 0.45, size));
            } else if (type === 2) {
                const tx = openLeft ? Math.max(14, margin * 0.45) : W - Math.max(14, margin * 0.45);
                front.push(sakura(rng, tx, ym - N * 0.1, clamp(margin * 0.7, 30, 52)));
            } else {
                lanterns.push({ x: openLeft ? bx + bw - 10 : bx + 12, y: yA + N * 0.55, size: 0.9 });
            }

            // Hanging lanterns / lamp just outside the U-turn
            const outside = cx - s - L.bend * 0.75 - ww / 2;
            if (outside > 14) {
                const lx = turnRight ? W - outside / 2 : outside / 2;
                mid.push(streetLamp(lx, yB - ww * 0.15, Math.min(N * 0.75, P * 0.55)));
            } else {
                lanterns.push({ x: turnRight ? W - 9 : 9, y: ym - N * 0.2, size: 0.85 });
            }
        }

        // Below the last row: water and foreground blossoms
        const lastBase = L.yLast + ww / 2 + 4;
        back.push(water(rng, -12, lastBase, W + 24, H - lastBase + 12));
        front.push(sakura(rng, -6, H - N * 0.15, N * 0.85, { trunk: false }));
        front.push(sakura(rng, W + 4, H - N * 0.5, N * 0.75, { trunk: false }));
        front.push(streetLamp(W * 0.86, L.yLast + ww * 0.15, N * 0.7));

        // Walkway: dark rim, stone, paving seams, highlight
        const walk = `M ${r1(positions[0].x - s * 0.95)} ${r1(positions[0].y)} L ${r1(positions[0].x)} ${r1(positions[0].y)} ${segs.join(' ')}` + (() => {
            const last = positions[positions.length - 1];
            const dir = last.x >= cx ? 1 : -1;
            return ` L ${r1(last.x + dir * s * 0.95)} ${r1(last.y)}`;
        })();
        mid.push(`<path d="${walk}" fill="none" stroke="#130e24" stroke-width="${r1(ww + 6)}" stroke-linecap="round" stroke-linejoin="round"/>`);
        mid.push(`<path d="${walk}" fill="none" stroke="url(#nd-stone)" stroke-width="${r1(ww)}" stroke-linecap="round" stroke-linejoin="round"/>`);
        mid.push(`<path d="${walk}" fill="none" stroke="#231c38" stroke-width="${r1(ww - 4)}" stroke-dasharray="1.6 ${r1(ww * 0.36)}" opacity="0.7"/>`);
        mid.push(`<path d="${walk}" fill="none" stroke="#5a5078" stroke-width="${r1(ww * 0.55)}" stroke-dasharray="${r1(ww * 0.3)} ${r1(ww * 0.42)}" opacity="0.22"/>`);

        // Vegetation tufts along the walkway
        positions.forEach((p, i) => {
            if (rng() < 0.55) mid.push(bush(rng, p.x + (rng() < 0.5 ? -1 : 1) * N * 0.72, p.y - ww * 0.5, N * 0.13));
            if (i % 3 === 1 && rng() < 0.5) mid.push(bush(rng, p.x + N * 0.8, p.y + ww * 0.5, N * 0.11));
        });

        // Stone platforms under nodes
        positions.forEach(p => {
            mid.push(`<ellipse cx="${r1(p.x)}" cy="${r1(p.y + N * 0.16)}" rx="${r1(N * 0.68)}" ry="${r1(N * 0.56)}" fill="#130e24"/>`);
            mid.push(`<ellipse cx="${r1(p.x)}" cy="${r1(p.y + N * 0.1)}" rx="${r1(N * 0.64)}" ry="${r1(N * 0.52)}" fill="url(#nd-plat)" stroke="#5a5078" stroke-opacity="0.35" stroke-width="1.2"/>`);
        });

        // Neon progression path
        const full = pathBetween(L, segs, 0, positions.length - 1);
        const adv = advance && advance.to > advance.from && advance.to < positions.length ? advance : null;
        const lit = pathBetween(L, segs, 0, Math.min(adv ? adv.from : litUntil, positions.length - 1));
        const advPath = adv ? pathBetween(L, segs, adv.from, adv.to) : '';
        mid.push(`<g class="nd-path">`);
        mid.push(`<path d="${full}" fill="none" stroke="url(#nd-path)" stroke-width="12" stroke-linecap="round" opacity="0.1"/>`);
        mid.push(`<path d="${full}" fill="none" stroke="url(#nd-path)" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 12" opacity="0.85"/>`);
        mid.push(`<path d="${full}" fill="none" stroke="#efe6ff" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 12" opacity="0.6"/>`);
        if (lit) {
            mid.push(`<path d="${lit}" fill="none" stroke="url(#nd-path)" stroke-width="14" stroke-linecap="round" opacity="0.16"/>`);
            mid.push(`<path d="${lit}" fill="none" stroke="url(#nd-path)" stroke-width="6" stroke-linecap="round" stroke-dasharray="0.1 12" opacity="1"/>`);
            mid.push(`<path d="${lit}" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 12"/>`);
        }
        if (advPath) {
            const reveal = `url(#nd-adv-mask)`;
            mid.push(`<mask id="nd-adv-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${r1(W)}" height="${r1(H)}"><path class="nd-adv-reveal" d="${advPath}" pathLength="1" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"/></mask>`);
            mid.push(`<g mask="${reveal}">`);
            mid.push(`<path d="${advPath}" fill="none" stroke="url(#nd-path)" stroke-width="14" stroke-linecap="round" opacity="0.2"/>`);
            mid.push(`<path d="${advPath}" fill="none" stroke="url(#nd-path)" stroke-width="6" stroke-linecap="round" stroke-dasharray="0.1 12"/>`);
            mid.push(`<path d="${advPath}" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 12"/>`);
            mid.push(`</g>`);
        }
        mid.push(`</g>`);

        // Atmosphere: fog / bloom pools
        for (let g = 0; g < L.rows; g++) {
            const y = y0 + g * P;
            const id = g % 2 === 0 ? 'nd-magenta' : 'nd-cyan';
            front.push(glow(g % 2 === 0 ? W * 0.05 : W * 0.95, y + P * 0.5, W * 0.35, P * 0.6, id, 0.35));
        }
        front.push(scatterPetals(rng, L, Math.round(L.H / 28)));

        const svg = `<svg class="ls-env" xmlns="http://www.w3.org/2000/svg" width="${r1(W)}" height="${r1(H)}" viewBox="0 0 ${r1(W)} ${r1(H)}" aria-hidden="true" focusable="false">${defs(L)}${back.join('')}${mid.join('')}${front.join('')}</svg>`;

        const spark = adv ? advPath : pathBetween(L, segs, 0, clamp(sparkTo, 1, positions.length - 1));
        return { svg, lanterns, spark };
    }

    /** Distant skyline for the parallax sky layer (fixed width tile) */
    function skyline(width, height) {
        const rng = createRng(SEED + 7);
        let out = '';
        let x = -10;
        while (x < width + 10) {
            const w = 24 + rng() * 46;
            const h = height * (0.35 + rng() * 0.55);
            out += `<rect x="${r1(x)}" y="${r1(height - h)}" width="${r1(w)}" height="${r1(h)}" fill="#160f38"/>`;
            for (let wy = height - h + 8; wy < height - 6; wy += 9) {
                for (let wx = x + 5; wx < x + w - 5; wx += 8) {
                    if (rng() < 0.16) {
                        const c = rng() < 0.75 ? '#ffb45a' : (rng() < 0.5 ? '#6ef0ff' : '#ff6fe0');
                        out += `<rect x="${r1(wx)}" y="${r1(wy)}" width="3" height="4" fill="${c}" opacity="${r1(0.35 + rng() * 0.4)}"/>`;
                    }
                }
            }
            x += w + rng() * 6;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${r1(width)}" height="${r1(height)}" viewBox="0 0 ${r1(width)} ${r1(height)}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${out}</svg>`;
    }

    return { computeLayout, render, skyline };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NeonDistrictMap };
}
