// Static Asset Catalog for the Shop
export const SHOP_ASSETS = [
  {
    id: "asset_classic_red_shirt",
    type: "shirt",
    name: "Classic Red Shirt",
    description: "A bright red shirt to stand out.",
    price: 15,
    textureUrl: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/uv_grid_opengl.jpg"
  },
  {
    id: "asset_classic_blue_shirt",
    type: "shirt",
    name: "Classic Blue Shirt",
    description: "A sleek blue shirt.",
    price: 15,
    textureUrl: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/crate.gif"
  },
  {
    id: "asset_cool_shades",
    type: "face",
    name: "Cool Shades",
    description: "Block out the haters.",
    price: 50,
    textureUrl: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/decals/decal-diffuse.png"
  },
  {
    id: "asset_gold_chain",
    type: "shirt",
    name: "Gold Chain Shirt",
    description: "Show off your Vorbucks.",
    price: 250,
    textureUrl: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg"
  },
  {
    id: "asset_fancy_fedora",
    type: "hat",
    name: "Fancy Fedora",
    description: "A classy hat for a classy avatar.",
    price: 100,
    modelType: "fedora"
  }
];

export function getAssetById(id) {
  return SHOP_ASSETS.find(a => a.id === id);
}
