"""Doodle cast + text props for the twist-tale kit, as SVG files the three.js kit loads as textures.

Characters: a cream bean head with a heavy ink outline, oval eyes with a highlight, blush, a capsule body in the
outfit colour, stick limbs with round hands — the format's flat-doodle-in-a-3D-world look, in our own drawing.
doodle(name, expr=..., pose=..., **outfit) writes assets/chars/<name>-<expr>[-<pose>].svg (400 x 600 viewBox, 800 x 1200
raster). Props use system fonts only (SVG-as-image cannot see page web fonts): Georgia, Arial Black, Courier New.

usage: python -I tools/make_assets.py
"""
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(ROOT, "assets", "chars")
PR = os.path.join(ROOT, "assets", "props")
INK = "#22202b"
SKIN = "#fffaf0"
BLUSH = "#f4a3a3"
SW = 9  # ink stroke width


def svg(body, w=400, h=600, scale=2):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * scale}" height="{h * scale}" viewBox="0 0 {w} {h}">'
            f'<g stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>')


# ------------------------------------------------------------------ faces
def eyes(expr, cx=200, cy=172):
    L, R = cx - 42, cx + 42
    o = ""
    if expr in ("happy", "laugh", "proud"):
        for x in (L, R):
            o += f'<path d="M{x-15},{cy+6} Q{x},{cy-14} {x+15},{cy+6}" fill="none" stroke="{INK}" stroke-width="8"/>'
    elif expr in ("sleep", "sick"):
        for x in (L, R):
            o += f'<path d="M{x-15},{cy} Q{x},{cy+14} {x+15},{cy}" fill="none" stroke="{INK}" stroke-width="7"/>'
    elif expr in ("shock",):
        for x in (L, R):
            o += f'<circle cx="{x}" cy="{cy}" r="21" fill="#fff" stroke="{INK}" stroke-width="7"/><circle cx="{x}" cy="{cy+2}" r="7" fill="{INK}"/>'
    elif expr in ("dread",):
        for x in (L, R):
            o += f'<circle cx="{x}" cy="{cy}" r="19" fill="#fff" stroke="{INK}" stroke-width="7"/><circle cx="{x}" cy="{cy+4}" r="5" fill="{INK}"/>'
    elif expr in ("whistle",):
        for x in (L, R):
            o += f'<path d="M{x-15},{cy} L{x+15},{cy}" stroke="{INK}" stroke-width="8"/>'
    elif expr in ("bored", "smug", "yawn", "tired"):
        for x in (L, R):
            o += (f'<ellipse cx="{x}" cy="{cy+5}" rx="10" ry="9" fill="{INK}"/>'
                  f'<path d="M{x-17},{cy-2} L{x+17},{cy-2}" stroke="{INK}" stroke-width="7"/>')
            if expr == "tired":
                o += f'<path d="M{x-14},{cy+22} Q{x},{cy+30} {x+14},{cy+22}" fill="none" stroke="#9a8fb0" stroke-width="5"/>'
    else:  # neutral, plead, sad, worried, determined
        r = 15 if expr == "plead" else 11
        for x in (L, R):
            o += (f'<ellipse cx="{x}" cy="{cy}" rx="{r}" ry="{r + 5}" fill="{INK}"/>'
                  f'<circle cx="{x + 4}" cy="{cy - 6}" r="{4 if r < 14 else 6}" fill="#fff"/>')
    # brows
    if expr in ("sad", "worried", "plead", "sick", "dread", "tired"):
        o += f'<path d="M{L-18},{cy-30} L{L+12},{cy-40}" stroke="{INK}" stroke-width="7"/><path d="M{R+18},{cy-30} L{R-12},{cy-40}" stroke="{INK}" stroke-width="7"/>'
    elif expr == "confused":
        o += f'<path d="M{L-16},{cy-32} L{L+14},{cy-32}" stroke="{INK}" stroke-width="7"/><path d="M{R-16},{cy-40} Q{R},{cy-54} {R+16},{cy-42}" fill="none" stroke="{INK}" stroke-width="7"/>'
    elif expr in ("determined", "angry"):
        o += f'<path d="M{L-18},{cy-40} L{L+14},{cy-28}" stroke="{INK}" stroke-width="8"/><path d="M{R+18},{cy-40} L{R-14},{cy-28}" stroke="{INK}" stroke-width="8"/>'
    elif expr in ("shock",):
        o += f'<path d="M{L-16},{cy-38} Q{L},{cy-50} {L+16},{cy-38}" fill="none" stroke="{INK}" stroke-width="7"/><path d="M{R-16},{cy-38} Q{R},{cy-50} {R+16},{cy-38}" fill="none" stroke="{INK}" stroke-width="7"/>'
    return o


