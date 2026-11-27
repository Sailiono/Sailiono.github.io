"""Render concept illustrations and all-sample plots of the public replay."""
import csv
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
with (ROOT.parent / 'assets/evidence/aerakia-mag-bias-series.csv').open() as f:
    rows = list(csv.reader(f))[1:]
samples = [[float(v) for v in row] for row in rows]
assert len(samples) == 2000
y_max = max(15, math.ceil(max(r[i] for r in samples for i in (1, 2)) / 15) * 15)
for theme, bg, ink, grid, standard, robust in [
    ('a', '#101216', '#a5b0c2', '#2b3039', '#c3855a', '#b0cafa'),
    ('b', '#1744ed', '#dce5ff', '#466af2', '#ffbca5', '#ffffff'),
]:
    for compact in (False, True):
        w, h = (360, 320) if compact else (1000, 440)
        left, right, top, bottom = 49, 17, 58, 42
        pw, ph = w-left-right, h-top-bottom
        x = lambda t: left + t/20*pw
        y = lambda v: top + ph - v/y_max*ph
        parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="title desc">',
                 '<title id="title">公开 C 算法磁偏置回放</title>',
                 '<desc id="desc">2000个实际输出采样点。6.66秒起加入磁偏置，标准配置误差上升，抗干扰配置接近参考值。合成回放，不是实飞。</desc>',
                 f'<rect width="{w}" height="{h}" fill="{bg}"/>',
                 f'<rect x="{x(6.66)}" y="{top}" width="{x(20)-x(6.66)}" height="{ph}" fill="{ink}" opacity=".05"/>',
                 f'<g font-family="Arial,Noto Sans CJK SC,sans-serif" font-size="17" fill="{ink}">',
                 f'<text x="{left}" y="25">姿态误差 / °</text>']
        for v in range(0, y_max + 1, 15):
            parts += [f'<path d="M{left} {y(v)}H{w-right}" stroke="{grid}"/>', f'<text x="{left-11}" y="{y(v)+6}" text-anchor="end">{v}</text>']
        for t in (0, 10, 20) if compact else (0, 5, 10, 15, 20):
            parts += [f'<text x="{x(t)}" y="{h-13}" text-anchor="middle">{t}</text>']
        parts += [f'<text x="{w-right}" y="25" text-anchor="end">时间 / s</text>',
                  f'<text x="{x(6.66)+6}" y="{top+21}">磁场偏置 →</text>', '</g>']
        for i, color in ((1, standard), (2, robust)):
            points = ' '.join(f'{x(r[0]):.3f},{y(r[i]):.3f}' for r in samples)
            dash = ' stroke-dasharray="7 4"' if i == 2 else ''
            parts += [f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="2.5"{dash}/>']
        parts += ['</svg>']
        (OUT / f'replay-{theme}{"-compact" if compact else ""}.svg').write_text('\n'.join(parts))

# Original conceptual artwork. Layers denote system responsibilities, not a PCB stackup.
traces = ''.join(f'<path d="M{80+i*29} 80v{35+i%4*18}l42 42v{110-i%3*20}"/>' for i in range(16))
pads = ''.join(f'<rect x="{260+i*12}" y="{v}" width="6" height="18" fill="#b49b7f"/>' for v in (130, 258) for i in range(13))
art = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 820" role="img" aria-labelledby="title desc">
<title id="title">dpiny 系统分层示意</title><desc id="desc">电源、定位与维护三个抽象层级。概念插画，不是实物照片或电路设计。</desc>
<defs><linearGradient id="edge" x2="0" y2="1"><stop stop-color="#e6b183"/><stop offset="1" stop-color="#725038"/></linearGradient><linearGradient id="board" x2="1" y2="1"><stop stop-color="#2c3130"/><stop offset="1" stop-color="#121b19"/></linearGradient><linearGradient id="shield" x2="1" y2="1"><stop stop-color="#d3d5ca"/><stop offset=".48" stop-color="#666f69"/><stop offset="1" stop-color="#bec3b9"/></linearGradient><radialGradient id="glow"><stop stop-color="#b3703e" stop-opacity=".3"/><stop offset="1" stop-color="#b3703e" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="570" cy="607" rx="480" ry="180" fill="url(#glow)"/>
<g fill="none" stroke="#b88c68" stroke-opacity=".25"><ellipse cx="550" cy="585" rx="470" ry="190"/><ellipse cx="550" cy="585" rx="400" ry="155"/><path d="M80 585h940M550 395v380"/></g>
<g transform="matrix(.9,.42,-.9,.42,500,280)"><rect x="55" y="55" width="570" height="370" rx="15" fill="#17191a" stroke="#655441" stroke-width="2"/><rect x="65" y="65" width="550" height="350" rx="10" fill="none" stroke="#b7855d" stroke-dasharray="5 7"/><g stroke="#9b7352" stroke-width="2" fill="none">TRACES</g><g fill="#e1b282"><rect x="110" y="100" width="130" height="70" rx="3"/><rect x="290" y="100" width="130" height="70" rx="3"/></g><g fill="#161919" font-family="monospace" font-size="16"><text x="135" y="142">24 V IN</text><text x="315" y="142">ISOLATED</text></g><text x="105" y="370" fill="#b69070" font-family="monospace" font-size="19">01 / POWER &amp; ISOLATION</text></g>
<g stroke="#c8a17d" stroke-dasharray="4 6" stroke-opacity=".35"><path d="M450 327v-160M785 483V323M198 530V370M532 686V526"/></g>
<g transform="matrix(.9,.42,-.9,.42,500,115)"><rect x="55" y="65" width="570" height="370" rx="15" fill="#0a1010" stroke="url(#edge)" stroke-width="5"/><rect x="55" y="55" width="570" height="370" rx="15" fill="url(#board)" stroke="#929283" stroke-width="1.5"/><g stroke="#8c7354" stroke-width="1.3" fill="none" opacity=".7">TRACES</g>PADS<rect x="250" y="145" width="170" height="110" rx="4" fill="#101314" stroke="#777e73"/><g fill="#b3c0ae" font-family="monospace" text-anchor="middle"><text x="335" y="193" font-size="19">STM32F407</text><text x="335" y="220" font-size="12">CONTROL / RTOS</text></g><rect x="100" y="190" width="120" height="150" rx="5" fill="url(#shield)" stroke="#d3d8cc"/><g fill="#252e29" text-anchor="middle" font-family="monospace"><text x="160" y="257" font-size="23">UM982</text><text x="160" y="282" font-size="13">GNSS / RTK</text></g><rect x="490" y="170" width="130" height="75" rx="5" fill="url(#shield)" stroke="#b8bdb1"/><rect x="555" y="183" width="65" height="49" rx="4" fill="#111517"/><g fill="#d7b183"><rect x="285" y="313" width="80" height="32"/><rect x="390" y="313" width="80" height="32"/><circle cx="83" cy="83" r="8"/><circle cx="596" cy="83" r="8"/><circle cx="83" cy="397" r="8"/><circle cx="596" cy="397" r="8"/></g><text x="270" y="385" fill="#a4af9e" font-family="monospace" font-size="15">DPINY / POSITIONING &amp; CONTROL</text></g>
<g transform="matrix(.9,.42,-.9,.42,500,-40)"><rect x="80" y="75" width="520" height="340" rx="14" fill="#b0bcb0" fill-opacity=".025" stroke="#a5b8b3" stroke-opacity=".55"/><g stroke="#849b96" stroke-width="1" fill="#101918" fill-opacity=".85"><rect x="120" y="120" width="190" height="80" rx="5"/><rect x="350" y="120" width="200" height="80" rx="5"/><rect x="120" y="240" width="190" height="80" rx="5"/><rect x="350" y="240" width="200" height="80" rx="5"/><path d="M310 160h40M310 280h40M215 200v40M450 200v40" fill="none"/></g><g fill="#c0d0c6" font-family="monospace" font-size="17" text-anchor="middle"><text x="215" y="167">GNSS / RTCM</text><text x="450" y="167">USB / SHELL</text><text x="215" y="287">WATCHDOG</text><text x="450" y="287">CONFIG</text></g><text x="120" y="380" fill="#91a89e" font-family="monospace" font-size="17">03 / OPERATION &amp; MAINTENANCE</text></g></svg>'''
(OUT / 'device.svg').write_text(art.replace('TRACES', traces).replace('PADS', pads))
print('Rendered four charts from all 2000 existing samples and one conceptual illustration.')
