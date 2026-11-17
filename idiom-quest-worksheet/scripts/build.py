#!/usr/bin/env python3
"""成語圖文探險單 建置程式

用法：
  python scripts/build.py quest.js --out 輸出資料夾 [--pdf] [--docx] [--images 圖片資料夾]

產出（檔名用 QUEST.title）：
  <title>.html            學生版，A4 兩頁（第一頁：第一、二關；第二頁：第三、四關）
  <title>_教師版.html      答案與使用建議（一頁）
  --pdf  再輸出兩個 PDF（需要 playwright）
  --docx 再輸出 Word 版學生單（需要 python-docx；插圖轉 PNG 需要 playwright）
  插圖提示詞.md            給老師用 GPT／Gemini 網頁版自己生圖時參考

需求：node（讀 quest.js）、fonttools＋brotli（內嵌芫荽字型子集）。
"""
import argparse, base64, html, json, os, random, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / 'assets'
FONT_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/iansui/Iansui-Regular.ttf'
CIRC = '①②③④⑤⑥⑦⑧'
LETTERS = 'ABCDEF'
VIEWBOX = '160 0 960 720'  # 插圖只取中間 4:3


# ---------- 讀 quest.js ----------
def load_quest(path):
    js = r"""
const fs = require('fs'), vm = require('vm');
const code = fs.readFileSync(process.argv[1], 'utf8') + '\n' + fs.readFileSync(process.argv[2], 'utf8') +
  `\n;JSON.stringify(Object.assign({}, QUEST, { idioms: QUEST.idioms.map(i => Object.assign({}, i, { art: typeof i.art === 'function' ? i.art(1.2) : (i.art || null) })) }))`;
process.stdout.write(vm.runInNewContext(code, { Math, console, JSON, Object }));
"""
    r = subprocess.run(['node', '-e', js, str(ASSETS / 'lib.js'), str(path)], capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        sys.exit('讀取 quest.js 失敗：\n' + r.stderr)
    q = json.loads(r.stdout)
    if len(q['idioms']) != 6:
        sys.exit(f'需要剛好 6 個成語，目前 {len(q["idioms"])} 個。')
    return q


# ---------- 打亂 ----------
def derange(rng, n, avoid=None):
    """回傳 0..n-1 的排列，每個位置都不等於自己（也盡量不等於 avoid）"""
    for _ in range(500):
        p = list(range(n)); rng.shuffle(p)
        if all(p[i] != i for i in range(n)) and (avoid is None or all(p[i] != avoid[i] for i in range(n))):
            return p
    p = list(range(n)); return p[1:] + p[:1]


def plan(q):
    rng = random.Random(q.get('seed', 1))
    ids = q['idioms']
    groups = []
    for g in (0, 1):
        base = [g * 3 + k for k in range(3)]
        pi = derange(rng, 3)
        pm = derange(rng, 3, pi)
        groups.append({'cards': base, 'idioms': [base[k] for k in pi], 'means': [base[k] for k in pm]})
    # 意思編號 1–6 依出現順序
    mean_no = {}
    for g in groups:
        for k in g['means']:
            mean_no[k] = len(mean_no) + 1
    sent = derange(rng, 6)  # 第三關句子順序（第 j 題是第 sent[j] 個成語）
    return groups, mean_no, sent


# ---------- 文字標記 ----------
def esc(s):
    return html.escape(s, quote=False)


def mk_meaning(s):
    return re.sub(r'【(.+?)】', r'<span class="key">\1</span>', esc(s))


def mk_sentence(s, ans=None):
    inner = f'<span class="ans">{esc(ans)}</span>' if ans else ''
    return esc(s).replace('（）', f'（<span class="blank">{inner}</span>）')


def mk_frame(s):
    s = esc(s)
    s = re.sub(r'＿+', lambda m: f'<span class="fill" style="width:{len(m.group(0)) * 1.15:.1f}em"></span>', s)
    return re.sub(r'「(.+?)」', r'「<b>\1</b>」', s)


# ---------- 插圖 ----------
def find_img(i, idiom, images_dir, qdir):
    cands = []
    if idiom.get('img'):
        cands.append(Path(idiom['img']) if Path(idiom['img']).is_absolute() else qdir / idiom['img'])
    if images_dir:
        for stem in (idiom['word'], str(i + 1)):
            for ext in ('.png', '.jpg', '.jpeg', '.webp'):
                cands.append(images_dir / (stem + ext))
    for c in cands:
        if c.exists():
            return c
    return None


def img_html(i, idiom, images_dir, qdir):
    p = find_img(i, idiom, images_dir, qdir)
    if p:
        mime = {'.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp'}.get(p.suffix.lower(), 'png')
        return f'<img src="data:image/{mime};base64,{base64.b64encode(p.read_bytes()).decode()}" alt="">'
    if idiom.get('art'):
        return f'<svg viewBox="{VIEWBOX}" preserveAspectRatio="xMidYMid slice">{idiom["art"]}</svg>'
    return '<div class="noimg">（請放插圖）</div>'


# ---------- 字型 ----------
def font_face(text):
    cache = Path(os.environ.get('IQW_CACHE', Path.home() / '.cache' / 'iqw'))
    cache.mkdir(parents=True, exist_ok=True)
    ttf = cache / 'Iansui-Regular.ttf'
    if not ttf.exists():
        print('下載芫荽字型…')
        urllib.request.urlretrieve(FONT_URL, ttf)
    try:
        from fontTools import subset
        opt = subset.Options(); opt.flavor = 'woff2'; opt.layout_features = ['*']
        f = subset.load_font(str(ttf), opt)
        s = subset.Subsetter(opt); s.populate(text=text + '０１２３４５６７８９0123456789ABCDEF'); s.subset(f)
        out = Path(tempfile.mktemp(suffix='.woff2')); subset.save_font(f, str(out), opt)
        b = out.read_bytes(); out.unlink()
        return f"@font-face{{font-family:'Iansui';src:url(data:font/woff2;base64,{base64.b64encode(b).decode()}) format('woff2');}}"
    except Exception as e:  # 沒有 fonttools 時改用線上字型
        print('⚠ 無法內嵌字型（', e, '），改用 Google Fonts 連線載入')
        return "@import url('https://fonts.googleapis.com/css2?family=Iansui&display=swap');"


CSS = r"""
:root{--navy:#1e3a8a;--blue:#2563eb;--pale:#eff6ff;--line:#bfd4f6;--th:#dbeafe;--red:#dc2626;--ink:#1f2937;--rowh:35.5mm;--fs:12.5pt}
*{box-sizing:border-box}
html,body{margin:0;background:#e5e7eb}
body{font-family:'Iansui','BiauKai','DFKai-SB','標楷體',serif;color:var(--ink);font-size:var(--fs)}
.page{width:210mm;height:297mm;margin:10mm auto;background:#fff;padding:12mm 13mm 10mm;overflow:hidden;box-shadow:0 2px 12px #0002;position:relative}
@page{size:A4;margin:0}
@media print{html,body{background:#fff}.page{margin:0;box-shadow:none;page-break-after:always;break-after:page}.page:last-child{page-break-after:auto;break-after:auto}.noprint{display:none!important}}
.toolbar{position:sticky;top:0;z-index:9;background:#1e3a8a;color:#fff;padding:8px 16px;display:flex;gap:12px;align-items:center;justify-content:center;font-family:sans-serif;font-size:14px}
.toolbar button{font:inherit;background:#fff;color:#1e3a8a;border:0;border-radius:6px;padding:5px 14px;cursor:pointer}
.head{border:1.6px solid var(--blue);border-radius:9px;background:var(--pale);padding:3mm 4.5mm 2.4mm}
.head .row1{display:flex;align-items:center;justify-content:space-between}
.head h1{margin:0;font-size:21pt;color:var(--navy);letter-spacing:1px}
.head h1 small{font-size:11pt;margin-left:3mm;color:#475569;letter-spacing:0}
.info{font-size:12pt;white-space:nowrap}
.info span{display:inline-block;border-bottom:1px solid #333;width:17mm;margin:0 3mm 0 1mm}
.info span.n{width:27mm;margin-right:0}
.prog{margin-top:2mm;padding-top:1.6mm;border-top:1px dashed #93b4ec;white-space:nowrap;font-size:9.6pt;letter-spacing:-.2px;color:var(--navy);overflow:hidden}
.prog b{font-weight:700}
.box{display:inline-block;width:.9em;height:.9em;border:1.3px solid currentColor;border-radius:2px;vertical-align:-.08em;margin:0 .12em 0 .35em}
h2{margin:3.2mm 0 2mm;font-size:14.5pt;color:var(--navy);background:var(--pale);border-left:5px solid var(--blue);padding:1.2mm 3mm;font-weight:700}
h2 small{font-size:10.5pt;color:#475569;font-weight:400;margin-left:3mm}
table.match{width:100%;border-collapse:collapse;table-layout:fixed}
table.match th{background:var(--th);color:var(--navy);font-size:10.5pt;border:1px solid var(--line);padding:1mm 0;font-weight:700}
table.match td{border:1px solid var(--line);height:var(--rowh);vertical-align:middle;padding:0}
td.gap{background:#f8fafc}
td.card{text-align:center;padding:1.2mm 0 .8mm!important}
.pic{width:calc(var(--rowh) * .98);max-width:36mm;height:calc(var(--rowh) * .735);margin:0 auto;border:1px solid #d6dde8;border-radius:5px;overflow:hidden;background:#fff}
.pic svg,.pic img{width:100%;height:100%;display:block;object-fit:cover}
.noimg{font-size:9pt;color:#999;padding-top:30%}
.lab{font-size:10pt;font-weight:700;margin-top:.6mm;color:#334155}
.dot{color:var(--blue);font-size:10pt}
td.idm{text-align:center;font-weight:700;font-size:13.5pt;white-space:nowrap}
td.mean{padding:0 3mm!important;font-size:12pt;line-height:1.5}
td.mean .m{display:flex;gap:1.5mm;align-items:baseline}
.key{color:var(--red);font-weight:700;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1.5px}
.treasure{border:1.5px solid var(--blue);border-radius:8px;padding:1.6mm 3mm 2.4mm}
.treasure .t{color:var(--navy);font-weight:700;font-size:12pt;margin-bottom:1.2mm}
.treasure .grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line)}
.treasure .grid div{border-right:1px solid var(--line);border-bottom:1px solid var(--line);text-align:center;padding:1mm 0;color:var(--navy);font-weight:700;font-size:13pt}
ol.sent{margin:3mm 0 0;padding-left:6mm;line-height:2.75;font-size:12.5pt}
ol.sent li{padding-left:1mm}
.blank{display:inline-block;min-width:28mm;border-bottom:1px solid #333;height:1.2em;vertical-align:-.25em;text-align:center}
.ans{color:var(--red);font-weight:700}
.l4{border:1px solid #cfd8e3;border-radius:8px;padding:2.4mm 3.5mm}
.mt{font-weight:700;color:var(--navy)}
.mt .box{margin-left:0}
.frames{background:#f1f5f9;border-left:4px solid var(--blue);margin:1.6mm 0 2.4mm 2mm;padding:1mm 3mm;line-height:2.75;font-size:12.5pt}
.fill{display:inline-block;border-bottom:1.3px dashed #555;height:1.1em;vertical-align:-.2em}
.lines div{border-bottom:1px solid #555;height:var(--lineh,19mm)}
.lines{margin:0 1mm 2.4mm}
.m3{white-space:nowrap;font-size:11.8pt;margin-top:1mm}
.m3 .sig{display:inline-block;border-bottom:1px solid #333;width:24mm}
.check{margin-top:2.6mm;background:var(--pale);border-radius:6px;padding:1.6mm 3mm;white-space:nowrap;font-size:11.5pt;color:var(--navy)}
.check span{display:inline-block;border-bottom:1px solid #333;width:26mm}
.tk table{width:100%;border-collapse:collapse;margin-bottom:3mm}
.tk th,.tk td{border:1px solid var(--line);padding:1.4mm 2.4mm;font-size:12pt}
.tk th{background:var(--th);color:var(--navy)}
.tk .blank{height:auto;vertical-align:baseline;padding:0 2mm;border-bottom:none}
.tk ul{margin:1mm 0;padding-left:6mm;line-height:1.8}
"""

FIT_JS = """
<script>
// 自動檢查：每一頁內容不可超出 A4；超出時把列高與字級縮小一點（只在螢幕載入時做一次）
document.fonts.ready.then(function(){function over(){return [...document.querySelectorAll('.page:not(.tk)')].some(p=>p.scrollHeight>p.clientHeight+1)}
let r=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rowh')),l=19,f=12.5,n=0;
while(over()&&n<20){n++;r-=0.8;l-=0.4;if(n>6)f-=0.25;const s=document.documentElement.style;s.setProperty('--rowh',r+'mm');s.setProperty('--lineh',l+'mm');s.setProperty('--fs',f+'pt')}
window.__fitSteps=n;window.__overflow=over();window.__fitDone=1;});
</script>
"""


def page_shell(title, css_font, body, toolbar=True):
    tb = ('<div class="toolbar noprint">A4 兩頁・列印時「邊界」選「無」<button onclick="print()">列印／另存 PDF</button></div>' if toolbar else '')
    return f'<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><style>{css_font}{CSS}</style></head><body>{tb}{body}{FIT_JS}</body></html>'


def build_student(q, groups, mean_no, sent, imgs):
    ids = q['idioms']
    sub = ' '.join(x for x in (q.get('grade'), q.get('subtitle')) if x)
    head = f'''<div class="head"><div class="row1"><h1>{esc(q.get('title', '成語圖文探險單'))}{f'<small>{esc(sub)}</small>' if sub else ''}</h1>
<div class="info">班級：<span></span>座號：<span></span>姓名：<span class="n"></span></div></div>
<div class="prog"><b>任務進度：</b><i class="box"></i>第一關：圖文連連看(一)<i class="box"></i>第二關：圖文連連看(二)<i class="box"></i>第三關：句子選選看<i class="box"></i>第四關：生活小玩家</div></div>'''
    thead = '<colgroup><col style="width:21%"><col style="width:8%"><col style="width:18%"><col style="width:8%"><col></colgroup><tr><th>情境圖片</th><th>連線區</th><th>成語</th><th>連線區</th><th>成語的意思</th></tr>'
    secs = []
    for gi, g in enumerate(groups):
        rows = ''
        for r in range(3):
            c, w, m = g['cards'][r], g['idioms'][r], g['means'][r]
            rows += (f'<tr><td class="card"><div class="pic">{imgs[c]}</div><div class="lab">圖卡 {LETTERS[c]} <span class="dot">●</span></div></td>'
                     f'<td class="gap"></td><td class="idm"><span class="dot">●</span> {esc(ids[w]["word"])} <span class="dot">●</span></td><td class="gap"></td>'
                     f'<td class="mean"><div class="m"><span class="dot">●</span><span>{mean_no[m]}. {mk_meaning(ids[m]["meaning"])}</span></div></td></tr>')
        name = '一二'[gi]
        secs.append(f'<h2>第{name}關：看圖連連看（{name}）</h2><table class="match">{thead}{rows}</table>')
    p1 = f'<section class="page">{head}{secs[0]}{secs[1]}</section>'

    box = ''.join(f'<div>{CIRC[i]} {esc(x["word"])}</div>' for i, x in enumerate(ids))
    sents = ''.join(f'<li>{mk_sentence(ids[k]["sentence"])}</li>' for k in sent)
    frames = ''.join(f'<div>• {mk_frame(f["text"])}</div>' for f in q.get('frames', [])[:3])
    lines = '<div></div>' * 3
    p2 = f'''<section class="page"><h2 style="margin-top:0">第三關：生活句子選選看</h2>
<div class="treasure"><div class="t">★ 成語百寶箱</div><div class="grid">{box}</div></div>
<ol class="sent">{sents}</ol>
<h2>第四關：生活小玩家<small>選一種方式完成就可以囉！</small></h2>
<div class="l4"><div class="mt"><i class="box"></i>方法一（半開放句型引導）<span style="font-weight:400;color:var(--ink)">：選一句，把句子寫完整。</span></div>
<div class="frames">{frames}</div>
<div class="mt"><i class="box"></i>方法二（進階挑戰 — 自由選詞造句）<span style="font-weight:400;color:var(--ink)">：任選一個成語，寫出 15 字以上的完整句子。</span></div>
<div class="lines">{lines}</div>
<div class="m3"><span class="mt"><i class="box"></i>方法三（口語表達）</span>：選一個成語口頭造句，唸給老師或小老師聽。　聽眾簽名：<span class="sig"></span></div></div>
<div class="check">自我／小老師檢查：<i class="box"></i>句子通順好懂<i class="box"></i>成語意思用對了　　老師認證章：<span></span></div>
</section>'''
    return p1 + p2


def build_teacher(q, groups, mean_no, sent):
    ids = q['idioms']
    rows = ''
    for g in groups:
        for c in g['cards']:
            rows += f'<tr><td>圖卡 {LETTERS[c]}</td><td><b>{esc(ids[c]["word"])}</b></td><td>{mean_no[c]}. {mk_meaning(ids[c]["meaning"])}</td></tr>'
    s3 = ''.join(f'<li>{mk_sentence(ids[k]["sentence"], CIRC[k] + " " + ids[k]["word"])}</li>' for k in sent)
    notes = ''.join(f'<li>{esc(n)}</li>' for n in q.get('notes', []))
    return f'''<section class="page tk"><div class="head"><div class="row1"><h1>{esc(q.get('title', '成語圖文探險單'))}<small>教師版答案</small></h1></div></div>
<h2>第一、二關：連連看答案</h2><table><tr><th style="width:16%">圖卡</th><th style="width:22%">成語</th><th>意思</th></tr>{rows}</table>
<h2>第三關：句子選選看答案</h2><ol class="sent" style="margin-top:0">{s3}</ol>
<h2>第四關：評量重點</h2><ul><li>方法一：句型提示只給頭尾，檢查學生補上的情境是否符合成語意思。</li><li>方法二：15 字以上、句子通順、成語用在對的情境。</li><li>方法三：可由小老師簽名，老師抽聽。</li></ul>
{f'<h2>使用建議</h2><ul>{notes}</ul>' if notes else ''}</section>'''


# ---------- 輸出 ----------
def launch(p):
    try:
        return p.chromium.launch()
    except Exception:
        for exe in (os.environ.get('CHROME_PATH'), '/opt/pw-browsers/chromium'):
            if exe and Path(exe).exists():
                return p.chromium.launch(executable_path=exe)
        raise

def render_pdf(html_path, pdf_path):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = launch(p); pg = b.new_page()
        pg.goto(Path(html_path).resolve().as_uri()); pg.wait_for_function('window.__fitDone === 1', timeout=20000)
        steps, over = pg.evaluate('[window.__fitSteps, window.__overflow]')
        pg.pdf(path=str(pdf_path), prefer_css_page_size=True, print_background=True)
        b.close()
    return steps, over


def art_pngs(q, imgs_dir, qdir, tmp):
    """把每張插圖變成 PNG（Word 用）"""
    out = []
    todo = []
    for i, x in enumerate(q['idioms']):
        p = find_img(i, x, imgs_dir, qdir)
        if p and p.suffix.lower() in ('.png', '.jpg', '.jpeg'):
            out.append(p); continue
        dst = tmp / f'art{i}.png'; out.append(dst); todo.append((i, dst))
    if todo:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            b = launch(pw); pg = b.new_page(viewport={'width': 640, 'height': 480})
            for i, dst in todo:
                x = q['idioms'][i]
                inner = img_html(i, x, imgs_dir, qdir)
                pg.set_content(f'<html><body style="margin:0"><div style="width:640px;height:480px">{inner.replace("<svg ", "<svg width=640 height=480 ").replace("<img ", "<img style=width:640px;height:480px;object-fit:cover ")}</div></body></html>')
                pg.screenshot(path=str(dst), clip={'x': 0, 'y': 0, 'width': 640, 'height': 480})
            b.close()
    return out


def build_docx(q, groups, mean_no, sent, pngs, path):
    from docx import Document
    from docx.shared import Pt, Mm, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    NAVY, RED, BLUE = RGBColor(0x1e, 0x3a, 0x8a), RGBColor(0xdc, 0x26, 0x26), RGBColor(0x25, 0x63, 0xeb)
    ids = q['idioms']
    d = Document()
    sec = d.sections[0]; sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.left_margin = sec.right_margin = Mm(13); sec.top_margin = Mm(11); sec.bottom_margin = Mm(9)
    st = d.styles['Normal']; st.font.name = '標楷體'; st.font.size = Pt(12)
    st.element.rPr.rFonts.set(qn('w:eastAsia'), '標楷體')
    st.paragraph_format.space_after = Pt(0); st.paragraph_format.space_before = Pt(0)

    def shade(cell, fill):
        tcPr = cell._tc.get_or_add_tcPr(); s = OxmlElement('w:shd'); s.set(qn('w:val'), 'clear'); s.set(qn('w:color'), 'auto'); s.set(qn('w:fill'), fill); tcPr.append(s)

    def borders(tbl, color='BFD4F6'):
        tblPr = tbl._tbl.tblPr; b = OxmlElement('w:tblBorders')
        for e in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            x = OxmlElement(f'w:{e}'); x.set(qn('w:val'), 'single'); x.set(qn('w:sz'), '6'); x.set(qn('w:color'), color); b.append(x)
        tblPr.append(b)

    def run(p, t, bold=False, color=None, size=None, ul=False):
        r = p.add_run(t); r.bold = bold; r.underline = ul
        if color: r.font.color.rgb = color
        if size: r.font.size = Pt(size)
        return r

    def rich(p, s, size=None):
        for part in re.split(r'(【.+?】)', s):
            if part.startswith('【'):
                run(p, part[1:-1], True, RED, size, True)
            elif part:
                run(p, part, size=size)

    def h2(t, small=''):
        tb = d.add_table(rows=1, cols=1); c = tb.cell(0, 0); shade(c, 'EFF6FF')
        p = c.paragraphs[0]; run(p, '▌', color=BLUE, size=14); run(p, t, True, NAVY, 14)
        if small: run(p, '　' + small, size=10.5)
        d.add_paragraph().paragraph_format.space_after = Pt(1)

    # 標題
    tb = d.add_table(rows=2, cols=2); borders(tb, '2563EB')
    for c in tb.rows[0].cells + tb.rows[1].cells: shade(c, 'EFF6FF')
    run(tb.cell(0, 0).paragraphs[0], q.get('title', '成語圖文探險單'), True, NAVY, 20)
    p = tb.cell(0, 1).paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.RIGHT; run(p, '班級：____ 座號：____ 姓名：________', size=11.5)
    tb.cell(0, 1).vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    m = tb.cell(1, 0).merge(tb.cell(1, 1)); run(m.paragraphs[0], '任務進度：□第一關：圖文連連看(一) □第二關：圖文連連看(二) □第三關：句子選選看 □第四關：生活小玩家', False, NAVY, 9.5)
    d.add_paragraph()
    widths = [Mm(38), Mm(15), Mm(34), Mm(15), Mm(82)]
    for gi, g in enumerate(groups):
        name = '一二'[gi]; h2(f'第{name}關：看圖連連看（{name}）')
        t = d.add_table(rows=4, cols=5); borders(t); t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for j, hd in enumerate(['情境圖片', '連線區', '成語', '連線區', '成語的意思']):
            c = t.cell(0, j); shade(c, 'DBEAFE'); p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER; run(p, hd, True, NAVY, 10)
        for r in range(3):
            cc, w, mm = g['cards'][r], g['idioms'][r], g['means'][r]
            row = t.rows[r + 1]; row.height = Mm(29)
            c = row.cells[0]; p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(str(pngs[cc]), width=Mm(28), height=Mm(21))
            p2 = c.add_paragraph(); p2.alignment = WD_ALIGN_PARAGRAPH.CENTER; run(p2, f'圖卡 {LETTERS[cc]} ', True, size=10); run(p2, '●', color=BLUE, size=10)
            shade(row.cells[1], 'F8FAFC'); shade(row.cells[3], 'F8FAFC')
            p = row.cells[2].paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run(p, '● ', color=BLUE, size=10); run(p, ids[w]['word'], True, size=13); run(p, ' ●', color=BLUE, size=10)
            p = row.cells[4].paragraphs[0]; run(p, '● ', color=BLUE, size=10); run(p, f'{mean_no[mm]}. ', size=11.5); rich(p, ids[mm]['meaning'], 11.5)
            for c in row.cells: c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        t.autofit = False
        for j, w_ in enumerate(widths):
            t.columns[j].width = w_
            for c in t.columns[j].cells: c.width = w_
        d.add_paragraph()
    d.add_page_break()
    h2('第三關：生活句子選選看')
    t = d.add_table(rows=3, cols=3); borders(t, '2563EB')
    m = t.cell(0, 0).merge(t.cell(0, 2)); run(m.paragraphs[0], '★ 成語百寶箱', True, NAVY, 12)
    for i, x in enumerate(ids):
        p = t.cell(1 + i // 3, i % 3).paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER; run(p, f'{CIRC[i]} {x["word"]}', True, NAVY, 12.5)
    d.add_paragraph()
    for j, k in enumerate(sent):
        p = d.add_paragraph(); p.paragraph_format.line_spacing = 1.75
        a, b = ids[k]['sentence'].split('（）')
        run(p, f'{j + 1}. {a}（　　　　　　　）{b}')
    d.add_paragraph()
    h2('第四關：生活小玩家', '選一種方式完成就可以囉！')
    p = d.add_paragraph(); run(p, '□ 方法一（半開放句型引導）', True, NAVY); run(p, '：選一句，把句子寫完整。')
    for f in q.get('frames', [])[:3]:
        p = d.add_paragraph(); p.paragraph_format.line_spacing = 2.0; p.paragraph_format.left_indent = Mm(5)
        for part in re.split(r'(「.+?」)', '• ' + re.sub(r'＿+', lambda m_: '＿' * len(m_.group(0)) * 2, f['text'])):
            run(p, part, bold=part.startswith('「'))
    p = d.add_paragraph(); run(p, '□ 方法二（進階挑戰 — 自由選詞造句）', True, NAVY); run(p, '：任選一個成語，寫出 15 字以上的完整句子。')
    for _ in range(3):
        p = d.add_paragraph(); p.paragraph_format.line_spacing = 2.3; run(p, '＿' * 38, color=RGBColor(0x55, 0x55, 0x55))
    p = d.add_paragraph(); run(p, '□ 方法三（口語表達）', True, NAVY); run(p, '：選一個成語口頭造句，唸給老師或小老師聽。　聽眾簽名：________')
    d.add_paragraph()
    t = d.add_table(rows=1, cols=1); c = t.cell(0, 0); shade(c, 'EFF6FF')
    run(c.paragraphs[0], '自我／小老師檢查：□ 句子通順好懂　□ 成語意思用對了　　老師認證章：________', color=NAVY, size=11.5)
    d.save(path)


def write_prompts(q, path):
    lines = ['# 插圖提示詞（給 GPT／Gemini 網頁版自己生圖用）', '',
             '每張都加上這段共同風格：', '',
             '> 可愛、清楚的兒童繪本插圖，白色乾淨背景，4:3 橫式，主角大而清楚，畫面不要出現任何文字。', '',
             '生好後存成 `images/1.png`～`images/6.png`（或用成語命名，如 `images/畫蛇添足.png`），建置時加 `--images images`。', '']
    for i, x in enumerate(q['idioms']):
        lines += [f'## {i + 1}. {x["word"]}', '', x.get('prompt') or f'（請描述「{x["word"]}」的情境）', '']
    Path(path).write_text('\n'.join(lines), encoding='utf-8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('quest'); ap.add_argument('--out', default='.')
    ap.add_argument('--pdf', action='store_true'); ap.add_argument('--docx', action='store_true')
    ap.add_argument('--images', help='老師自己生的插圖資料夾（1.png～6.png 或 成語.png）')
    a = ap.parse_args()
    qpath = Path(a.quest).resolve(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    imgs_dir = Path(a.images).resolve() if a.images else None
    q = load_quest(qpath)
    groups, mean_no, sent = plan(q)
    imgs = [img_html(i, x, imgs_dir, qpath.parent) for i, x in enumerate(q['idioms'])]
    title = q.get('title', '成語圖文探險單')
    stu = build_student(q, groups, mean_no, sent, imgs)
    tea = build_teacher(q, groups, mean_no, sent)
    text = re.sub(r'<[^>]+>', '', stu + tea) + '任務進度班級座號姓名列印另存邊界選無教師版答案圖卡（）●★□•…—／：，。、！？「」①②③④⑤⑥'
    ff = font_face(text)
    sp = out / f'{title}.html'; tp = out / f'{title}_教師版.html'
    sp.write_text(page_shell(title, ff, stu), encoding='utf-8')
    tp.write_text(page_shell(title + '（教師版）', ff, tea), encoding='utf-8')
    print('✓', sp); print('✓', tp)
    write_prompts(q, out / '插圖提示詞.md')
    if a.pdf:
        for h in (sp, tp):
            steps, over = render_pdf(h, h.with_suffix('.pdf'))
            print('✓', h.with_suffix('.pdf'), f'（自動縮排 {steps} 次）' if steps else '')
            if over:
                print('⚠ 內容仍超出 A4，請縮短句子或意思文字')
    if a.docx:
        with tempfile.TemporaryDirectory() as td:
            pngs = art_pngs(q, imgs_dir, qpath.parent, Path(td))
            dp = out / f'{title}.docx'; build_docx(q, groups, mean_no, sent, pngs, dp); print('✓', dp)


if __name__ == '__main__':
    main()
