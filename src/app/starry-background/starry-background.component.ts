// starry-background.component.ts
import {
  AfterViewInit, Component, ElementRef, Input, NgZone,
  OnDestroy, QueryList, ViewChildren
} from '@angular/core';

@Component({
  selector: 'app-starry-background',
  templateUrl: './starry-background.component.html',
  styleUrls: ['./starry-background.component.scss'],
})
export class StarryBackgroundComponent implements AfterViewInit, OnDestroy {
  @Input() countSmall = 140;
  @Input() countMedium = 70;
  @Input() countLarge = 30;

  @Input() enableParallax = true;
  @Input() enablePointerParallax = true;
  @Input() enableGyroParallax = false;

  /** 💫 Auto motion settings */
  @Input() enableAutoMotion = true;     // turn on/off auto wandering
  @Input() autoStrength = 1.0;          // 0..1: how wide auto motion can roam (-1..1 scaled by this)
  @Input() autoSpeed = 2.0;             // 0.5=slow, 1=default, 2=faster
  @Input() userInfluenceDecayMs = 1500; // how long mouse/gyro influence lingers

  @Input() parallaxStrength = 30;

  small: any[] = [];
  medium: any[] = [];
  large: any[] = [];

  @ViewChildren('layerInner', { read: ElementRef }) layerInners!: QueryList<ElementRef<HTMLElement>>;

  private rafId: number | null = null;

  // User target (normalized -1..1)
  private userTX = 0;
  private userTY = 0;

  // Blended/eased current
  private currentX = 0;
  private currentY = 0;
  private ease = 0.08;

  // Timing and input activity
  private tStart = performance.now();
  private lastUserInputTs = 0;

  // Auto-motion phases & frequencies (randomized per mount)
  private ph = { x1: 0, x2: 0, y1: 0, y2: 0 };
  private fq = { x1: 0.030, x2: 0.047, y1: 0.039, y2: 0.061 }; // Hz-ish (cycles/sec)

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngOnInit(): void {
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    this.small  = this.makeStars(this.countSmall, 1, 1,   [0.4, 0.9], [0.0, 1.0], [0, 1]);
    this.medium = this.makeStars(this.countMedium, 2, 2,  [0.6, 1.2], [0.0, 1.0], [0, 2]);
    this.large  = this.makeStars(this.countLarge, 3, 3,   [0.8, 1.5], [0.0, 1.0], [0, 2]);

    // Randomize phases so each page load feels different
    this.ph = {
      x1: rnd(0, Math.PI * 2),
      x2: rnd(0, Math.PI * 2),
      y1: rnd(0, Math.PI * 2),
      y2: rnd(0, Math.PI * 2),
    };
    // Add slight frequency jitter per mount
    this.fq = {
      x1: 0.028 + rnd(-0.004, 0.004),
      x2: 0.051 + rnd(-0.006, 0.006),
      y1: 0.035 + rnd(-0.005, 0.005),
      y2: 0.059 + rnd(-0.007, 0.007),
    };
  }

  ngAfterViewInit(): void {
    if (!this.enableParallax) return;

    this.zone.runOutsideAngular(() => {
      if (this.enablePointerParallax) {
        window.addEventListener('mousemove', this.onPointerMove, { passive: true });
        window.addEventListener('touchmove', this.onTouchMove, { passive: true });
      }
      if (this.enableGyroParallax) {
        window.addEventListener('deviceorientation', this.onDeviceOrientation as any, { passive: true });
      }
      this.loop();
    });
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    window.removeEventListener('mousemove', this.onPointerMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('deviceorientation', this.onDeviceOrientation as any);
  }

  /** 🔁 RAF: blend auto + user, ease, and apply transforms */
  private loop = () => {
    const now = performance.now();
    const t = (now - this.tStart) / 1000; // seconds

    // Auto wandering (-1..1) via layered sines (Lissajous-like)
    let ax = 0, ay = 0;
    if (this.enableAutoMotion) {
      const s = this.autoSpeed;
      ax =
        0.65 * Math.sin(2 * Math.PI * this.fq.x1 * s * t + this.ph.x1) +
        0.35 * Math.sin(2 * Math.PI * this.fq.x2 * s * t + this.ph.x2);
      ay =
        0.55 * Math.sin(2 * Math.PI * this.fq.y1 * s * t + this.ph.y1) +
        0.45 * Math.sin(2 * Math.PI * this.fq.y2 * s * t + this.ph.y2);
      ax *= this.autoStrength;
      ay *= this.autoStrength;
    }

    // How much recent user input should influence? Decays to 0 after userInfluenceDecayMs
    const dt = now - this.lastUserInputTs;
    const userW = this.lastUserInputTs === 0
      ? 0
      : Math.exp(-dt / this.userInfluenceDecayMs); // 1→0 over time

    // Blend: user dominates right after movement; otherwise auto
    const targetX = userW * this.userTX + (1 - userW) * ax;
    const targetY = userW * this.userTY + (1 - userW) * ay;

    // Ease toward target
    this.currentX += (targetX - this.currentX) * this.ease;
    this.currentY += (targetY - this.currentY) * this.ease;

    // Apply to all layer__inner wrappers via CSS variables
    const inners = (this.host.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.layer__inner');
    for (const el of Array.from(inners)) {
      const depth = parseFloat(el.dataset['depth'] || '0');
      const maxPx = this.parallaxStrength * depth;
      el.style.setProperty('--tx', (this.currentX * maxPx).toFixed(2) + 'px');
      el.style.setProperty('--ty', (this.currentY * maxPx).toFixed(2) + 'px');

      const scale = 1 + 0.01 * depth * Math.hypot(this.currentX, this.currentY);
      el.style.setProperty('--scale', scale.toFixed(4));
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  /** Normalize pointer to -1..1 */
  private onPointerMove = (e: MouseEvent) => {
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    this.userTX = (e.clientX / vw) * 2 - 1;
    this.userTY = (e.clientY / vh) * 2 - 1;
    this.lastUserInputTs = performance.now();
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!e.touches?.length) return;
    const t = e.touches[0];
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    this.userTX = (t.clientX / vw) * 2 - 1;
    this.userTY = (t.clientY / vh) * 2 - 1;
    this.lastUserInputTs = performance.now();
  };

  private onDeviceOrientation = (e: DeviceOrientationEvent) => {
    const g = Math.max(-45, Math.min(45, e.gamma ?? 0));
    const b = Math.max(-45, Math.min(45, e.beta ?? 0));
    this.userTX = g / 45;
    this.userTY = b / 45;
    this.lastUserInputTs = performance.now();
  };

  private makeStars(
    count: number, minSizePx: number, maxSizePx: number,
    durationRange: [number, number], delayRange: [number, number], blurRange: [number, number]
  ) {
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    return Array.from({ length: count }, () => ({
      xPct: rnd(0, 100),
      yPct: rnd(0, 100),
      sizePx: rnd(minSizePx, maxSizePx),
      delayS: rnd(delayRange[0], delayRange[1]),
      durationS: rnd(durationRange[0], durationRange[1]),
      blurPx: rnd(blurRange[0], blurRange[1]),
    }));
  }
}