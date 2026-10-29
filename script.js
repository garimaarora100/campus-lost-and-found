const STORAGE_KEY = "campusfind_reports_v1";
const MY_REPORTS_KEY = "campusfind_my_reports_v1";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const starterItems = [
  {id:"demo1",name:"Wireless headphones",category:"Electronics",status:"found",description:"Black over-ear headphones found near the main library entrance. No visible name tag.",location:"Main Library",date:todayOffset(0),reporter:"Aarav S.",contact:"aarav@example.com",emoji:"🎧",image:"",createdAt:Date.now()-1000*60*30},
  {id:"demo2",name:"Student ID card",category:"ID & Cards",status:"lost",description:"A student ID card was misplaced around the cafeteria. Please contact me if you spot it.",location:"Campus Cafeteria",date:todayOffset(-1),reporter:"Priya M.",contact:"priya@example.com",emoji:"🪪",image:"",createdAt:Date.now()-1000*60*60*3},
  {id:"demo3",name:"Blue water bottle",category:"Accessories",status:"found",description:"Reusable blue bottle left on a table after the afternoon lecture.",location:"Block B, Room 204",date:todayOffset(-1),reporter:"Kabir R.",contact:"kabir@example.com",emoji:"🧴",image:"",createdAt:Date.now()-1000*60*60*8},
  {id:"demo4",name:"Calculus notebook",category:"Books & Notes",status:"lost",description:"Spiral-bound notebook with handwritten calculus notes. Has a small green sticker on the cover.",location:"Science Building",date:todayOffset(-2),reporter:"Meera K.",contact:"meera@example.com",emoji:"📓",image:"",createdAt:Date.now()-1000*60*60*20},
  {id:"demo5",name:"Brown wallet",category:"Accessories",status:"reunited",description:"Small brown wallet with a few cards. Owner has been contacted and the item has been returned.",location:"Sports Complex",date:todayOffset(-3),reporter:"Dev P.",contact:"dev@example.com",emoji:"👛",image:"",createdAt:Date.now()-1000*60*60*30},
  {id:"demo6",name:"USB-C charger",category:"Electronics",status:"found",description:"White USB-C wall charger found plugged in beside a study desk.",location:"Computer Lab 1",date:todayOffset(0),reporter:"Nisha T.",contact:"nisha@example.com",emoji:"🔌",image:"",createdAt:Date.now()-1000*60*60*2}
];
function todayOffset(offset){const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function loadItems(){try{const saved=localStorage.getItem(STORAGE_KEY);return saved?JSON.parse(saved):starterItems.map(x=>({...x}));}catch{return starterItems.map(x=>({...x}));}}
let items=loadItems();
let currentView="all";
let currentStatus="all";
let listMode=false;
let toastTimer;
let myReports=new Set(JSON.parse(localStorage.getItem(MY_REPORTS_KEY)||"[]"));
function saveItems(){localStorage.setItem(STORAGE_KEY,JSON.stringify(items));localStorage.setItem(MY_REPORTS_KEY,JSON.stringify([...myReports]));}
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function formatDate(date){if(!date)return "Date not specified";const d=new Date(`${date}T12:00:00`);return Number.isNaN(d.getTime())?date:d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}
function niceStatus(status){return status==="reunited"?"Reunited":status==="lost"?"Lost":"Found";}
function emojiFor(category){return ({"Electronics":"🎧","Accessories":"🔑","ID & Cards":"🪪","Books & Notes":"📚","Bags":"🎒","Clothing":"🧥","Other":"📦"})[category]||"📦";}
function counts(){return {all:items.length,lost:items.filter(i=>i.status==="lost").length,found:items.filter(i=>i.status==="found").length,reunited:items.filter(i=>i.status==="reunited").length};}
function renderStats(){const c=counts();$("#totalStat").textContent=c.all;$("#lostStat").textContent=c.lost;$("#foundStat").textContent=c.found;$("#reunitedStat").textContent=c.reunited;$("#allCount").textContent=c.all;$("#pillAll").textContent=c.all;$("#pillLost").textContent=c.lost;$("#pillFound").textContent=c.found;$("#pillReunited").textContent=c.reunited;}
function filteredItems(){
 let list=[...items];const q=$("#searchInput").value.trim().toLowerCase();const category=$("#categoryFilter").value;const sort=$("#sortFilter").value;
 if(currentView==="lost")list=list.filter(i=>i.status==="lost");
 if(currentView==="found")list=list.filter(i=>i.status==="found");
 if(currentView==="my")list=list.filter(i=>myReports.has(i.id));
 if(currentStatus!=="all")list=list.filter(i=>i.status===currentStatus);
 if(category!=="all")list=list.filter(i=>i.category===category);
 if(q)list=list.filter(i=>[i.name,i.description,i.location,i.category,i.reporter].join(" ").toLowerCase().includes(q));
 if(sort==="newest")list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 if(sort==="oldest")list.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
 if(sort==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
 return list;
}
function itemCard(item){
 const image=item.image?`<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" onerror="this.remove()">`:`<span class="item-emoji">${emojiFor(item.category)}</span>`;
 return `<article class="item-card"><div class="item-visual">${image}<span class="status-tag ${item.status}">${item.status==="lost"?"⌕":item.status==="found"?"✓":"♡"} ${niceStatus(item.status)}</span></div><div class="item-body"><div class="item-category">${escapeHTML(item.category)}</div><h3 class="item-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</h3><p class="item-description">${escapeHTML(item.description)}</p><div class="item-meta"><span>⌖</span><span>${escapeHTML(item.location)}</span></div><div class="item-meta"><span>◷</span><span>${formatDate(item.date)}</span></div><div class="card-bottom"><span class="reporter">By ${escapeHTML(item.reporter)}</span><button class="detail-link" data-detail="${escapeHTML(item.id)}">View details ↗</button></div></div></article>`;
}
function viewTitle(){return ({all:"All items",lost:"Lost items",found:"Found items",my:"My reports"})[currentView]||"All items";}
function render(){
 renderStats();const list=filteredItems();$("#breadcrumbTitle").textContent=viewTitle();$("#listingTitle").textContent=currentView==="all"?"Recently reported items":currentView==="my"?"My reports":viewTitle();$("#resultsCount").textContent=`Showing ${list.length} item${list.length===1?"":"s"}`;
 $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));
 $$(".pill").forEach(b=>b.classList.toggle("active",b.dataset.status===currentStatus));
 $("#itemsGrid").classList.toggle("list-mode",listMode);
 $("#itemsGrid").innerHTML=list.map(itemCard).join("");$("#emptyState").classList.toggle("hidden",list.length!==0);$("#itemsGrid").classList.toggle("hidden",list.length===0);
}
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2800);}
function openModal(id){$("#"+id).classList.remove("hidden");document.body.style.overflow="hidden";}
function closeModal(id){$("#"+id).classList.add("hidden");if($$(".modal-backdrop:not(.hidden)").length===0)document.body.style.overflow="";}
function openDetails(id){
 const item=items.find(i=>i.id===id);if(!item)return;
 const visual=item.image?`<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" onerror="this.remove()">`:emojiFor(item.category);
 $("#detailContent").innerHTML=`<div class="detail-hero">${visual}</div><div class="detail-inner"><span class="status-tag ${item.status}">${niceStatus(item.status)}</span><div class="item-category" style="margin-top:14px">${escapeHTML(item.category)}</div><h2 id="detailTitle">${escapeHTML(item.name)}</h2><p>${escapeHTML(item.description)}</p><div class="detail-info"><div class="info-cell"><small>LAST SEEN / FOUND AT</small><b>${escapeHTML(item.location)}</b></div><div class="info-cell"><small>DATE REPORTED</small><b>${formatDate(item.date)}</b></div><div class="info-cell"><small>REPORTED BY</small><b>${escapeHTML(item.reporter)}</b></div><div class="info-cell"><small>REPORT TYPE</small><b>${niceStatus(item.status)}</b></div></div><div class="detail-contact"><b>Contact the reporter</b>${escapeHTML(item.contact)}<br>Please be respectful and arrange any handover in a safe, public campus location.</div><div class="detail-actions">${item.status!=="reunited"?`<button class="primary-btn" id="claimButton" data-claim="${escapeHTML(item.id)}">${item.status==="lost"?"I may have found this":"Contact / claim item"} ↗</button><button class="secondary-btn" id="reunitedButton" data-reunited="${escapeHTML(item.id)}">Mark as reunited</button>`:"<span class='status-tag reunited'>♡ This item is reunited</span>"}<button class="secondary-btn" id="copyDetails" data-copy="${escapeHTML(item.id)}">Copy item details</button></div></div>`;
 openModal("detailModal");
}
function openReport(){ $("#itemDate").value=todayOffset(0);openModal("reportModal"); }
function setView(view){currentView=view;currentStatus="all";render();if(window.innerWidth<=800)$("#sidebar").classList.remove("open");}
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("#reportTop").addEventListener("click",openReport);$("#sidebarReport").addEventListener("click",openReport);
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#searchInput").addEventListener("input",render);$("#categoryFilter").addEventListener("change",render);$("#sortFilter").addEventListener("change",render);
$("#statusPills").addEventListener("click",e=>{const b=e.target.closest("[data-status]");if(b){currentStatus=b.dataset.status;render();}});
$("#itemsGrid").addEventListener("click",e=>{const b=e.target.closest("[data-detail]");if(b)openDetails(b.dataset.detail);});
$("#listViewBtn").addEventListener("click",()=>{listMode=!listMode;$("#listViewBtn").classList.toggle("selected",listMode);$(".view-btn[aria-label='Grid view']").classList.toggle("selected",!listMode);render();});
$(".view-btn[aria-label='Grid view']").addEventListener("click",()=>{listMode=false;$("#listViewBtn").classList.remove("selected");$(".view-btn[aria-label='Grid view']").classList.add("selected");render();});
$("#clearFilters").addEventListener("click",()=>{$("#searchInput").value="";$("#categoryFilter").value="all";$("#sortFilter").value="newest";currentStatus="all";currentView="all";render();});
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
$$(".modal-backdrop").forEach(backdrop=>backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal(backdrop.id);}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".modal-backdrop:not(.hidden)").forEach(m=>closeModal(m.id));if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#searchInput").focus();}});
$("#reportForm").addEventListener("submit",e=>{
 e.preventDefault();
 const name=$("#itemName").value.trim(),description=$("#itemDescription").value.trim(),location=$("#itemLocation").value.trim(),reporter=$("#reporterName").value.trim(),contact=$("#reporterContact").value.trim();
 if(!name||!description||!location||!reporter||!contact){showToast("Please complete all required fields.");return;}
 const item={id:"item_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),name,description,location,reporter,contact,category:$("#itemCategory").value,status:$("#itemStatus").value,date:$("#itemDate").value,image:$("#itemImage").value.trim(),createdAt:Date.now()};
 items.unshift(item);myReports.add(item.id);saveItems();e.target.reset();closeModal("reportModal");currentView="all";currentStatus="all";$("#searchInput").value="";$("#categoryFilter").value="all";render();showToast("Your report has been published!");window.scrollTo({top:0,behavior:"smooth"});
});
$("#detailContent").addEventListener("click",e=>{
 const claim=e.target.closest("[data-claim]");if(claim){const item=items.find(i=>i.id===claim.dataset.claim);if(item){showToast(`Contact ${item.reporter} at ${item.contact}`);}return;}
 const reunited=e.target.closest("[data-reunited]");if(reunited){const item=items.find(i=>i.id===reunited.dataset.reunited);if(item){item.status="reunited";saveItems();render();openDetails(item.id);showToast("Item marked as reunited. Thank you!");}return;}
 const copy=e.target.closest("[data-copy]");if(copy){const item=items.find(i=>i.id===copy.dataset.copy);if(item){const text=`${item.name} (${niceStatus(item.status)})\\nCategory: ${item.category}\\nLocation: ${item.location}\\nDate: ${formatDate(item.date)}\\nDescription: ${item.description}\\nContact: ${item.contact}`;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(()=>showToast("Item details copied.")).catch(()=>showToast(text));else showToast(text);} }
});
render();
