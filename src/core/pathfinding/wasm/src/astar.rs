use std::collections::{HashMap, HashSet};
use priority_queue::PriorityQueue;
use std::cmp::Reverse;
use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect};
use serde::{Serialize, Deserialize};

// Result types to match TypeScript enums
#[wasm_bindgen]
pub enum PathFindResultType {
    NextTile = 0,
    Pending = 1,
    Completed = 2,
    PathNotFound = 3,
}

#[derive(Serialize, Deserialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

// GameMap abstraction for Rust
#[wasm_bindgen]
pub struct WasmGameMap {
    width: usize,
    height: usize,
    costs: Vec<f64>,
    water_tiles: HashSet<u32>,
}

#[wasm_bindgen]
impl WasmGameMap {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize, costs: Vec<f64>, water_tiles: Vec<u32>) -> WasmGameMap {
        WasmGameMap {
            width,
            height,
            costs,
            water_tiles: water_tiles.into_iter().collect(),
        }
    }

    pub fn ref_tile(&self, x: i32, y: i32) -> u32 {
        (y as u32 * self.width as u32 + x as u32)
    }

    pub fn x(&self, tile_ref: u32) -> i32 {
        (tile_ref % self.width as u32) as i32
    }

    pub fn y(&self, tile_ref: u32) -> i32 {
        (tile_ref / self.width as u32) as i32
    }

    pub fn cost(&self, tile_ref: u32) -> f64 {
        let idx = tile_ref as usize;
        if idx < self.costs.len() {
            self.costs[idx]
        } else {
            1.0 // Default cost
        }
    }

    pub fn is_water(&self, tile_ref: u32) -> bool {
        self.water_tiles.contains(&tile_ref)
    }

    pub fn neighbors(&self, tile_ref: u32) -> Vec<u32> {
        let x = self.x(tile_ref);
        let y = self.y(tile_ref);
        let width = self.width as i32;
        let height = self.height as i32;
        
        let mut neighbors = Vec::with_capacity(8);
        
        // 4-direction neighbors (no diagonals for simplicity)
        for (dx, dy) in &[(0, -1), (1, 0), (0, 1), (-1, 0)] {
            let nx = x + dx;
            let ny = y + dy;
            
            if nx >= 0 && nx < width && ny >= 0 && ny < height {
                neighbors.push(self.ref_tile(nx, ny));
            }
        }
        
        neighbors
    }
}

// Serial A* implementation in Rust
#[wasm_bindgen]
pub struct SerialAStarWasm {
    fwd_open_set: PriorityQueue<u32, Reverse<i32>>,
    bwd_open_set: PriorityQueue<u32, Reverse<i32>>,
    fwd_came_from: HashMap<u32, u32>,
    bwd_came_from: HashMap<u32, u32>,
    fwd_g_score: HashMap<u32, f64>,
    bwd_g_score: HashMap<u32, f64>,
    meeting_point: Option<u32>,
    completed: bool,
    sources: Vec<u32>,
    closest_source: u32,
    dst: u32,
    iterations: i32,
    max_tries: i32,
    game_map: WasmGameMap,
}

