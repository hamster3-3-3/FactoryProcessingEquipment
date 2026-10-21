const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),db=JSON.parse(fs.readFileSync(path.join(root,'data-json/data.json'),'utf8'));
const {matches}=require('../filters.js'),rs=db.records;
assert.ok(rs.length>0);assert.equal(new Set(rs.map(r=>r.id)).size,rs.length);assert.equal(db.sources.length,4);
for(const s of db.sources){assert.equal(rs.filter(r=>r.factory===s.factory).length,Object.values(s.sheets).reduce((a,b)=>a+b,0));for(const [sheet,n]of Object.entries(s.sheets))assert.equal(rs.filter(r=>r.factory===s.factory&&r.sheet===sheet).length,n);}
assert.equal(rs.filter(r=>matches(r,{})).length,rs.length);
assert.equal(rs.filter(r=>matches(r,{temp:new Set()})).length,0);
assert.equal(rs.filter(r=>matches(r,{temp:new Set(['18℃']),subtype:new Set()})).length,rs.filter(r=>r.temp==='18℃').length);
assert.equal(rs.filter(r=>matches(r,{temp:new Set(['18℃','4℃']),subtype:new Set(['麵'])})).length,rs.filter(r=>r.temp==='18℃'||r.sheet==='4℃麵').length);
assert.equal(rs.filter(r=>matches(r,{equipment:new Set(['炊飯','烤箱'])})).length,rs.filter(r=>r.equipment.includes('炊飯')||r.equipment.includes('烤箱')).length);
const combined={temp:new Set(['4℃']),subtype:new Set(['飯']),factory:new Set(['晉欣','大溪']),status:new Set(['上架']),equipment:new Set(['炊飯','烤箱'])};
assert.equal(rs.filter(r=>matches(r,combined)).length,rs.filter(r=>r.sheet==='4℃飯'&&['晉欣','大溪'].includes(r.factory)&&r.status==='上架'&&r.equipment.some(x=>['炊飯','烤箱'].includes(x))).length);
for(const r of rs){assert.ok(r.product&&r.half&&r.factory);assert.ok(r.equipment.every(x=>db.equipment.includes(x)));assert.ok(['上架','下架','待上架','未標示'].includes(r.status));if(typeof r.rawYield==='number')assert.equal(r.yieldRate,Math.round(r.rawYield*(r.yieldFormat.split('\\%').join('').includes('%')?100:1)*1e6)/1e6);}
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data-json/data.js'),'utf8'),context);
assert.equal(JSON.stringify(context.window.DATABASE),JSON.stringify(db));
const fixture={temp:'4℃',subtype:'麵',factory:'晉欣',status:'上架',category:'義大利麵',product:'奶油培根義大利麵',half:'測試白醬',risk:'單一設備依賴',equipment:['二重釜','烤箱']};
assert.ok(matches(fixture,{factory:new Set(['晉欣','大溪']),equipment:new Set(['烤箱','炊飯'])},'奶油 白醬'));
assert.equal(matches(fixture,{factory:new Set(['新豐'])}),false);assert.equal(matches(fixture,{},'不存在關鍵字'),false);
console.log('PASS: '+rs.length+' records; dynamic source totals; percent conversion; multi-select; 4℃ scope; search; JSON/JS consistency.');
