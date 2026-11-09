from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
from collections import deque
src=Image.open('C:/WINDOWS/TEMP/codex-clipboard-29a3bd9a-f26c-4593-9a75-ac592403b8ce.png').convert('RGBA')
out=Path('assets/generated/original-icons');out.mkdir(exist_ok=True)
regions={'like':(67,27,155,90),'heart':(65,100,135,158),'beer':(65,163,134,228),'lollipop':(66,234,132,303)}
icons={}
for name,rect in regions.items():
 im=src.crop(rect);pix=im.load();w,h=im.size
 # Remove only connected beige background; retain original icon RGB pixels unchanged.
 seen=set();todo=deque([(x,y) for x in range(w) for y in [0,h-1]]+[(x,y) for y in range(h) for x in [0,w-1]])
 while todo:
  x,y=todo.popleft()
  if (x,y) in seen or not(0<=x<w and 0<=y<h):continue
  seen.add((x,y));r,g,b,a=pix[x,y]
  if 110<r<210 and 90<g<185 and 65<b<160 and 7<r-g<45 and 8<g-b<48:
   pix[x,y]=(r,g,b,0);todo.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
 im.save(out/(name+'.png'));icons[name]=im
canvas=Image.new('RGBA',(540,310),(0,0,0,0));d=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc',35)
for i,(name,text) in enumerate([('like','打印一张小图'),('heart','打印大图一张'),('beer','打印大图两张'),('lollipop','打印大图三张')]):
 im=icons[name];y=8+i*75;canvas.alpha_composite(im,((100-im.width)//2,y+(70-im.height)//2));d.text((106,y+10),text,font=font,fill='#ffe543',stroke_width=2,stroke_fill='#1e1c12')
canvas.save('assets/generated/live-rules-exact.png')
p=Path('index.html');s=p.read_text(encoding='utf-8').replace('./assets/generated/live-rules.png','./assets/generated/live-rules-exact.png');p.write_text(s,encoding='utf-8')
print('Original screenshot pixels preserved; four crops saved and rule PNG replaced.')
