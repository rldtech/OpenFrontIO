mod astar;
mod utils;

use wasm_bindgen::prelude::*;

// Export to javascript
#[wasm_bindgen]
pub fn init_panic_hook() {
    utils::set_panic_hook();
}


#[wasm_bindgen]
pub use astar::*;