def mouth(expr, cx=200, cy=222):
    if expr in ("happy", "proud"):
        return f'<path d="M{cx-26},{cy-4} Q{cx},{cy+30} {cx+26},{cy-4} Z" fill="{INK}"/><path d="M{cx-12},{cy+12} Q{cx},{cy+20} {cx+12},{cy+12}" fill="#e46a6a"/>'
    if expr == "laugh":
        return f'<path d="M{cx-34},{cy-8} Q{cx},{cy+44} {cx+34},{cy-8} Z" fill="{INK}"/><path d="M{cx-16},{cy+18} Q{cx},{cy+30} {cx+16},{cy+18}" fill="#e46a6a"/>'
    if expr in ("shock", "yawn"):
        return f'<ellipse cx="{cx}" cy="{cy+6}" rx="{14 if expr == "shock" else 18}" ry="{18 if expr == "shock" else 22}" fill="{INK}"/>'
    if expr in ("sad", "sick"):
        return f'<path d="M{cx-20},{cy+10} Q{cx},{cy-8} {cx+20},{cy+10}" fill="none" stroke="{INK}" stroke-width="7"/>'
    if expr == "worried":
        return f'<path d="M{cx-22},{cy+6} q7,-8 14,0 q7,8 14,0 q7,-8 14,0" fill="none" stroke="{INK}" stroke-width="6"/>'
    if expr == "smug":
        return f'<path d="M{cx-18},{cy+4} Q{cx+8},{cy+14} {cx+24},{cy-6}" fill="none" stroke="{INK}" stroke-width="7"/>'
    if expr == "sleep":
        return f'<ellipse cx="{cx}" cy="{cy+4}" rx="7" ry="5" fill="{INK}"/>'
    if expr == "plead":
        return f'<path d="M{cx-10},{cy+6} Q{cx},{cy} {cx+10},{cy+6}" fill="none" stroke="{INK}" stroke-width="6"/>'
    if expr in ("determined", "bored", "tired"):
        return f'<path d="M{cx-20},{cy+4} L{cx+20},{cy+4}" stroke="{INK}" stroke-width="7"/>'
    if expr == "angry":
        return f'<path d="M{cx-24},{cy+14} Q{cx},{cy-6} {cx+24},{cy+14} Z" fill="{INK}"/>'
    if expr == "dread":
        return f'<path d="M{cx-26},{cy+8} q6.5,-9 13,0 q6.5,9 13,0 q6.5,-9 13,0 q6.5,9 13,0" fill="none" stroke="{INK}" stroke-width="6"/>'
    if expr == "confused":
        return f'<path d="M{cx-14},{cy+6} q7,-7 14,0 q7,7 14,0" fill="none" stroke="{INK}" stroke-width="6"/>'
    if expr == "whistle":
        return f'<circle cx="{cx}" cy="{cy+4}" r="11" fill="#e46a6a" stroke="{INK}" stroke-width="6"/>'
    if expr == "talk":
        return f'<path d="M{cx-20},{cy-2} Q{cx},{cy+26} {cx+20},{cy-2} Z" fill="{INK}"/>'
    return f'<path d="M{cx-16},{cy} Q{cx},{cy+12} {cx+16},{cy}" fill="none" stroke="{INK}" stroke-width="7"/>'


HATS = {
    "bowler": lambda c: f'<path d="M96,92 Q200,70 304,92 Q304,104 200,104 Q96,104 96,92 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/><path d="M132,94 Q132,18 200,16 Q268,18 268,94 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/><path d="M134,80 L266,80" stroke="#7a5a3a" stroke-width="10"/>',
    "tophat": lambda c: f'<path d="M100,96 L300,96 L300,108 L100,108 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/><path d="M140,98 L146,-2 L254,-2 L260,98 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/><path d="M144,78 L256,78" stroke="#8a2f2f" stroke-width="12"/>',
    "cap": lambda c: f'<path d="M104,94 Q110,30 200,30 Q290,30 296,94 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/><path d="M196,92 Q300,84 336,108 Q290,112 196,104 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/>',
    "peaked": lambda c: f'<path d="M110,96 L118,40 Q200,18 282,40 L290,96 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/><path d="M118,96 Q200,128 282,96 Q200,112 118,96 Z" fill="{INK}"/><circle cx="200" cy="66" r="12" fill="#e8c35a" stroke="{INK}" stroke-width="5"/>',
    "nightcap": lambda c: f'<path d="M102,96 Q110,20 200,26 Q300,30 330,120 L318,130 Q296,70 290,96 Z" fill="{c}" stroke="{INK}" stroke-width="{SW}"/><circle cx="326" cy="128" r="18" fill="#fff" stroke="{INK}" stroke-width="6"/>',
}


