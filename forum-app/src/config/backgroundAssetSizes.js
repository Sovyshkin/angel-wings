// Intrinsic pixel dimensions of the supplied artwork. Keep backgrounds sharp
// at 2x density and bound tall silhouettes as well as horizontal ribbons.
const sizes = {
  "home-scene/molecule-01-diagonal": [
    1165,
    1091
  ],
  "home-scene/molecule-02-mirrored": [
    1156,
    1073
  ],
  "home-scene/molecule-03-chain": [
    1380,
    987
  ],
  "home-scene/molecule-04-chain-reversed": [
    1380,
    987
  ],
  "home-scene/molecule-05-cluster": [
    591,
    810
  ],
  "home-scene/molecule-06-ring": [
    1131,
    985
  ],
  "home-scene/wave-01-horizontal": [
    2172,
    466
  ],
  "home-scene/wave-02-reversed": [
    2172,
    466
  ],
  "home-scene/wave-03-flow-up": [
    1758,
    406
  ],
  "home-scene/wave-04-flow-down": [
    1758,
    406
  ],
  "home-scene/wave-05-vertical": [
    929,
    1507
  ],
  "home-scene/wave-06-curved": [
    1365,
    1179
  ],
  "home-scene-light/chain-dna": [
    1254,
    1254
  ],
  "home-scene-light/chain-pearl": [
    1254,
    1254
  ],
  "home-scene-light/dna": [
    1024,
    1536
  ],
  "home-scene-light/molecule-blue": [
    1254,
    1254
  ],
  "home-scene-light/molecule-cross": [
    1254,
    1254
  ],
  "home-scene-light/molecule-pearl-reverse": [
    1254,
    1254
  ],
  "home-scene-light/molecule-pearl": [
    1254,
    1254
  ],
  "home-scene-light/molecule-small": [
    1254,
    1254
  ],
  "home-scene-light/ring": [
    1254,
    1254
  ],
  "home-scene-light/sphere-dna": [
    1254,
    1254
  ],
  "home-scene-light/spheres": [
    1254,
    1254
  ],
  "home-scene-light/wave-cloud": [
    1254,
    1254
  ],
  "home-scene-light/wave-flow-reverse": [
    1774,
    887
  ],
  "home-scene-light/wave-flow": [
    1774,
    887
  ],
  "home-scene-light/wave-orbit": [
    1254,
    1254
  ],
  "home-scene-light/wave-ribbon-reverse": [
    1774,
    887
  ],
  "home-scene-light/wave-ribbon": [
    1774,
    887
  ],
  "home-scene-light/wave-rising": [
    1672,
    941
  ]
}

export function backgroundAssetWidth(folder, asset, requestedWidth, maxHeight) {
  const [width, height] = sizes[`${folder}/${asset}`]
  return Math.min(requestedWidth, width / 2, maxHeight * width / height)
}
