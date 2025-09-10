// import {
//   Component,
//   AfterViewInit,
//   OnDestroy,
//   ElementRef,
//   ViewChild,
// } from '@angular/core';
// import Map from 'ol/Map';
// import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
// import WMTS from 'ol/source/WMTS';
// import TileGrid from 'ol/tilegrid/WMTS';
// import { get as getProjection } from 'ol/proj';

// @Component({
//   selector: 'app-nasa-wmts',
//   templateUrl: './nasa-wmts.component.html',
//   styleUrls: ['./nasa-wmts.component.scss'],
// })
// export class NasaWmtsComponent implements AfterViewInit, OnDestroy {
//   @ViewChild('mapElement', { static: true })
//   mapElement!: ElementRef<HTMLDivElement>;
//   private map!: Map;

//   ngAfterViewInit(): void {
//     const projection = getProjection('EPSG:4326');
//     const extent = [-180, -90, 180, 90];
//     const origin = [-180, 90];

//     const scaleDenominators = [
//       2.7922763629807472e8,
//       1.3961381814903736e8,
//       6.9806909074518681e7,
//       3.490345453725934e7,
//       1.745172726862967e7,
//       8.7258636343148351e6,
//       4.3629318171574175e6,
//       2.1814659085787088e6,
//       1.0907329542893544e6,
//     ];

//     const metersPerUnit = 111319.49079327358;
//     const resolutions = scaleDenominators.map(
//       (sd) => (sd * 0.28e-3) / metersPerUnit
//     );

//     const matrixIds = scaleDenominators.map((_, i) => i.toString());

//     const tileGrid = new TileGrid({
//       extent,
//       origin,
//       resolutions,
//       matrixIds,
//       tileSize: 256,
//     });

//     const nasaSource = new WMTS({
//       projection,
//       tileGrid,
//       layer: 'LRO_WAC_Mosaic_Global_303ppd_v02',
//       matrixSet: 'default028mm',
//       format: 'image/jpeg',
//       style: 'default',
//       requestEncoding: 'REST',
//       url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
//     });

//     this.map = new Map({
//       target: this.mapElement.nativeElement,
//       layers: [
//         new TileLayer({
//           source: nasaSource,
//         }),
//       ],
//       view: new View({
//         projection,
//         center: [0, 0],
//         zoom: 2,
//         minZoom: 0,
//         maxZoom: 8,
//         extent,
//       }),
//     });
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.setTarget(null);
//     }
//   }
// }



// import {
//   Component,
//   AfterViewInit,
//   OnDestroy,
//   ElementRef,
//   ViewChild,
// } from '@angular/core';
// import Map from 'ol/Map';
// import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
// import WMTS from 'ol/source/WMTS';
// import TileGrid from 'ol/tilegrid/WMTS';
// import { get as getProjection } from 'ol/proj';

// interface NasaLayerConfig {
//   id: string;
//   label: string;
//   urlTemplate: string;
//   matrixSet: string;
//   format: string;
//   style: string;
//   scaleDenominators: number[];
// }

// @Component({
//   selector: 'app-nasa-wmts',
//   templateUrl: './nasa-wmts.component.html',
//   styleUrls: ['./nasa-wmts.component.scss'],
// })
// export class NasaWmtsComponent implements AfterViewInit, OnDestroy {
//   @ViewChild('mapElement', { static: true }) mapElement!: ElementRef<HTMLDivElement>;

//   private map!: Map;
//   private layer!: TileLayer<WMTS>;

//   // All layers use EPSG:4326 and same extent
//   readonly extent = [-180, -90, 180, 90];
//   readonly metersPerUnit = 111319.49079327358;