def doodle(name, expr="neutral", pose="stand", outfit="#3b6fd8", trim="#ffffff", hair="#3a2b22", hat=None, hatc="#2b2b33",
           moustache=False, grey=False, glasses=False, prop=None, stripes=None, tie=None, legs=True, zz=False, sweat=False,
           headonly=False, tag=None):
    cy = 172
    o = ""
    if not headonly:
        # legs + feet
        if legs:
            if pose == "sit":
                o += f'<path d="M178,420 L150,470 L150,540" fill="none" stroke="{INK}" stroke-width="10"/><path d="M222,420 L250,470 L250,540" fill="none" stroke="{INK}" stroke-width="10"/>'
            else:
                o += f'<path d="M180,420 L170,556" stroke="{INK}" stroke-width="10"/><path d="M220,420 L232,556" stroke="{INK}" stroke-width="10"/>'
            o += f'<ellipse cx="160" cy="560" rx="22" ry="11" fill="{INK}"/><ellipse cx="242" cy="560" rx="22" ry="11" fill="{INK}"/>'
        # arms (behind body for most poses)
        arms = {
            "stand": ("M150,300 Q126,350 132,402", "M250,300 Q274,350 268,402"),
            "arms_up": ("M150,300 Q100,240 96,170", "M250,300 Q300,240 304,170"),
            "point": ("M150,300 Q126,350 132,402", "M250,300 Q320,280 372,262"),
            "hold": ("M150,300 Q150,350 186,352", "M250,300 Q250,350 214,352"),
            "plead": ("M150,300 Q160,350 196,334", "M250,300 Q240,350 204,334"),
            "shrug": ("M150,300 Q96,330 84,276", "M250,300 Q304,330 316,276"),
            "hands_head": ("M150,300 Q86,250 98,186", "M250,300 Q314,250 302,186"),
            "think": ("M150,300 Q126,350 132,402", "M250,300 Q262,250 222,232"),
            "sit": ("M150,300 Q134,360 160,392", "M250,300 Q266,360 240,392"),
            "shovel": ("M150,300 Q150,350 190,340", "M250,300 Q262,330 236,360"),
        }[pose]
        for d in arms:
            o += f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="10"/>'
        # body
        o += f'<rect x="138" y="262" width="124" height="176" rx="60" fill="{outfit}" stroke="{INK}" stroke-width="{SW}"/>'
        if stripes:
            for k in range(4):
                o += f'<path d="M142,{300 + k * 34} L258,{300 + k * 34}" stroke="{stripes}" stroke-width="13" opacity="0.95"/>'
            o += f'<rect x="138" y="262" width="124" height="176" rx="60" fill="none" stroke="{INK}" stroke-width="{SW}"/>'
        if trim:
            o += f'<path d="M178,268 L200,318 L222,268 Z" fill="{trim}" stroke="{INK}" stroke-width="5"/>'
        if tie:
            o += f'<path d="M200,286 L190,300 L200,350 L210,300 Z" fill="{tie}" stroke="{INK}" stroke-width="4"/>'
        # hands
        hands = {"stand": [(132, 404), (268, 404)], "arms_up": [(96, 168), (304, 168)], "point": [(132, 404), (374, 260)],
                 "hold": [(188, 352), (212, 352)], "plead": [(198, 334), (202, 334)], "shrug": [(84, 272), (316, 272)],
                 "hands_head": [(98, 184), (302, 184)], "think": [(132, 404), (222, 232)], "sit": [(160, 394), (240, 394)],
                 "shovel": [(190, 340), (236, 362)]}[pose]
        for x, y in hands:
            o += f'<circle cx="{x}" cy="{y}" r="14" fill="{SKIN}" stroke="{INK}" stroke-width="6"/>'
        # props held in front
        if prop == "pamphlet":
            o += (f'<g transform="translate(150,300) rotate(-6)"><rect x="0" y="0" width="100" height="128" rx="5" fill="#f3e7c9" stroke="{INK}" stroke-width="6"/>'
                  f'<circle cx="50" cy="44" r="18" fill="#f4b942" stroke="{INK}" stroke-width="4"/><path d="M16,84 L84,84 M16,100 L70,100" stroke="{INK}" stroke-width="5"/></g>')
            for x, y in hands[:2]:
                o += f'<circle cx="{x}" cy="{y}" r="14" fill="{SKIN}" stroke="{INK}" stroke-width="6"/>'
        elif prop == "paper":
            o += f'<g transform="translate(160,296) rotate(4)"><rect width="84" height="104" rx="4" fill="#fff" stroke="{INK}" stroke-width="6"/><path d="M14,26 L70,26 M14,46 L70,46 M14,66 L56,66" stroke="{INK}" stroke-width="5"/></g>'
        elif prop == "coal":
            o += f'<path d="M168,318 L196,300 L232,312 L240,344 L212,366 L176,358 Z" fill="#2a2a30" stroke="{INK}" stroke-width="6"/><path d="M192,318 L208,326" stroke="#6a6a78" stroke-width="5"/>'
        elif prop == "shovel":
            o += f'<path d="M170,250 L250,430" stroke="#8a5a32" stroke-width="12"/><path d="M232,420 L282,400 L300,460 L254,478 Z" fill="#9aa0a8" stroke="{INK}" stroke-width="6"/>'
        elif prop == "trowel":
            o += f'<path d="M268,404 L300,372" stroke="#8a5a32" stroke-width="10"/><path d="M292,380 L332,340 L346,370 Z" fill="#b8bec6" stroke="{INK}" stroke-width="5"/>'
        elif prop == "magnifier":
            o += f'<path d="M222,232 L270,180" stroke="#6b4a2e" stroke-width="10"/><circle cx="282" cy="166" r="30" fill="#cfe9ff" stroke="{INK}" stroke-width="8" opacity="0.95"/>'
        elif prop == "watch":
            o += f'<circle cx="214" cy="232" r="26" fill="#f2d16b" stroke="{INK}" stroke-width="6"/><path d="M214,232 L214,214 M214,232 L226,238" stroke="{INK}" stroke-width="4"/>'
    # head
    o += f'<path d="M200,{cy-108} C298,{cy-108} 322,{cy-30} 316,{cy+22} C310,{cy+92} 260,{cy+112} 200,{cy+112} C140,{cy+112} 90,{cy+92} 84,{cy+22} C78,{cy-30} 102,{cy-108} 200,{cy-108} Z" fill="{SKIN}" stroke="{INK}" stroke-width="{SW}"/>'
    if hair and not hat:
        hc = "#9a948c" if grey else hair
        o += f'<path d="M106,{cy-46} Q116,{cy-120} 200,{cy-114} Q292,{cy-118} 298,{cy-42} Q262,{cy-82} 214,{cy-76} Q160,{cy-96} 106,{cy-46} Z" fill="{hc}" stroke="{INK}" stroke-width="{SW-1}"/>'
    o += f'<ellipse cx="126" cy="{cy+40}" rx="20" ry="11" fill="{BLUSH}" opacity="0.75"/><ellipse cx="274" cy="{cy+40}" rx="20" ry="11" fill="{BLUSH}" opacity="0.75"/>'
    o += eyes(expr, 200, cy)
    o += mouth(expr, 200, cy + 54)
    if moustache:
        mc = "#9a948c" if grey else "#4a3424"
        o += f'<path d="M156,{cy+48} Q178,{cy+30} 200,{cy+44} Q222,{cy+30} 244,{cy+48} Q222,{cy+58} 200,{cy+50} Q178,{cy+58} 156,{cy+48} Z" fill="{mc}" stroke="{INK}" stroke-width="5"/>'
    if glasses:
        o += f'<circle cx="158" cy="{cy}" r="26" fill="none" stroke="{INK}" stroke-width="6"/><circle cx="242" cy="{cy}" r="26" fill="none" stroke="{INK}" stroke-width="6"/><path d="M184,{cy} L216,{cy}" stroke="{INK}" stroke-width="6"/>'
    if hat:
        o += HATS[hat](hatc)
    if expr == "sick":
        o += f'<path d="M232,{cy+56} L292,{cy+30}" stroke="#d94a4a" stroke-width="8"/><circle cx="292" cy="{cy+30}" r="7" fill="#d94a4a"/>'
    if zz or expr == "sleep":
        o += (f'<text x="300" y="70" font-family="Arial Black" font-size="56" fill="#fff" stroke="{INK}" stroke-width="6" paint-order="stroke">Z</text>'
              f'<text x="350" y="30" font-family="Arial Black" font-size="38" fill="#fff" stroke="{INK}" stroke-width="5" paint-order="stroke">z</text>')
    if sweat:
        o += f'<path d="M300,96 Q312,120 300,132 Q288,120 300,96 Z" fill="#8fd0ff" stroke="{INK}" stroke-width="4"/>'
    h = 330 if headonly else 600
    path = os.path.join(CH, f"{name}-{expr}" + (f"-{pose}" if pose not in ("stand",) and not headonly else "") + ".svg")
    if tag:
        path = os.path.join(CH, f"{name}-{tag}.svg")
    open(path, "w", encoding="utf-8").write(svg(o, 400, h))
    return path


