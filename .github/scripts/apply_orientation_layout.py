from pathlib import Path
import re

p=Path('edit.html')
s=p.read_text(encoding='utf-8')

old='function hasPermanentSidePanel(){return window.matchMedia("(min-width:900px) and (min-height:600px) and (orientation:landscape)").matches}'
new='function hasPermanentSidePanel(){return window.innerWidth>window.innerHeight}'
if old not in s:
    raise SystemExit('permanent side panel target missing')
s=s.replace(old,new,1)

old='@media (min-width:900px) and (min-height:600px) and (orientation:landscape){'
if old not in s:
    raise SystemExit('desktop side media target missing')
s=s.replace(old,'@media (orientation:landscape){')

old='@media(max-width:899px), (orientation:portrait) and (max-width:1024px){'
if old not in s:
    raise SystemExit('mobile mission media target missing')
s=s.replace(old,'@media (orientation:portrait){')

s,n640=re.subn(r'@media\s*\(\s*max-width\s*:\s*640px\s*\)', '@media (orientation:portrait)', s)
if n640<1:
    raise SystemExit('phone media targets missing')

s,n699=re.subn(r'\(max-width:699px\)', '(orientation:portrait)', s)
if n699<1:
    raise SystemExit('compact 699 targets missing')

s=s.replace('@media(min-width:641px) and (max-width:1100px){','@media(orientation:landscape) and (max-width:1100px){')
s=s.replace('@media (min-width:641px) and (max-width:1024px){','@media (orientation:landscape) and (max-width:1024px){')
s=s.replace('@media (min-width:641px){','@media (orientation:landscape){')
s=s.replace('@media(min-width:700px) and (min-height:600px){','@media(orientation:landscape){')
s=s.replace('@media (min-width:700px) and (min-height:600px){','@media (orientation:landscape){')

old='function thumbKeypadShouldShow(){\n  return window.innerWidth>=700'
new='function thumbKeypadShouldShow(){\n  return window.innerWidth>window.innerHeight'
if old not in s:
    raise SystemExit('thumb keypad layout target missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
w=re.sub(r'const CACHE_NAME="[^"]+";','const CACHE_NAME="study-jew-pwa-v37-orientation-layout";',w,count=1)
w=w.replace('./runtime/curriculum-ui.js?v=20261001-1','./runtime/curriculum-ui.js?v=20261001-2')
sw.write_text(w,encoding='utf-8')

check=p.read_text(encoding='utf-8')
assert 'function hasPermanentSidePanel(){return window.innerWidth>window.innerHeight}' in check
assert '@media (orientation:portrait){' in check
assert '@media (orientation:landscape){' in check
assert 'return window.innerWidth>window.innerHeight\n    &&app.ui.workspace==="bank"' in check
assert '(max-width:699px)' not in check
