/** Tiny first-paint boot for installed Admin (inline in document head). Keep small. */
export const ADMIN_EARLY_BOOT_SCRIPT = `(function(){try{var p=location.pathname;if(p!=="/admin"&&p.indexOf("/admin/")!==0)return;var d=document.documentElement;d.classList.add("dh-admin");var s=false;try{s=window.matchMedia("(display-mode: standalone)").matches}catch(e){}if(!s&&navigator.standalone===true)s=true;if(!s)return;d.classList.add("dh-standalone");var k="daintyhand-admin-launch-shown";try{if(sessionStorage.getItem(k)==="1")return;sessionStorage.setItem(k,"1")}catch(e){}d.setAttribute("data-admin-launch","pending");var el=document.createElement("div");el.id="admin-early-splash";el.setAttribute("aria-hidden","true");el.innerHTML='<div class="admin-early-splash-brand"><p class="admin-early-splash-title">DaintyHand</p><p class="admin-early-splash-sub">Admin</p></div>';function mount(){try{(document.body||d).appendChild(el)}catch(e){}}if(document.body)mount();else document.addEventListener("DOMContentLoaded",mount)}catch(e){}})();`;

export const ADMIN_EARLY_BOOT_STYLE = `html,body{background-color:#fdfbf7;color-scheme:light}
#admin-early-splash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;min-height:100dvh;width:100%;background:#fdfbf7;pointer-events:auto}
.admin-early-splash-brand{text-align:center;padding:1.5rem;animation:admin-launch-brand 700ms cubic-bezier(0.16,1,0.3,1) both}
.admin-early-splash-title{margin:0;font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:2.25rem;letter-spacing:-0.02em;color:#2d2926}
.admin-early-splash-sub{margin:0.75rem 0 0;font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#68635f}
@media (prefers-reduced-motion:reduce){.admin-early-splash-brand{animation:none}}
@media (display-mode:standalone){html.dh-admin .admin-mobile-chrome-header{display:none!important}html.dh-admin .admin-shell-main{padding-top:max(0.75rem,env(safe-area-inset-top,0px))!important}}
html.dh-standalone.dh-admin .admin-mobile-chrome-header{display:none!important}
html.dh-standalone.dh-admin .admin-shell-main{padding-top:max(0.75rem,env(safe-area-inset-top,0px))!important}`;
