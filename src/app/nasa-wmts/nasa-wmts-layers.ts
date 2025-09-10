// nasa-wmts-layers.ts

export interface NasaLayerConfig {
    id: string;
    label: string;
    urlTemplate: string;
    matrixSet: string;
    format: string;
    style: string;
    scaleDenominators: number[];
    maxZoom: number;
  }
  
  // Common scale denominators used by both Moon and Mars layers
  const sharedScaleDenominators: number[] = [
    2.7922763629807472e8,
    1.3961381814903736e8,
    6.9806909074518681e7,
    3.490345453725934e7,
    1.745172726862967e7,
    8.7258636343148351e6,
    4.3629318171574175e6,
    2.1814659085787088e6,
  ];
  
  export const moonLayers: NasaLayerConfig[] = [
    {
      id: 'LRO_WAC_Mosaic_Global_303ppd_v02',
      label: '🌕 Moon – WAC Mosaic (303ppd)',
      urlTemplate:
        'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg',
      matrixSet: 'default028mm',
      format: 'image/jpeg',
      style: 'default',
      scaleDenominators: sharedScaleDenominators,
      maxZoom: 7,
    },
    {
      id: 'LRO_LOLA_ClrShade_Global_128ppd_v04',
      label: '🌕 Moon – LOLA Elevation Shaded (128ppd)',
      urlTemplate:
        'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
      matrixSet: 'default028mm',
      format: 'image/png',
      style: 'default',
      scaleDenominators: sharedScaleDenominators,
      maxZoom: 7,
    },
  ];
  
  export const marsLayers: NasaLayerConfig[] = [
    {
      id: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
      label: '🚀 Mars – MOLA ClrShade (463m)',
      urlTemplate:
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg',
      matrixSet: 'default028mm',
      format: 'image/jpeg',
      style: 'default',
      scaleDenominators: sharedScaleDenominators,
      maxZoom: 7,
    },

    {
        id: 'mola_roughness',
        label: '🚀 mola_roughness',
        urlTemplate:
          'https://trek.nasa.gov/tiles/Mars/EQ/mola_roughness/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
        matrixSet: 'default028mm',
        format: 'image/jpeg',
        style: 'default',
        scaleDenominators: sharedScaleDenominators,
        maxZoom: 0,
      },
    // Add more Mars layers here as needed
  ];
  