#[wasm_bindgen]
impl SerialAStarWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(
        sources: Vec<u32>, 
        dst: u32, 
        iterations: i32, 
        max_tries: i32, 
        game_map: WasmGameMap
    ) -> SerialAStarWasm {
        let mut astar = SerialAStarWasm {
            fwd_open_set: PriorityQueue::new(),
            bwd_open_set: PriorityQueue::new(),
            fwd_came_from: HashMap::new(),
            bwd_came_from: HashMap::new(),
            fwd_g_score: HashMap::new(),
            bwd_g_score: HashMap::new(),
            meeting_point: None,
            completed: false,
            sources: sources.clone(),
            closest_source: 0, // Will be set below
            dst,
            iterations,
            max_tries,
            game_map,
        };
        
        // Find closest source
        let mut min_dist = f64::MAX;
        let mut closest_src = sources[0];
        
        for src in &sources {
            let dist = astar.heuristic(*src, dst);
            if dist < min_dist {
                min_dist = dist;
                closest_src = *src;
            }
        }
        astar.closest_source = closest_src;
        
        // Initialize forward search
        for &source in &sources {
            astar.fwd_g_score.insert(source, 0.0);
            let f_score = astar.heuristic(source, dst) as i32;
            astar.fwd_open_set.push(source, Reverse(f_score));
        }
        
        // Initialize backward search
        astar.bwd_g_score.insert(dst, 0.0);
        let f_score = astar.heuristic(dst, closest_src) as i32;
        astar.bwd_open_set.push(dst, Reverse(f_score));
        
        astar
    }
    
    // Compute method that matches the TypeScript interface
    pub fn compute(&mut self) -> PathFindResultType {
        if self.completed {
            return PathFindResultType::Completed;
        }
        
        self.max_tries -= 1;
        let mut iterations = self.iterations;
        
        while !self.fwd_open_set.is_empty() && !self.bwd_open_set.is_empty() {
            iterations -= 1;
            if iterations <= 0 {
                if self.max_tries <= 0 {
                    return PathFindResultType::PathNotFound;
                }
                return PathFindResultType::Pending;
            }
            
            // Forward search
            if let Some((fwd_current, _)) = self.fwd_open_set.pop() {
                // Check for meeting point
                if self.bwd_g_score.contains_key(&fwd_current) {
                    self.meeting_point = Some(fwd_current);
                    self.completed = true;
                    return PathFindResultType::Completed;
                }
                
                self.expand_tile_ref(fwd_current, true);
            }
            
            // Backward search
            if let Some((bwd_current, _)) = self.bwd_open_set.pop() {
                // Check for meeting point
                if self.fwd_g_score.contains_key(&bwd_current) {
                    self.meeting_point = Some(bwd_current);
                    self.completed = true;
                    return PathFindResultType::Completed;
                }
                
                self.expand_tile_ref(bwd_current, false);
            }
        }
        
        if self.completed {
            PathFindResultType::Completed
        } else {
            PathFindResultType::PathNotFound
        }
    }
    
    // Helper function to expand a tile in the search
    fn expand_tile_ref(&mut self, current: u32, is_forward: bool) {
        let target = if is_forward { self.dst } else { self.closest_source };
        
        for neighbor in self.game_map.neighbors(current) {
            if neighbor != target && !self.game_map.is_water(neighbor) {
                continue;
            }
            
            let g_score = if is_forward { &mut self.fwd_g_score } else { &mut self.bwd_g_score };
            let came_from = if is_forward { &mut self.fwd_came_from } else { &mut self.bwd_came_from };
            let open_set = if is_forward { &mut self.fwd_open_set } else { &mut self.bwd_open_set };
            
            let current_g = *g_score.get(&current).unwrap();
            let tentative_g = current_g + self.game_map.cost(neighbor);
            
            if !g_score.contains_key(&neighbor) || tentative_g < *g_score.get(&neighbor).unwrap() {
                came_from.insert(neighbor, current);
                g_score.insert(neighbor, tentative_g);
                
                let h = self.heuristic(neighbor, target);
                let f_score = (tentative_g + h) as i32;
                open_set.push(neighbor, Reverse(f_score));
            }
        }
    }
    
    // Heuristic function (Manhattan distance)
    fn heuristic(&self, a: u32, b: u32) -> f64 {
        let ax = self.game_map.x(a);
        let ay = self.game_map.y(a);
        let bx = self.game_map.x(b);
        let by = self.game_map.y(b);
        
        1.1 * (((ax - bx).abs() + (ay - by).abs()) as f64)
    }
    
    // Reconstruct the path from start to goal
    pub fn reconstruct_path(&self) -> Vec<u32> {
        let mut path = Vec::new();
        
        if let Some(meeting) = self.meeting_point {
            // Build forward path
            let mut current = meeting;
            path.push(current);
            
            while let Some(&prev) = self.fwd_came_from.get(&current) {
                current = prev;
                path.insert(0, current);
            }
            
            // Build backward path
            current = meeting;
            while let Some(&next) = self.bwd_came_from.get(&current) {
                current = next;
                path.push(current);
            }
        }
        
        path
    }
}

// Mini A* implementation in Rust
#[wasm_bindgen]
pub struct MiniAStarWasm {
    game_map: WasmGameMap,
    mini_map: WasmGameMap,
    dst: u32,
    astar: SerialAStarWasm,
}

