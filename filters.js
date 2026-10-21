(function(root) {
  const GROUPS = ['temp','subtype','status','factory','equipment','category'];
  function matches(row,state,query='') {
    for (const key of GROUPS) {
      if (key==='subtype' && row.temp!=='4℃') continue;
      const chosen=state[key];
      if (!chosen) continue;
      if (key==='equipment') {if (!row.equipment.some(e=>chosen.has(e))) return false;}
      else if (!chosen.has(row[key])) return false;
    }
    const words=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const haystack=[row.half,row.product,row.category,row.factory,row.risk,...row.equipment].join(' ').toLocaleLowerCase();
    return words.every(word=>haystack.includes(word));
  }
  const api={GROUPS,matches};
  if(typeof module!=='undefined')module.exports=api; else root.DBFilters=api;
})(typeof window==='undefined'?globalThis:window);
