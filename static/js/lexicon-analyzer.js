// static/js/lexicon-analyzer.js
// Versão cliente (MVP) - quick-win
(function(){
  // exemplo de lexicons iniciais
  const defaultLeft = {
    "desigualdade":1,"redistribuição":1,"direitos":0.8,"solidariedade":0.8,"estatais":0.6
  };
  const defaultRight = {
    "livre":1,"livre mercado":1,"meritocracia":0.8,"privatiza":0.9,"impostos":-0.6
  };

  function safeParseJSON(s){
    try { return JSON.parse(s); } catch(e){ return null; }
  }
  function normalizeTokens(text){
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'') 
      .replace(/https?:\/\/\S+/g,' ')
      .replace(/[^a-z0-9\s]/g,' ')
      .split(/\s+/).filter(Boolean);
  }

  function lexiconAnalyze(text, userLex){
    const tokens = normalizeTokens(text);
    const left = Object.assign({}, defaultLeft);
    const right = Object.assign({}, defaultRight);
    if(userLex && typeof userLex === 'object'){
      Object.keys(userLex).forEach(k=>{
        const w = Number(userLex[k]);
        if(!isFinite(w)) return;
        if(w > 0) left[k.toLowerCase()] = (left[k.toLowerCase()]||0) + Math.abs(w);
        if(w < 0) right[k.toLowerCase()] = (right[k.toLowerCase()]||0) + Math.abs(w);
      });
    }
    let scoreLeft = 0, scoreRight = 0;
    const highlights = {};
    tokens.forEach(t=>{
      if(left[t]) { scoreLeft += left[t]; highlights[t] = (highlights[t]||0)+left[t]; }
      if(right[t]) { scoreRight += right[t]; highlights[t] = (highlights[t]||0)-right[t]; }
    });
    const total = Math.abs(scoreLeft) + Math.abs(scoreRight) || 1;
    const bias = (scoreLeft - scoreRight) / total;
    const scorePct = Math.round(((bias + 1) / 2) * 100);
    return { score: scorePct, bias, left:scoreLeft, right:scoreRight, highlights };
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.querySelector('#analyze-button');
    const clear = document.querySelector('#clear-button');
    const ta = document.querySelector('#news-textarea');
    const userLexTa = document.querySelector('#user-lexicon');
    const resSection = document.querySelector('#results');
    const scoreEl = document.querySelector('#result-score');
    const labelEl = document.querySelector('#result-label');
    const detailsEl = document.querySelector('#result-details');
    const highlightsEl = document.querySelector('#result-highlights');
    const contrapointsList = document.querySelector('#contrapoints-list');

    btn && btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const text = ta.value || '';
      let userLex = safeParseJSON(userLexTa.value);
      const out = lexiconAnalyze(text, userLex);
      let label = 'Neutro';
      if(out.score > 60) label = 'Tendência ESQUERDA';
      else if(out.score < 40) label = 'Tendência DIREITA';
      scoreEl.innerText = out.score + '%';
      labelEl.innerText = label;
      detailsEl.innerText = `Contribuição — Esquerda: ${out.left.toFixed(2)} | Direita: ${out.right.toFixed(2)} | bias: ${out.bias.toFixed(3)}`;
      highlightsEl.innerHTML = Object.keys(out.highlights).slice(0,30).map(k=>{
        const v = out.highlights[k];
        return `<span title="${v.toFixed(2)}">${k}</span>`;
      }).join(', ');
      contrapointsList.innerHTML = '';
      ['Gazeta do Povo','Jovem Pan','Revista Oeste','Brasil Paralelo'].forEach(src=>{
        const li = document.createElement('li');
        li.innerText = src + ' — (exemplo de contraponto)';
        contrapointsList.appendChild(li);
      });
      resSection.style.display = 'block';
    });

    clear && clear.addEventListener('click', (e)=>{
      ta.value = '';
      userLexTa.value = '';
      document.querySelector('#results').style.display='none';
    });

    const feedbackLink = document.querySelector('#feedback-link');
    if(feedbackLink) feedbackLink.setAttribute('href','mailto:suporte@agente.ldm?subject=Feedback%20AGENTE%20LDM');
  });
})();