#[wasm_bindgen]
impl MiniAStarWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(
        game_map: WasmGameMap,
        mini_map: WasmGameMap,
        sources: Vec<u32>,
        dst: u32,
        iterations: i32,
        max_tries: i32
    ) -> MiniAStarWasm {
        // Convert source points to mini map coordinates
        let mini_sources: Vec<u32> = sources.iter().map(|&src| {
            let x = game_map.x(src);
            let y = game_map.y(src);
            mini_map.ref_tile(x / 2, y / 2)
        }).collect();
        
        // Convert destination to mini map coordinates
        let mini_dst = {
            let x = game_map.x(dst);
            let y = game_map.y(dst);
            mini_map.ref_tile(x / 2, y / 2)
        };
        
        let astar = SerialAStarWasm::new(
            mini_sources,
            mini_dst,
            iterations,
            max_tries,
            mini_map.clone()
        );
        
        MiniAStarWasm {
            game_map,
            mini_map,
            dst,
            astar,
        }
    }
    
    pub fn compute(&mut self) -> PathFindResultType {
        self.astar.compute()
    }
    
    pub fn reconstruct_path(&self) -> Vec<u32> {
        let mini_path = self.astar.reconstruct_path();
        
        // Convert minipath to points
        let points: Vec<Point> = mini_path.iter().map(|&tr| {
            Point {
                x: self.mini_map.x(tr),
                y: self.mini_map.y(tr)
            }
        }).collect();
        
       
        let upscaled = self.upscale_path(points);
        
      
        let mut final_path = upscaled;
        final_path.push(Point {
            x: self.game_map.x(self.dst),
            y: self.game_map.y(self.dst)
        });
        
       
        final_path.iter().map(|p| {
            self.game_map.ref_tile(p.x, p.y)
        }).collect()
    }
    
    fn upscale_path(&self, path: Vec<Point>, scale_factor: i32) -> Vec<Point> {
        let mut scaled_path: Vec<Point> = path.iter().map(|p| {
            Point { 
                x: p.x * scale_factor, 
                y: p.y * scale_factor 
            }
        }).collect();
        
        let mut smooth_path = Vec::new();
        
        for i in 0..scaled_path.len() - 1 {
            let current = &scaled_path[i];
            let next = &scaled_path[i + 1];
            
           
            smooth_path.push(Point { x: current.x, y: current.y });
            
            
            let dx = next.x - current.x;
            let dy = next.y - current.y;
            
            
            let distance = dx.abs().max(dy.abs());
            let steps = distance;
            
            
            for step in 1..steps {
                smooth_path.push(Point {
                    x: current.x + (dx * step) / steps,
                    y: current.y + (dy * step) / steps,
                });
            }
        }
        
        
        if !scaled_path.is_empty() {
            let last = scaled_path.last().unwrap();
            smooth_path.push(Point { x: last.x, y: last.y });
        }
        
        smooth_path
    }
}


#[wasm_bindgen]
pub struct AirPathFinderWasm {
    game_map: WasmGameMap,
}

#[wasm_bindgen]
impl AirPathFinderWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(game_map: WasmGameMap) -> AirPathFinderWasm {
        AirPathFinderWasm { game_map }
    }
    
    pub fn next_tile(&self, tile: u32, dst: u32, random_seed: u32) -> JsValue {
        let x = self.game_map.x(tile);
        let y = self.game_map.y(tile);
        let dst_x = self.game_map.x(dst);
        let dst_y = self.game_map.y(dst);
        
        if x == dst_x && y == dst_y {
            return JsValue::TRUE;
        }
        
        
        let mut next_x = x;
        let mut next_y = y;
        
        let ratio = 1 + ((dst_y - y).abs() as f64 / ((dst_x - x).abs() + 1) as f64).floor() as i32;
        
        
        let chance = (random_seed as f64 % 100.0) < (ratio as f64 * 100.0 / (ratio + 1) as f64);
        
        if chance && x != dst_x {
            if x < dst_x {
                next_x += 1;
            } else if x > dst_x {
                next_x -= 1;
            }
        } else {
            if y < dst_y {
                next_y += 1;
            } else if y > dst_y {
                next_y -= 1;
            }
        }
        
        if next_x == x && next_y == y {
            return JsValue::TRUE;
        }
        
        JsValue::from(self.game_map.ref_tile(next_x, next_y))
    }
}