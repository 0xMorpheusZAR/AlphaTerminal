# Infrastructure & Design System Documentation

## 🏗️ Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Next.js    │  │   React 18   │  │  TypeScript  │            │
│  │  App Router  │  │   + Hooks    │  │   Strict     │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────────────────────────────────────────┐             │
│  │              Component Architecture               │             │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│             │
│  │  │shadcn/ui│ │ Radix UI│ │ Lucide  │ │Framer  ││             │
│  │  │         │ │Primitives│ │  Icons  │ │Motion  ││             │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘│             │
│  └──────────────────────────────────────────────────┘             │
│                                                                     │
│  ┌──────────────────────────────────────────────────┐             │
│  │                 Styling System                    │             │
│  │  ┌──────────────┐  ┌──────────────┐             │             │
│  │  │ Tailwind CSS │  │ CSS Variables│             │             │
│  │  │   + Theme    │  │  for tokens  │             │             │
│  │  └──────────────┘  └──────────────┘             │             │
│  └──────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         OPTIMIZATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │    Static    │  │    Image     │  │   Font       │            │
│  │  Generation  │  │ Optimization │  │ Optimization │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────────────────────────────────────────┐             │
│  │            Performance Features                   │             │
│  │  • ISR (Incremental Static Regeneration)         │             │
│  │  • Edge caching with proper headers              │             │
│  │  • Code splitting per route                      │             │
│  │  • Lazy loading for below-fold content           │             │
│  └──────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          HOSTING LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Replit     │  │     Nix      │  │   Node.js    │            │
│  │  Container   │  │ Environment  │  │   Server     │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────────────────────────────────────────┐             │
│  │               CDN & Caching                       │             │
│  │  • Static assets served from /public             │             │
│  │  • Dynamic routes with cache headers             │             │
│  │  • API routes with response caching              │             │
│  └──────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎨 Design System

### Typography Scale

```
┌────────────────────────────────────────────────────┐
│              TYPOGRAPHY HIERARCHY                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Hero Title (h1)      60-72px  Inter Extra Bold   │
│  ├─ Desktop:          72px                         │
│  └─ Mobile:           48px                         │
│                                                    │
│  Section Title (h2)   36-48px  Inter Bold         │
│  ├─ Desktop:          48px                         │
│  └─ Mobile:           32px                         │
│                                                    │
│  Card Title (h3)      24-32px  Inter Semi Bold    │
│  ├─ Desktop:          28px                         │
│  └─ Mobile:           24px                         │
│                                                    │
│  Subtitle (h4)        20-24px  Inter Semi Bold    │
│                                                    │
│  Body Text            16-18px  Inter Regular      │
│  ├─ Large:            18px                         │
│  └─ Default:          16px                         │
│                                                    │
│  Small Text           14px     Inter Regular      │
│  Caption              12px     Inter Regular      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Color System

```
┌────────────────────────────────────────────────────┐
│                  COLOR PALETTE                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  Primary Actions                                   │
│  ├─ accent-default:   #646BFF  (Violet-Blue)      │
│  └─ accent-light:     #6D7CFF  (Hover state)      │
│                                                    │
│  Backgrounds                                       │
│  ├─ background:       #FFFFFF  (Pure White)       │
│  ├─ surface:          #FAFAFA  (Off White)        │
│  └─ muted:            #F5F5F5  (Light Gray)       │
│                                                    │
│  Text Colors                                       │
│  ├─ foreground:       #000000  (Primary text)     │
│  ├─ muted-foreground: #666666  (Secondary text)   │
│  └─ light-foreground: #999999  (Tertiary text)    │
│                                                    │
│  Borders & Dividers                                │
│  ├─ border:           #E5E5E5                      │
│  └─ divider:          #EEEEEE                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Layout Grid System

```
┌────────────────────────────────────────────────────┐
│               RESPONSIVE GRID                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Desktop (1280px+)                                 │
│  ┌─────────────────┬─────────────────┐           │
│  │                 │                 │           │
│  │   Left Column   │  Right Column   │           │
│  │     (50%)       │     (50%)       │           │
│  │                 │                 │           │
│  └─────────────────┴─────────────────┘           │
│                                                    │
│  Tablet (768px - 1279px)                          │
│  ┌─────────────────┬─────────────────┐           │
│  │   Left (60%)    │  Right (40%)    │           │
│  └─────────────────┴─────────────────┘           │
│                                                    │
│  Mobile (<768px)                                   │
│  ┌─────────────────────────────────┐             │
│  │      Single Column (100%)        │             │
│  └─────────────────────────────────┘             │
│                                                    │
│  Container Widths                                  │
│  ├─ max-w-7xl:  1280px (Main container)          │
│  ├─ max-w-6xl:  1152px (Content container)       │
│  ├─ max-w-4xl:  896px  (Narrow content)          │
│  └─ max-w-2xl:  672px  (Article width)           │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Component Patterns

```
┌────────────────────────────────────────────────────┐
│              COMPONENT ARCHITECTURE                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  Card Component                                    │
│  ┌─────────────────────────────────┐             │
│  │  padding:      24px (p-6)        │             │
│  │  border-radius: 8px              │             │
│  │  box-shadow:   0 4px 14px       │             │
│  │               rgba(0,0,0,0.05)   │             │
│  │  hover:        translateY(-4px)  │             │
│  │  transition:   300ms ease        │             │
│  └─────────────────────────────────┘             │
│                                                    │
│  Button Component                                  │
│  ┌─────────────────────────────────┐             │
│  │  padding:      12px 24px         │             │
│  │  font-weight:  600               │             │
│  │  border-radius: 6px              │             │
│  │  background:   accent-default    │             │
│  │  hover:        accent-light      │             │
│  │  transition:   200ms ease        │             │
│  └─────────────────────────────────┘             │
│                                                    │
│  Section Spacing                                   │
│  ├─ hero:         py-24 (96px)                    │
│  ├─ section:      py-20 (80px)                    │
│  ├─ subsection:   py-16 (64px)                    │
│  └─ component:    py-12 (48px)                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

