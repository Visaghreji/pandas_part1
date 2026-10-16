'use strict';
/* ===== Helpers ===== */
const $=(s,e=document)=>e.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const N=null;

/* ===== Datasets (all answers are computed from these) ===== */
const D={
 students:{cols:['Name','Age','Department','Marks'],rows:[['Anu',19,'Cybersecurity',85],['Rahul',20,'AI',72],['Maya',19,'Cybersecurity',91],['Arjun',21,'Cloud',65],['Neha',20,'AI',88]]},
 messy:{cols:['Name','Department','Marks'],rows:[['Anu','Cybersecurity',85],['Rahul','AI',N],['Maya','Cybersecurity',91],['Maya','Cybersecurity',91],['Arjun',N,65],['Neha','AI',88]]},
 shop:{cols:['Product','Category','Price','Quantity'],rows:[['Pen','Stationery',10,100],['Notebook','Stationery',60,40],['Mouse','Electronics',600,10],['Keyboard','Electronics',1500,4],['Backpack','Accessories',900,6]]},
 sales:{cols:['Product','Category','Price','Quantity'],rows:[['Laptop','Electronics',55000,2],['Mouse','Electronics',600,10],['Keyboard','Electronics',1500,4],['Notebook','Stationery',60,40],['Pen','Stationery',10,100],['Mouse','Electronics',600,10],['Headset','Electronics',2500,N],['Backpack','Accessories',900,6],['Wallet','Accessories',450,8]]},
 staff:{cols:['Employee','Team','Salary'],rows:[['Isha','Security',52000],['Omar','Cloud',61000],['Lena','AI',N],['Omar','Cloud',61000],['Ravi','AI',58000]]},
 incidents:{cols:['ID','Type','Severity','Hours'],rows:[[101,'Phishing',3,5],[102,'Malware',5,12],[103,'Phishing',2,N],[104,'DDoS',4,8],[105,'Malware',4,6]]}
};
const DNAME={students:'Student marks',messy:'Messy company records',shop:'Product inventory',sales:'Company sales (messy)',staff:'Employee records',incidents:'Cyber incidents'};

/* ===== Simulated Pandas (a DataFrame is {cols, rows, idx}) ===== */
const mk=n=>({cols:[...D[n].cols],rows:D[n].rows.map(r=>[...r]),idx:D[n].rows.map((_,i)=>i)});
const cp=d=>({cols:[...d.cols],rows:d.rows.map(r=>[...r]),idx:[...d.idx]});
const ci=(d,c)=>d.cols.indexOf(c);
const ob=(d,r)=>Object.fromEntries(d.cols.map((c,i)=>[c,r[i]]));
const colv=(d,c)=>d.rows.map(r=>r[ci(d,c)]);
const keep=(d,f)=>{const o=cp(d);o.rows=[];o.idx=[];d.rows.forEach((r,i)=>{if(f(ob(d,r),r)){o.rows.push([...r]);o.idx.push(d.idx[i])}});return o};
const where=(d,f)=>keep(d,f).idx;
const dropna=d=>keep(d,(o,r)=>r.every(x=>x!==N));
const dedupe=d=>{const s=new Set();return keep(d,(o,r)=>{const k=JSON.stringify(r);if(s.has(k))return false;s.add(k);return true})};
const fill=(d,c,v)=>{const o=cp(d),i=ci(o,c);o.rows.forEach(r=>{if(r[i]===N)r[i]=v});return o};
const sortBy=(d,c,asc=true)=>{const i=ci(d,c);const ord=d.rows.map((_,k)=>k).sort((a,b)=>{const x=d.rows[a][i],y=d.rows[b][i];const m=x<y?-1:x>y?1:0;return (asc?m:-m)||a-b});const o=cp(d);o.rows=ord.map(k=>[...d.rows[k]]);o.idx=ord.map(k=>d.idx[k]);return o};
const r2=x=>Math.round(x*100)/100;
const addc=(d,n,f)=>{const o=cp(d);o.cols.push(n);o.rows=d.rows.map(r=>{const v=f(ob(d,r));return [...r,typeof v==='number'?r2(v):v]});return o};
const ren=(d,a,b)=>{const o=cp(d);o.cols=o.cols.map(c=>c===a?b:c);return o};
const nulls=d=>d.rows.flat().filter(x=>x===N).length;
const sum=a=>a.reduce((x,y)=>x+y,0),mean=a=>sum(a)/a.length;
const grp=(d,g,c,f)=>{const m={};d.rows.forEach(r=>{const k=r[ci(d,g)];(m[k]=m[k]||[]).push(r[ci(d,c)])});return Object.keys(m).sort().map(k=>[k,f(m[k])])};
const vc=(d,c)=>grp(d,c,c,a=>a.length).sort((a,b)=>b[1]-a[1]);
const eq=(a,b)=>JSON.stringify([a.cols,a.rows,a.idx])===JSON.stringify([b.cols,b.rows,b.idx]);
const fmt=x=>x===N?'NaN':typeof x==='number'?(Number.isInteger(x)?x:+x.toFixed(2)):x;

/* ===== Rendering helpers ===== */
function table(d,o={}){
 const m=o.mode,S=o.sel||new Set();
 let s='<div class="tw"><table><thead><tr><th class="ix">index</th>';
 d.cols.forEach(c=>{const k='c'+c;s+=`<th ${m==='col'?`data-k="${esc(k)}" tabindex="0" role="button"`:''} class="${S.has(k)?'on':''}">${esc(c)}</th>`});
 if(o.notes)s+='<th>Why?</th>';
 s+='</tr></thead><tbody>';
 d.rows.forEach((r,i)=>{const x=d.idx[i],k='r'+x;
  s+=`<tr ${m==='row'?`data-k="${k}" tabindex="0" role="button"`:''} class="${S.has(k)?'on':''} ${o.pass?(o.pass[x]?'pass':'fail'):''}"><th class="ix">${x}</th>`;
  r.forEach((v,j)=>{const ck=x+'|'+d.cols[j];s+=`<td ${m==='cell'?`data-k="${esc(ck)}" tabindex="0" role="button"`:''} class="${v===N?'na':''} ${S.has(ck)?'on':''}">${esc(fmt(v))}</td>`});
  if(o.notes)s+=`<td>${esc(o.notes[x]||'')}</td>`;
  s+='</tr>'});
 return s+'</tbody></table></div>';
}
const bars=(p,u='')=>{const mx=Math.max(...p.map(x=>x[1]));return p.map(([k,v])=>`<div class="vb"><span>${esc(k)}</span><span><span class="f" style="width:${mx?v/mx*100:0}%"></span></span><b>${fmt(v)}${u}</b></div>`).join('')};
const card=(l,v)=>`<div class="big-card">${esc(l)}<b>${esc(fmt(v))}</b></div>`;