//   availableLayers: NasaLayerConfig[] = [
//     {
//       id: 'LRO_WAC_Mosaic_Global_303ppd_v02',
//       label: 'Moon - WAC Color Mosaic',
//       urlTemplate:
//         'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
//       matrixSet: 'default028mm',
//       format: 'image/jpeg',
//       style: 'default',
//       scaleDenominators: [
//         2.7922763629807472e8,
//         1.3961381814903736e8,
//         6.9806909074518681e7,
//         3.490345453725934e7,
//         1.745172726862967e7,
//         8.7258636343148351e6,
//         4.3629318171574175e6,
//         2.1814659085787088e6,
//         1.0907329542893544e6,
//       ],
//     },
//     {
//       id: 'LRO_LOLA_ClrShade_Global_128ppd_v04',
//       label: 'Moon - LOLA Elevation Shaded',
//       urlTemplate:
//         'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
//       matrixSet: 'default028mm',
//       format: 'image/png',
//       style: 'default',
//       scaleDenominators: [
//         2.7922763629807472e8,
//         1.3961381814903736e8,
//         6.9806909074518681e7,
//         3.490345453725934e7,
//         1.745172726862967e7,
//         8.7258636343148351e6,
//         4.3629318171574175e6,
//         2.1814659085787088e6,
//         1.0907329542893544e6,
//       ],
//     },
//     {
//       id: 'MOLA_Shaded_Relief_Color',
//       label: 'Mars - MOLA Shaded Relief',
//       urlTemplate:
//         'https://trek.nasa.gov/tiles/Mars/EQ/MOLA_Shaded_Relief_Color/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
//       matrixSet: 'default028mm',
//       format: 'image/jpeg',
//       style: 'default',
//       scaleDenominators: [
//         2.7922763629807472e8,
//         1.3961381814903736e8,
//         6.9806909074518681e7,
//         3.490345453725934e7,
//         1.745172726862967e7,
//         8.7258636343148351e6,
//         4.3629318171574175e6,
//         2.1814659085787088e6,
//         1.0907329542893544e6,
//       ],
//     },
//   ];

//   selectedLayerId = this.availableLayers[0].id;

//   ngAfterViewInit(): void {
//     const projection = getProjection('EPSG:4326');

//     this.layer = new TileLayer({}); // dummy init

//     this.map = new Map({
//       target: this.mapElement.nativeElement,
//       layers: [this.layer],
//       view: new View({
//         projection,
//         center: [0, 0],
//         zoom: 2,
//         minZoom: 0,
//         maxZoom: 8,
//         extent: this.extent,
//       }),
//     });

//     this.updateLayer(this.selectedLayerId);
//   }

//   updateLayer(layerId: string): void {
//     const config = this.availableLayers.find((l) => l.id === layerId);
//     if (!config) return;

//     const resolutions = config.scaleDenominators.map(
//       (sd) => (sd * 0.28e-3) / this.metersPerUnit
//     );
//     const matrixIds = config.scaleDenominators.map((_, i) => i.toString());

//     const tileGrid = new TileGrid({
//       extent: this.extent,
//       origin: [-180, 90],
//       resolutions,
//       matrixIds,
//       tileSize: 256,
//     });

//     const source = new WMTS({
//       url: config.urlTemplate,
//       layer: config.id,
//       matrixSet: config.matrixSet,
//       format: config.format,
//       style: config.style,
//       projection: getProjection('EPSG:4326'),
//       tileGrid,
//       requestEncoding: 'REST',
//     });

//     this.layer.setSource(source);
//   }

//   onLayerChange(event: Event): void {
//     const value = (event.target as HTMLSelectElement).value;
//     this.selectedLayerId = value;
//     this.updateLayer(value);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.setTarget(null);
//     }
//   }
// }


// import {
//   Component,
//   AfterViewInit,
//   OnDestroy,
//   ElementRef,
//   ViewChild,
// } from '@angular/core';
// import Map from 'ol/Map';
// import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
// import WMTS from 'ol/source/WMTS';
// import TileGrid from 'ol/tilegrid/WMTS';
// import { get as getProjection } from 'ol/proj';

// interface NasaLayerConfig {
//   id: string;
//   label: string;
//   urlTemplate: string;
//   matrixSet: string;
//   format: string;
//   style: string;
//   scaleDenominators: number[];
//   maxZoom: number;
// }

// @Component({
//   selector: 'app-nasa-wmts',
//   templateUrl: './nasa-wmts.component.html',
//   styleUrls: ['./nasa-wmts.component.scss'],
// })
// export class NasaWmtsComponent implements AfterViewInit, OnDestroy {
//   @ViewChild('mapElement', { static: true }) mapElement!: ElementRef<HTMLDivElement>;

//   private map!: Map;
//   private layer!: TileLayer<WMTS>;

//   readonly extent = [-180, -90, 180, 90];
//   readonly metersPerUnit = 111319.49079327358;

