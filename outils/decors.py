#!/usr/bin/env python3
"""Décors cartoon de Jimee (V25), dessinés en SVG au trait d'encre.

Lancer depuis la racine du dépôt :  python3 outils/decors.py
Écrit decors/vaisseau.svg, hangar.svg, atelier.svg, marche.svg, carte.svg (1024 × 1536).

Les positions des éléments cliquables suivent les zones du code (index.html) :
vaisseau  -> data-hx/hy/hw/hh des boutons de #ecran-vaisseau
hangar    -> PIECES_HANGAR
Si on déplace un élément ici, mettre à jour les zones dans index.html (et inversement).
"""
import math, os, random

W, H = 1024, 1536
ENCRE = '#221B16'
# Palette (voir DIRECTION-ARTISTIQUE.md)
P = dict(papier='#F4E7C8', carte='#FFF7E4', creme='#FFFCF2', sable='#E8D3A8', sable2='#D9B98A',
         bois='#B9824F', bois2='#8E5B33', bois3='#6B4226', metal='#9DB3AC', metal2='#76918B', metal3='#56706B',
         laiton='#D9A441', laiton2='#B07F25', rouge='#D63A2F', rouge2='#A92A22', moutarde='#E9A93A',
         nuit='#1F2A45', nuit2='#2B3F66', ciel='#3C5C8C', vert='#5E9E4A', vert2='#3F7A35', sarcelle='#2F8F8B',
         violet='#8A5AA8', bleu='#3F7CB8', bleu2='#2C5A8C', orange='#E07B2A', rose='#E8A6A0')

T = 7  # épaisseur du trait standard


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def pts(liste):
    return ' '.join(f'{f(x)},{f(y)}' for x, y in liste)


