// modules/systems/WindArrowSystem.js
import { tileMap, mapCols, mapRows, tileSize } from '../tile/TileMap.js';
import { applyWindDamage } from '../utils/WindDamageUtils.js';

export class WindArrowSystem {
  constructor() {
    this.arrows = [];
    this.spawnRate = 1500;
    this.lastSpawnTime = 0;
    this.fadeDuration = 500;
    this.speed = 0.5;
    this.seAngle = Math.PI/4;
    this.minArrows = 5;
    this.maxArrows = 12;
    this.wobbleDuration = 500;
  }

  update(world, dt) {
    const now = millis();
    if (now - this.lastSpawnTime > this.spawnRate) {
      this.spawnWindGust(world);
      this.lastSpawnTime = now;
    }
    for (let i=this.arrows.length-1;i>=0;i--){
      const a=this.arrows[i]; a.age+=dt;
      a.x+=a.vx*(dt/16.7); a.y+=a.vy*(dt/16.7);
      const c=floor(a.x/tileSize), r=floor(a.y/tileSize);

      // Out of bounds => fade
      if(r<0||c<0||r>=mapRows||c>=mapCols){this.fadeOut(a);}
      else{
        // 1) Check agent collision (simple same-tile approach)
        if(this.agentInTile(world,r,c)){ this.fadeOut(a); }
        else{
          const tile=tileMap[r][c];
          // forest + tree => fade
          if(tile.type==='forest' && tile.hasTree){ this.fadeOut(a); }
          // fully built wall/floor/door => revert to blueprint, damage=0, cost $10
          else if(this.isFullyBuiltWall(tile)){
            applyWindDamage(tile,r,c,tileMap); // keep the “damage feedback” 
            tile.damage=0; // or set to some partial damage if you want
            tile.transparent=true; 
            this.markForRebuild(world,tile.type,r,c);
            this.fadeOut(a);
          }
          // blueprint => ignore (pass through)
          // beach/ocean => pass through
        }
      }
      a.alpha=this.computeAlpha(a);
      if(a.alpha<=0||a.age>=a.lifetime) this.arrows.splice(i,1);
    }
  }

  spawnWindGust(world){
    // Collect possible spawn cells (e.g. grassland). Some “windiest” cells get extra spawns
    const spawnCells=[];
    for(let r=0;r<mapRows;r++){
      for(let c=0;c<mapCols;c++){
        // Suppose we spawn only if tile is grassland or a “windy grassland”
        if(tileMap[r][c].type==='grassland'){
          let multiplier= (tileMap[r][c].windyArea)? 3:1; // “windyArea” => more spawns
          while(multiplier-->0) spawnCells.push({r,c});
        }
      }
    }
    if(!spawnCells.length)return;
    const cell= spawnCells[floor(random(spawnCells.length))];
    const cx= cell.c*tileSize + tileSize/2, cy= cell.r*tileSize + tileSize/2;
    const count= floor(random(this.minArrows, this.maxArrows+1));
    const perp= this.seAngle+Math.PI/2, distBetween=15, bowAmp=30;

    for(let i=0;i<count;i++){
      const off= i-(count-1)/2, f= off/((count-1)/2||1);
      const xp= distBetween*off*cos(perp), yp= distBetween*off*sin(perp);
      const fOff= bowAmp*(1-f*f), xB= fOff*cos(this.seAngle), yB= fOff*sin(this.seAngle);
      const sx= cx+xp+xB, sy= cy+yp+yB;
      const lifetime= floor(random(8000,30000)); // 8-30s
      this.arrows.push({
        x:sx,y:sy, age:0, alpha:0, fadeMode:'in', 
        vx:this.speed*cos(this.seAngle), vy:this.speed*sin(this.seAngle),
        rotation:this.seAngle, lifetime
      });
    }
  }

  agentInTile(world,r,c){
    // Example check: see if any agent’s floor(Position) is (r,c).
    // This can be replaced with a more robust bounding check if needed
    const agents= world.getEntitiesByComponents(['Position','Renderable']);
    for(let ent of agents){
      const p= world.getComponent(ent,'Position');
      const rc= floor(p.x/tileSize), rr= floor(p.y/tileSize);
      if(rr===r && rc===c) return true;
    }
    return false;
  }

  isFullyBuiltWall(tile){
    // e.g. fully built => not transparent, type in [white_bricks, dark_floor, door_tile]
    return (!tile.transparent && 
      (tile.type==='white_bricks'||tile.type==='dark_floor'||tile.type==='door_tile'));
  }

  markForRebuild(world,type,r,c){
    // cost system sees rebuild => subtract $10
    if(!world.placedBuildingsQueue) world.placedBuildingsQueue=[];
    world.placedBuildingsQueue.push({rebuild:true, type,row:r, col:c});
  }

  fadeOut(a){
    if(a.fadeMode!=='out'){a.fadeMode='out';a.lifetime=a.age+this.fadeDuration;}
  }

  computeAlpha(a){
    if(a.fadeMode==='in'){
      if(a.age<this.fadeDuration)return map(a.age,0,this.fadeDuration,0,255);
      else return 255;
    } else {
      const e=a.age-(a.lifetime-this.fadeDuration);
      return map(e,0,this.fadeDuration,255,0);
    }
  }
}