/* ===== Condition builder (Level 3, Practice, Level 7) ===== */
function builderHTML(d){
 const co=d.cols.map(c=>`<option>${esc(c)}</option>`).join('');
 const op=['>','>=','<','<=','==','!='].map(o=>`<option>${o}</option>`).join('');
 const row=i=>`<div class="row"><select id="bc${i}" aria-label="Column ${i+1}">${i?'<option value="">(no second condition)</option>':''}${co}</select><select id="bo${i}" aria-label="Operator ${i+1}">${op}</select><input id="bv${i}" placeholder="value" size="9" aria-label="Value ${i+1}"></div>`;
 return `<div class="card" style="margin:8px 0"><b>Condition builder</b>${row(0)}<div class="row"><select id="bj" aria-label="Combine with"><option value="&amp;">and ( &amp; )</option><option value="|">or ( | )</option></select></div>${row(1)}</div>`;
}
function readBuilder(d){
 const parts=[];
 for(let i=0;i<2;i++){
  const c=$('#bc'+i).value;if(!c)continue;
  const op=$('#bo'+i).value,raw=$('#bv'+i).value.trim();
  if(raw==='')return {err:'Type a value in the condition first.'};
  const sample=colv(d,c).find(x=>x!==N),num=typeof sample==='number';
  if(num&&isNaN(+raw))return {err:`"${c}" holds numbers, so the value must be a number.`};
  const v=num?+raw:raw;
  const f=o=>{const x=o[c];if(x===N)return false;switch(op){case '>':return x>v;case '>=':return x>=v;case '<':return x<v;case '<=':return x<=v;case '==':return x===v;default:return x!==v}};
  parts.push({c,op,v,f,txt:`df["${c}"] ${op} ${num?v:'"'+v+'"'}`});
 }
 const j=$('#bj').value;
 const pred=o=>parts.length===1?parts[0].f(o):(j==='&'?parts.every(p=>p.f(o)):parts.some(p=>p.f(o)));
 const code=parts.length===1?`df[${parts[0].txt}]`:`df[(${parts[0].txt}) ${j} (${parts[1].txt})]`;
 const notes={},pass={};
 d.rows.forEach((r,i)=>{const o=ob(d,r),x=d.idx[i];pass[x]=pred(o);
  notes[x]=parts.map(p=>`${fmt(o[p.c])} ${p.op} ${fmt(p.v)} ${p.f(o)?'✓':'✗'}`).join(parts.length>1?(j==='&'?' and ':' or '):'')+(pass[x]?' → kept':' → dropped')});
 return {pred,code,notes,pass};
}

