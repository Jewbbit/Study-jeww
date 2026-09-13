from pathlib import Path
import subprocess, sys

p=Path('edit.html')
html=p.read_text(encoding='utf-8')
old="""      if((app.ui.workspace||'memory')!=='curriculum')openCurriculumWorkspace();
      if(curriculumData){"""
new="""      if((app.ui.workspace||'memory')!=='curriculum')openCurriculumWorkspace();
      /* openCurriculumWorkspace() selects the curriculum outline tab; restore the requested independent standards tab. */
      widePlannerSideTab='standards';
      if(curriculumData){"""
if new in html:
    print('standards workspace handoff already fixed')
elif old in html:
    html=html.replace(old,new,1)
    p.write_text(html,encoding='utf-8')
    print('fixed standards workspace handoff')
else:
    raise SystemExit('standards workspace handoff marker not found')

text=p.read_text(encoding='utf-8')
s=text.find('<script type="module">')
if s<0: raise SystemExit('main module not found')
s+=len('<script type="module">')
e=text.find('</script>',s)
if e<0: raise SystemExit('main module end not found')
Path('/tmp/study-module.mjs').write_text(text[s:e],encoding='utf-8')
r=subprocess.run(['node','--check','/tmp/study-module.mjs'],capture_output=True,text=True)
if r.returncode:
    print(r.stdout);print(r.stderr,file=sys.stderr);raise SystemExit(r.returncode)
print('module syntax OK after workspace handoff fix')
