const STOP = new Set(`a an the and or but if then than to of in on for with at by from up about into over after before is are was were be been being i me my mine we our ours you your yours he she they them it its this that these those do does did doing have has had having can could should would may might will just very really so not no yes as when where why how what who which their there here out more most some any each other such only own same too also`.split(/\s+/));
const POWER = new Set(`actually absurd avoid best broke build changed costly crazy dead difficult easy failed fastest fix hidden insane learned mistake never problem proof secret simple system terrible truth useful waste weird win wrong`.split(/\s+/));
const CONTRAST = /\b(but|however|instead|except|yet|although|actually|turns out|the problem|the mistake|what changed|rather than)\b/i;
const SAMPLE = `I kept wasting an hour turning one training session into one short video. The workout itself was easy compared with finding the useful moment, writing a hook, making a title, and deciding what to post next. The weird part is that the raw material was already there. I had a voice note explaining why my swim technique collapsed after ten metres because I panicked and my legs sank. That one observation could become five different clips, but I was treating every post like a blank page. So I started thinking about content as an operations problem instead of a creativity problem. The system should find specific moments, rank them, package them, and leave the human to decide what is actually worth saying. If a tool can turn thirty minutes of raw transcript into a ranked queue in ten seconds, the bottleneck changes completely. You stop asking what should I post and start asking which useful thing should I publish first.`;
let latest = null;