//   availableLayers: NasaLayerConfig[] = [
//     {
//       id: 'LRO_WAC_Mosaic_Global_303ppd_v02',
//       label: '🌕 Moon - WAC Color Mosaic',
//       urlTemplate:
//         'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
//       matrixSet: 'default028mm',
//       format: 'image/jpeg',
//       style: 'default',
//       scaleDenominators: [
//         2.7922763629807472e8,
//         1.3961381814903736e8,
//         6.9806909074518681e7,
//         3.490345453725934e7,
//         1.745172726862967e7,
//         8.7258636343148351e6,
//         4.3629318171574175e6,
//         2.1814659085787088e6,
//         1.0907329542893544e6,
//       ],
//       maxZoom: 8,
//     },
//     {
//       id: 'LRO_LOLA_ClrShade_Global_128ppd_v04',
//       label: '🌕 Moon - LOLA Elevation Shaded',
//       urlTemplate:
//         'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
//       matrixSet: 'default028mm',
//       format: 'image/png',
//       style: 'default',
//       scaleDenominators: [
//         2.7922763629807472e8,
//         1.3961381814903736e8,
//         6.9806909074518681e7,
//         3.490345453725934e7,
//         1.745172726862967e7,
//         8.7258636343148351e6,
//         4.3629318171574175e6,
//         2.1814659085787088e6,
//         1.0907329542893544e6,
//       ],
//       maxZoom: 8,
//     },
//     {
//       id: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
//       label: '🚀 Mars – MOLA ClrShade (463m)',
//       urlTemplate:
//         'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg',
//       matrixSet: 'default028mm',
//       format: 'image/jpeg',
//       style: 'default',
//       scaleDenominators: [
//         2.7922763629807472e8,
//         1.3961381814903736e8,
//         6.9806909074518681e7,
//         3.490345453725934e7,
//         1.745172726862967e7,
//         8.7258636343148351e6,
//         4.3629318171574175e6,
//         2.1814659085787088e6,
//       ],
//       maxZoom: 7, // Highest valid zoom level without 404s
//     }
//   ];

//   selectedLayerId = this.availableLayers[0].id;

//   ngAfterViewInit(): void {
//     const projection = getProjection('EPSG:4326');

//     this.layer = new TileLayer({});
//     this.map = new Map({
//       target: this.mapElement.nativeElement,
//       layers: [this.layer],
//       view: new View({
//         projection,
//         center: [0, 0],
//         zoom: 2,
//         minZoom: 0,
//         maxZoom: 8,
//         extent: this.extent,
//       }),
//     });

//     this.updateLayer(this.selectedLayerId);
//   }

//   updateLayer(layerId: string): void {
//     const config = this.availableLayers.find((l) => l.id === layerId);
//     if (!config) return;

//     const resolutions = config.scaleDenominators.map(
//       (sd) => (sd * 0.28e-3) / this.metersPerUnit
//     );
//     const matrixIds = resolutions.map((_, i) => i.toString());

//     const tileGrid = new TileGrid({
//       extent: this.extent,
//       origin: [-180, 90],
//       resolutions: resolutions.slice(0, config.maxZoom + 1),
//       matrixIds: matrixIds.slice(0, config.maxZoom + 1),
//       tileSize: 256,
//     });

//     const source = new WMTS({
//       url: config.urlTemplate,
//       layer: config.id,
//       matrixSet: config.matrixSet,
//       format: config.format,
//       style: config.style,
//       projection: getProjection('EPSG:4326'),
//       tileGrid,
//       requestEncoding: 'REST',
//     });

//     this.layer.setSource(source);

//     const view = this.map.getView();
//     view.setMaxZoom(config.maxZoom);
//     if (view.getZoom() > config.maxZoom) {
//       view.setZoom(config.maxZoom);
//     }
//   }

//   onLayerChange(event: Event): void {
//     const value = (event.target as HTMLSelectElement).value;
//     this.selectedLayerId = value;
//     this.updateLayer(value);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.setTarget(null);
//     }
//   }
// }


// nasa-wmts.component.ts
// import {
//   Component,
//   AfterViewInit,
//   OnDestroy,
//   ElementRef,
//   ViewChild,
// } from '@angular/core';
// import Map from 'ol/Map';
// import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
// import WMTS from 'ol/source/WMTS';
// import TileGrid from 'ol/tilegrid/WMTS';
// import Projection from 'ol/proj/Projection';
// import { moonLayers, marsLayers, NasaLayerConfig } from './nasa-wmts-layers';

// @Component({
//   selector: 'app-nasa-wmts',
//   templateUrl: './nasa-wmts.component.html',
//   styleUrls: ['./nasa-wmts.component.scss'],
// })
// export class NasaWmtsComponent implements AfterViewInit, OnDestroy {
//   @ViewChild('mapElement', { static: true })
//   mapElement!: ElementRef<HTMLDivElement>;

