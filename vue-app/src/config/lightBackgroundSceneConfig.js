// Independent art direction for the light scene. Coordinates are fractions of
// a composition zone; dimensions and edge offsets are adapted per device.
export const lightBackgroundSceneConfig = {
  zoneHeight: 760,
  arrangements: [
    ['wave-flow', 'wave-rising', 'molecule-pearl', 'sphere-dna', 'molecule-small', 'spheres'],
    ['wave-ribbon-reverse', 'wave-orbit', 'spheres', 'molecule-cross', 'chain-dna', 'molecule-blue'],
    ['wave-flow-reverse', 'wave-cloud', 'chain-pearl', 'molecule-pearl-reverse', 'sphere-dna', 'ring'],
    ['wave-ribbon', 'wave-flow', 'molecule-cross', 'ring', 'molecule-blue', 'dna'],
    ['wave-rising', 'wave-ribbon-reverse', 'molecule-pearl-reverse', 'molecule-small', 'spheres', 'chain-pearl'],
    ['wave-flow-reverse', 'wave-orbit', 'sphere-dna', 'dna', 'molecule-pearl', 'molecule-cross']
  ],
  objects: [
    { role: 'wave', asset: 0, y: .02, size: 720, inset: -220, opacity: .68, angle: -13 },
    { role: 'primary', asset: 2, y: .18, size: 255, inset: -95, opacity: .9, angle: 18 },
    { role: 'satellite', asset: 3, y: .43, size: 115, inset: 108, opacity: .78, angle: -28 },
    { role: 'echo', asset: 1, y: .5, size: 480, inset: -210, opacity: .56, angle: 21, opposite: true },
    { role: 'counterpoint', asset: 4, y: .64, size: 200, inset: -72, opacity: .86, angle: -19, opposite: true },
    { role: 'small', asset: 5, y: .08, size: 82, inset: 135, opacity: .72, angle: 32, opposite: true },
    { role: 'outer', asset: 3, y: .76, size: 170, inset: 365, opacity: .82, angle: 38 },
    { role: 'outer', asset: 5, y: .36, size: 125, inset: 410, opacity: .76, angle: -23, opposite: true }
  ],
  profiles: {
    mobile: { roles: ['wave', 'primary', 'counterpoint'], sizes: { wave: 440, primary: 155, counterpoint: 125 }, insets: { wave: -295, primary: -108, counterpoint: -88 }, angles: { wave: -32 }, positions: { wave: .2, primary: .06, counterpoint: .58 } },
    tablet: { roles: ['wave', 'primary', 'echo', 'counterpoint', 'small'], scale: .74 },
    desktop: { roles: ['wave', 'primary', 'satellite', 'echo', 'counterpoint', 'small'], scale: 1 },
    wide: { roles: ['wave', 'primary', 'satellite', 'echo', 'counterpoint', 'small', 'outer'], scale: 1 }
  }
}
