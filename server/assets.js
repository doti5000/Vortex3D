// Static Asset Catalog for the Shop
export const SHOP_ASSETS = [
  {
    id: "asset_classic_red_shirt",
    type: "shirt",
    name: "Classic Red Shirt",
    description: "A bright red shirt to stand out.",
    price: 15,
    textureUrl: "/textures/classic-red-shirt-texture.png"
  },
  {
    id: "asset_classic_blue_shirt",
    type: "shirt",
    name: "Classic Blue Shirt",
    description: "A sleek blue shirt.",
    price: 15,
    textureUrl: "/textures/classic-shirt-texture-1.png"
  },
  {
    id: "asset_cool_shades",
    type: "hat",
    name: "Cool Shades",
    description: "Block out the haters.",
    price: 50,
    modelType: "shades"
  },
  {
    id: "asset_classic_face",
    type: "face",
    name: "Classic Smile",
    description: "The classic smile.",
    price: 25,
    textureUrl: "/textures/classic-face-texture.png"
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
