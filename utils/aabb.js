// utils/aabb.js
function hasBounds(o){ return o && o.x!=null && o.y!=null && o.width!=null && o.height!=null; }
function AABB(a,b){ return hasBounds(a)&&hasBounds(b) &&
  a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y; }
window.AABB = AABB;