class Dessin:
    def __init__(self, graine):
        self.p = []
        self.r = random.Random(graine)

    def add(self, s):
        self.p.append(s)

    # formes de base, toutes cerclées d'encre
    def poly(self, liste, fill, sw=T, extra=''):
        self.add(f'<polygon points="{pts(liste)}" fill="{fill}" stroke="{ENCRE}" stroke-width="{sw}" stroke-linejoin="round" {extra}/>')

    def path(self, d, fill='none', sw=T, extra=''):
        self.add(f'<path d="{d}" fill="{fill}" stroke="{ENCRE}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round" {extra}/>')

    def rect(self, x, y, w, h, fill, r=10, sw=T, extra=''):
        self.add(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{fill}" stroke="{ENCRE}" stroke-width="{sw}" stroke-linejoin="round" {extra}/>')

    def cercle(self, cx, cy, r, fill, sw=T, extra=''):
        self.add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}" stroke="{ENCRE}" stroke-width="{sw}" {extra}/>')

    def ellipse(self, cx, cy, rx, ry, fill, sw=T, extra=''):
        self.add(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="{fill}" stroke="{ENCRE}" stroke-width="{sw}" {extra}/>')

    def ligne(self, x1, y1, x2, y2, sw=T, coul=ENCRE, extra=''):
        self.add(f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{coul}" stroke-width="{sw}" stroke-linecap="round" {extra}/>')

    # ombre / reflet plats (sans trait)
    def ombre(self, liste, op=.16):
        self.add(f'<polygon points="{pts(liste)}" fill="{ENCRE}" opacity="{op}"/>')

    def ombre_d(self, d, op=.16):
        self.add(f'<path d="{d}" fill="{ENCRE}" opacity="{op}"/>')

    def reflet_d(self, d, op=.55):
        self.add(f'<path d="{d}" fill="{P["creme"]}" opacity="{op}"/>')

    # petits motifs récurrents
    def rivets(self, liste, r=5):
        for x, y in liste:
            self.add(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="{ENCRE}" opacity=".55"/>')

    def etoile4(self, cx, cy, r, fill=None, sw=0):
        fill = fill or P['creme']
        d = f'M{f(cx)} {f(cy-r)} Q{f(cx+r*.18)} {f(cy-r*.18)} {f(cx+r)} {f(cy)} Q{f(cx+r*.18)} {f(cy+r*.18)} {f(cx)} {f(cy+r)} Q{f(cx-r*.18)} {f(cy+r*.18)} {f(cx-r)} {f(cy)} Q{f(cx-r*.18)} {f(cy-r*.18)} {f(cx)} {f(cy-r)}Z'
        if sw:
            self.path(d, fill, sw)
        else:
            self.add(f'<path d="{d}" fill="{fill}"/>')

    def plante(self, x, y, s=1.0):
        """Pot de terre cuite avec feuilles rondes, posé en (x, y) = milieu du bas du pot."""
        w, h = 46 * s, 40 * s
        for a, l in [(-60, 52), (-25, 62), (5, 66), (35, 58), (70, 48), (-90, 40), (100, 38)]:
            ang = math.radians(a - 90)
            ex, ey = x + math.cos(ang) * l * s, y - h + math.sin(ang) * l * s
            self.path(f'M{f(x)} {f(y-h)} Q{f((x+ex)/2 - 10*s)} {f((y-h+ey)/2)} {f(ex)} {f(ey)} Q{f((x+ex)/2 + 12*s)} {f((y-h+ey)/2 + 6*s)} {f(x)} {f(y-h)}Z',
                      P['vert'] if a % 2 else P['vert2'], sw=4.5 * s)
        self.poly([(x - w / 2, y - h), (x + w / 2, y - h), (x + w * .36, y), (x - w * .36, y)], P['orange'], sw=5 * s)
        self.rect(x - w / 2 - 4 * s, y - h - 8 * s, w + 8 * s, 12 * s, P['orange'], r=4 * s, sw=5 * s)

    def caisse(self, x, y, w, h, fill=None, sw=6):
        fill = fill or P['bois']
        self.rect(x, y, w, h, fill, r=6, sw=sw)
        self.path(f'M{f(x+8)} {f(y+8)} L{f(x+w-8)} {f(y+h-8)} M{f(x+w-8)} {f(y+8)} L{f(x+8)} {f(y+h-8)}', sw=sw * .7)
        self.ombre([(x + w * .7, y + 4), (x + w - 4, y + 4), (x + w - 4, y + h - 4), (x + w * .7, y + h - 4)], .14)

    def ampoule(self, x, y, fil=60, s=1.0):
        self.ligne(x, y - fil, x, y - 14 * s, sw=4)
        self.rect(x - 10 * s, y - 18 * s, 20 * s, 14 * s, P['laiton'], r=3, sw=4.5)
        self.add(f'<circle cx="{f(x)}" cy="{f(y+8*s)}" r="{f(34*s)}" fill="{P["moutarde"]}" opacity=".22"/>')
        self.cercle(x, y + 8 * s, 15 * s, '#FBE6A6', sw=4.5)
        self.reflet_d(f'M{f(x-7*s)} {f(y+2*s)} q4 -6 9 -5', .9)

    def svg(self, filtre=True, fond=None):
        fond = fond or P['papier']
        defs = ''
        if filtre:
            # Trait « à la main » : léger tremblement de tout le dessin
            defs = ('<defs><filter id="main" x="-2%" y="-2%" width="104%" height="104%">'
                    '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/>'
                    '<feDisplacementMap in="SourceGraphic" scale="5"/></filter></defs>')
        corps = '\n'.join(self.p)
        g = f'<g filter="url(#main)">{corps}</g>' if filtre else corps
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
                f'{defs}<rect width="{W}" height="{H}" fill="{fond}"/>{g}</svg>')


def lerp(a, b, t):
    return a + (b - a) * t


# =====================================================================
#  VAISSEAU : couloir de fusée vu depuis l'entrée, cockpit au fond
# =====================================================================
def vaisseau():
    d = Dessin('vaisseau')
    # cadre avant (hors image) et cadre du fond (ouverture du cockpit)
    AV = (-140, -120, W + 140, H + 260)          # x0, y0, x1, y1
    FD = (372, 436, 652, 772)
    cad = lambda t: tuple(lerp(a, b, t) for a, b in zip(AV, FD))
    x0, y0, x1, y1 = AV
    bx0, by0, bx1, by1 = FD
    # plafond, murs, sol
    d.poly([(x0, y0), (x1, y0), (bx1, by0), (bx0, by0)], P['sable2'], sw=0)
    d.poly([(x0, y0), (bx0, by0), (bx0, by1), (x0, y1)], P['sable'], sw=0)
    d.poly([(x1, y0), (bx1, by0), (bx1, by1), (x1, y1)], P['sable'], sw=0)
    d.poly([(x0, y1), (x1, y1), (bx1, by1), (bx0, by1)], P['bois'], sw=0)
    # ombre douce sur le mur de droite (lumière qui vient de gauche) et au plafond
    d.ombre([(x1, y0), (bx1, by0), (bx1, by1), (x1, y1)], .10)
    d.ombre([(x0, y0), (x1, y0), (bx1, by0), (bx0, by0)], .08)
    # lattes du sol (fuyantes) + joints transversaux
    for i in range(-6, 7):
        xa = W / 2 + i * 190
        xb = (bx0 + bx1) / 2 + i * (bx1 - bx0) / 12
        d.ligne(xa, y1, xb, by1, sw=4, extra='opacity=".45"')
    for t in [.12, .3, .46, .6, .72, .82, .9]:
        c = cad(t)
        d.ligne(c[0], c[3], c[2], c[3], sw=3.5, extra='opacity=".35"')
    # tapis rouge central
    tp = [(W/2 - 250, y1), (W/2 + 250, y1), (W/2 + 78, by1 + 4), (W/2 - 78, by1 + 4)]
    d.poly(tp, P['rouge2'], sw=6)
    d.poly([(W/2 - 212, y1), (W/2 - 196, y1), (W/2 - 66, by1 + 4), (W/2 - 70, by1 + 4)], P['moutarde'], sw=0)
    d.poly([(W/2 + 196, y1), (W/2 + 212, y1), (W/2 + 70, by1 + 4), (W/2 + 66, by1 + 4)], P['moutarde'], sw=0)
    for t in [.2, .42, .6, .74, .85]:
        yy = lerp(y1, by1, t); demi = lerp(250, 78, t) * .55; hh = lerp(70, 14, t)
        d.add(f'<polygon points="{pts([(W/2, yy-hh), (W/2+demi*.35, yy), (W/2, yy+hh), (W/2-demi*.35, yy)])}" fill="{P["moutarde"]}" opacity=".55"/>')
    # arêtes du couloir
    for (ax, ay), (bxx, byy) in [((x0, y0), (bx0, by0)), ((x1, y0), (bx1, by0)), ((x0, y1), (bx0, by1)), ((x1, y1), (bx1, by1))]:
        d.ligne(ax, ay, bxx, byy, sw=6)
    # tuyaux le long du plafond (gauche et droite)
    for cote in (0, 1):
        for k, (dec, coul) in enumerate([(26, P['laiton']), (58, P['metal'])]):
            if cote == 0:
                a, b = (x0, y0 + 160 + dec * 1.6), (bx0, by0 + dec * .28)
            else:
                a, b = (x1, y0 + 160 + dec * 1.6), (bx1, by0 + dec * .28)
            d.add(f'<line x1="{f(a[0])}" y1="{f(a[1])}" x2="{f(b[0])}" y2="{f(b[1])}" stroke="{ENCRE}" stroke-width="{26 - k*4}" stroke-linecap="round"/>')
            d.add(f'<line x1="{f(a[0])}" y1="{f(a[1])}" x2="{f(b[0])}" y2="{f(b[1])}" stroke="{coul}" stroke-width="{14 - k*4}" stroke-linecap="round"/>')
    # côtes (arches rivetées) du fuselage
    for t in [.0, .2, .38, .54, .68, .8, .9]:
        cx0, cy0, cx1, cy1 = cad(t)
        e = lerp(56, 14, t)
        r = lerp(220, 60, t)
        dd = (f'M{f(cx0)} {f(cy1)} L{f(cx0)} {f(cy0 + r)} Q{f(cx0)} {f(cy0)} {f(cx0 + r)} {f(cy0)} '
              f'L{f(cx1 - r)} {f(cy0)} Q{f(cx1)} {f(cy0)} {f(cx1)} {f(cy0 + r)} L{f(cx1)} {f(cy1)} '
              f'L{f(cx1 - e)} {f(cy1)} L{f(cx1 - e)} {f(cy0 + r)} Q{f(cx1 - e)} {f(cy0 + e)} {f(cx1 - r)} {f(cy0 + e)} '
              f'L{f(cx0 + r)} {f(cy0 + e)} Q{f(cx0 + e)} {f(cy0 + e)} {f(cx0 + e)} {f(cy0 + r)} L{f(cx0 + e)} {f(cy1)} Z')
        d.path(dd, P['metal2'], sw=lerp(8, 4, t))
        n = 9
        for k in range(1, n):
            xx = lerp(cx0 + r, cx1 - r, k / n)
            d.rivets([(xx, cy0 + e / 2)], r=lerp(6, 2.5, t))
        # ampoule suspendue au milieu de la côte
        if 0 < t < .85:
            d.ampoule((cx0 + cx1) / 2, cy0 + e + lerp(70, 18, t), fil=lerp(70, 18, t), s=lerp(2.1, .7, t))

    # ---------- fond : cockpit (zone x 37-61 %, y 29-49 %) ----------
    d.rect(bx0, by0, bx1 - bx0, by1 - by0, P['sable2'], r=30, sw=7)
    # hublot
    hx, hy, hr = 512, 566, 104
    d.cercle(hx, hy, hr + 22, P['laiton'], sw=7)
    d.add(f'<clipPath id="hub"><circle cx="{hx}" cy="{hy}" r="{hr}"/></clipPath>')
    d.add(f'<g clip-path="url(#hub)"><rect x="{hx-hr}" y="{hy-hr}" width="{2*hr}" height="{2*hr}" fill="{P["nuit2"]}"/>'
          f'<circle cx="{hx+60}" cy="{hy+70}" r="88" fill="{P["orange"]}" stroke="{ENCRE}" stroke-width="6"/>'
          f'<path d="M{hx-30} {hy+80} q80 -40 170 -10" fill="none" stroke="{ENCRE}" stroke-width="5" opacity=".5"/>'
          f'<circle cx="{hx-50}" cy="{hy-40}" r="3" fill="{P["creme"]}"/><circle cx="{hx+20}" cy="{hy-70}" r="2.5" fill="{P["creme"]}"/>'
          f'<circle cx="{hx-75}" cy="{hy+20}" r="2" fill="{P["creme"]}"/><circle cx="{hx+70}" cy="{hy-20}" r="2" fill="{P["creme"]}"/></g>')
    d.etoile4(hx - 20, hy - 30, 11)
    d.cercle(hx, hy, hr, 'none', sw=7)
    d.reflet_d(f'M{hx-70} {hy-40} q20 -45 70 -58 q-40 25 -58 70z', .35)
    d.rivets([(hx + math.cos(a) * (hr + 11), hy + math.sin(a) * (hr + 11)) for a in [i * math.pi / 6 for i in range(12)]], r=4)
    # pupitre de commande
    d.path(f'M{bx0+18} 772 L{bx0+40} 690 L{bx1-40} 690 L{bx1-18} 772 Z', P['metal'], sw=6)
    for i, cx in enumerate([430, 470, 554, 594]):
        d.cercle(cx, 722, 14, P['creme'], sw=4.5)
        a = math.radians(-120 + i * 50)
        d.ligne(cx, 722, cx + math.cos(a) * 10, 722 + math.sin(a) * 10, sw=3, coul=P['rouge'])
    for i, cx in enumerate([420, 444, 580, 604]):
        d.cercle(cx, 752, 6, [P['rouge'], P['vert'], P['moutarde'], P['bleu']][i], sw=3.5)
    # fauteuil du pilote (de dos)
    d.path('M462 772 L462 660 Q462 618 512 618 Q562 618 562 660 L562 772 Z', P['rouge'], sw=6)
    d.path('M478 760 L478 664 Q478 636 512 636 Q546 636 546 664 L546 760', 'none', sw=4, extra='opacity=".5"')
    d.ombre_d('M530 640 Q562 646 562 668 L562 772 L530 772 Z', .18)

    # ---------- mur gauche : étagères avec plantes et caisses ----------
    for (ya, yb) in [(258, 300), (420, 448)]:
        d.poly([(-10, ya + 40), (150, ya + 8), (150, ya + 30), (-10, yb + 50)], P['bois'], sw=6)
    d.plante(60, 300, 1.1)
    d.caisse(96, 238, 48, 44, sw=5)
    d.plante(118, 432, .9)
    d.caisse(10, 400, 70, 60, P['moutarde'], sw=5)

    # ---------- armoire / armurerie (x 16-35 %, y 27-47 %) ----------
    ax0, ax1 = 176, 352
    d.poly([(ax0, 404), (ax1, 432), (ax1, 712), (ax0, 736)], P['metal'], sw=7)
    d.poly([(ax0 + 18, 432), (ax1 - 16, 454), (ax1 - 16, 694), (ax0 + 18, 712)], P['metal3'], sw=5)
    # fond de l'armoire plus sombre (profondeur) et parois intérieures
    d.poly([(ax0 + 40, 452), (ax1 - 36, 470), (ax1 - 36, 680), (ax0 + 40, 694)], '#3E524E', sw=0)
    d.ligne(ax0 + 18, 432, ax0 + 40, 452, sw=4); d.ligne(ax1 - 16, 454, ax1 - 36, 470, sw=4)
    d.ligne(ax0 + 18, 712, ax0 + 40, 694, sw=4); d.ligne(ax1 - 16, 694, ax1 - 36, 680, sw=4)
    # étagère haute avec le casque
    d.poly([(ax0 + 18, 500), (ax1 - 16, 516), (ax1 - 16, 526), (ax0 + 18, 512)], P['bois'], sw=4.5)
    d.cercle(234, 474, 28, P['creme'], sw=5)
    d.ellipse(240, 476, 17, 14, P['ciel'], sw=4)
    d.reflet_d('M230 468 q5 -8 13 -7 q-7 4 -8 10z', .8)
    d.rect(276, 488, 46, 22, P['moutarde'], r=5, sw=4.5)
    # tringle, cintre et combinaison suspendue
    d.ligne(ax0 + 30, 548, ax1 - 28, 560, sw=5)
    d.path('M270 552 q0 -14 10 -14 q10 0 10 10 M246 576 L280 558 L314 576', sw=4.5)
    d.path('M240 576 Q280 566 320 578 L322 600 L306 604 L310 676 L286 678 L282 630 L276 678 L252 676 L256 604 L238 600 Z', P['creme'], sw=5)
    d.rect(256, 616, 54, 10, P['moutarde'], r=4, sw=4)
    d.ligne(281, 580, 281, 612, sw=3.5)
    d.ombre([(300, 580), (320, 580), (322, 600), (306, 604), (310, 676), (296, 676)], .14)
    # porte ouverte (vers la gauche) avec hublot
    d.poly([(ax0, 404), (ax0 - 70, 384), (ax0 - 70, 756), (ax0, 736)], P['metal2'], sw=7)
    d.cercle(ax0 - 36, 470, 18, P['ciel'], sw=4.5)
    d.rect(ax0 - 18, 560, 10, 46, P['laiton'], r=4, sw=4)
    d.rivets([(ax0 - 58, 420), (ax0 - 58, 700), (ax0 - 12, 430), (ax0 - 12, 712)], r=4)
    d.rivets([(ax0 + 10, 418), (ax1 - 8, 444), (ax0 + 10, 724), (ax1 - 8, 702)], r=4)
    # chapeau de l'armoire
    d.poly([(ax0 - 8, 392), (ax1 + 8, 420), (ax1 + 8, 436), (ax0 - 8, 410)], P['metal2'], sw=6)

    # ---------- banquette VIDE (x 5-31 %, y 47-61 %) : le jeu y dessine le Jimee ----------
    # dossier
    d.path('M30 780 Q30 742 70 742 L292 742 Q330 742 330 780 L330 880 L30 880 Z', P['sarcelle'], sw=7)
    for x in (108, 184, 258):
        d.ligne(x, 760, x, 870, sw=4, extra='opacity=".45"')
    d.rivets([(70, 812), (146, 812), (222, 812), (296, 812)], r=5)
    # assise et accoudoir
    d.path('M10 872 L340 872 Q356 872 356 890 L356 930 L10 930 Z', P['sarcelle'], sw=7)
    d.path('M0 820 Q0 796 24 796 L48 796 Q66 796 66 820 L66 950 L0 950 Z', P['sarcelle'], sw=7)
    d.ombre([(10, 912), (356, 912), (356, 930), (10, 930)], .2)
    d.path('M20 930 L20 968 M340 930 L340 968', sw=10)
    # coussin
    d.path('M262 806 Q300 800 314 830 Q318 862 288 868 Q252 872 246 842 Q240 812 262 806 Z', P['moutarde'], sw=5)
    # table basse et tasse
    d.ellipse(220, 1000, 112, 26, P['bois'], sw=6)
    d.path('M140 1012 L132 1072 M300 1012 L308 1072 M220 1026 L220 1080', sw=9)
    d.rect(196, 950, 40, 44, P['creme'], r=6, sw=5)
    d.path('M236 960 q20 0 20 16 q0 14 -20 14', sw=5)
    d.path('M208 938 q-8 -14 4 -24 M224 936 q8 -14 -2 -26', sw=3.5, extra='opacity=".6"')
    d.rect(130, 978, 52, 10, P['rouge'], r=3, sw=4)

    # ---------- planétaire / carte stellaire (x 60-78 %, y 32-50 %) ----------
    ox, oy = 706, 600
    d.path(f'M{ox-50} 772 L{ox+50} 772 L{ox+28} 744 L{ox-28} 744 Z', P['bois2'], sw=6)
    d.rect(ox - 9, 640, 18, 106, P['laiton'], r=6, sw=5)
    d.ellipse(ox, oy, 92, 30, 'none', sw=5, extra=f'transform="rotate(-12 {ox} {oy})"')
    d.ellipse(ox, oy, 62, 20, 'none', sw=4, extra=f'transform="rotate(18 {ox} {oy})"')
    d.add(f'<ellipse cx="{ox}" cy="{oy}" rx="92" ry="30" fill="none" stroke="{P["laiton"]}" stroke-width="2.5" transform="rotate(-12 {ox} {oy})"/>')
    d.cercle(ox, oy, 36, P['moutarde'], sw=6)
    d.reflet_d(f'M{ox-20} {oy-14} q8 -14 24 -14 q-14 6 -18 20z', .8)
    for (px, py, pr, pc) in [(ox + 88, oy - 26, 15, P['bleu']), (ox - 84, oy + 22, 12, P['vert']), (ox + 40, oy + 26, 9, P['rouge']), (ox - 40, oy - 30, 10, P['violet'])]:
        d.ligne(ox, oy, px, py, sw=3)
        d.cercle(px, py, pr, pc, sw=4.5)
    d.etoile4(ox + 76, oy - 74, 12, P['moutarde'], sw=3)
    d.etoile4(ox - 70, oy - 58, 8, P['creme'], sw=2.5)

    # ---------- guichet de la Jimee's Corp (x 78-94 %, y 31-50 %) ----------
    gx0, gx1 = 806, 962
    d.rect(gx0 + 8, 520, gx1 - gx0 - 16, 140, P['sable'], r=6, sw=6)
    d.rect(gx0 + 26, 540, gx1 - gx0 - 52, 80, P['ciel'], r=8, sw=5)
    d.reflet_d(f'M{gx0+36} 548 l40 0 l-30 60 l-14 0z', .3)
    d.ligne(gx0 + 14, 520, gx0 + 14, 660, sw=10)
    d.ligne(gx1 - 14, 520, gx1 - 14, 660, sw=10)
    # auvent rayé
    bandes = 6
    for k in range(bandes):
        xa, xb = lerp(gx0 - 8, gx1 + 8, k / bandes), lerp(gx0 - 8, gx1 + 8, (k + 1) / bandes)
        d.poly([(xa + 10, 470), (xb + 10, 470), (xb, 526), (xa, 526)], P['rouge'] if k % 2 == 0 else P['creme'], sw=5)
    for k in range(bandes):
        xa, xb = lerp(gx0 - 8, gx1 + 8, k / bandes), lerp(gx0 - 8, gx1 + 8, (k + 1) / bandes)
        d.path(f'M{f(xa)} 526 Q{f((xa+xb)/2)} 552 {f(xb)} 526', P['rouge'] if k % 2 == 0 else P['creme'], sw=5)
    # médaillon de la Corp (rond rouge avec une tête de Jimee stylisée)
    d.cercle(884, 456, 22, P['rouge'], sw=5)
    d.ellipse(884, 455, 12, 10, P['creme'], sw=3.5)
    d.ellipse(880, 455, 4, 3, ENCRE, sw=0)
    d.ellipse(889, 453, 4.5, 3.5, ENCRE, sw=0)
    # comptoir
    d.rect(gx0 - 6, 652, gx1 - gx0 + 12, 30, P['bois'], r=6, sw=6)
    d.poly([(gx0, 682), (gx1, 682), (gx1 - 6, 770), (gx0 + 6, 770)], P['bois2'], sw=6)
    for x in (840, 884, 928):
        d.ligne(x, 694, x, 760, sw=3.5, extra='opacity=".4"')
    # sonnette et formulaires
    d.path('M842 652 Q842 624 862 624 Q882 624 882 652 Z', P['laiton'], sw=5)
    d.rect(856, 614, 12, 10, P['laiton'], r=3, sw=4)
    d.rect(896, 630, 46, 22, P['creme'], r=3, sw=4.5)
    d.rect(900, 620, 46, 12, P['creme'], r=3, sw=4.5)

    # ---------- mur droit : étagère haute, plantes, caisses, compteur ----------
    d.poly([(840, 300), (1040, 262), (1040, 288), (840, 324)], P['bois'], sw=6)
    d.plante(904, 300, 1.0)
    d.caisse(950, 230, 60, 52, P['moutarde'], sw=5)
    d.plante(1000, 920, 1.4)
    d.caisse(830, 800, 120, 96, sw=6)
    d.caisse(860, 712, 70, 88, P['sarcelle'], sw=6)
    d.cercle(980, 640, 38, P['creme'], sw=6)
    d.ligne(980, 640, 1000, 620, sw=5, coul=P['rouge'])
    d.rivets([(980, 610), (1008, 640), (980, 670), (952, 640)], r=3)

    # ---------- avant-plan : côte la plus proche, en bas les côtés ----------
    # (le bas de l'image reste libre : le jeu y pose Hangar / Atelier / Commerce)
    d.path('M0 1536 L0 1100 Q0 1060 40 1060 L70 1060 L70 1536 Z', P['metal2'], sw=8)
    d.path('M1024 1536 L1024 1100 Q1024 1060 984 1060 L954 1060 L954 1536 Z', P['metal2'], sw=8)
    d.rivets([(36, 1120), (36, 1220), (36, 1320), (36, 1420), (988, 1120), (988, 1220), (988, 1320), (988, 1420)], r=6)
    return d.svg()


# Petite fusée de profil (pointe en haut), réutilisée par le hangar et le marché
def fusee(d, cx, haut, h, corps=None, sw=T):
    corps = corps or P['creme']
    w = h * .36
    bas = haut + h
    # ailerons
    d.path(f'M{f(cx-w*.5)} {f(bas-h*.32)} Q{f(cx-w*1.1)} {f(bas-h*.12)} {f(cx-w*1.05)} {f(bas+h*.06)} L{f(cx-w*.45)} {f(bas-h*.06)} Z', P['rouge'], sw=sw)
    d.path(f'M{f(cx+w*.5)} {f(bas-h*.32)} Q{f(cx+w*1.1)} {f(bas-h*.12)} {f(cx+w*1.05)} {f(bas+h*.06)} L{f(cx+w*.45)} {f(bas-h*.06)} Z', P['rouge'], sw=sw)
    # flamme éteinte : tuyère
    d.path(f'M{f(cx-w*.28)} {f(bas-h*.04)} L{f(cx+w*.28)} {f(bas-h*.04)} L{f(cx+w*.36)} {f(bas+h*.06)} L{f(cx-w*.36)} {f(bas+h*.06)} Z', P['metal2'], sw=sw*.8)
    # fuselage en obus
    d.path(f'M{f(cx)} {f(haut)} C{f(cx+w*.75)} {f(haut+h*.18)} {f(cx+w*.55)} {f(bas-h*.2)} {f(cx+w*.42)} {f(bas-h*.04)} '
           f'L{f(cx-w*.42)} {f(bas-h*.04)} C{f(cx-w*.55)} {f(bas-h*.2)} {f(cx-w*.75)} {f(haut+h*.18)} {f(cx)} {f(haut)} Z', corps, sw=sw)
    # pointe rouge
    d.path(f'M{f(cx)} {f(haut)} C{f(cx+w*.42)} {f(haut+h*.1)} {f(cx+w*.5)} {f(haut+h*.2)} {f(cx+w*.52)} {f(haut+h*.24)} '
           f'Q{f(cx)} {f(haut+h*.3)} {f(cx-w*.52)} {f(haut+h*.24)} C{f(cx-w*.5)} {f(haut+h*.2)} {f(cx-w*.42)} {f(haut+h*.1)} {f(cx)} {f(haut)} Z', P['rouge'], sw=sw)
    # hublot
    d.cercle(cx, haut + h * .44, w * .22, P['laiton'], sw=sw * .8)
    d.cercle(cx, haut + h * .44, w * .14, P['ciel'], sw=sw * .6)
    d.reflet_d(f'M{f(cx-w*.08)} {f(haut+h*.42)} q{f(w*.04)} {f(-w*.08)} {f(w*.1)} {f(-w*.06)}', .9)
    # bande et ombre
    d.ligne(cx - w * .5, haut + h * .7, cx + w * .5, haut + h * .7, sw=sw * .8)
    d.ombre_d(f'M{f(cx+w*.12)} {f(haut+h*.08)} C{f(cx+w*.6)} {f(haut+h*.25)} {f(cx+w*.5)} {f(bas-h*.2)} {f(cx+w*.4)} {f(bas-h*.06)} L{f(cx+w*.2)} {f(bas-h*.06)} Z', .12)


# =====================================================================
#  HANGAR : plan cyanotype au mur, fusée garée en bas
#  Encadrés aux positions de PIECES_HANGAR (index.html)
# =====================================================================
PIECES = {  # x, y, w, h en % de l'image (copie de PIECES_HANGAR)
    'reacteur': (67.9, 27.9, 13.9, 6.8), 'scanner': (66.1, 19.9, 13.5, 6.1), 'reservoir': (20, 34.3, 12.7, 6.9),
    'soute': (22, 19.9, 14.4, 5.9), 'coque': (67.2, 36.3, 14.4, 6.2)}


def hangar():
    d = Dessin('hangar')
    # mur de planches
    d.rect(-20, -20, W + 40, 760, P['bois'], r=0, sw=0)
    for i in range(0, W, 86):
        d.ligne(i, -10, i, 740, sw=4, extra='opacity=".4"')
        for y in (120 + (i * 37) % 200, 520 + (i * 53) % 150):
            d.cercle(i + 43, y, 3.5, ENCRE, sw=0, extra='opacity=".4"')
    d.ombre([(0, 0), (W, 0), (W, 90), (0, 90)], .12)
    # poutres et lampes d'atelier
    d.rect(-20, 70, W + 40, 50, P['bois2'], r=0, sw=7)
    for x in (110, 512, 914):
        d.ligne(x, 120, x, 176, sw=5)
        d.add(f'<ellipse cx="{x}" cy="230" rx="140" ry="60" fill="{P["moutarde"]}" opacity=".16"/>')
        d.path(f'M{x-56} 214 Q{x-50} 172 {x} 172 Q{x+50} 172 {x+56} 214 Z', P['vert2'], sw=6)
        d.ellipse(x, 214, 56, 10, P['vert2'], sw=6)
        d.ellipse(x, 220, 20, 10, '#FBE6A6', sw=4.5)
    # grand plan cyanotype (zone x 19-83 %, y 19-43 %)
    X0, Y0, X1, Y1 = 186, 268, 858, 682
    d.ombre([(X0 + 12, Y0 + 14), (X1 + 12, Y0 + 14), (X1 + 12, Y1 + 14), (X0 + 12, Y1 + 14)], .25)
    d.rect(X0, Y0, X1 - X0, Y1 - Y0, P['bleu2'], r=4, sw=7)
    # quadrillage du plan
    for x in range(X0 + 32, X1, 32):
        d.ligne(x, Y0 + 6, x, Y1 - 6, sw=1.4, coul=P['creme'], extra='opacity=".18"')
    for y in range(Y0 + 32, Y1, 32):
        d.ligne(X0 + 6, y, X1 - 6, y, sw=1.4, coul=P['creme'], extra='opacity=".18"')
    # coins cornés et punaises
    for (px, py) in [(X0 + 16, Y0 + 16), (X1 - 16, Y0 + 16), (X0 + 16, Y1 - 16), (X1 - 16, Y1 - 16)]:
        d.cercle(px, py, 10, P['rouge'], sw=4)
    # fusée au trait crème au centre du plan
    cx, haut, hh = 522, 300, 340
    w = hh * .36
    C = P['creme']
    lignes = [
        f'M{cx} {haut} C{cx+w*.75} {haut+hh*.18} {cx+w*.55} {haut+hh*.8} {cx+w*.42} {haut+hh*.96} L{cx-w*.42} {haut+hh*.96} C{cx-w*.55} {haut+hh*.8} {cx-w*.75} {haut+hh*.18} {cx} {haut} Z',
        f'M{cx-w*.5} {haut+hh*.68} Q{cx-w*1.1} {haut+hh*.88} {cx-w*1.05} {haut+hh*1.06} L{cx-w*.45} {haut+hh*.94}',
        f'M{cx+w*.5} {haut+hh*.68} Q{cx+w*1.1} {haut+hh*.88} {cx+w*1.05} {haut+hh*1.06} L{cx+w*.45} {haut+hh*.94}',
        f'M{cx-w*.52} {haut+hh*.24} Q{cx} {haut+hh*.3} {cx+w*.52} {haut+hh*.24}',
        f'M{cx-w*.5} {haut+hh*.7} L{cx+w*.5} {haut+hh*.7}',
        f'M{cx-w*.28} {haut+hh*.96} L{cx-w*.36} {haut+hh*1.06} L{cx+w*.36} {haut+hh*1.06} L{cx+w*.28} {haut+hh*.96}']
    for l in lignes:
        d.add(f'<path d="{l}" fill="none" stroke="{C}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>')
    d.add(f'<circle cx="{cx}" cy="{haut+hh*.44}" r="{w*.2}" fill="none" stroke="{C}" stroke-width="4"/>')
    # cotes pointillées
    d.add(f'<path d="M{cx-w*1.3} {haut} L{cx-w*1.3} {haut+hh*1.06}" stroke="{C}" stroke-width="2.5" stroke-dasharray="8 6" opacity=".7"/>')
    # encadrés des pièces (aux positions du jeu) + traits vers la fusée
    ancres = {'soute': (cx - w * .3, haut + hh * .55), 'scanner': (cx + w * .1, haut + hh * .05), 'reservoir': (cx - w * .4, haut + hh * .8),
              'reacteur': (cx + w * .3, haut + hh * .98), 'coque': (cx + w * .45, haut + hh * .6)}
    for nom, (px, py, pw, ph) in PIECES.items():
        x, y, ww, hh2 = px / 100 * W, py / 100 * H, pw / 100 * W, ph / 100 * H
        mx, my = x + ww / 2, y + hh2 / 2
        ax, ay = ancres[nom]
        bord_x = x + ww if mx < cx else x
        d.add(f'<path d="M{f(bord_x)} {f(my)} L{f(ax)} {f(ay)}" stroke="{C}" stroke-width="3" fill="none"/>')
        d.add(f'<circle cx="{f(ax)}" cy="{f(ay)}" r="6" fill="{C}"/>')
        d.add(f'<rect x="{f(x)}" y="{f(y)}" width="{f(ww)}" height="{f(hh2)}" rx="10" fill="{P["bleu"]}" stroke="{C}" stroke-width="4"/>')
        s = min(ww, hh2) * .34
        if nom == 'soute':
            d.add(f'<rect x="{f(mx-s)}" y="{f(my-s*.8)}" width="{f(2*s)}" height="{f(1.6*s)}" rx="4" fill="none" stroke="{C}" stroke-width="3.5"/>'
                  f'<path d="M{f(mx-s)} {f(my-s*.8)} L{f(mx+s)} {f(my+s*.8)} M{f(mx+s)} {f(my-s*.8)} L{f(mx-s)} {f(my+s*.8)}" stroke="{C}" stroke-width="3"/>')
        elif nom == 'scanner':
            d.add(f'<path d="M{f(mx-s)} {f(my-s*.4)} Q{f(mx)} {f(my+s*1.1)} {f(mx+s)} {f(my-s*.4)} Z" fill="none" stroke="{C}" stroke-width="3.5"/>'
                  f'<path d="M{f(mx)} {f(my+s*.4)} L{f(mx)} {f(my+s)} M{f(mx)} {f(my)} L{f(mx+s*.5)} {f(my-s*.9)}" stroke="{C}" stroke-width="3.5"/>'
                  f'<circle cx="{f(mx+s*.5)}" cy="{f(my-s*.9)}" r="4" fill="{C}"/>')
        elif nom == 'reservoir':
            d.add(f'<rect x="{f(mx-s*1.3)}" y="{f(my-s*.8)}" width="{f(2.6*s)}" height="{f(1.6*s)}" rx="{f(s*.8)}" fill="none" stroke="{C}" stroke-width="3.5"/>'
                  f'<path d="M{f(mx-s*.5)} {f(my-s*.8)} L{f(mx-s*.5)} {f(my+s*.8)} M{f(mx+s*.5)} {f(my-s*.8)} L{f(mx+s*.5)} {f(my+s*.8)}" stroke="{C}" stroke-width="3"/>')
        elif nom == 'reacteur':
            d.add(f'<path d="M{f(mx-s*1.2)} {f(my-s*.5)} L{f(mx+s*.2)} {f(my-s*.5)} L{f(mx+s*1.1)} {f(my-s*.9)} L{f(mx+s*1.1)} {f(my+s*.9)} L{f(mx+s*.2)} {f(my+s*.5)} L{f(mx-s*1.2)} {f(my+s*.5)} Z" fill="none" stroke="{C}" stroke-width="3.5" stroke-linejoin="round"/>')
        else:  # coque
            d.add(f'<rect x="{f(mx-s*1.3)}" y="{f(my-s*.8)}" width="{f(2.6*s)}" height="{f(1.6*s)}" rx="4" fill="none" stroke="{C}" stroke-width="3.5"/>')
            for k in range(4):
                d.add(f'<circle cx="{f(mx-s*.9+k*s*.6)}" cy="{f(my-s*.45)}" r="3" fill="{C}"/><circle cx="{f(mx-s*.9+k*s*.6)}" cy="{f(my+s*.45)}" r="3" fill="{C}"/>')
    # étagères à outils sur les côtés du plan
    for x0 in (20, 884):
        d.rect(x0, 300, 120, 16, P['bois2'], r=4, sw=5)
        d.rect(x0, 470, 120, 16, P['bois2'], r=4, sw=5)
    d.caisse(34, 236, 56, 62, P['moutarde'], sw=5)
    d.cercle(110, 446, 22, P['metal'], sw=5)
    d.cercle(110, 446, 8, P['metal3'], sw=4)
    d.rect(900, 410, 30, 58, P['rouge'], r=6, sw=5)
    d.rect(944, 424, 30, 44, P['vert'], r=6, sw=5)
    d.plante(950, 300, .9)
    # sol du hangar
    d.rect(-20, 730, W + 40, H - 700, P['sable2'], r=0, sw=7)
    for y in (850, 1010, 1210, 1450):
        d.ligne(0, y, W, y, sw=3.5, extra='opacity=".3"')
    for x in range(-200, W + 400, 180):
        d.ligne(x, H, W / 2 + (x - W / 2) * .55, 736, sw=3.5, extra='opacity=".25"')
    # marquage d'aire d'atterrissage
    d.add(f'<ellipse cx="560" cy="1260" rx="330" ry="110" fill="none" stroke="{P["moutarde"]}" stroke-width="10" stroke-dasharray="40 26"/>')
    d.ombre_d('M300 1270 Q560 1350 820 1270 Q560 1320 300 1270Z', .25)
    # la vraie fusée, garée
    fusee(d, 560, 760, 520, P['creme'], sw=8)
    # échelle, bidons, caisses
    d.path('M816 1300 L870 820 M876 1300 L930 820', sw=9)
    for k in range(7):
        y = 1240 - k * 66
        d.ligne(816 + (1300 - y) * .1125 + 4, y, 876 + (1300 - y) * .1125 + 4, y, sw=7)
    d.caisse(60, 1080, 170, 140, P['bois'], sw=7)
    d.caisse(110, 960, 120, 120, P['sarcelle'], sw=7)
    d.rect(250, 1140, 62, 86, P['rouge'], r=10, sw=6)
    d.ellipse(281, 1140, 31, 10, P['rouge2'], sw=5)
    d.rect(320, 1160, 56, 70, P['vert'], r=10, sw=6)
    d.ellipse(348, 1160, 28, 9, P['vert2'], sw=5)
    d.rect(860, 1340, 140, 90, P['metal'], r=8, sw=6)
    d.rect(860, 1340, 140, 26, P['metal2'], r=8, sw=6)
    return d.svg()


# =====================================================================
#  ATELIER : établi d'inventeur (le tiers haut est le plus visible)
# =====================================================================
def outil_cle(d, x, y, s=1.0, ang=0):
    d.add(f'<g transform="translate({f(x)} {f(y)}) rotate({ang}) scale({s})">'
          f'<path d="M-8 -60 L8 -60 L8 40 L-8 40 Z" fill="{P["metal"]}" stroke="{ENCRE}" stroke-width="5" stroke-linejoin="round"/>'
          f'<path d="M-22 -72 A24 24 0 1 0 22 -72 L10 -72 L10 -90 L-10 -90 L-10 -72 Z" fill="{P["metal"]}" stroke="{ENCRE}" stroke-width="5" stroke-linejoin="round"/>'
          f'<circle cx="0" cy="52" r="18" fill="{P["metal"]}" stroke="{ENCRE}" stroke-width="5"/><circle cx="0" cy="52" r="7" fill="{P["bois"]}" stroke="{ENCRE}" stroke-width="4"/></g>')


def engrenage(d, cx, cy, r, fill, dents=10, sw=6):
    pts_ = []
    for k in range(dents * 2):
        a = k * math.pi / dents
        rr = r if k % 2 == 0 else r * .78
        a1, a2 = a - math.pi / dents * .45, a + math.pi / dents * .45
        pts_ += [(cx + math.cos(a1) * rr, cy + math.sin(a1) * rr), (cx + math.cos(a2) * rr, cy + math.sin(a2) * rr)]
    d.poly(pts_, fill, sw=sw)
    d.cercle(cx, cy, r * .3, P['bois'], sw=sw * .8)


def atelier():
    d = Dessin('atelier')
    # mur
    d.rect(-20, -20, W + 40, 900, P['sable'], r=0, sw=0)
    for y in range(60, 860, 110):
        d.ligne(0, y, W, y, sw=3, extra='opacity=".18"')
    d.ombre([(0, 0), (W, 0), (W, 70), (0, 70)], .12)
    # tuyaux de cuivre
    d.add(f'<path d="M-10 60 L700 60 Q740 60 740 100 L740 250" fill="none" stroke="{ENCRE}" stroke-width="30" stroke-linecap="round"/>'
          f'<path d="M-10 60 L700 60 Q740 60 740 100 L740 250" fill="none" stroke="{P["orange"]}" stroke-width="18" stroke-linecap="round"/>')
    d.cercle(740, 260, 24, P['laiton'], sw=6)
    d.ligne(740, 260, 752, 246, sw=4, coul=P['rouge'])
    # panneau perforé avec outils (centre-gauche)
    PX0, PY0, PX1, PY1 = 90, 120, 660, 470
    d.rect(PX0, PY0, PX1 - PX0, PY1 - PY0, P['bois'], r=8, sw=7)
    for x in range(PX0 + 24, PX1 - 10, 34):
        for y in range(PY0 + 24, PY1 - 10, 34):
            d.add(f'<circle cx="{x}" cy="{y}" r="3.2" fill="{ENCRE}" opacity=".45"/>')
    outil_cle(d, 170, 300, 1.0, -8)
    outil_cle(d, 250, 290, .8, 6)
    # marteau
    d.add(f'<g transform="translate(350 300) rotate(-10)"><rect x="-8" y="-40" width="16" height="140" rx="6" fill="{P["bois2"]}" stroke="{ENCRE}" stroke-width="5"/>'
          f'<rect x="-46" y="-78" width="92" height="40" rx="8" fill="{P["metal2"]}" stroke="{ENCRE}" stroke-width="5"/></g>')
    # scie
    d.add(f'<g transform="translate(470 290) rotate(8)"><path d="M-30 -110 L30 -110 L30 -60 L-30 -60 Z" fill="{P["bois"]}" stroke="{ENCRE}" stroke-width="5" stroke-linejoin="round"/>'
          f'<path d="M-24 -60 L24 -60 L40 120 L-10 120 Z" fill="{P["metal"]}" stroke="{ENCRE}" stroke-width="5" stroke-linejoin="round"/>'
          + ''.join(f'<path d="M{-10+k*6} {120-k*20} l-8 -6" stroke="{ENCRE}" stroke-width="3"/>' for k in range(8)) + '</g>')
    # tournevis
    for k, coul in enumerate([P['rouge'], P['moutarde'], P['sarcelle']]):
        x = 570 + k * 28
        d.rect(x - 9, 200, 18, 56, coul, r=6, sw=4.5)
        d.ligne(x, 256, x, 340, sw=6)
    engrenage(d, 600, 410, 40, P['laiton'], 10, 5)
    # étagère de bocaux (droite)
    for y in (200, 360):
        d.rect(720, y, 280, 18, P['bois2'], r=4, sw=6)
    for k, coul in enumerate([P['vert'], P['bleu'], P['moutarde'], P['violet']]):
        x = 744 + k * 64
        d.rect(x, 128, 48, 72, P['creme'], r=10, sw=5)
        d.rect(x + 6, 152, 36, 42, coul, r=6, sw=0, extra='opacity=".75"')
        d.rect(x - 2, 120, 52, 14, P['metal2'], r=4, sw=4.5)
    engrenage(d, 790, 316, 40, P['metal'], 9, 5)
    engrenage(d, 860, 330, 26, P['laiton'], 8, 4.5)
    d.rect(910, 290, 72, 70, P['rouge'], r=8, sw=5)
    d.ligne(920, 310, 972, 310, sw=4)
    # lampe articulée
    d.path('M640 640 L700 520 L620 450', sw=10)
    d.cercle(700, 520, 9, P['laiton'], sw=4)
    d.add('<ellipse cx="560" cy="600" rx="190" ry="90" fill="#F7D58B" opacity=".35"/>')
    d.add('<g transform="rotate(-30 620 450)"><path d="M596 420 L644 420 L676 486 L564 486 Z" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>'
          '<ellipse cx="620" cy="486" rx="56" ry="11" fill="#FBE6A6" stroke="%s" stroke-width="5"/><rect x="608" y="406" width="24" height="16" rx="4" fill="%s" stroke="%s" stroke-width="4.5"/></g>' % (P['vert2'], ENCRE, ENCRE, P['laiton'], ENCRE))
    # établi
    d.rect(40, 600, 944, 46, P['bois'], r=6, sw=8)
    d.ombre([(48, 630), (980, 630), (980, 646), (48, 646)], .2)
    d.path('M80 646 L80 900 M944 646 L944 900', sw=16)
    d.rect(60, 760, 904, 22, P['bois2'], r=4, sw=6)
    # sur l'établi : étau, plan roulé, boulons, gros engrenage
    d.rect(110, 520, 140, 80, P['metal2'], r=8, sw=6)
    d.rect(90, 540, 40, 40, P['metal'], r=6, sw=5)
    d.rect(150, 500, 60, 30, P['metal'], r=6, sw=5)
    d.ligne(60, 560, 120, 560, sw=8)
    d.path('M300 600 Q300 560 340 556 L520 556 Q556 560 556 600 Z', P['bleu2'], sw=6)
    d.ellipse(300, 580, 18, 22, P['bleu'], sw=5)
    d.ligne(330, 576, 520, 576, sw=2.5, coul=P['creme'], extra='opacity=".7"')
    engrenage(d, 820, 548, 50, P['laiton'], 11, 6)
    for k in range(5):
        d.cercle(640 + k * 26, 590, 9, P['metal'], sw=4)
    d.rect(880, 540, 70, 60, P['creme'], r=8, sw=5)
    d.path('M950 556 q20 0 20 16 q0 14 -20 14', sw=5)
    # sol
    d.rect(-20, 880, W + 40, H - 860, P['bois2'], r=0, sw=7)
    for y in range(940, H, 90):
        d.ligne(0, y, W, y, sw=3, extra='opacity=".3"')
    d.caisse(700, 820, 160, 120, P['moutarde'], sw=7)
    d.caisse(180, 840, 130, 100, P['bois'], sw=7)
    return d.svg()


# =====================================================================
#  MARCHÉ : bazar spatial sur un quai de station (tiers haut visible)
# =====================================================================
def etal(d, x, y, w, couleurs, coul_comptoir=None):
    coul_comptoir = coul_comptoir or P['bois']
    n = 5
    # montants
    d.ligne(x + 10, y, x + 10, y + 300, sw=12)
    d.ligne(x + w - 10, y, x + w - 10, y + 300, sw=12)
    # auvent rayé festonné
    for k in range(n):
        xa, xb = x - 16 + (w + 32) * k / n, x - 16 + (w + 32) * (k + 1) / n
        c = couleurs[k % 2]
        d.poly([(xa + 22, y - 70), (xb + 22, y - 70), (xb, y), (xa, y)], c, sw=6)
        d.path(f'M{f(xa)} {f(y)} Q{f((xa+xb)/2)} {f(y+32)} {f(xb)} {f(y)}', c, sw=6)
    # comptoir
    d.rect(x - 10, y + 200, w + 20, 34, coul_comptoir, r=6, sw=7)
    d.poly([(x, y + 234), (x + w, y + 234), (x + w - 8, y + 340), (x + 8, y + 340)], P['bois2'], sw=7)


def marche():
    d = Dessin('marche')
    # paroi de la station
    d.rect(-20, -20, W + 40, 980, P['metal'], r=0, sw=0)
    for x in range(0, W, 128):
        d.ligne(x, 0, x, 960, sw=4, extra='opacity=".35"')
        d.rivets([(x + 14, y) for y in range(40, 960, 80)], r=3.5)
    # grande baie ronde sur l'espace, fusée amarrée
    bx, by, br = 512, 250, 210
    d.cercle(bx, by, br + 34, P['laiton'], sw=8)
    d.add(f'<clipPath id="baie"><circle cx="{bx}" cy="{by}" r="{br}"/></clipPath>')
    d.add(f'<g clip-path="url(#baie)"><rect x="{bx-br}" y="{by-br}" width="{2*br}" height="{2*br}" fill="{P["nuit2"]}"/>'
          f'<circle cx="{bx-120}" cy="{by+150}" r="140" fill="{P["sarcelle"]}" stroke="{ENCRE}" stroke-width="7"/>'
          f'<path d="M{bx-230} {by+120} q110 -50 230 -10" fill="none" stroke="{ENCRE}" stroke-width="5" opacity=".4"/></g>')
    for (sx, sy, sr) in [(bx + 120, by - 120, 12), (bx - 60, by - 150, 8), (bx + 160, by + 30, 7), (bx - 150, by - 60, 6), (bx + 40, by - 40, 5)]:
        d.etoile4(sx, sy, sr)
    d.add(f'<g clip-path="url(#baie)">')
    fusee(d, bx + 90, by - 60, 260, P['creme'], sw=6)
    d.add('</g>')
    d.cercle(bx, by, br, 'none', sw=8)
    d.reflet_d(f'M{bx-150} {by-80} q40 -90 140 -118 q-80 50 -118 140z', .25)
    d.rivets([(bx + math.cos(a) * (br + 17), by + math.sin(a) * (br + 17)) for a in [i * math.pi / 8 for i in range(16)]], r=5)
    # guirlande de lampions
    d.path('M0 120 Q260 260 512 230', sw=4)
    d.path('M512 230 Q770 260 1024 120', sw=4)
    for k, (x, y) in enumerate([(70, 156), (170, 200), (280, 228), (390, 236), (630, 238), (740, 226), (850, 196), (950, 156)]):
        c = [P['rouge'], P['moutarde'], P['sarcelle']][k % 3]
        d.add(f'<circle cx="{x}" cy="{y+30}" r="34" fill="{P["moutarde"]}" opacity=".18"/>')
        d.ligne(x, y, x, y + 10, sw=3)
        d.ellipse(x, y + 30, 20, 24, c, sw=5)
        d.ligne(x - 12, y + 30, x + 12, y + 30, sw=2.5, extra='opacity=".5"')
    # étals
    etal(d, 30, 470, 300, (P['rouge'], P['creme']))
    etal(d, 694, 470, 300, (P['sarcelle'], P['creme']))
    # marchandises sur les comptoirs : bocaux de minerais qui brillent, sacs
    for k, c in enumerate([P['moutarde'], P['violet'], P['bleu'], P['vert']]):
        x = 52 + k * 70
        d.add(f'<circle cx="{x+24}" cy="{630}" r="34" fill="{c}" opacity=".22"/>')
        d.rect(x, 590, 48, 80, P['creme'], r=12, sw=5)
        d.rect(x + 6, 618, 36, 46, c, r=8, sw=0, extra='opacity=".8"')
        d.rect(x - 2, 580, 52, 16, P['metal2'], r=5, sw=4.5)
    for k, c in enumerate([P['sable2'], P['sable'], P['sable2']]):
        x = 720 + k * 88
        d.path(f'M{x} 670 Q{x-6} 610 {x+20} 596 L{x+20} 584 L{x+56} 584 L{x+56} 596 Q{x+82} 610 {x+76} 670 Z', c, sw=5)
        d.ligne(x + 16, 598, x + 60, 598, sw=4)
    for x, y, c in [(760, 560, P['rouge']), (820, 548, P['orange']), (880, 562, P['moutarde'])]:
        d.cercle(x, y, 16, c, sw=4.5)
    # balance de marchand au centre
    d.ligne(512, 520, 512, 760, sw=10)
    d.ligne(420, 560, 604, 560, sw=8)
    d.cercle(512, 520, 14, P['laiton'], sw=5)
    for x in (420, 604):
        d.path(f'M{x} 560 L{x-30} 640 M{x} 560 L{x+30} 640', sw=3.5)
        d.path(f'M{x-44} 640 Q{x} 676 {x+44} 640 Z', P['laiton'], sw=5)
    d.path('M470 760 L554 760 L540 780 L484 780 Z', P['bois2'], sw=6)
    # quai
    d.rect(-20, 940, W + 40, H - 920, P['sable2'], r=0, sw=7)
    for x in range(-300, W + 600, 160):
        d.ligne(x, H, W / 2 + (x - W / 2) * .5, 946, sw=3.5, extra='opacity=".25"')
    d.caisse(400, 880, 120, 100, P['bois'], sw=7)
    d.caisse(530, 900, 90, 80, P['moutarde'], sw=7)
    return d.svg()


# =====================================================================
#  CARTE : ciel de nuit peint (le jeu dessine soleil, planètes, noms)
# =====================================================================
def carte():
    d = Dessin('carte')
    r = d.r
    d.add(f'<defs><radialGradient id="ciel" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="{P["ciel"]}"/>'
          f'<stop offset=".55" stop-color="{P["nuit2"]}"/><stop offset="1" stop-color="{P["nuit"]}"/></radialGradient>'
          f'<filter id="flou"><feGaussianBlur stdDeviation="40"/></filter></defs>')
    d.add(f'<rect width="{W}" height="{H}" fill="url(#ciel)"/>')
    # nébuleuses douces
    for (x, y, rx, ry, c, o) in [(220, 380, 260, 150, P['violet'], .35), (820, 260, 220, 140, P['sarcelle'], .3),
                                 (700, 1180, 300, 170, P['violet'], .28), (200, 1250, 220, 120, P['sarcelle'], .25),
                                 (520, 760, 380, 200, P['moutarde'], .08)]:
        d.add(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" opacity="{o}" filter="url(#flou)"/>')
    # points d'étoiles
    for _ in range(260):
        x, y = r.uniform(0, W), r.uniform(0, H)
        d.add(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r.choice([1.4, 1.8, 2.4, 3]))}" fill="{P["creme"]}" opacity="{f(r.uniform(.35, .9))}"/>')
    # étoiles en croix, plus présentes vers les bords (le centre reste calme)
    for _ in range(46):
        while True:
            x, y = r.uniform(30, W - 30), r.uniform(30, H - 30)
            if math.hypot((x - W / 2) / W, (y - H / 2) / H) > .22:
                break
        d.etoile4(x, y, r.choice([7, 9, 12, 16]), r.choice([P['creme'], P['creme'], P['moutarde']]))
    # petits astéroïdes aux bords
    for (x, y, s) in [(60, 140, 34), (120, 220, 18), (960, 1380, 40), (900, 1460, 22), (980, 600, 20), (40, 1100, 26), (86, 1160, 14)]:
        pts_ = [(x + math.cos(a) * s * r.uniform(.75, 1.1), y + math.sin(a) * s * r.uniform(.75, 1.1)) for a in [k * math.pi / 5 for k in range(10)]]
        d.poly(pts_, P['sable2'], sw=5)
        d.cercle(x - s * .2, y - s * .15, s * .22, P['bois'], sw=3)
    return d.svg(fond=P['nuit'])


DECORS = [('vaisseau', vaisseau), ('hangar', hangar), ('atelier', atelier), ('marche', marche), ('carte', carte)]

if __name__ == '__main__':
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sortie = os.path.join(racine, 'decors')
    os.makedirs(sortie, exist_ok=True)
    for nom, fn in DECORS:
        with open(os.path.join(sortie, nom + '.svg'), 'w') as fh:
            fh.write(fn())
        print('écrit', nom)