/* ===== Missions ===== */
const o_=(c,f,n)=>({c,f,n});
const names=(d,ids)=>d.rows.filter((_,i)=>ids.includes(d.idx[i])).map(r=>r[0]).join(', ')||'nobody';
const L=[
{name:'Meet the Dataset',tiny:'students',
 learn:'<b>Pandas</b> is a Python tool for working with tables. A table is called a <b>DataFrame</b> (we write <code>df</code>). Each <b>row</b> is one record, like one student. Each <b>column</b> is one property, like Marks. One column on its own is a <b>Series</b>.',
 cmds:[['df.head()','shows the first 5 rows'],['df.shape','gives (number of rows, number of columns)'],['df.columns','lists the column names'],['df["Marks"]','picks the Marks column as a Series']],
 tasks:[
 {t:'pick',ds:'students',mode:'row',q:'Click the row that belongs to Rahul.',code:'df[df["Name"] == "Rahul"]',why:'A row runs left to right and holds everything about one record.',hint:'Rows run across the table. Find the line that starts with Rahul.',ans:d=>new Set(where(d,o=>o.Name==='Rahul').map(i=>'r'+i))},
 {t:'pick',ds:'students',mode:'col',q:'Click the column header you would use to get all the marks.',code:'df["Marks"]',why:'A column runs top to bottom. df["Marks"] returns just that column (a Series).',hint:'Columns run down the table, and the name is in the header.',ans:()=>new Set(['cMarks'])},
 {t:'num',ds:'students',label:'Records (rows)',q:'How many records (rows) does this DataFrame have?',code:d=>`df.shape   # (${d.rows.length}, ${d.cols.length}) = ${d.rows.length} rows, ${d.cols.length} columns`,why:'df.shape returns (rows, columns). The first number is the record count.',hint:'Count the rows, not the columns.',ans:d=>d.rows.length},
 {t:'pick',ds:'students',mode:'col',q:'Which column contains the department names? Click its header.',code:'df["Department"]',why:'Department holds text labels such as AI or Cloud.',hint:'Look for the header that matches the words AI, Cloud and Cybersecurity.',ans:()=>new Set(['cDepartment'])}]},
{name:'Select Your Evidence',tiny:'students',
 learn:'Selecting means picking only the evidence you need. Columns are chosen by name. Rows are chosen with <code>loc</code> (by index <i>label</i>) or <code>iloc</code> (by integer <i>position</i>, counting from 0). They look alike until you sort or filter, because then labels and positions stop matching.',
 cmds:[['df["Name"]','one column (a Series)'],['df[["Name","Marks"]]','two brackets = a list of columns, result is a table'],['df.iloc[0]','the row at position 0'],['df.loc[2]','the row whose index label is 2']],
 tasks:[
 {t:'pick',ds:'students',mode:'col',multi:1,q:'Select only Name and Marks (click both headers, then Check).',code:'df[["Name", "Marks"]]',why:'The outer brackets select; the inner brackets build a list of the columns you want.',hint:'You need two headers selected.',ans:()=>new Set(['cName','cMarks'])},
 {t:'pick',ds:'students',mode:'row',multi:1,q:'Select the first three rows.',code:'df.iloc[0:3]',why:'iloc counts positions from 0 and stops before the end number, so 0:3 gives positions 0, 1, 2.',hint:'Positions start at 0, so the first three rows are 0, 1 and 2.',ans:d=>new Set(d.idx.slice(0,3).map(i=>'r'+i))},
 {t:'pick',ds:'students',mode:'row',q:'Find the record that belongs to Maya.',code:'df[df["Name"] == "Maya"]   # or df.loc[2]',why:'Maya has index label 2. df.loc[2] works because loc uses labels.',hint:'Scan the Name column.',ans:d=>new Set(where(d,o=>o.Name==='Maya').map(i=>'r'+i))},
 {t:'pick',ds:'students',mode:'cell',q:'Click the single cell that holds Maya\'s Marks.',code:'df.loc[2, "Marks"]',why:'A cell sits where one row label meets one column name.',hint:'Find Maya\'s row, then go across to the Marks column.',ans:d=>new Set(where(d,o=>o.Name==='Maya').map(i=>i+'|Marks'))},
 {t:'mc',ds:'students',q:'Which command selects the row by integer position?',opts:()=>['df.loc[2]','df.iloc[2]','df["2"]'],ans:()=>'df.iloc[2]',code:'df.iloc[2]',why:'"i" in iloc stands for integer position. loc uses labels.',hint:'The "i" in iloc is a clue.',miss:'loc looks up labels. iloc looks up positions.'}]},
{name:'Filter the Records',tiny:'students',
 learn:'Filtering keeps only the rows where a condition is True. <code>df["Marks"] &gt; 80</code> gives True or False for every row. Putting that inside <code>df[...]</code> keeps the True rows. Combine conditions with <code>&amp;</code> (and) or <code>|</code> (or), and put each condition in parentheses.',
 cmds:[['df[df["Marks"] > 80]','students above 80'],['df[df["Department"] == "AI"]','== means "is equal to" (one = would assign)'],['df[df["Marks"] >= 75]','>= means at least'],['df[(df["Department"] == "Cybersecurity") & (df["Marks"] > 80)]','both must be true']],
 tasks:[
 {t:'build',ds:'students',q:'Use the builder to find students with marks greater than 80.',tp:o=>o.Marks>80,why:'Only rows where the condition is True survive the filter.',hint:'Column Marks, operator >, value 80.'},
 {t:'build',ds:'students',q:'Find students from the AI department.',tp:o=>o.Department==='AI',why:'Text values are compared with ==, and the text goes in quotes in real Pandas.',hint:'Column Department, operator ==, value AI.'},
 {t:'build',ds:'students',q:'Find students whose marks are at least 75.',tp:o=>o.Marks>=75,why:'"At least" includes the boundary, so use >=.',hint:'At least 75 includes 75 itself.'},
 {t:'build',ds:'students',q:'Find Cybersecurity students who scored above 80. Use two conditions joined with "and".',tp:o=>o.Department==='Cybersecurity'&&o.Marks>80,why:'With & both conditions must be True for a row to stay.',hint:'Fill both condition rows and choose "and".'},
 {t:'mc',ds:'students',q:'Debug it: df[df["Marks"] > 80 and df["Department"] == "AI"] raises an error. What is the fix?',opts:()=>['Use & and put each condition in parentheses','Replace == with =','Remove the quotes around AI'],ans:()=>'Use & and put each condition in parentheses',code:'df[(df["Marks"] > 80) & (df["Department"] == "AI")]',why:'Python\'s "and" cannot compare whole columns. Pandas needs & with parentheses.',hint:'Pandas has its own symbols for combining columns.',miss:'A single = assigns a value, and quotes are needed for text. The real problem is the combining word.'}]},
{name:'Clean the Mess',tiny:'messy',
 learn:'Real data is messy. <b>NaN</b> means a value is missing, and some rows may be repeated. <code>isnull()</code> marks missing cells, <code>dropna()</code> deletes rows with missing values, <code>fillna(v)</code> fills them, and <code>drop_duplicates()</code> removes repeated rows. <b>No fix is always right:</b> dropping loses information, and filling marks with 0 invents data and drags averages down.',
 cmds:[['df.isnull()','True where a value is missing'],['df.isnull().sum()','missing count per column'],['df.dropna()','drop rows containing NaN'],['df["Marks"].fillna(50)','fill missing marks with 50 (a choice, not a rule)'],['df.drop_duplicates()','remove repeated rows']],
 tasks:[
 {t:'pick',ds:'messy',mode:'cell',multi:1,q:'Click every missing (NaN) cell.',code:'df.isnull()',why:'isnull() flags the cells that hold no value.',hint:'Look for orange NaN cells. There is more than one column affected.',ans:d=>new Set(d.rows.flatMap((r,i)=>r.map((v,j)=>v===N?d.idx[i]+'|'+d.cols[j]:null)).filter(Boolean))},
 {t:'num',ds:'messy',label:'Missing values',q:'How many missing values are in the whole table?',code:d=>`df.isnull().sum().sum()   # ${nulls(d)}`,why:'isnull().sum() counts per column. A second .sum() adds the columns together.',hint:'Count every NaN cell.',ans:d=>nulls(d)},
 {t:'ops',ds:'messy',q:'Remove every row that has a missing value.',ok:0,opts:[o_('df.dropna()',d=>dropna(d)),o_('df["Marks"].fillna(0)',d=>fill(d,'Marks',0),'Fills instead of removing, and 0 would be a made-up mark.'),o_('df.drop_duplicates()',d=>dedupe(d),'That removes repeated rows, not missing values.')],why:'dropna() removes rows with any NaN. It is simple but throws away the other (good) values in those rows.',hint:'Which command name means "drop the NaN rows"?'},
 {t:'ops',ds:'messy',q:'Replace the missing marks with 50 (the teacher approved this value). Keep the other columns as they are.',ok:1,opts:[o_('df["Marks"].fillna(0)',d=>fill(d,'Marks',0),'0 is not 50, and 0 can unfairly lower averages.'),o_('df["Marks"].fillna(50)',d=>fill(d,'Marks',50)),o_('df.dropna()',d=>dropna(d),'That deletes rows instead of filling them.')],why:'fillna keeps all rows. Only fill when you have a sensible value. A fake 0 can be worse than leaving data out.',hint:'You want to fill, with the approved number.'},
 {t:'ops',ds:'messy',q:'Remove the duplicate record.',ok:0,opts:[o_('df.drop_duplicates()',d=>dedupe(d)),o_('df.dropna()',d=>dropna(d),'That does not touch the repeated Maya row.'),o_('df.sort_values("Name")',d=>sortBy(d,'Name'),'Sorting moves rows but removes nothing.')],why:'drop_duplicates() keeps the first copy of each identical row and drops the repeats.',hint:'Look for two identical rows.'}]},
{name:'Transform the Data',tiny:'shop',
 learn:'Transforming means preparing a clean report. You can add a column by assigning to a new name, sort rows, rename columns, and use <code>apply(lambda x: ...)</code> to run a small rule on every value. The new column is calculated row by row.',
 cmds:[['df.sort_values("Marks", ascending=False)','highest first'],['df.rename(columns={"Marks": "Score"})','old name : new name'],['df["Result"] = df["Marks"].apply(lambda x: "Pass" if x >= 75 else "Fail")','a rule for each mark'],['df["Total"] = df["Price"] * df["Quantity"]','column maths works row by row']],
 tasks:[
 {t:'ops',ds:'students',q:'Sort the students by Marks, highest first.',ok:1,opts:[o_('df.sort_values("Marks")',d=>sortBy(d,'Marks'),'The default is ascending (lowest first).'),o_('df.sort_values("Marks", ascending=False)',d=>sortBy(d,'Marks',false)),o_('df.sort_values("Name")',d=>sortBy(d,'Name'),'That sorts by name instead.')],why:'ascending=False flips the order. Notice the index labels travel with their rows.',hint:'Highest first means NOT ascending.'},
 {t:'ops',ds:'students',q:'Rename the Marks column to Score.',ok:0,opts:[o_('df.rename(columns={"Marks": "Score"})',d=>ren(d,'Marks','Score')),o_('df.rename(columns={"Score": "Marks"})',d=>ren(d,'Score','Marks'),'The mapping is old : new. Pandas silently ignores names that do not exist, so nothing changed.')],why:'rename takes {old name: new name}.',hint:'The dictionary reads old : new.'},
 {t:'ops',ds:'students',q:'Add a Result column. The passing mark is 75 or more.',ok:0,opts:[o_('df["Result"] = df["Marks"].apply(lambda x: "Pass" if x >= 75 else "Fail")',d=>addc(d,'Result',o=>o.Marks>=75?'Pass':'Fail')),o_('df["Result"] = df["Marks"].apply(lambda x: "Pass" if x >= 40 else "Fail")',d=>addc(d,'Result',o=>o.Marks>=40?'Pass':'Fail'),'That uses 40, so everybody passes. Use the passing mark given in the task.'),o_('df["Result"] = df["Marks"].apply(lambda x: "Pass" if x < 75 else "Fail")',d=>addc(d,'Result',o=>o.Marks<75?'Pass':'Fail'),'The rule is reversed.')],why:'The lambda runs once per mark. If the test is true it returns "Pass", otherwise "Fail".',hint:'Check the number and the direction of the comparison.'},
 {t:'ops',ds:'shop',q:'Calculate the total sales for each product (Price times Quantity) in a Total column.',ok:1,opts:[o_('df["Total"] = df["Price"] + df["Quantity"]',d=>addc(d,'Total',o=>o.Price+o.Quantity),'Adding is not the same as multiplying.'),o_('df["Total"] = df["Price"] * df["Quantity"]',d=>addc(d,'Total',o=>o.Price*o.Quantity))],why:'Sales = price of one item x number sold. Pandas does this for every row at once.',hint:'Total money = price x how many.'},
 {t:'ops',ds:'shop',q:'Create a "Sale Price" column with a 10% discount.',ok:0,opts:[o_('df["Sale Price"] = df["Price"] * 0.9',d=>addc(d,'Sale Price',o=>o.Price*0.9)),o_('df["Sale Price"] = df["Price"] * 0.1',d=>addc(d,'Sale Price',o=>o.Price*0.1),'0.1 is the discount amount, not the price after discount.'),o_('df["Sale Price"] = df["Price"] - 10',d=>addc(d,'Sale Price',o=>o.Price-10),'That takes a flat 10, not 10 percent.')],why:'Paying 90% of the price means multiplying by 0.9.',hint:'If 10% comes off, 90% remains.'}]},
{name:'Analyze the Results',tiny:'students',
 learn:'Summary functions turn many rows into one meaningful number. <code>mean()</code> is the average, <code>median()</code> the middle value, <code>max()</code>/<code>min()</code> the extremes, <code>count()</code> counts non-missing values, <code>value_counts()</code> counts each label, and <code>groupby()</code> splits rows into groups first, then calculates per group.',
 cmds:[['df["Marks"].mean()','average mark'],['df["Marks"].max()','highest mark'],['df["Marks"].min()','lowest mark'],['df["Department"].value_counts()','how many students per department'],['df.groupby("Department")["Marks"].mean()','average mark inside each department']],
 tasks:[
 {t:'num',ds:'students',label:'Average marks',q:'What is the average (mean) of the Marks column?',code:'df["Marks"].mean()',why:'Mean = sum of marks divided by the number of students.',hint:'Add all marks and divide by how many there are.',ans:d=>mean(colv(d,'Marks'))},
 {t:'num',ds:'students',label:'Highest mark',q:'What is the highest mark?',code:'df["Marks"].max()',why:'max() returns the largest value in the column.',hint:'Scan the Marks column.',ans:d=>Math.max(...colv(d,'Marks'))},
 {t:'num',ds:'students',label:'Lowest mark',q:'What is the lowest mark?',code:'df["Marks"].min()',why:'min() returns the smallest value in the column.',hint:'Scan the Marks column.',ans:d=>Math.min(...colv(d,'Marks'))},
 {t:'num',ds:'students',label:'AI students',q:'How many students are in the AI department?',code:'df["Department"].value_counts()',why:'value_counts() counts how often each label appears, most frequent first.',hint:'Count the rows where Department is AI.',ans:d=>vc(d,'Department').find(x=>x[0]==='AI')[1],viz:d=>bars(vc(d,'Department'),' students')},
 {t:'num',ds:'students',label:'Cybersecurity average',q:'What is the average mark of the Cybersecurity department?',code:'df.groupby("Department")["Marks"].mean()',why:'groupby makes one pile per department, then mean() runs inside each pile.',hint:'Average only the Cybersecurity rows.',ans:d=>grp(d,'Department','Marks',mean).find(x=>x[0]==='Cybersecurity')[1],viz:d=>bars(grp(d,'Department','Marks',mean))},
 {t:'mc',ds:'shop',label:'Best seller',q:'Which product has the highest total Quantity sold?',opts:()=>mk('shop').rows.map(r=>r[0]),ans:()=>grp(mk('shop'),'Product','Quantity',sum).sort((a,b)=>b[1]-a[1])[0][0],code:'df.groupby("Product")["Quantity"].sum().idxmax()',why:'Group by product, add up the quantities, then pick the largest.',hint:'Compare the Quantity column.',miss:'That product did not sell the most units.',viz:d=>bars(grp(d,'Product','Quantity',sum),' units')}]},
{name:'The Final Data Mystery',tiny:'sales',w:1,
 learn:'The manager thinks this sales report has errors. Work through the case in order. <b>Each step changes the same working table</b>, so what you clean first affects the later answers. Use hints when stuck.',
 cmds:[['isnull / dropna / drop_duplicates','Level 4'],['df[df["Price"] >= 100]','Level 3'],['df["Revenue"] = ...  /  sort_values','Level 5'],['groupby("Category")["Revenue"].sum()','Level 6']],
 tasks:[
 {t:'num',w:1,label:'Missing values',q:'Step 1: Inspect the table. How many values are missing?',code:d=>`df.isnull().sum().sum()   # ${nulls(d)}`,why:'The Headset has no Quantity, so its revenue cannot be calculated.',hint:'Look for NaN cells.',ans:d=>nulls(d),sum:()=>nulls(mk('sales'))+' missing value(s) in the raw data'},
 {t:'ops',w:1,q:'Step 2: Remove the rows with missing values.',ok:0,opts:[o_('df = df.dropna()',d=>dropna(d)),o_('df = df.fillna(0)',d=>{const o=cp(d);o.rows=o.rows.map(r=>r.map(v=>v===N?0:v));return o},'Filling Quantity with 0 would claim the Headset sold nothing, which we do not know.'),o_('df = df.drop_duplicates()',d=>dedupe(d),'That does not remove the missing value.')],why:'We cannot trust a row with an unknown Quantity, so we drop it.',hint:'dropna removes rows with NaN.',sum:()=>'Rows with NaN removed'},
 {t:'ops',w:1,q:'Step 3: Remove the duplicate record.',ok:0,opts:[o_('df = df.drop_duplicates()',d=>dedupe(d)),o_('df = df.sort_values("Product")',d=>sortBy(d,'Product'),'Sorting does not remove anything.')],why:'The Mouse row appears twice, which would double-count its sales.',hint:'Find the repeated row.',sum:()=>'Duplicate Mouse row removed'},
 {t:'build',w:1,keep:1,q:'Step 4: Keep only products priced at 100 or more.',tp:o=>o.Price>=100,why:'Cheap items (Notebook, Pen) are excluded from this premium report.',hint:'Column Price, operator >=, value 100.',sum:()=>'Only products priced 100 or more kept'},
 {t:'ops',w:1,q:'Step 5: Add a Revenue column (Price x Quantity).',ok:0,opts:[o_('df["Revenue"] = df["Price"] * df["Quantity"]',d=>addc(d,'Revenue',o=>o.Price*o.Quantity)),o_('df["Revenue"] = df["Price"] + df["Quantity"]',d=>addc(d,'Revenue',o=>o.Price+o.Quantity),'Revenue is price times units sold.')],why:'Each row\'s revenue is price x units.',hint:'Multiply.',sum:()=>'Revenue = Price x Quantity'},
 {t:'ops',w:1,q:'Step 6: Sort the products by Revenue, highest first.',ok:1,opts:[o_('df = df.sort_values("Revenue")',d=>sortBy(d,'Revenue'),'That is lowest first.'),o_('df = df.sort_values("Revenue", ascending=False)',d=>sortBy(d,'Revenue',false))],why:'ascending=False puts the biggest earner on top.',hint:'Highest first.',sum:()=>'Sorted by Revenue, highest first'},
 {t:'mc',w:1,label:'Top category',q:'Steps 7 and 8: Group by Category. Which category has the highest total revenue?',opts:()=>[...new Set(colv(W,'Category'))],ans:()=>grp(W,'Category','Revenue',sum).sort((a,b)=>b[1]-a[1])[0][0],code:'df.groupby("Category")["Revenue"].sum()',why:'Add up Revenue inside each Category and compare.',hint:'Compare the totals, not the number of products.',miss:'Check the group totals again.',viz:d=>bars(grp(d,'Category','Revenue',sum)),sum:()=>{const g=grp(W,'Category','Revenue',sum).sort((a,b)=>b[1]-a[1])[0];return `Top category: ${g[0]} (${g[1]})`}},
 {t:'num',w:1,label:'Total sales',q:'Step 9: Submit your final finding. What is the total revenue of the cleaned report?',code:'df["Revenue"].sum()',why:'Sum of the Revenue column in the cleaned and filtered table.',hint:'Add up the Revenue column.',ans:d=>sum(colv(d,'Revenue')),sum:()=>'Total revenue: '+sum(colv(W,'Revenue'))}]}
];
const TOTAL=L.reduce((a,l)=>a+l.tasks.length,0);