FACES = ["neutral", "happy", "laugh", "proud", "plead", "worried", "sad", "shock", "smug", "bored", "yawn", "sleep", "sick",
         "determined", "angry", "dread", "confused", "whistle", "tired", "talk"]


def faces():
    """face textures for the 3D cast (kit v2 toon()): features only, on transparent, framed on the head square
    (x 84..316, y 58..290 of the doodle frame) so the kit projects them straight onto the front of the head sphere."""
    fd = os.path.join(ROOT, "assets", "faces")
    os.makedirs(fd, exist_ok=True)
    cy = 172
    for e in FACES:
        for m in ("", "-m"):
            o = f'<ellipse cx="128" cy="{cy+40}" rx="21" ry="12" fill="{BLUSH}" opacity="0.8"/><ellipse cx="272" cy="{cy+40}" rx="21" ry="12" fill="{BLUSH}" opacity="0.8"/>'
            o += eyes(e, 200, cy) + mouth(e, 200, cy + 54)
            if m:
                o += f'<path d="M156,{cy+48} Q178,{cy+30} 200,{cy+44} Q222,{cy+30} 244,{cy+48} Q222,{cy+58} 200,{cy+50} Q178,{cy+58} 156,{cy+48} Z" fill="#4a3424" stroke="{INK}" stroke-width="5"/>'
            if e == "sweat" or e in ("dread", "tired"):
                o += f'<path d="M292,{cy-70} Q304,{cy-46} 292,{cy-34} Q280,{cy-46} 292,{cy-70} Z" fill="#8fd0ff" stroke="{INK}" stroke-width="4"/>'
            open(os.path.join(fd, f"{e}{m}.svg"), "w", encoding="utf-8").write(
                f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="84 58 232 232">'
                f'<g stroke-linecap="round" stroke-linejoin="round">{o}</g></svg>')
    return len(FACES) * 2


