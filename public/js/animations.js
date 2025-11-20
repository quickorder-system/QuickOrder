// animations.js — small helper for ripple effect and keyboard activation
(function(){
  function createInk(x,y,size,container){
    const ink = document.createElement('span');
    ink.className = 'ripple-ink';
    ink.style.width = ink.style.height = size + 'px';
    ink.style.left = (x - size/2) + 'px';
    ink.style.top = (y - size/2) + 'px';
    container.appendChild(ink);
    // trigger animation
    requestAnimationFrame(()=> ink.classList.add('animate'));
    ink.addEventListener('animationend', ()=> ink.remove());
    setTimeout(()=> { if(ink.parentNode) ink.remove(); }, 800);
  }

  function onPointerDown(e){
    // don't create ripples if user prefers reduced motion
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    let x = 0, y = 0;
    if(e.touches && e.touches.length) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    createInk(x,y,size,el);
  }

  // Attach ripple to common interactive selectors
  function attachRipples(){
    const selectors = [
      'button', '.btn-cta', '.btn-primary', '.home-btn', '.order-btn', '.back-btn', '.close-btn', '.next-button', '.submit-button', '.feature-card', '.food-card', '.order-item-card', '.nav-links a'
    ];
    const els = document.querySelectorAll(selectors.join(','));
    els.forEach(el => {
      // ensure element is relatively positioned for ink
      if(getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('ripple');
      el.addEventListener('pointerdown', onPointerDown, {passive:true});
      // keyboard activation
      el.addEventListener('keydown', (ev) => {
        if(ev.key === 'Enter' || ev.key === ' ') {
          // simulate center ripple
          const rect = el.getBoundingClientRect();
          createInk(rect.width/2, rect.height/2, Math.max(rect.width, rect.height)*1.2, el);
        }
      });
    });
  }

  // Toast auto-hide animation handled by existing code; this ensures class-based animate
  document.addEventListener('DOMContentLoaded', ()=>{
    try{ attachRipples(); }catch(e){/* fail silently */}
    try{ initCustomSelect(); }catch(e){/* fail silently */}
  });
})();

/* Custom select replacement for native selects to provide animated dropdown
   - Targets select with id #categorySelect (menu page). Keeps original select
     hidden for form submission and syncs value.
*/
(function(){
  function initCustomSelect(){
    // Initialize custom select for all selects except admin/owner filter selects
    const selects = Array.from(document.querySelectorAll('select')).filter(s => !s.classList.contains('filter-select') && !s.hasAttribute('data-no-custom'));
    if(!selects.length) return;
    selects.forEach(sel => {
      // avoid double-initialization
      if(sel.dataset.customized === '1') return;
      sel.dataset.customized = '1';

      const wrapper = document.createElement('div'); wrapper.className = 'custom-select';
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'select-toggle'; toggle.setAttribute('aria-haspopup','listbox');
      const label = document.createElement('span'); label.className = 'label'; label.textContent = sel.options[sel.selectedIndex]?.text || '';
      const caret = document.createElement('span'); caret.className = 'caret'; caret.innerHTML = '\u25BC';
      toggle.appendChild(label); toggle.appendChild(caret);
      const options = document.createElement('div'); options.className = 'options'; options.setAttribute('role','listbox');

      Array.from(sel.options).forEach((opt, idx)=>{
        const o = document.createElement('div'); o.className = 'option'; o.setAttribute('role','option'); o.tabIndex = -1; o.dataset.value = opt.value; o.textContent = opt.text;
        if(opt.disabled) o.setAttribute('aria-disabled','true');
        if(opt.selected) o.setAttribute('aria-selected','true');
        o.addEventListener('click', ()=>{
          selectIndex(idx);
          close();
          toggle.focus();
        });
        options.appendChild(o);
      });

      // hide original select but keep in DOM
      sel.style.display = 'none';
      sel.parentNode.insertBefore(wrapper, sel);
      wrapper.appendChild(toggle); wrapper.appendChild(options); wrapper.appendChild(sel);

      function open(){ wrapper.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
      function close(){ wrapper.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
      function toggleOpen(){ wrapper.classList.contains('open')? close(): open(); }
      function selectIndex(i){ sel.selectedIndex = i; sel.dispatchEvent(new Event('change')); // sync label & aria
        label.textContent = sel.options[i]?.text || '';
        const opts = options.querySelectorAll('.option'); opts.forEach((el,ix)=> el.setAttribute('aria-selected', ix===i ? 'true' : 'false'));
      }

      // keyboard behavior
      toggle.addEventListener('keydown', (e)=>{
        if(e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); open(); const first = options.querySelector('.option'); first && first.focus(); }
        if(e.key === 'ArrowUp'){ e.preventDefault(); open(); const last = options.querySelector('.option:last-child'); last && last.focus(); }
      });

      options.addEventListener('keydown', (e)=>{
        const focused = document.activeElement;
        if(!focused || !focused.classList.contains('option')) return;
        if(e.key === 'ArrowDown'){ e.preventDefault(); (focused.nextElementSibling || options.firstElementChild).focus(); }
        if(e.key === 'ArrowUp'){ e.preventDefault(); (focused.previousElementSibling || options.lastElementChild).focus(); }
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); focused.click(); }
        if(e.key === 'Escape'){ e.preventDefault(); toggle.focus(); close(); }
      });

      // open/close
      toggle.addEventListener('click', (e)=>{ e.preventDefault(); toggleOpen(); });
      document.addEventListener('click', (e)=>{ if(!wrapper.contains(e.target)) close(); });

      // set initial aria
      toggle.setAttribute('aria-expanded','false');

      // helper: if underlying select changes (programmatic), update UI
      sel.addEventListener('change', ()=>{
        const i = sel.selectedIndex; label.textContent = sel.options[i]?.text || '';
        const opts = options.querySelectorAll('.option'); opts.forEach((el,ix)=> el.setAttribute('aria-selected', ix===i ? 'true' : 'false'));
      });
    });
  }

  // expose init
  window.initCustomSelect = initCustomSelect;
})();
