var CACHE='ct-v3';
var FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable.png'];
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(f){
      return c.add(new Request(f,{cache:'reload'})).catch(function(){return null;});
    }));
  }).catch(function(){}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.filter(function(x){return x!==CACHE;}).map(function(x){return caches.delete(x);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('message',function(e){
  if(e.data&&e.data.t==='skip')self.skipWaiting();
});
function isPage(req){
  if(req.mode==='navigate')return true;
  var u=req.url.split('?')[0];
  return u.slice(-11)==='/index.html'||u.slice(-1)==='/';
}
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  if(req.url.indexOf('http')!==0)return;

  if(isPage(req)){
    e.respondWith(
      fetch(req,{cache:'no-store'}).then(function(resp){
        if(resp&&resp.status===200){
          var copy=resp.clone();
          caches.open(CACHE).then(function(c){c.put('./index.html',copy);}).catch(function(){});
        }
        return resp;
      }).catch(function(){
        return caches.match('./index.html',{ignoreSearch:true}).then(function(f){
          return f || new Response('Offline and nothing cached yet. Open once with data on.',
            {status:503,headers:{'Content-Type':'text/plain'}});
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req,{ignoreSearch:true}).then(function(hit){
      if(hit)return hit;
      return fetch(req).then(function(resp){
        if(resp&&resp.status===200&&resp.type!=='opaque'){
          var copy=resp.clone();
          caches.open(CACHE).then(function(c){c.put(req,copy);}).catch(function(){});
        }
        return resp;
      }).catch(function(){return new Response('',{status:504});});
    })
  );
});
