/* Sets light/dark before first paint (no flash). A same-origin file, so the CSP allows it without a nonce. */
(function(){var d=false;try{var t=localStorage.getItem('veritas-theme')||'system';d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)}catch(e){}document.documentElement.dataset.theme=d?'dark':'light'})()