def horse(name, frame):
    """side-view doodle horse with Willett riding; frame 0/1 = trot legs"""
    lg = [(150, 330, 140, 430), (180, 330, 196, 430), (300, 330, 290, 430), (330, 330, 346, 430)]
    if frame:
        lg = [(150, 330, 166, 430), (180, 330, 172, 430), (300, 330, 316, 430), (330, 330, 322, 430)]
    o = ""
    for x1, y1, x2, y2 in lg:
        o += f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{INK}" stroke-width="16"/><path d="M{x1},{y1} L{x2},{y2}" stroke="#a8643a" stroke-width="8"/><ellipse cx="{x2}" cy="{y2 + 6}" rx="14" ry="8" fill="{INK}"/>'
    o += f'<path d="M120,250 Q118,206 170,198 L320,196 Q372,200 370,252 Q366,330 300,334 L176,334 Q122,330 120,250 Z" fill="#b8703f" stroke="{INK}" stroke-width="{SW}"/>'
    o += f'<path d="M126,232 Q84,250 92,300" fill="none" stroke="#4a2c1a" stroke-width="16"/>'  # tail
    o += f'<path d="M330,210 L372,120 Q380,96 410,100 L446,118 Q456,134 440,146 L404,152 L376,236 Z" fill="#b8703f" stroke="{INK}" stroke-width="{SW}"/>'
    o += f'<path d="M352,150 Q362,96 392,90" fill="none" stroke="#4a2c1a" stroke-width="14"/><circle cx="414" cy="118" r="6" fill="{INK}"/>'
    o += f'<path d="M220,200 Q250,190 280,200 L276,226 Q250,232 224,226 Z" fill="#7a3b2a" stroke="{INK}" stroke-width="5"/>'  # saddle
    # rider (small Willett)
    o += f'<path d="M226,196 L214,250" stroke="{INK}" stroke-width="9"/><rect x="214" y="110" width="74" height="100" rx="34" fill="#6b4a32" stroke="{INK}" stroke-width="7"/>'
    o += f'<path d="M282,140 Q320,160 360,150" fill="none" stroke="{INK}" stroke-width="8"/><circle cx="362" cy="150" r="9" fill="{SKIN}" stroke="{INK}" stroke-width="5"/>'
    o += f'<ellipse cx="252" cy="70" rx="56" ry="52" fill="{SKIN}" stroke="{INK}" stroke-width="7"/>'
    o += f'<ellipse cx="236" cy="66" rx="7" ry="10" fill="{INK}"/><ellipse cx="270" cy="66" rx="7" ry="10" fill="{INK}"/>'
    o += f'<path d="M232,92 Q252,82 272,92 Q252,100 232,92 Z" fill="#4a3424" stroke="{INK}" stroke-width="3"/>'
    o += f'<path d="M196,36 Q252,24 308,36 Q308,44 252,44 Q196,44 196,36 Z" fill="#2b2b33" stroke="{INK}" stroke-width="5"/><path d="M216,38 Q216,-8 252,-8 Q288,-8 288,38 Z" fill="#2b2b33" stroke="{INK}" stroke-width="5"/>'
    open(os.path.join(CH, f"{name}-{frame}.svg"), "w", encoding="utf-8").write(svg(o, 480, 450, 2))


# ------------------------------------------------------------------ props (system fonts only)
def prop(name, w, h, body, scale=2):
    open(os.path.join(PR, name + ".svg"), "w", encoding="utf-8").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * scale}" height="{h * scale}" viewBox="0 0 {w} {h}">{body}</svg>')


