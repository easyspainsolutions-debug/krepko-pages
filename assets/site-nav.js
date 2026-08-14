/* Обвязка навигации: пометка активного пункта и поведение мобильного меню.
   Файл общий на все страницы — раньше тот же код лежал внутри каждого из
   225 HTML и заново скачивался при каждом переходе. */
(function(){
  // Active page marker
  var p=location.pathname;
  var k=(p==='/'||p==='/index.html')?'home':p.indexOf('/blog')===0?'blog':p.indexOf('/services')===0||p.indexOf('/notario')===0||p.indexOf('/ukraina')===0||p.indexOf('/banca')===0||p.indexOf('/traduccion')===0||p.indexOf('/legalizacion')===0?'services':p.indexOf('/about')===0?'about':'';
  if(k){var l=document.querySelector('.site-menu__link[data-page="'+k+'"]');if(l)l.classList.add('active');}
  // Dialog a11y wiring (Sprint 5):
  // - backdrop click closes
  // - Esc closes (explicit, not just native)
  // - focus returns to trigger on close
  var d=document.getElementById('site-menu-dialog');
  var trigger=document.querySelector('.site-nav__menu-btn');
  // Статус-бар iOS под цвет открытого меню — почему так, см. site-nav.css
  var themeMeta=document.querySelector('meta[name="theme-color"]');
  var themeIdle=themeMeta?themeMeta.getAttribute('content'):null;
  if(d&&themeMeta&&themeIdle&&window.MutationObserver){
    new MutationObserver(function(){
      themeMeta.setAttribute('content',d.hasAttribute('open')?'#FFFBF7':themeIdle);
    }).observe(d,{attributes:true,attributeFilter:['open']});
  }
  if(d){
    d.addEventListener('click',function(e){if(e.target===d)d.close();});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();d.close();}});
    d.addEventListener('close',function(){if(trigger){try{trigger.focus();}catch(_){}}});
  }
})();
