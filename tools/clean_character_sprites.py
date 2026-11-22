from pathlib import Path
from PIL import Image, ImageOps
import base64, io, json, shutil

ROOT = Path(__file__).resolve().parents[1]
YIYO = ROOT / 'game/assets/sprites/newchars/yiyo'
MANUELIN = ROOT / 'game/assets/sprites'
BACKUP = ROOT / '.sprite-backup-20261121'

if not BACKUP.exists():
    BACKUP.mkdir()
    shutil.copytree(YIYO, BACKUP / 'yiyo')
    shutil.copy(ROOT / 'game/game.js', BACKUP / 'game.js')
    shutil.copy(MANUELIN / 'manuelin-normal.png', BACKUP / 'manuelin-normal.png')


def components(im, threshold=8):
    a = im.getchannel('A')
    w, h = im.size
    px = a.load(); seen = set(); out = []
    for y in range(h):
        for x in range(w):
            if px[x, y] <= threshold or (x, y) in seen:
                continue
            stack = [(x, y)]; seen.add((x, y)); coords = []
            while stack:
                xx, yy = stack.pop(); coords.append((xx, yy))
                for nx, ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny] > threshold and (nx, ny) not in seen:
                        seen.add((nx, ny)); stack.append((nx, ny))
            out.append(coords)
    return out


def clean_crop(im, min_component=10, pad=3, target_size=None):
    im = im.convert('RGBA')
    mask = Image.new('L', im.size, 0)
    mp = mask.load()
    for comp in components(im):
        if len(comp) >= min_component:
            for x, y in comp:
                mp[x, y] = im.getpixel((x, y))[3]
    im.putalpha(mask)
    box = mask.getbbox()
    if not box:
        return im
    l, t, r, b = box
    l, t, r, b = max(0, l-pad), max(0, t-pad), min(im.width, r+pad), min(im.height, b+pad)
    im = im.crop((l, t, r, b))
    if target_size:
        scale = min(target_size[0] / im.width, target_size[1] / im.height, 1.0)
        if scale < 1:
            im = im.resize((max(1, round(im.width*scale)), max(1, round(im.height*scale))), Image.Resampling.NEAREST)
    return im

# Yiyo: remove only tiny disconnected specks, preserve attack effects and the main silhouette.
for p in sorted(YIYO.glob('yiyo-*.png')):
    clean_crop(Image.open(p), min_component=10, pad=3).save(p)

# Read embedded Manuelín frames. The external resource is used as an existing guard pose.
js = (ROOT / 'game/game.js').read_text(errors='replace')
pos = js.index('const SPRITE_DATA = ') + len('const SPRITE_DATA = ')
data, _ = json.JSONDecoder().raw_decode(js[pos:])
frames = []
for src in data['manuelin']:
    raw = base64.b64decode(src.split(',', 1)[1])
    frames.append(Image.open(io.BytesIO(raw)).convert('RGBA'))

# New movement 1: clean/crop the existing raised-hands guard artwork.
guard = clean_crop(Image.open(MANUELIN / 'manuelin-normal.png'), min_component=10, pad=4, target_size=(230, 235))
guard.save(MANUELIN / 'manuelin-guard.png')

# New movement 2: reverse kick variant from Manuelín's existing kick frame, with a subtle
# uniform reduction so it reads as a distinct counter-direction movement.
kick = ImageOps.mirror(clean_crop(frames[4], min_component=4, pad=3))
kick = kick.resize((round(kick.width * 0.94), round(kick.height * 0.94)), Image.Resampling.NEAREST)
kick.save(MANUELIN / 'manuelin-kick-reverse.png')

print('Yiyo cleaned:', len(list(YIYO.glob('yiyo-*.png'))))
for p in (MANUELIN/'manuelin-guard.png', MANUELIN/'manuelin-kick-reverse.png'):
    im = Image.open(p); print(p.name, im.size, im.getchannel('A').getbbox())