## ⚡ Performance & Latency Optimization

### Loading Strategy

```
┌────────────────────────────────────────────────────┐
│            PROGRESSIVE ENHANCEMENT                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Initial Load (0-100ms)                           │
│  ├─ Critical CSS inlined                          │
│  ├─ Above-fold content priority                  │
│  └─ Font preloading                              │
│                                                    │
│  Interactive (100-300ms)                          │
│  ├─ React hydration                              │
│  ├─ Event listeners attached                     │
│  └─ First animations ready                       │
│                                                    │
│  Full Load (300-1000ms)                          │
│  ├─ Below-fold images lazy loaded                │
│  ├─ Non-critical JS chunks loaded                │
│  └─ Analytics initialized                        │
│                                                    │
│  Optimization Techniques                          │
│  ├─ Static Generation (SSG)                      │
│  ├─ Incremental Static Regeneration (ISR)       │
│  ├─ Image optimization with next/image           │
│  ├─ Font subsetting & preloading                 │
│  ├─ Code splitting per route                     │
│  ├─ Tree shaking unused code                     │
│  └─ Compression (gzip/brotli)                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Animation Performance

```
┌────────────────────────────────────────────────────┐
│           ANIMATION GUIDELINES                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  Entrance Animations                               │
│  ├─ Duration:     300-500ms                       │
│  ├─ Easing:       ease-out                        │
│  ├─ Properties:   transform, opacity only         │
│  └─ Trigger:      IntersectionObserver            │
│                                                    │
│  Hover Effects                                     │
│  ├─ Duration:     200-300ms                       │
│  ├─ Properties:   transform, box-shadow           │
│  └─ GPU accel:    will-change: transform          │
│                                                    │
│  Scroll-based                                      │
│  ├─ Throttled:    16ms (60fps)                    │
│  ├─ Debounced:    scroll end events               │
│  └─ Passive:      { passive: true }               │
│                                                    │
└────────────────────────────────────────────────────┘
```

## 📐 Layout Patterns

### Hero Section Pattern
```tsx
<section className="grid lg:grid-cols-2 gap-12 py-24">
  <div className="space-y-6">
    <h1 className="text-5xl lg:text-7xl font-extrabold">
      {/* Main headline */}
    </h1>
    <p className="text-lg text-muted-foreground">
      {/* Supporting copy */}
    </p>
    <Button size="lg">{/* CTA */}</Button>
  </div>
  <div className="relative">
    {/* Hero image with animation */}
  </div>
</section>
```

### Card Grid Pattern
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id} className="p-6 hover:-translate-y-1 transition">
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Alternating Rows Pattern
```tsx
{features.map((feature, index) => (
  <div className={`grid lg:grid-cols-2 gap-12 py-16 ${
    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
  }`}>
    {/* Alternating content */}
  </div>
))}
```

## 🚀 Deployment Architecture

### Build Pipeline
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Source    │────▶│    Build    │────▶│   Deploy    │
│    Code     │     │   Process   │     │   Assets    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       │                    │                    │
   Git Push          Next.js Build         Static Files
                     └─ SSG Pages          └─ CDN Ready
                     └─ API Routes         └─ Edge Cache
                     └─ Optimized JS       └─ Compressed
```

### Caching Strategy
```
┌────────────────────────────────────────────────────┐
│                 CACHE LAYERS                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Browser Cache                                     │
│  ├─ Static assets:  1 year                        │
│  ├─ HTML pages:     0 (revalidate)                │
│  └─ API responses:  5 minutes                     │
│                                                    │
│  CDN Cache                                         │
│  ├─ Images:         30 days                       │
│  ├─ CSS/JS:         365 days (hashed)             │
│  └─ HTML:           60 seconds                    │
│                                                    │
│  Server Cache                                      │
│  ├─ ISR pages:      60 seconds                    │
│  ├─ API data:       5 minutes                     │
│  └─ Database:       Query-specific                │
│                                                    │
└────────────────────────────────────────────────────┘
```

## 📊 Metrics & Monitoring

### Performance Targets
- **First Contentful Paint (FCP)**: < 1.2s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Bundle Size Targets
- **Initial JS**: < 75KB (gzipped)
- **Initial CSS**: < 20KB (gzipped)
- **Total Page Weight**: < 500KB (excluding images)
- **Image Budget**: < 200KB per viewport

## 🔧 Development Workflow

### Component Development
1. Design in Figma with 8px grid
2. Build with shadcn/ui primitives
3. Style with Tailwind utilities
4. Add Framer Motion for animations
5. Optimize with React.memo where needed
6. Test on multiple viewports

### Performance Testing
1. Run Lighthouse CI on every PR
2. Monitor bundle size with webpack-bundle-analyzer
3. Test on 3G network speeds
4. Verify animations at 60fps
5. Check accessibility scores

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)
- [Web Vitals](https://web.dev/vitals)