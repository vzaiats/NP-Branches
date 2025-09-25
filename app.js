const Pagination_Items = 10;
const branchesEl = document.getElementById('branches');
const paginationEl = document.getElementById('pagination');

const state = { 
  page: 1,
  perPage: Pagination_Items,
  items: NOVA_POSTS.slice()
};

// Parsing (title, address, phone, schedule1, schedule2)
function parseRawLine(line){
  const [head, ...rest] = line.split(':');
  const restStr = rest.join(':').trim();
  const headFull = head.trim();

  // Extract phone number from the string
  const phoneMatch = restStr.match(/\+?\d[\d\-\s()]{6,}\d/);
  let phone='', beforePhone=restStr, schedules='';
  
  if(phoneMatch){
    phone = phoneMatch[0].trim();
    const idx = restStr.indexOf(phone);
    beforePhone = restStr.slice(0, idx).replace(/[,;]\s*$/,'').trim();
    schedules = restStr.slice(idx + phone.length).replace(/^,?\s*/,'').trim();
  } else {
    const parts = restStr.split(',').map(p=>p.trim()).filter(Boolean);
    if(parts.length>=2){
      phone = parts[parts.length-2];
      schedules = parts.slice(parts.length-1).join(', ');
      beforePhone = parts.slice(0, parts.length-2).join(', ');
    } else beforePhone = restStr;
    beforePhone = beforePhone.replace(/[,;]\s*$/,'').trim();
  }

  // Combine address with prefix
  let address = headFull;
  if(beforePhone) address += ': ' + beforePhone.replace(/[,\s]+$/,'');

  let [schedule1='', ...restSchedules] = schedules.split(',').map(s=>s.trim());
  let schedule2 = restSchedules.join(', ');

  return { title: headFull, address, phone, schedule1, schedule2 };
}

// Template for branch row
function rowTemplate(parsed, index, labelText){
  return `
    <div class="col-branch">${labelText}</div>
    <div class="col-address">${parsed.address}</div>
    <div class="col-schedule">${[parsed.schedule1, parsed.schedule2].filter(Boolean).join('<br/>')}</div>
    <div class="col-phone">${parsed.phone}</div>
    <div class="mobile-table">
      <div class="mobile-label">${labelText}</div>
      <div class="mobile-address">${parsed.address}</div>
      <div class="mobile-empty"></div>
      <div class="mobile-bottom">
        <div class="mobile-schedule">${[parsed.schedule1, parsed.schedule2].filter(Boolean).join('<br/>')}</div>
        <div class="mobile-phone">${parsed.phone}</div>
      </div>
    </div>
  `;
}

// Create a branch row
function createRow(parsed, index, isPostomat){
  const labelText = isPostomat ? `Поштомат ${index}` : `Відділення ${index}`;

  const row = document.createElement('div');
  row.className = 'branch-row';
  row.innerHTML = rowTemplate(parsed, index, labelText);

  return row;
}

// Render page
function render(){
  const start = (state.page-1)*state.perPage;
  const pageItems = state.items.slice(start, start+state.perPage);

  Array.from(branchesEl.children).forEach(c=>{
    if(!c.classList.contains('desktop-header')) c.remove();
  });

  let branchCounter = 1;
  let postomatCounter = 1;

  const prevItems = state.items.slice(0, start);
  prevItems.forEach(line=>{
    const parsed = parseRawLine(line);
    const isPostomat = ((parsed.title || '') + ' ' + (parsed.address || '')).toLowerCase().includes('поштомат');
    if(isPostomat) postomatCounter++;
    else branchCounter++;
  });

  // Render new rows
  pageItems.forEach((line)=>{
    const parsed = parseRawLine(line);
    const isPostomat = ((parsed.title || '') + ' ' + (parsed.address || '')).toLowerCase().includes('поштомат');

    let index;
    if(isPostomat){
      index = postomatCounter++;
    } else {
      index = branchCounter++;
    }

    const row = createRow(parsed, index, isPostomat);
    branchesEl.appendChild(row);
  });

  renderPagination();
}

// Pagination range calculation
function getPageRange(current,total,maxButtons=5){
  const half=Math.floor(maxButtons/2);
  let start=Math.max(1,current-half);
  let end=Math.min(total,start+maxButtons-1);
  if(end-start+1<maxButtons) start=Math.max(1,end-maxButtons+1);
  const out=[];
  for(let i=start;i<=end;i++) out.push(i);
  return out;
}

// Render pagination
function renderPagination(){
  paginationEl.innerHTML='';
  const totalPages = Math.max(1, Math.ceil(state.items.length/state.perPage));

  // Prev button
  const prev = document.createElement('button');
  prev.className = 'button';
  prev.textContent = 'Назад';
  prev.disabled = state.page===1;
  prev.onclick = ()=>{if(state.page>1){state.page--; render();}};
  paginationEl.appendChild(prev);

  // Page buttons
  getPageRange(state.page,totalPages,5).forEach(p=>{
    const btn = document.createElement('button');
    btn.className = 'button' + (p===state.page?' active':'');
    btn.textContent = String(p);
    btn.onclick = ()=>{state.page=p; render();};
    paginationEl.appendChild(btn);
  });

  // Next button
  const next = document.createElement('button');
  next.className = 'button';
  next.textContent = 'Далі';
  next.disabled = state.page===totalPages;
  next.onclick = ()=>{if(state.page<totalPages){state.page++; render();}};
  paginationEl.appendChild(next);
}

render();