def props():
    # clock face
    t = ""
    for k in range(60):
        a = k * 6 * math.pi / 180
        r1, r2 = (196, 172) if k % 5 == 0 else (196, 186)
        t += f'<path d="M{250 + r1 * math.sin(a):.1f},{250 - r1 * math.cos(a):.1f} L{250 + r2 * math.sin(a):.1f},{250 - r2 * math.cos(a):.1f}" stroke="{INK}" stroke-width="{8 if k % 5 == 0 else 4}"/>'
    for n in range(1, 13):
        a = n * 30 * math.pi / 180
        t += f'<text x="{250 + 140 * math.sin(a):.1f}" y="{250 - 140 * math.cos(a) + 16:.1f}" font-family="Georgia" font-weight="bold" font-size="46" text-anchor="middle" fill="{INK}">{n}</text>'
    prop("clockface", 500, 500, f'<circle cx="250" cy="250" r="246" fill="#fffaf0"/>{t}')
    # pamphlet cover
    prop("pamphlet", 300, 420, f'<rect width="300" height="420" fill="#f1e4c3" stroke="{INK}" stroke-width="10"/>'
         f'<rect x="18" y="18" width="264" height="384" fill="none" stroke="{INK}" stroke-width="3"/>'
         f'<text x="150" y="86" font-family="Georgia" font-size="30" font-weight="bold" text-anchor="middle" fill="{INK}">THE WASTE</text>'
         f'<text x="150" y="124" font-family="Georgia" font-size="22" font-style="italic" text-anchor="middle" fill="{INK}">of</text>'
         f'<text x="150" y="166" font-family="Georgia" font-size="38" font-weight="bold" text-anchor="middle" fill="{INK}">DAYLIGHT</text>'
         f'<circle cx="150" cy="262" r="46" fill="#f4b942" stroke="{INK}" stroke-width="6"/>'
         + "".join(f'<path d="M{150 + 58 * math.cos(a * math.pi / 4):.0f},{262 + 58 * math.sin(a * math.pi / 4):.0f} L{150 + 76 * math.cos(a * math.pi / 4):.0f},{262 + 76 * math.sin(a * math.pi / 4):.0f}" stroke="{INK}" stroke-width="6"/>' for a in range(8))
         + f'<text x="150" y="372" font-family="Georgia" font-size="22" text-anchor="middle" fill="{INK}">W. WILLETT · 1907</text>')
    prop("bill", 300, 380, f'<rect width="300" height="380" fill="#ffffff" stroke="{INK}" stroke-width="8"/>'
         f'<text x="150" y="70" font-family="Georgia" font-size="26" font-weight="bold" text-anchor="middle" fill="{INK}">DAYLIGHT</text>'
         f'<text x="150" y="106" font-family="Georgia" font-size="26" font-weight="bold" text-anchor="middle" fill="{INK}">SAVING BILL</text>'
         + "".join(f'<path d="M40,{150 + k * 34} L260,{150 + k * 34}" stroke="#9a948c" stroke-width="6"/>' for k in range(6)))
    prop("report", 300, 380, f'<rect width="300" height="380" fill="#e9eef5" stroke="{INK}" stroke-width="8"/>'
         f'<text x="150" y="70" font-family="Georgia" font-size="24" font-weight="bold" text-anchor="middle" fill="{INK}">SELECT</text>'
         f'<text x="150" y="102" font-family="Georgia" font-size="24" font-weight="bold" text-anchor="middle" fill="{INK}">COMMITTEE</text>'
         f'<text x="150" y="142" font-family="Georgia" font-size="22" text-anchor="middle" fill="{INK}">1909</text>'
         + "".join(f'<path d="M40,{180 + k * 30} L260,{180 + k * 30}" stroke="#9a948c" stroke-width="6"/>' for k in range(6)))
    # calendars: a torn-off page per label
    def cal(name, top, big, sub="", circle=False, red=False):
        c = (f'<rect width="300" height="340" rx="10" fill="#ffffff" stroke="{INK}" stroke-width="8"/>'
             f'<rect width="300" height="86" rx="10" fill="{"#c4342a" if red else "#2f5d8a"}" stroke="{INK}" stroke-width="8"/>'
             f'<text x="150" y="60" font-family="Arial Black" font-size="40" text-anchor="middle" fill="#fff">{top}</text>'
             f'<text x="150" y="{230 if len(big) < 4 else 220}" font-family="Arial Black" font-size="{120 if len(big) < 4 else 92}" text-anchor="middle" fill="{INK}">{big}</text>')
        if sub:
            c += f'<text x="150" y="300" font-family="Georgia" font-size="30" font-weight="bold" text-anchor="middle" fill="{INK}">{sub}</text>'
        if circle:
            c += f'<ellipse cx="150" cy="190" rx="110" ry="80" fill="none" stroke="#c4342a" stroke-width="9"/>'
        prop(name, 300, 340, c)
    cal("cal-april", "APRIL", "SUN", "every Sunday", circle=True)
    cal("cal-sept", "SEPTEMBER", "↺", "wind them back")
    for y in range(1907, 1915):
        cal(f"cal-{y}", "YEAR", str(y))
    cal("cal-mar1915", "MARCH", "1915")
    cal("cal-apr1916", "APRIL 1916", "30", "", red=True)
    cal("cal-may1916", "MAY 1916", "21", "", red=True)
    cal("cal-nov2026", "NOVEMBER", "1", "Sunday", red=True)
    # flags
    prop("flag-de", 300, 200, f'<rect width="300" height="67" fill="#1d1d1d"/><rect y="67" width="300" height="66" fill="#ffffff"/><rect y="133" width="300" height="67" fill="#d22a2a"/><rect width="300" height="200" fill="none" stroke="{INK}" stroke-width="8"/>')
    prop("flag-uk", 300, 200, '<rect width="300" height="200" fill="#1f3f8a"/>'
         '<path d="M0,0 L300,200 M300,0 L0,200" stroke="#fff" stroke-width="40"/><path d="M0,0 L300,200 M300,0 L0,200" stroke="#c4342a" stroke-width="14"/>'
         '<path d="M150,0 L150,200 M0,100 L300,100" stroke="#fff" stroke-width="64"/><path d="M150,0 L150,200 M0,100 L300,100" stroke="#c4342a" stroke-width="36"/>'
         f'<rect width="300" height="200" fill="none" stroke="{INK}" stroke-width="8"/>')
    # windows
    blinds = "".join(f'<rect x="14" y="{14 + k * 20}" width="172" height="17" fill="#efe1c4" stroke="#b9a37c" stroke-width="2"/>' for k in range(13))
    prop("win-blinds", 200, 290, f'<rect width="200" height="290" fill="#6e4a30" stroke="{INK}" stroke-width="10"/>{blinds}<path d="M100,14 L100,276" stroke="#6e4a30" stroke-width="8"/>')
    prop("win-day", 200, 290, f'<rect width="200" height="290" fill="#6e4a30" stroke="{INK}" stroke-width="10"/><rect x="14" y="14" width="172" height="262" fill="#bfe6ff"/><path d="M100,14 L100,276 M14,145 L186,145" stroke="#6e4a30" stroke-width="8"/><circle cx="150" cy="70" r="24" fill="#ffe28a"/>')
    prop("win-night", 200, 290, f'<rect width="200" height="290" fill="#3b2a24" stroke="{INK}" stroke-width="10"/><rect x="14" y="14" width="172" height="262" fill="#1d2a4a"/><circle cx="140" cy="70" r="20" fill="#f5f0d0"/><path d="M100,14 L100,276 M14,145 L186,145" stroke="#3b2a24" stroke-width="8"/>')
    prop("win-lit", 200, 290, f'<rect width="200" height="290" fill="#6e4a30" stroke="{INK}" stroke-width="10"/><rect x="14" y="14" width="172" height="262" fill="#ffd36b"/><path d="M100,14 L100,276 M14,145 L186,145" stroke="#6e4a30" stroke-width="8"/>')
    prop("door", 160, 300, f'<rect width="160" height="300" rx="8" fill="#2f5d8a" stroke="{INK}" stroke-width="10"/><circle cx="130" cy="160" r="9" fill="#e8c35a"/><rect x="30" y="30" width="100" height="90" fill="none" stroke="{INK}" stroke-width="5"/>')
    prop("box-winter", 300, 200, f'<rect width="300" height="200" fill="#c99a5b" stroke="{INK}" stroke-width="10"/><rect x="60" y="62" width="180" height="76" fill="#fff" stroke="{INK}" stroke-width="5"/><text x="150" y="118" font-family="Arial Black" font-size="44" text-anchor="middle" fill="{INK}">WINTER</text>')
    prop("sign-coal", 300, 140, f'<rect width="300" height="140" fill="#f1e4c3" stroke="{INK}" stroke-width="10"/><text x="150" y="98" font-family="Arial Black" font-size="76" text-anchor="middle" fill="{INK}">KOHLE</text>')
    prop("phone", 200, 380, f'<rect width="200" height="380" rx="30" fill="#22202b"/><rect x="12" y="20" width="176" height="340" rx="20" fill="#2f5d8a"/>'
         f'<text x="100" y="140" font-family="Arial Black" font-size="62" text-anchor="middle" fill="#fff">1:59</text><text x="100" y="196" font-family="Arial Black" font-size="26" text-anchor="middle" fill="#cfe3ff">SUN · NOV 1</text>')
    prop("tumbleweed", 200, 200, f'<g fill="none" stroke="#8a6a3a" stroke-width="7"><circle cx="100" cy="100" r="80"/><path d="M30,80 Q100,20 170,90 Q120,170 40,130 Q60,60 140,50 Q170,140 70,160"/></g>')
    prop("zzz", 200, 200, f'<text x="40" y="150" font-family="Arial Black" font-size="110" fill="#fff" stroke="{INK}" stroke-width="10" paint-order="stroke">Z</text><text x="130" y="80" font-family="Arial Black" font-size="64" fill="#fff" stroke="{INK}" stroke-width="7" paint-order="stroke">z</text>')
    prop("pound-note", 300, 160, f'<rect width="300" height="160" rx="10" fill="#cfe3c4" stroke="{INK}" stroke-width="8"/><circle cx="150" cy="80" r="46" fill="#a8cf9a" stroke="{INK}" stroke-width="5"/><text x="150" y="104" font-family="Georgia" font-weight="bold" font-size="64" text-anchor="middle" fill="{INK}">£</text>')