/* ===== State ===== */
const KEY='pandasQuestV1';
const fresh=()=>({xp:0,pts:0,t:{},log:{},done:{},streak:0,best:0,fa:0,b:[]});
let S=(()=>{try{return Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return fresh()}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const TITLES=['Rookie','Junior Detective','Case Analyst','Senior Detective','Data Sleuth','Chief Inspector','Pandas Master'];
const lvl=()=>Math.min(7,1+Math.floor(S.xp/600));
const BADGES=[['first','🔎','First Clue','Solve your first task',()=>S.pts>0],['str','🔥','Hot Streak','3 first-try answers in a row',()=>S.best>=3],['fa','🎯','Sharp Eye','10 first-try answers',()=>S.fa>=10],['l1','📂','Dataset Scout','Finish Level 1',()=>S.done[0]],['l3','🧲','Filter Hunter','Finish Level 3',()=>S.done[2]],['l4','🧹','Data Janitor','Finish Level 4',()=>S.done[3]],['l6','📊','Analyst','Finish Level 6',()=>S.done[5]],['m','🐼','Pandas Master','Solve the Final Mystery',()=>S.done[6]]];
const newBadges=()=>{const g=[];BADGES.forEach(b=>{if(!S.b.includes(b[0])&&b[4]()){S.b.push(b[0]);g.push(b[1]+' '+b[2])}});return g};
const unlocked=n=>n===0||S.done[n-1];
const doneCount=n=>L[n].tasks.filter((_,i)=>S.t[n+'.'+i]).length;
const totalDone=()=>Object.keys(S.t).length;

function hud(){
 const l=lvl(),p=S.xp%600;
 $('#hud').innerHTML=`<span>Level ${l}: <b>${TITLES[l-1]}</b></span><div class="bar" title="XP to next level"><i style="width:${l===7?100:p/6}%"></i></div><span>${S.xp} XP</span><span>⭐ ${S.pts}</span><span>🔥 ${S.streak}</span>`;
}

/* ===== Views ===== */
const app=$('#app');
let cur={},W=null,PR=null;

function home(){
 const pc=Math.round(totalDone()/TOTAL*100);
 const next=L.findIndex((_,i)=>!S.done[i]);
 app.innerHTML=`<section class="card"><h1>Welcome, Data Detective!</h1><p>A company has collected messy data. Investigate it, clean it, and solve the mystery to become a <b>Pandas Master</b>.</p>
 <div class="grid"><div class="stat"><b>${lvl()}</b>Level (${esc(TITLES[lvl()-1])})</div><div class="stat"><b>${S.xp}</b>XP</div><div class="stat"><b>${Object.keys(S.done).length}/7</b>Missions completed</div><div class="stat"><b>${S.streak}</b>Current streak</div><div class="stat"><b>${S.b.length}</b>Badges earned</div></div>
 <p>Course progress: ${pc}%</p><div class="bar" style="width:100%"><i style="width:${pc}%"></i></div>
 <div class="row"><button class="btn big" data-act="start">${next<0?'Replay a Mission':totalDone()?'Continue Mission':'Start Mission'}</button><button class="btn ghost" data-act="practice">Practice Arena</button><button class="btn ghost" data-act="ach">My Achievements</button></div></section>
 <section class="card"><h2>Your learning journey</h2>${L.map((l,i)=>`<div class="step ${S.done[i]?'done':''} ${unlocked(i)?'':'lock'}"><span class="num">${S.done[i]?'✓':i+1}</span><div class="t"><b>${esc(l.name)}</b><br><small>${doneCount(i)}/${l.tasks.length} tasks${unlocked(i)?'':' · locked: finish the previous mission'}</small></div><button class="btn ghost" data-act="lvl" data-n="${i}" ${unlocked(i)?'':'disabled'}>${S.done[i]?'Review':'Open'}</button></div>`).join('')}</section>`;
 hud();
}

function openLevel(n){
 if(!unlocked(n))return;
 const i=L[n].w?0:Math.max(0,L[n].tasks.findIndex((_,k)=>!S.t[n+'.'+k]));
 cur={lv:n,i,att:0,hint:false,ok:false,sel:new Set(),opt:null};
 if(L[n].w)W=mk('sales');
 drawLevel();
}
const T=()=>L[cur.lv].tasks[cur.i];
const getDF=t=>t.w?W:mk(t.ds);

function drawLevel(){
 const lv=L[cur.lv];
 app.innerHTML=`<button class="btn ghost" data-act="home">← Dashboard</button>
 <section class="card"><h2>Level ${cur.lv+1}: ${esc(lv.name)}</h2><details open><summary>📖 Learn Mode</summary><p>${lv.learn}</p>${table(mk(lv.tiny))}<div class="cmds">${lv.cmds.map(c=>`<div><code>${esc(c[0])}</code> ${esc(c[1])}</div>`).join('')}</div></details></section><section class="card" id="task"></section>`;
 drawTask();
}

function drawTask(){
 cur.att=0;cur.hint=false;cur.ok=false;cur.sel=new Set();cur.opt=null;
 const t=T(),d=getDF(t),n=L[cur.lv].tasks.length;
 let play='';
 if(t.t==='pick')play=table(d,{mode:t.mode,sel:cur.sel})+(t.multi?'<small>You can select several items.</small>':'');
 else if(t.t==='build')play=table(d)+builderHTML(d);
 else if(t.t==='ops')play=table(d)+`<div class="opts" role="radiogroup">${t.opts.map((o,i)=>`<button class="opt" data-act="opt" data-i="${i}" role="radio" aria-checked="false"><code>${esc(o.c)}</code></button>`).join('')}</div><div id="prev"></div>`;
 else if(t.t==='mc')play=table(d)+`<div class="opts" role="radiogroup">${t.opts().map((o,i)=>`<button class="opt" data-act="mcopt" data-v="${esc(o)}" role="radio" aria-checked="false">${esc(o)}</button>`).join('')}</div>`;
 else play=table(d)+`<div class="row"><label for="num">Your answer:</label><input id="num" type="number" step="any"></div>`;
 $('#task').innerHTML=`<span class="pill">Task ${cur.i+1} of ${n} · ${esc(t.t==='pick'?'Click the data':t.t==='build'?'Build a condition':t.t==='ops'?'Choose the command':t.t==='mc'?'Think it through':'Calculate')}</span><h3>${esc(t.q)}</h3>${play}
 <div class="row"><button class="btn" data-act="check" id="chk">${t.t==='build'?'Run Filter':t.t==='ops'?'Apply':'Check'}</button><button class="btn ghost" data-act="hint">💡 Hint</button><button class="btn ghost" data-act="retry" id="rty" hidden>Try Again</button><button class="btn" data-act="next" id="nxt" hidden>${cur.i===n-1?'Finish Mission':'Next Task →'}</button></div><div id="fb" aria-live="polite"></div><div id="res"></div>`;
}
const fb=(m,k)=>{$('#fb').innerHTML=`<div class="fb ${k}">${m}</div>`};

function award(){
 const k=cur.lv+'.'+cur.i,p=cur.att?50:cur.hint?70:100,first=!S.t[k];
 if(first){S.t[k]=p;S.pts+=p;S.xp+=p}
 S.log[k]={a:cur.att,h:cur.hint};
 if(!cur.att&&!cur.hint){S.streak++;S.best=Math.max(S.best,S.streak);if(first)S.fa++}else S.streak=0;
 return {p,first};
}

function check(){
 if(cur.ok)return;
 const t=T(),d=getDF(t);let ok=false,msg='',res='',code=typeof t.code==='function'?t.code(d):t.code,disp=null;
 if(t.t==='pick'){
  const a=t.ans(d),s=cur.sel;if(!s.size)return fb('Click something in the table first.','hint');
  ok=a.size===s.size&&[...a].every(k=>s.has(k));
  if(!ok){const miss=[...a].filter(k=>!s.has(k)).length,ex=[...s].filter(k=>!a.has(k)).length;msg=`Not quite: ${miss} needed item(s) missing and ${ex} extra item(s) selected. Remember: rows run across, columns run down, and a cell is where a row meets a column.`}
  else if(t.mode==='col'){const o=cp(d);const ix=d.cols.map((c,i)=>s.has('c'+c)?i:-1).filter(i=>i>=0);o.cols=ix.map(i=>d.cols[i]);o.rows=d.rows.map(r=>ix.map(i=>r[i]));res=table(o)}
  else if(t.mode==='row'){res=table(keep(d,(o,r)=>s.has('r'+d.idx[d.rows.indexOf(r)])))}
  else res=table(d,{sel:s});
 }else if(t.t==='build'){
  const b=readBuilder(d);if(b.err)return fb(b.err,'hint');
  const mine=where(d,b.pred),want=where(d,t.tp);
  ok=mine.length===want.length&&mine.every((x,i)=>x===want[i]);
  $('#res').innerHTML=`<h4>Rows that passed or failed</h4>`+table(d,{pass:b.pass,notes:b.notes});
  if(!ok)msg=`Your filter kept ${mine.length} row(s) (${esc(names(d,mine))}), but the evidence needs ${want.length} (${esc(names(d,want))}). Check the column, the operator (> vs >=) and the value.`;
  else{code=b.code;const o=keep(d,b.pred);res=table(o);if(t.keep)W=o;disp=`Correct! Your filter kept ${esc(names(d,mine))}.`}
 }else if(t.t==='ops'){
  if(cur.opt===null)return fb('Choose a command first.','hint');
  const o=t.opts[cur.opt],good=t.opts[t.ok].f(d);ok=eq(o.f(d),good);
  if(!ok)msg=o.n||'That command gives a different table than the goal. Compare the preview with what the task asks for.';
  else{code=o.c;res=`<div class="pair"><div><h4>Before</h4>${table(d)}</div><div><h4>After</h4>${table(good)}</div></div>`;if(t.w)W=good}
 }else if(t.t==='mc'){
  if(cur.opt===null)return fb('Choose an option first.','hint');
  ok=cur.opt===String(t.ans());if(!ok)msg=(t.miss||'That is not the one.')+' Try the hint.';else res=card(t.label||'Answer',cur.opt);
 }else{
  const v=parseFloat($('#num').value);if(isNaN(v))return fb('Type a number first.','hint');
  const a=t.ans(d);ok=Math.abs(v-a)<0.01;
  if(!ok)msg=`${v} is not right. Check which column and which rows the question is about, then try the hint.`;
  else res=card(t.label,a);
 }
 if(!ok){cur.att++;S.streak=0;save();hud();fb('❌ '+msg,'bad');$('#rty').hidden=false;return}
 cur.ok=true;const r=award(),nb=newBadges();save();hud();
 const viz=t.viz?`<h4>Quick chart</h4>${t.viz(d)}`:'';
 fb(`✅ ${disp||'Correct!'} ${r.first?`+${r.p} points`:'(already earned; no extra points on replay)'}${nb.length?`<br>🏅 New badge: ${nb.join(', ')}`:''}`,'ok');
 $('#res').innerHTML=`<h4>📊 Result Mode</h4>${res}${viz}<h4>🐍 Code Mode</h4><div class="code"><code>${esc(code)}</code></div><div class="why"><b>Why it works:</b> ${esc(t.why)}</div>`;
 $('#rty').hidden=true;$('#nxt').hidden=false;$('#chk').disabled=true;$('#nxt').focus();
}

function finish(){
 const n=cur.lv,first=!S.done[n];
 if(first){S.done[n]=1;S.xp+=200;S.pts+=200}
 const nb=newBadges();save();hud();
 const pts=L[n].tasks.reduce((a,_,i)=>a+(S.t[n+'.'+i]||0),0);
 let extra='';
 if(L[n].w){
  extra=`<h3>🕵️ Case report</h3><div class="tw"><table><thead><tr><th>Step</th><th>Expected finding</th><th>Your result</th></tr></thead><tbody>${L[n].tasks.map((t,i)=>{const g=S.log[n+'.'+i]||{a:0,h:0};return `<tr><td>${i+1}</td><td>${esc(t.sum())}</td><td>${g.a?`needed ${g.a+1} attempts`:g.h?'used a hint':'first try ✓'}</td></tr>`}).join('')}</tbody></table></div>${L[n].tasks.map((t,i)=>{const g=S.log[n+'.'+i];return g&&g.a?`<div class="why"><b>Step ${i+1} review:</b> ${esc(t.why)}</div>`:''}).join('')}<h2>🐼 You are a Pandas Master!</h2>`;
 }
 app.innerHTML=`<section class="card"><h1>🎉 Mission complete: ${esc(L[n].name)}</h1><div class="grid"><div class="stat"><b>${pts}</b>Task points</div><div class="stat"><b>${first?'+200':'0'}</b>Bonus XP</div><div class="stat"><b>${S.xp}</b>Total XP</div></div>${nb.length?`<p>🏅 New badges: ${nb.join(', ')}</p>`:''}${extra}<div class="row">${n<6?`<button class="btn big" data-act="lvl" data-n="${n+1}">Next Mission →</button>`:`<button class="btn big" data-act="ach">See achievements</button>`}<button class="btn ghost" data-act="home">Dashboard</button></div></section>`;
}

function ach(){
 const rows=[['Aarav',2400],['Diya',1900],['Meera',1500],['Kabir',1100],['Zoya',700],['You',S.pts]].sort((a,b)=>b[1]-a[1]);
 app.innerHTML=`<button class="btn ghost" data-act="home">← Dashboard</button><section class="card"><h2>My Achievements</h2><div class="badges">${BADGES.map(b=>`<div class="badge ${S.b.includes(b[0])?'got':''}"><i>${b[1]}</i><b>${b[2]}</b><br><small>${b[3]}</small></div>`).join('')}</div></section>
 <section class="card"><h2>Score summary</h2><p>${S.pts} points · ${S.xp} XP · ${totalDone()}/${TOTAL} tasks · best streak ${S.best}</p></section>
 <section class="card"><h2>Leaderboard (local demo)</h2><p><small>Fictional names. Scores are stored only in this browser and are not shared with other users or devices.</small></p><div class="tw"><table class="lb"><tbody>${rows.map((r,i)=>`<tr class="${r[0]==='You'?'me':''}"><td>${i+1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div></section>`;
}

/* ===== Practice Arena ===== */
function practice(keepDs){
 if(!PR||!keepDs)PR={ds:PR?PR.ds:'students',df:null,code:[]};
 if(!PR.df)PR.df=mk(PR.ds);
 app.innerHTML=`<button class="btn ghost" data-act="home">← Dashboard</button><section class="card"><h2>Practice Arena</h2><p>Free play: no points. Apply operations and watch the table and the code change.</p>
 <div class="row"><label for="pds">Dataset:</label><select id="pds" data-act="pds">${Object.keys(D).map(k=>`<option value="${k}" ${k===PR.ds?'selected':''}>${DNAME[k]}</option>`).join('')}</select><button class="btn ghost" data-act="preset">Reset table</button></div>
 ${builderHTML(PR.df)}
 <div class="row"><button class="btn" data-act="pfilter">Run Filter</button><label for="psc">Sort by:</label><select id="psc">${PR.df.cols.map(c=>`<option>${esc(c)}</option>`).join('')}</select><button class="btn ghost" data-act="psort" data-a="1">Ascending</button><button class="btn ghost" data-act="psort" data-a="0">Descending</button><button class="btn ghost" data-act="pdrop">dropna()</button><button class="btn ghost" data-act="pdup">drop_duplicates()</button></div>
 <div id="pmsg" aria-live="polite"></div><div class="code"><code>${esc(['df = pd.DataFrame(...)',...PR.code].join('\n'))}</code></div>
 <div class="pair"><div><h4>Original</h4>${table(mk(PR.ds))}</div><div><h4>Current (${PR.df.rows.length} rows)</h4>${table(PR.df)}</div></div></section>`;
}
const pset=(df,line)=>{PR.df=df;PR.code.push(line);practice(true)};

/* ===== Events ===== */
const act={
 home,ach,reset(){if(confirm('Reset all progress? This cannot be undone.')){S=fresh();save();hud();home()}},
 start(){const n=L.findIndex((_,i)=>!S.done[i]);openLevel(n<0?0:n)},
 lvl(a){openLevel(+a.n)},
 practice(){practice(false)},
 opt(a,b){cur.opt=+a.i;document.querySelectorAll('.opt').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b)});const t=T(),d=getDF(t);$('#prev').innerHTML=`<h4>Preview (not applied yet)</h4>`+table(t.opts[cur.opt].f(d))},
 mcopt(a,b){cur.opt=a.v;document.querySelectorAll('.opt').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b)})},
 check,
 hint(){const t=T();cur.hint=true;fb('💡 '+esc(t.hint),'hint')},
 retry(){if(cur.ok)return;cur.sel=new Set();cur.opt=null;const t=T();if(t.t==='pick'){const d=getDF(t);const w=document.querySelector('#task .tw');w.outerHTML=table(d,{mode:t.mode,sel:cur.sel})}document.querySelectorAll('.opt').forEach(x=>x.classList.remove('on'));if($('#prev'))$('#prev').innerHTML='';$('#fb').innerHTML='';$('#res').innerHTML='';$('#rty').hidden=true},
 next(){if(!cur.ok)return;if(cur.i<L[cur.lv].tasks.length-1){cur.i++;drawTask()}else finish()},
 pds(a,b){PR={ds:b.value,df:null,code:[]};practice(true)},
 preset(){PR.df=null;PR.code=[];practice(true)},
 pfilter(){const b=readBuilder(PR.df);if(b.err){$('#pmsg').innerHTML=`<div class="fb hint">${b.err}</div>`;return}pset(keep(PR.df,b.pred),'df = '+b.code.replace('df[','df[')) },
 psort(a){const c=$('#psc').value;pset(sortBy(PR.df,c,a.a==='1'),`df = df.sort_values("${c}"${a.a==='1'?'':', ascending=False'})`)},
 pdrop(){pset(dropna(PR.df),'df = df.dropna()')},
 pdup(){pset(dedupe(PR.df),'df = df.drop_duplicates()')}
};
document.addEventListener('click',e=>{
 const k=e.target.closest('#task [data-k]');
 if(k&&cur.sel&&!cur.ok&&T().t==='pick'){
  const key=k.dataset.k,t=T();
  if(!t.multi)cur.sel.clear();
  cur.sel.has(key)?cur.sel.delete(key):cur.sel.add(key);
  $('#task .tw').outerHTML=table(getDF(t),{mode:t.mode,sel:cur.sel});return;
 }
 const b=e.target.closest('[data-act]');
 if(b&&b.tagName!=='SELECT'&&act[b.dataset.act])act[b.dataset.act](b.dataset,b);
});
document.addEventListener('change',e=>{if(e.target.id==='pds')act.pds({},e.target)});
document.addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-k]')){e.preventDefault();e.target.click()}
 if(e.key==='Enter'&&e.target.id==='num')check();
});
hud();home();