const $ = id => document.getElementById(id);
const cleanWords = text => text.toLowerCase().replace(/[^a-z0-9'\s-]/g,' ').split(/\s+/).filter(Boolean);
const clamp = (v,min=0,max=100) => Math.max(min,Math.min(max,v));

function sentences(text){
  return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[]).map(s=>s.trim()).filter(s=>s.split(/\s+/).length>=4);
}

function keywords(text, limit=14){
  const counts = new Map();
  for(const w of cleanWords(text)){
    if(w.length<4 || STOP.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w,(counts.get(w)||0)+1);
  }
  return [...counts.entries()].sort((a,b)=>b[1]-a[1] || b[0].length-a[0].length).slice(0,limit).map(([word,count])=>({word,count}));
}

function sentenceScore(s, idx, total){
  const words = cleanWords(s); let score=18;
  const len=words.length;
  if(len>=8&&len<=26) score+=16; else if(len<=38) score+=8;
  if(/[?]/.test(s)) score+=8;
  if(/\d/.test(s)) score+=10;
  if(CONTRAST.test(s)) score+=12;
  score += Math.min(18, words.filter(w=>POWER.has(w)).length*5);
  const specificity = words.filter(w=>w.length>7).length/Math.max(1,len);
  score += Math.min(10,specificity*35);
  if(idx < Math.max(2,total*.18)) score+=5;
  if(/\b(I|we|my|our)\b/.test(s)) score+=4;
  if(/\b(because|therefore|means|so that|which is why)\b/i.test(s)) score+=6;
  return Math.round(clamp(score));
}

function buildClips(ss, count){
  const ranked = ss.map((text,i)=>({text,i,score:sentenceScore(text,i,ss.length)})).sort((a,b)=>b.score-a.score);
  const picked=[];
  for(const item of ranked){
    if(picked.some(p=>Math.abs(p.i-item.i)<=1)) continue;
    const start=Math.max(0,item.i-1), end=Math.min(ss.length,item.i+2);
    const body=ss.slice(start,end).join(' ');
    const kws=keywords(body,4).map(k=>k.word);
    picked.push({...item,start,end,body,kws});
    if(picked.length>=count) break;
  }
  return picked.map((p,n)=>({...p,rank:n+1,...packageClip(p,n)}));
}

function titleCase(s){return s.replace(/\b\w/g,c=>c.toUpperCase())}
function packageClip(p,n){
  const k=p.kws[0]||'this';
  const patterns=[
    `The ${titleCase(k)} Problem Nobody Notices`,
    `Why ${titleCase(k)} Changes the Whole Workflow`,
    `I Was Solving ${titleCase(k)} the Wrong Way`,
    `The Fastest Way to Rethink ${titleCase(k)}`,
    `${titleCase(k)}: The Part That Actually Matters`
  ];
  const hook=p.text.replace(/^["“]|["”]$/g,'').slice(0,150);
  const caption=`${hook}${hook.endsWith('.')?'':'.'}\n\nThe useful part is not making more content. It is finding the strongest signal in what you already said and packaging it clearly.`;
  return {title:patterns[n%patterns.length],hook,caption,hashtags:p.kws.slice(0,4).map(x=>`#${x.replace(/-/g,'')}`)};
}

function diagnostics(text, ss, kws, clips){
  const words=cleanWords(text); const unique=new Set(words);
  const hookDensity=clamp(Math.round(clips.reduce((a,c)=>a+c.score,0)/Math.max(1,clips.length)));
  const specificity=clamp(Math.round((words.filter(w=>/\d/.test(w)||w.length>=8).length/Math.max(1,words.length))*280));
  const avg=words.length/Math.max(1,ss.length); const clarity=clamp(Math.round(100-Math.abs(avg-17)*3));
  const top=kws.slice(0,5).reduce((a,k)=>a+k.count,0); const focus=clamp(Math.round(top/Math.max(1,words.length)*420));
  const lexical=unique.size/Math.max(1,words.length);
  const overall=clamp(Math.round(hookDensity*.38+specificity*.22+clarity*.22+focus*.13+lexical*100*.05));
  let diagnosis='Strong source. The next bottleneck is packaging and distribution, not inventing more ideas.';
  if(overall<55) diagnosis='The source is usable, but it needs more concrete details, contrast, numbers, or causal explanations before clipping.';
  else if(specificity<45) diagnosis='Good structure, low specificity. Add numbers, examples, failures, constraints, or named decisions to make clips less generic.';
  else if(clarity<55) diagnosis='The ideas are there, but sentences are long. Shorter causal statements will create cleaner hooks and captions.';
  return {overall,hookDensity,specificity,clarity,focus,diagnosis};
}

function schedule(clips, platform){
  const days=['Mon','Wed','Fri','Sun','Tue','Thu','Sat'];
  return clips.map((c,i)=>({day:days[i%days.length],item:c.title,slot:platform==='LinkedIn'?'09:00':'18:30',score:c.score}));
}

function analyze(){
  const text=$('transcript').value.trim();
  if(text.length<120){$('sourceMeta').textContent='Add at least ~120 characters so there is enough signal to rank.';return;}
  const ss=sentences(text), wordCount=cleanWords(text).length, kws=keywords(text), count=Number($('clipCount').value), clips=buildClips(ss,count), platform=$('platform').value, diag=diagnostics(text,ss,kws,clips);
  latest={generatedAt:new Date().toISOString(),platform,wordCount,sentenceCount:ss.length,diagnostics:diag,keywords:kws,clips,schedule:schedule(clips,platform)};
  render(latest);
}

function render(data){
  $('sourceMeta').textContent=`${data.wordCount} words · ${data.sentenceCount} sentences · ${data.clips.length} ranked opportunities · processed locally`;
  $('overallScore').textContent=data.diagnostics.overall;
  $('hookDensity').textContent=`${data.diagnostics.hookDensity}/100`;
  $('specificity').textContent=`${data.diagnostics.specificity}/100`;
  $('clarity').textContent=`${data.diagnostics.clarity}/100`;
  $('focus').textContent=`${data.diagnostics.focus}/100`;
  $('diagnosis').textContent=data.diagnostics.diagnosis;
  $('clips').innerHTML=data.clips.map(c=>`<article class="clip"><div class="clip-rank">0${c.rank}</div><div class="clip-score">SIGNAL ${c.score}/100</div><h3>${escapeHtml(c.title)}</h3><p class="quote">${escapeHtml(c.hook)}</p><p class="caption">${escapeHtml(c.caption.split('\n')[0])}</p><div class="mini"><span>sentences ${c.start+1}–${c.end}</span>${c.hashtags.map(h=>`<span>${escapeHtml(h)}</span>`).join('')}</div></article>`).join('');
  $('keywords').innerHTML=data.keywords.map(k=>`<span>${escapeHtml(k.word)} · ${k.count}</span>`).join('');
  $('schedule').innerHTML=data.schedule.map(s=>`<div class="schedule-item"><b>${s.day} ${s.slot}</b><span>${escapeHtml(s.item)}</span><em>${s.score}/100</em></div>`).join('');
  $('results').classList.remove('hidden');
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function exportJson(){if(!latest)return;const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='contentops-output.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
async function copySummary(){if(!latest)return;const s=latest.clips.map(c=>`${c.rank}. ${c.title}\nHook: ${c.hook}`).join('\n\n');await navigator.clipboard.writeText(s);$('copyBtn').textContent='Copied';setTimeout(()=>$('copyBtn').textContent='Copy summary',1200);}
$('sampleBtn').addEventListener('click',()=>{$('transcript').value=SAMPLE;$('sourceMeta').textContent='Sample loaded. Run the engine.';});
$('analyzeBtn').addEventListener('click',analyze);$('exportBtn').addEventListener('click',exportJson);$('copyBtn').addEventListener('click',copySummary);