def cast():
    W = dict(outfit="#7a5236", trim="#ffffff", tie="#2f5d8a", hat="bowler", hatc="#2b2b33", moustache=True)
    for e in ("neutral", "happy", "proud", "plead", "worried", "sad", "determined", "shock"):
        doodle("willett", e, **W)
    doodle("willett", "plead", "plead", **W)
    doodle("willett", "proud", "hold", prop="pamphlet", **W)
    doodle("willett", "happy", "hold", prop="pamphlet", **W)
    doodle("willett", "determined", "point", **W)
    doodle("willett", "happy", "arms_up", **W)
    doodle("willett", "happy", "stand", prop="trowel", tag="trowel", **W)
    doodle("willett", "worried", "think", **W)
    Wg = dict(W, grey=True)
    doodle("willett", "sad", "hold", prop="paper", tag="old-sad", **Wg)
    doodle("willett", "determined", "hold", prop="paper", tag="old-write", **Wg)
    doodle("willett", "sick", headonly=True, tag="sick-head", **dict(Wg, hat=None, hair="#9a948c"))
    for frame in (0, 1):
        horse("willett-horse", frame)
    # MPs
    for k, (o, h, hat) in enumerate([("#2b2b33", "#3a2b22", "tophat"), ("#33415c", "#8a6a3a", None), ("#3d2f2f", "#1d1d1d", None), ("#2b3b2f", "#c8b28a", "tophat")]):
        for e in ("bored", "yawn", "happy", "neutral", "sleep"):
            doodle(f"mp{k}", e, "sit", outfit=o, hair=h, hat=hat, hatc="#1d1d22", tie="#8a2f2f")
        doodle(f"mp{k}", "happy", "arms_up", outfit=o, hair=h, hat=hat, hatc="#1d1d22", tie="#8a2f2f")
        doodle(f"mp{k}", "neutral", "hold", prop="paper", outfit=o, hair=h, hat=hat, hatc="#1d1d22", tie="#8a2f2f")
        doodle(f"mp{k}", "determined", "think", prop="magnifier", outfit=o, hair=h, hat=hat, hatc="#1d1d22", tie="#8a2f2f")
    # sleepers (heads on pillows)
    doodle("sleeper0", "sleep", headonly=True, hat="nightcap", hatc="#6aa3d8", zz=True)
    doodle("sleeper1", "sleep", headonly=True, hair="long")
    # German workers / clerk, British clerk, kids, American
    for e in ("neutral", "worried", "happy", "determined"):
        doodle("worker", e, "shovel", outfit="#4d6b8a", trim=None, hat="cap", hatc="#3b3b44", prop="shovel")
    doodle("worker", "happy", "hold", prop="coal", outfit="#4d6b8a", trim=None, hat="cap", hatc="#3b3b44", tag="hug")
    doodle("worker2", "worried", "stand", outfit="#6b5a8a", trim=None, hat="cap", hatc="#2b2b33", sweat=True)
    for e in ("neutral", "smug", "happy", "determined"):
        doodle("clerk_de", e, "point", outfit="#3e4a3a", trim="#ffffff", tie="#1d1d1d", hat="peaked", hatc="#4b5a46", glasses=True)
    doodle("clerk_de", "smug", "hold", prop="watch", outfit="#3e4a3a", trim="#ffffff", tie="#1d1d1d", hat="peaked", hatc="#4b5a46", glasses=True)
    for e in ("neutral", "shock", "smug", "worried"):
        doodle("clerk_uk", e, "hold", prop="paper", outfit="#2b2b33", trim="#ffffff", tie="#c4342a", hat="bowler", hatc="#1d1d22")
    doodle("clerk_uk", "smug", "point", outfit="#2b2b33", trim="#ffffff", tie="#c4342a", hat="bowler", hatc="#1d1d22")
    for k, o in enumerate(["#e0573c", "#3c9be0", "#f0b43c"]):
        for e in ("happy", "laugh"):
            doodle(f"kid{k}", e, "arms_up", outfit=o, hair=["#3a2b22", "#8a5a32", "#1d1d1d"][k])
    for e in ("neutral", "happy", "smug", "sleep", "shock"):
        doodle("yank", e, "stand", outfit="#5aa0d8", stripes="#ffffff", trim=None, hair="#6b4a2e")
    doodle("yank", "happy", "hold", prop="pamphlet", outfit="#5aa0d8", stripes="#ffffff", trim=None, hair="#6b4a2e")
    doodle("yank", "smug", "point", outfit="#5aa0d8", stripes="#ffffff", trim=None, hair="#6b4a2e")


if __name__ == "__main__":
    import sys
    os.makedirs(CH, exist_ok=True)
    os.makedirs(PR, exist_ok=True)
    n = faces()
    if "faces" not in sys.argv[1:]:  # "faces" = the 3D cast only (kit v2); otherwise also the v1 doodle billboards
        cast()
    props()
    print(n, "face textures ·", len(os.listdir(CH)), "character svgs ·", len(os.listdir(PR)), "props")