//   private map!: Map;
//   selectedLayer: NasaLayerConfig = [...moonLayers, ...marsLayers][0];

//   availableLayers: NasaLayerConfig[] = [...moonLayers, ...marsLayers];

//   ngAfterViewInit(): void {
//     this.initializeMap();
//   }

//   initializeMap(): void {
//     const config = this.selectedLayer;

//     const projection = new Projection({
//       code: 'EPSG:104903',
//       units: 'degrees',
//       extent: [-180, -90, 180, 90],
//     });

//     const resolutions = config.scaleDenominators.map(
//       (sd) => (sd * 0.28e-3) / 111319.49079327358
//     );

//     const tileGrid = new TileGrid({
//       extent: [-180, -90, 180, 90],
//       origin: [-180, 90],
//       resolutions,
//       matrixIds: resolutions.map((_, i) => i.toString()),
//       tileSize: 256,
//     });

//     const wmtsSource = new WMTS({
//       projection,
//       tileGrid,
//       layer: config.id,
//       matrixSet: config.matrixSet,
//       format: config.format,
//       style: config.style,
//       wrapX: false,
//       requestEncoding: 'REST',
//       url: config.urlTemplate,
//     });

//     const tileLayer = new TileLayer({
//       source: wmtsSource,
//     });

//     this.map = new Map({
//       target: this.mapElement.nativeElement,
//       layers: [tileLayer],
//       view: new View({
//         projection,
//         center: [0, 0],
//         zoom: 2,
//         minZoom: 0,
//         maxZoom: config.maxZoom,
//         extent: [-180, -90, 180, 90],
//       }),
//     });
//   }

//   onLayerChange(layerId: string): void {
//     this.selectedLayer = this.availableLayers.find((l) => l.id === layerId)!;
//     this.map.setTarget(null); // destroy old map
//     this.initializeMap(); // recreate with new layer
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.setTarget(null);
//     }
//   }
// }



// nasa-wmts.component.ts
import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import TileGrid from 'ol/tilegrid/WMTS';
import Projection from 'ol/proj/Projection';
import { moonLayers, marsLayers, NasaLayerConfig } from './nasa-wmts-layers';

@Component({
  selector: 'app-nasa-wmts',
  templateUrl: './nasa-wmts.component.html',
  styleUrls: ['./nasa-wmts.component.scss'],
})
export class NasaWmtsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: true })
  mapElement!: ElementRef<HTMLDivElement>;

  private map!: Map;

  planets = ['moon', 'mars'];
  selectedPlanet = 'moon';
  availableLayers: NasaLayerConfig[] = moonLayers;
  selectedLayer: NasaLayerConfig = moonLayers[0];

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  initializeMap(): void {
    const config = this.selectedLayer;

    const projection = new Projection({
      code: 'EPSG:104903',
      units: 'degrees',
      extent: [-180, -90, 180, 90],
    });

    const resolutions = config.scaleDenominators.map(
      (sd) => (sd * 0.28e-3) / 111319.49079327358
    );

    const tileGrid = new TileGrid({
      extent: [-180, -90, 180, 90],
      origin: [-180, 90],
      resolutions,
      matrixIds: resolutions.map((_, i) => i.toString()),
      tileSize: 256,
    });

    const wmtsSource = new WMTS({
      projection,
      tileGrid,
      layer: config.id,
      matrixSet: config.matrixSet,
      format: config.format,
      style: config.style,
      wrapX: false,
      requestEncoding: 'REST',
      url: config.urlTemplate,
    });

    const tileLayer = new TileLayer({
      source: wmtsSource,
    });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [tileLayer],
      view: new View({
        projection,
        center: [0, 0],
        zoom: 2,
        minZoom: 0,
        maxZoom: config.maxZoom,
        extent: [-180, -90, 180, 90],
      }),
    });
  }

  onPlanetChange(planet: string): void {
    this.selectedPlanet = planet;
    this.availableLayers = planet === 'moon' ? moonLayers : marsLayers;
    this.selectedLayer = this.availableLayers[0];
    this.map.setTarget(null);
    this.initializeMap();
  }

  onLayerChange(layerId: string): void {
    this.selectedLayer = this.availableLayers.find((l) => l.id === layerId)!;
    this.map.setTarget(null);
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget(null);
    }
  }
}

