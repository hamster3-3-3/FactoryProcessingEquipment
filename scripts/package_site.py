"""Only publish browser assets; Excel source files stay in the repository."""
from pathlib import Path
import shutil
import hashlib
root = Path(__file__).resolve().parent.parent
out = root / '_site'
if out.exists(): shutil.rmtree(out)
out.mkdir()
for name in ['index.html','style.css','app.js','filters.js','.nojekyll']:
    shutil.copy2(root/name, out/name)
shutil.copytree(root/'data-json',out/'data-json')
page=(out/'index.html').read_text(encoding='utf-8')
for name in ['style.css','data-json/data.js','filters.js','app.js']:
    version=hashlib.sha256((out/name).read_bytes()).hexdigest()[:12]
    page=page.replace('"'+name+'"','"'+name+'?v='+version+'"')
(out/'index.html').write_text(page,encoding='utf-8')
print('Website packaged:', out)
