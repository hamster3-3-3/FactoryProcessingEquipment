'use strict';
const db=window.DATABASE, rows=db.records, $=s=>document.querySelector(s);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>typeof n==='number'?new Intl.NumberFormat('zh-TW',{maximumFractionDigits:6}).format(n):String(n??'—');
const schema=[
 {key:'temp',label:'溫層',options:['18℃','4℃','冷凍']},
 {key:'subtype',label:'4℃ 分類',options:['麵','飯','其他']},
 {key:'status',label:'商品狀態',options:['上架','待上架','下架','未標示']},
 {key:'factory',label:'工廠',options:['晉欣','新豐','大溪','長家']},
 {key:'equipment',label:'使用設備',options:db.equipment},
 {key:'category',label:'品類',options:[...new Set(rows.map(r=>r.category))].sort((a,b)=>a.localeCompare(b,'zh-Hant'))}
];
const state=Object.fromEntries(schema.map(g=>[g.key,new Set(g.options)]));
let filtered=[],page=1,pageSize=30;
const quantity=r=>r.amount===null||r.amount===''?'—':`${fmt(r.amount)}${r.unit?' '+r.unit:''}`;
const rate=r=>r.yieldRate===null?'—':typeof r.yieldRate==='number'?fmt(r.yieldRate)+'%':r.yieldRate;
function isColdEnabled(){return state.temp.has('4℃');}
function filtersUI(){
 $('#filter-groups').innerHTML=schema.map((g,index)=>{
  const disabled=g.key==='subtype'&&!isColdEnabled();
  return `<section class="filter-group${disabled?' disabled':''}" data-group="${g.key}"><div class="group-head"><h3><span class="step">${String(index+1).padStart(2,'0')}</span>${g.label}</h3><div class="group-actions"><button data-action="all" ${disabled?'disabled':''}>全選</button><button data-action="none" ${disabled?'disabled':''}>清空</button></div></div><div class="options${g.key==='category'?' category-options':''}">${g.options.map((o,i)=>`<button class="option${g.key==='factory'?' counted':''}" data-option="${i}" aria-pressed="${state[g.key].has(o)}" ${disabled?'disabled':''}><span><span class="tick">✓</span> ${escapeHTML(o)}</span>${g.key==='factory'?`<span class="count">${rows.filter(r=>r.factory===o).length}</span>`:''}</button>`).join('')}</div></section>`;
 }).join('');
 const active=schema.filter(g=>g.key!=='subtype'||isColdEnabled()).filter(g=>state[g.key].size!==g.options.length);
 $('#active-filters').innerHTML=active.map(g=>`<button class="active-tag" data-clear="${g.key}">${g.label}：${state[g.key].size?escapeHTML([...state[g.key]].join('、')):'未選擇'} ×</button>`).join('');
}
function update(resetPage=true){
 if(resetPage)page=1;
 const query=$('#search').value;
 filtered=rows.filter(r=>DBFilters.matches(r,state,query));
 const sort=$('#sort').value;
 if(sort==='yield-desc')filtered.sort((a,b)=>(typeof b.yieldRate==='number'?b.yieldRate:-Infinity)-(typeof a.yieldRate==='number'?a.yieldRate:-Infinity));
 else if(sort!=='source')filtered.sort((a,b)=>a[sort].localeCompare(b[sort],'zh-Hant')||a.product.localeCompare(b.product,'zh-Hant'));
 $('#record-count').textContent=fmt(filtered.length);
 $('#product-count').textContent=fmt(new Set(filtered.map(r=>JSON.stringify([r.factory,r.product]))).size);
 $('#half-count').textContent=fmt(new Set(filtered.map(r=>r.half)).size);
 $('#factory-count').textContent=new Set(filtered.map(r=>r.factory)).size;
 $('#result-summary').textContent=`共 ${fmt(filtered.length)} 筆符合條件；同名半成品保留各商品對應資料`;
 filtersUI();render();
}
function render(){
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);
 const start=(page-1)*pageSize, slice=filtered.slice(start,start+pageSize);
 $('#rows').innerHTML=slice.map(r=>{
  const statusClass=({上架:'status-up',待上架:'status-wait',下架:'status-down'})[r.status]||'';
  const neutral=r.check==='OK'||r.check.includes('免調理');
  return `<tr><td><button class="half-link" data-id="${escapeHTML(r.id)}">${escapeHTML(r.half)}</button><span class="product-name">${escapeHTML(r.product)}</span></td><td><b>${escapeHTML(r.factory)}</b><span class="secondary-text">${escapeHTML(r.temp+(r.subtype?' · '+r.subtype:''))}</span></td><td>${escapeHTML(r.category)}<span class="secondary-text"><span class="badge ${statusClass}">${r.status}</span></span></td><td><div class="equipment">${r.equipment.length?r.equipment.map(e=>`<span class="badge">${escapeHTML(e)}</span>`).join(''):'<span class="secondary-text">未填設備</span>'}</div></td><td class="number">${escapeHTML(quantity(r))}</td><td class="number">${escapeHTML(rate(r))}</td><td><span class="risk-label${neutral?' neutral':''}">${escapeHTML(r.check||'未填檢核結果')}</span><span class="risk-text">${escapeHTML(r.risk||'未填風險說明')}</span></td></tr>`;
 }).join('');
 $('#empty').hidden=filtered.length!==0;
 $('#range').textContent=filtered.length?`顯示 ${start+1}–${Math.min(start+pageSize,filtered.length)} 筆，共 ${fmt(filtered.length)} 筆`:'共 0 筆';
 $('#page-info').textContent=`${page} / ${pages}`;
 $('#prev').disabled=page<=1;$('#next').disabled=page>=pages;
}
function reset(){for(const g of schema)state[g.key]=new Set(g.options);$('#search').value='';$('#sort').value='source';update();}
$('#filter-groups').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 const key=button.closest('[data-group]').dataset.group,g=schema.find(g=>g.key===key);
 if(button.dataset.action==='all')state[key]=new Set(g.options);
 else if(button.dataset.action==='none')state[key]=new Set();
 else if(button.dataset.option!==undefined){const o=g.options[Number(button.dataset.option)];state[key].has(o)?state[key].delete(o):state[key].add(o);}
 update();
});
$('#active-filters').addEventListener('click',event=>{const b=event.target.closest('[data-clear]');if(b){const g=schema.find(g=>g.key===b.dataset.clear);state[g.key]=new Set(g.options);update();}});
$('#reset').onclick=reset;$('#empty-reset').onclick=reset;
$('#search').oninput=()=>update();$('#sort').onchange=()=>update();
$('#page-size').onchange=()=>{pageSize=Number($('#page-size').value);page=1;render();};
$('#prev').onclick=()=>{page--;render();};$('#next').onclick=()=>{page++;render();};
function dialog(title,content){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=content;$('#detail').showModal();}
$('#close-dialog').onclick=()=>$('#detail').close();
$('#detail').onclick=e=>{if(e.target===$('#detail')){const rect=e.target.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)e.target.close();}};
$('#rows').onclick=event=>{
 const button=event.target.closest('[data-id]');if(!button)return;
 const r=rows.find(r=>r.id===button.dataset.id);
 const fields=[['對應商品',r.product],['工廠',r.factory],['溫層',r.temp+(r.subtype?' · '+r.subtype:'')],['品類',r.category],['商品狀態',r.status+(r.rawStatus&&r.rawStatus!==r.status?'（原始：'+r.rawStatus+'）':'')],['單位用量',quantity(r)],['製成率',rate(r)],['使用設備',r.equipment.join('、')||'未填'],['檢核結果',r.check||'未填'],['風險說明',r.risk||'未填'],['備註',r.note||'—'],['來源檔案',r.source],['來源位置',`${r.sheet} · 第 ${r.row} 列`]];
 dialog(r.half,'<dl>'+fields.map(([k,v])=>`<dt>${k}</dt><dd>${escapeHTML(v)}</dd>`).join('')+'</dl>');
};
$('#source-open').onclick=()=>dialog('來源與資料說明',`<table class="source-table"><thead><tr><th>工廠</th><th>18℃</th><th>4℃飯</th><th>4℃麵</th><th>4℃其他</th><th>冷凍</th></tr></thead><tbody>${db.sources.map(s=>`<tr><td>${s.factory}</td>${['18℃','4℃飯','4℃麵','4℃其他','冷凍品'].map(k=>`<td>${s.sheets[k]}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="source-note">原始「架上」統一顯示為「上架」。空白、未設狀態欄及「-」顯示為「未標示」，共 ${rows.filter(r=>r.status==='未標示').length} 筆。<br>製成率依 Excel 儲存格的百分比格式轉換，保留原始數值意義，包括超過 100% 的資料。<br>4℃ 的麵／飯／其他依原始分頁分類，不改動商品品類。風險說明沿用來源檔案內容。</p><p class="source-files">匯入日期：${db.importedAt}<br>${db.sources.map(s=>escapeHTML(s.file)).join('<br>')}</p>`);
$('#export').onclick=()=>{
 const columns=[['半成品名稱',r=>r.half],['商品名稱',r=>r.product],['工廠',r=>r.factory],['溫層',r=>r.temp],['4℃分類',r=>r.subtype],['品類',r=>r.category],['狀態',r=>r.status],['單位用量',r=>r.amount??''],['單位',r=>r.unit],['製成率',rate],['使用設備',r=>r.equipment.join('、')],['檢核結果',r=>r.check],['風險說明',r=>r.risk],['來源檔案',r=>r.source],['來源分頁',r=>r.sheet],['來源列',r=>r.row]];
 const csvCell=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
 const csv='\uFEFF'+[columns.map(c=>c[0]),...filtered.map(r=>columns.map(c=>c[1](r)))].map(a=>a.map(csvCell).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='半成品設備_篩選結果.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#detail').open){e.preventDefault();$('#search').focus();}});
$('#total').textContent=fmt(rows.length);
$('#edition').textContent=`四廠整合 · 資料更新 ${db.importedAt}`;
$('#source-date').textContent=`最近轉換：${db.importedAt}`;
update();
