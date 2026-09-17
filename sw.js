var CACHE='ct-v2';
var FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable.png'];
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    // cache each file on its own so one failure cannot wipe the batch
    return Promise.all(FILES.map(function(f){
      return c.add(f).catch(function(){return null;});
    }));
  }).catch(function(){}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.filter(function(x){return x!==CACHE;}).map(function(x){return caches.delete(x);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  if(e.request.url.indexOf('http')!==0)return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(function(hit){
      var net=fetch(e.request).then(function(resp){
        if(resp&&resp.status===200&&resp.type!=='opaque'){
          var copy=resp.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,copy);}).catch(function(){});
        }
        return resp;
      }).catch(function(){return null;});
      if(hit){net;return hit;}
      return net.then(function(r){
        if(r)return r;
        return caches.match('./index.html',{ignoreSearch:true}).then(function(f){
          return f || new Response('Offline and nothing cached yet. Open once with data.',{status:503,headers:{'Content-Type':'text/plain'}});
        });
      });
    })
  );
});
