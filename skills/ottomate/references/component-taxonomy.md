# Component Taxonomy — Master List for the Ottomate Asset Library

Comprehensive catalog of UI component types the asset library should cover. This is the **target library**; the user walks each category and adds source code for the ones they actually want — building up `master_components` from 15 (current seed) to 200-300 production-ready entries.

**User bias to honour throughout:** *"extremely into animated and interactive components and modern UI components"*. Categories 9-13 are weighted heavier for that reason. Boring form fields get one entry each; magnetic buttons, scroll-driven reveals, and bento layouts get the floor space they deserve.

## How to use this doc

1. **Walk one category at a time** in the Ottomate UI's master-components browser (`/components-browser`).
2. For each component you want in your library: paste source code (TSX preferred, framework_tags will say `react`, `vue`, `svelte`, etc.), set tags, optionally add a preview URL or screenshot.
3. Components missing from the current 15-seed are marked `🆕`; existing seeded ones are marked `✅`.
4. Multi-category components are listed in their primary home with cross-references.
5. After enrichment, Stage 2.4 (initial component pick) and Stage 4 component-pick flow both query this same `master_components` table.

## Schema fields each entry should fill

When you save a component, fill these in the Ottomate UI form:

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `mc-<kebab-name>` |
| `name` | yes | display name (e.g. "Magnetic Button") |
| `category` | yes | primary; pick from the 15 below |
| `description` | yes | 1-2 sentence what-and-why |
| `tags` | yes | JSON array — at minimum one of `[basic, modern, animated, interactive, accessibility-first, dark-only, light-only, responsive]` |
| `source_code` | recommended | full component TSX/Vue/Svelte; framework inferred from imports |
| `framework_tags` | recommended | JSON array — `[react, next, vue, svelte, vanilla]` |
| `preview_url` | optional | link to live demo (CodeSandbox, the project that uses it, etc.) |
| `variants_json` | optional | array of variant names (e.g. `["primary", "ghost", "icon-only"]`) |
| `dependencies` | optional | npm packages required (`framer-motion`, `lucide-react`, etc.) |

---

## Category 1 — Inputs (~22 components)

Single-value text/number/picker inputs. Most "boring" category — keep 1 strong entry per type, then move on.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-text-input | TextInput | basic | Standard text field. Underline, outline, filled variants. |
| 🆕 mc-textarea | Textarea | basic | Auto-grow + char count. |
| 🆕 mc-number-input | NumberInput | basic | Step buttons + scroll-to-change. |
| 🆕 mc-search-bar-animated | SearchBarAnimated | animated, modern | Expanding search with subtle morph. Replaces basic search. |
| ✅ mc-search-bar | SearchBar | basic | Already in catalog. |
| 🆕 mc-mention-input | MentionInput | interactive | `@user` and `#tag` autocomplete. |
| 🆕 mc-tag-input | TagInput | interactive | Pill-based, drag-to-reorder. |
| 🆕 mc-command-input | CommandInput | modern, interactive | The cmdk-style search field with shortcut chips. |
| 🆕 mc-otp-input | OTPInput | basic | 6-digit segmented input with auto-advance. |
| 🆕 mc-pin-pad | PinPad | interactive | Numeric grid for mobile auth. |
| 🆕 mc-password-input | PasswordInput | basic | Show/hide toggle + strength meter. |
| 🆕 mc-date-picker | DatePicker | basic | Calendar popover. |
| 🆕 mc-date-range | DateRangePicker | basic | Two-month side-by-side. |
| 🆕 mc-time-picker | TimePicker | basic | Wheel or input style. |
| 🆕 mc-color-picker | ColorPicker | interactive | HSL/RGB sliders + eyedropper. |
| 🆕 mc-slider | Slider | basic | Single thumb. |
| 🆕 mc-range-slider | RangeSlider | interactive | Two-thumb range. |
| 🆕 mc-emoji-picker | EmojiPicker | interactive, modern | With recent + skin-tone. |
| 🆕 mc-file-drop | FileDropZone | interactive, modern | Drag-and-drop with progress per file. |
| 🆕 mc-image-crop | ImageCropper | interactive | Pinch+drag to crop. |
| 🆕 mc-currency-input | CurrencyInput | basic | Locale-formatted, mask. |
| 🆕 mc-phone-input | PhoneInput | basic | Country code dropdown + format. |

---

## Category 2 — Selection (~10 components)

Boolean and discrete-set selectors.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-checkbox | Checkbox | basic, accessibility-first | Includes indeterminate state. |
| 🆕 mc-radio-group | RadioGroup | basic, accessibility-first | |
| 🆕 mc-switch | Switch | animated | Smooth thumb transition. |
| 🆕 mc-segmented-control | SegmentedControl | animated, modern | iOS-style indicator slides between segments. |
| 🆕 mc-multi-select | MultiSelect | interactive | Pill-based selected items, search filter. |
| 🆕 mc-combobox | Combobox | interactive, accessibility-first | Searchable single-select. |
| 🆕 mc-listbox | Listbox | basic | Simpler combobox without search. |
| 🆕 mc-rating-stars | RatingStars | animated, interactive | Hover-fill animation. |
| 🆕 mc-rating-emoji | EmojiReaction | animated, modern | Like Slack reactions, jiggle on click. |
| 🆕 mc-toggle-group | ToggleGroup | animated | Multi-toggle with at-most-one or any-many. |

---

## Category 3 — Buttons & Actions (~14 components)

Where animation/personality really matters. Lean modern.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-button-primary | PrimaryButton | basic | Baseline + variants matter. |
| 🆕 mc-button-ghost | GhostButton | basic | |
| 🆕 mc-button-icon | IconButton | basic | |
| 🆕 mc-button-magnetic | MagneticButton | animated, modern, interactive | Cursor pulls the button toward it. **High user interest.** |
| 🆕 mc-button-shimmer | ShimmerButton | animated, modern | Border-light sweeps around. |
| 🆕 mc-button-pulse | PulseButton | animated | Subtle pulsing CTA. |
| 🆕 mc-button-confetti | ConfettiButton | animated, interactive, modern | Pops confetti on click — celebrate moments. |
| 🆕 mc-button-loading | LoadingButton | animated | Spinner + checkmark transitions. |
| 🆕 mc-fab | FloatingActionButton | basic | Mobile primary action. |
| 🆕 mc-fab-expandable | ExpandableFab | animated, interactive | Tap to fan out 3-5 sub-actions. |
| 🆕 mc-button-split | SplitButton | basic | Primary + dropdown caret. |
| 🆕 mc-action-menu | ActionMenu | basic | Contextual `…` menu. |
| 🆕 mc-copy-button | CopyButton | animated, interactive | Click → green checkmark + "Copied!" |
| 🆕 mc-share-sheet | ShareSheet | interactive | OS-style share with Web Share API fallback. |

---

## Category 4 — Display (~17 components)

Static-ish surfaces. Cards, badges, summary widgets.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-card-basic | Card | basic | Header + body + footer. |
| 🆕 mc-card-tilt | TiltCard | animated, interactive, modern | 3D tilt on mouse hover. |
| 🆕 mc-card-stack | StackedCards | animated, modern | Tinder-style swipe stack. |
| 🆕 mc-card-flip | FlipCard | animated, interactive | Front/back rotate-Y. |
| 🆕 mc-card-glow | GlowCard | animated, modern | Soft border glow following cursor. |
| ✅ mc-stat-card-gradient | GradientStatCard | modern | Already seeded. |
| 🆕 mc-stat-card-trending | TrendingStat | animated | Up/down sparkline + animated number. |
| ✅ mc-animated-number | AnimatedNumber | animated | Already seeded. |
| 🆕 mc-badge | Badge | basic | Variants: dot, count, status. |
| 🆕 mc-badge-pulse | PulseBadge | animated | Live "online" indicator. |
| ✅ mc-quality-badge | QualityBadge | basic | Already seeded. |
| 🆕 mc-avatar | Avatar | basic | With fallback initials + shape variants. |
| 🆕 mc-avatar-stack | AvatarStack | basic | "+3" overflow chip. |
| 🆕 mc-tooltip | Tooltip | basic, accessibility-first | |
| 🆕 mc-popover | Popover | basic | |
| ✅ mc-poster-tile | PosterTile | basic | Already seeded. |
| 🆕 mc-list-item-rich | RichListItem | basic | Avatar + title + subtitle + meta + actions. |

---

## Category 5 — Navigation (~13 components)

Top-level wayfinding.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-navbar-sticky | StickyNavbar | basic | Standard top nav with scroll-aware shrink. |
| 🆕 mc-navbar-floating | FloatingNavbar | animated, modern | Pill-shaped, lifts on scroll. |
| ✅ mc-sidebar-categorized | CategorizedSidebar | basic | Already seeded. |
| 🆕 mc-sidebar-collapsible | CollapsibleSidebar | animated | Width morph + label fade. |
| 🆕 mc-tabs-underline | TabsUnderline | animated | Active indicator slides. |
| 🆕 mc-tabs-pill | TabsPill | animated, modern | Selected pill morphs between options (FLIP animation). |
| 🆕 mc-breadcrumbs | Breadcrumbs | basic, accessibility-first | |
| 🆕 mc-stepper-horizontal | HorizontalStepper | animated | Active step + completed checkmarks. |
| 🆕 mc-stepper-vertical | VerticalStepper | basic | For longer wizards. |
| 🆕 mc-pagination | Pagination | basic, accessibility-first | |
| 🆕 mc-pagination-infinite | InfiniteScroll | interactive | IntersectionObserver-based. |
| ✅ mc-command-palette | CommandPalette | modern, interactive | Already seeded — cmdk-based. |
| 🆕 mc-mobile-tab-bar | MobileTabBar | basic | Bottom nav for PWA. |

---

## Category 6 — Feedback (~16 components)

States: loading, empty, error, success, in-progress.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-toast-stack | ToastStack | animated, modern | Sonner-style: stack, swipe-dismiss. |
| 🆕 mc-alert | Alert | basic, accessibility-first | Info/warn/error/success variants. |
| 🆕 mc-banner-dismissible | DismissibleBanner | basic | Top page banner with close. |
| 🆕 mc-snackbar | Snackbar | basic | Material-style bottom message. |
| ✅ mc-loading-screen | LoadingScreen | animated | Already seeded. |
| 🆕 mc-skeleton-list | SkeletonList | animated, modern | Animated shimmer placeholders for content lists. |
| 🆕 mc-skeleton-card | SkeletonCard | animated | Same idea, card shape. |
| 🆕 mc-spinner | Spinner | basic | |
| 🆕 mc-spinner-orbit | OrbitSpinner | animated, modern | Multi-ring orbital loader. |
| 🆕 mc-progress-bar | ProgressBar | basic | Determinate + indeterminate. |
| 🆕 mc-progress-circle | ProgressCircle | animated | SVG-based, animates to value. |
| ✅ mc-radial-donut | RadialDonut | animated | Already seeded. |
| 🆕 mc-empty-state | EmptyState | basic | Illustration + CTA. |
| ✅ mc-error-boundary | ErrorBoundary | basic | Already seeded. |
| 🆕 mc-confetti-burst | ConfettiBurst | animated, modern | Trigger on success — particle physics. |
| 🆕 mc-success-checkmark | SuccessCheckmark | animated | SVG path-draw checkmark. |

---

## Category 7 — Overlay (~9 components)

Above-the-page surfaces.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-modal | Modal | basic, accessibility-first | Focus trap + ESC. |
| 🆕 mc-dialog-confirm | ConfirmDialog | basic | Yes/no with loading state on action. |
| 🆕 mc-drawer | Drawer | animated | Slide from edge (left/right/top/bottom). |
| 🆕 mc-bottom-sheet | BottomSheet | animated, modern, interactive | Drag handle + snap points. Mobile-friendly. |
| ✅ mc-task-drawer | TaskDrawer | basic | Already seeded. |
| 🆕 mc-side-panel | SidePanel | basic | Persistent right rail for editing. |
| 🆕 mc-lightbox | Lightbox | animated, interactive | Image/video zoom + swipe to next. |
| 🆕 mc-context-menu | ContextMenu | basic | Right-click menu. |
| 🆕 mc-spotlight-search | SpotlightSearch | animated, modern | Apple-style overlay search. |

---

## Category 8 — Layout (~13 components)

Page composition primitives.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-grid-bento | BentoGrid | modern | Bento-box variable-size grid (Apple-style marketing). |
| 🆕 mc-grid-masonry | MasonryGrid | basic | Pinterest-style. |
| 🆕 mc-split-pane | SplitPane | interactive | Resizable divider. |
| ✅ mc-kanban-board | KanbanBoard | interactive | Already seeded. |
| 🆕 mc-timeline-vertical | VerticalTimeline | animated | Activity feed with connectors. |
| 🆕 mc-timeline-horizontal | HorizontalTimeline | animated | Roadmap-style. |
| 🆕 mc-hero-split | SplitHero | basic | Text left, image right. |
| ✅ mc-hero-backdrop | HeroBackdrop | modern | Already seeded. |
| 🆕 mc-hero-aurora | AuroraHero | animated, modern | Aurora-borealis gradient bg. |
| 🆕 mc-footer-rich | RichFooter | basic | Multi-column with newsletter. |
| 🆕 mc-section-divider | SectionDivider | basic | Wave / zigzag / gradient SVG. |
| 🆕 mc-pricing-table | PricingTable | basic | 3-tier with "most popular" highlight. |
| 🆕 mc-feature-grid | FeatureGrid | basic | 3-6 column icon-headline-description. |

---

## Category 9 — Animation Primitives (~22 components) ⭐ user-bias category

Reusable motion building blocks. Most projects need a handful of these.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-anim-fade-in | FadeIn | animated | Simple opacity 0 → 1 on mount or scroll. |
| 🆕 mc-anim-slide-up | SlideUp | animated | translateY + opacity reveal. |
| 🆕 mc-anim-scale-in | ScaleIn | animated | Spring-based. |
| 🆕 mc-anim-stagger | StaggerChildren | animated, modern | Children animate in sequence. |
| 🆕 mc-anim-text-reveal | TextReveal | animated, modern | Per-character or per-word reveal on scroll. |
| 🆕 mc-anim-text-typewriter | TypewriterText | animated | Character-by-character typing effect. |
| 🆕 mc-anim-text-glitch | GlitchText | animated, modern | RGB-split glitch. |
| 🆕 mc-anim-text-gradient-shift | GradientShiftText | animated, modern | Animated gradient through text. |
| 🆕 mc-anim-counter-roll | CounterRoll | animated | Slot-machine number rolling. |
| 🆕 mc-anim-hover-lift | HoverLift | animated, interactive | Card lifts on hover with shadow. |
| 🆕 mc-anim-hover-glow | HoverGlow | animated, modern | Soft border-glow follows cursor inside card. |
| 🆕 mc-anim-magnetic-element | MagneticElement | animated, interactive, modern | Generic magnetic-cursor wrapper. |
| 🆕 mc-anim-cursor-blob | CursorBlob | animated, modern | Custom blob cursor that morphs over interactive elements. |
| 🆕 mc-anim-spotlight-cursor | SpotlightCursor | animated, modern | Dark theme — cursor reveals area beneath. |
| 🆕 mc-anim-parallax-layer | ParallaxLayer | animated | Scroll-driven parallax (1-3 layers). |
| 🆕 mc-anim-scroll-reveal | ScrollReveal | animated | Fades content in as it enters viewport. |
| 🆕 mc-anim-scroll-progress | ScrollProgress | animated | Top bar showing % of page read. |
| 🆕 mc-anim-scroll-snap | ScrollSnap | interactive | CSS scroll-snap for carousels/sections. |
| 🆕 mc-anim-scroll-pin | ScrollPin | animated, modern | GSAP-style pinning during section scroll. |
| 🆕 mc-anim-marquee | Marquee | animated | Infinite horizontal scroll, pause on hover. |
| 🆕 mc-anim-orbit | OrbitElement | animated, modern | Items orbit around a centre (logos, badges). |
| 🆕 mc-anim-floating | FloatingElement | animated | Subtle 3D float for hero illustrations. |

---

## Category 10 — Transitions (~10 components) ⭐ user-bias category

Connecting two states.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-transition-page | PageTransition | animated, modern | Route-change wrapper (View Transitions API or Framer). |
| 🆕 mc-transition-shared-element | SharedElement | animated, modern | Element morphs between routes (like iOS hero animation). |
| 🆕 mc-transition-modal-fade | ModalFade | animated | Opacity + scale for modals. |
| 🆕 mc-transition-modal-slide | ModalSlide | animated | Slide-from-bottom or side. |
| 🆕 mc-transition-accordion | AccordionExpand | animated | Smooth height auto-to-content. |
| 🆕 mc-transition-list-reorder | ListReorder | animated | FLIP technique for sorting. |
| 🆕 mc-transition-tab-content | TabContent | animated | Crossfade or slide between tab panes. |
| 🆕 mc-transition-image | ImageTransition | animated | Blurhash → loaded image fade. |
| 🆕 mc-transition-route-progress | RouteProgress | animated | NProgress-style top loader. |
| 🆕 mc-transition-stagger-list | StaggerList | animated, modern | Items fade up one-by-one on mount. |

---

## Category 11 — Data Visualisation (~14 components)

Charts and viz primitives. Most projects need 2-3.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-chart-line | LineChart | basic | Recharts/Nivo wrapper. |
| 🆕 mc-chart-area | AreaChart | basic | Stacked, percent-stacked. |
| 🆕 mc-chart-bar | BarChart | basic | Vertical, horizontal, grouped, stacked. |
| 🆕 mc-chart-donut | DonutChart | basic | With centre stat. |
| ✅ mc-sparkline | Sparkline | basic | Already seeded. |
| 🆕 mc-chart-heatmap | Heatmap | modern | GitHub-contrib style. |
| 🆕 mc-chart-radar | RadarChart | modern | For multi-dim comparisons. |
| 🆕 mc-chart-sankey | SankeyDiagram | modern | Flow visualisation. |
| 🆕 mc-chart-treemap | Treemap | basic | Hierarchical area. |
| 🆕 mc-chart-gauge | Gauge | animated | Speedometer-style. |
| 🆕 mc-chart-ridge | RidgeChart | modern | Stacked density curves. |
| 🆕 mc-chart-funnel | FunnelChart | basic | Conversion funnels. |
| 🆕 mc-chart-network-graph | NetworkGraph | interactive, modern | Force-directed graph (d3 or react-flow). |
| 🆕 mc-chart-calendar-heatmap | CalendarHeatmap | modern | Year-grid contribution-style. |

---

## Category 12 — Media (~13 components)

Image, video, audio.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-image-blurhash | BlurhashImage | modern | Blur placeholder → fade to loaded. |
| 🆕 mc-image-zoom | ImageZoom | interactive | Click to enlarge with backdrop. |
| 🆕 mc-image-pan-zoom | PanZoomImage | interactive | Map-style drag/zoom. |
| 🆕 mc-image-comparison | ImageComparison | interactive, modern | Before/after slider. |
| 🆕 mc-image-ken-burns | KenBurnsImage | animated, modern | Slow zoom + pan for hero images. |
| 🆕 mc-carousel-basic | Carousel | basic | Embla or Swiper-based. |
| 🆕 mc-carousel-3d-coverflow | CoverflowCarousel | animated, modern | 3D rotation between items. |
| 🆕 mc-gallery-masonry | MasonryGallery | basic | With lightbox. |
| 🆕 mc-video-player | VideoPlayer | basic | Custom controls (Plyr-style). |
| 🆕 mc-video-bg | BackgroundVideo | modern | Hero looping video with poster fallback. |
| 🆕 mc-audio-player | AudioPlayer | basic | Waveform or simple bar. |
| 🆕 mc-audio-waveform | WaveformPlayer | animated, modern | wavesurfer.js. |
| ✅ mc-cast-carousel | CastCarousel | basic | Already seeded. |

---

## Category 13 — Modern / Specialty (~22 components) ⭐ user-bias category

The "wow" stuff. Heaviest category by request.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-glass-card | GlassmorphismCard | modern | Backdrop blur + subtle border. |
| 🆕 mc-glass-navbar | GlassmorphismNavbar | modern | Frosted-glass top nav. |
| 🆕 mc-clay-button | ClaymorphismButton | modern | Soft inset/outset shadows. |
| 🆕 mc-clay-card | ClaymorphismCard | modern | |
| 🆕 mc-neon-button | NeonGlowButton | modern, animated | Cyberpunk glow + hover pulse. |
| 🆕 mc-aurora-bg | AuroraBackground | animated, modern | Aceternity-style gradient aurora. |
| 🆕 mc-mesh-gradient-bg | MeshGradient | animated, modern | Animated mesh-gradient hero. |
| 🆕 mc-grid-bg-animated | AnimatedGridBg | animated, modern | Square-grid with hover light. |
| 🆕 mc-dot-bg | DotPatternBg | basic, modern | Subtle dot grid. |
| 🆕 mc-noise-overlay | NoiseOverlay | modern | Film-grain texture. |
| 🆕 mc-beam-bg | BeamBackground | animated, modern | Light beams sweeping. |
| 🆕 mc-orb-bg | OrbBackground | animated, modern | Floating gradient orbs. |
| 🆕 mc-3d-card | 3DCard | animated, interactive, modern | Three.js or CSS 3D card with depth. |
| 🆕 mc-holographic | HolographicEffect | animated, modern | Iridescent gradient that shifts on tilt. |
| 🆕 mc-marquee-logos | LogoMarquee | animated | "Trusted by" infinite logo strip. |
| 🆕 mc-testimonial-3d | TestimonialCarousel3D | animated, modern | 3D depth carousel for testimonials. |
| 🆕 mc-timeline-animated | AnimatedTimeline | animated, modern | Connector animates as user scrolls. |
| 🆕 mc-vortex-bg | VortexBackground | animated, modern | Particle vortex swirl. |
| 🆕 mc-spotlight-card | SpotlightCard | animated, modern | Spotlight follows cursor inside card. |
| 🆕 mc-text-reveal-mask | TextRevealMask | animated, modern | Mask wipe reveals text. |
| 🆕 mc-particles-bg | ParticleBackground | animated, modern | tsparticles. |
| 🆕 mc-spotlight-section | SpotlightSection | animated, modern | Section that "lights up" as user scrolls into it. |

---

## Category 14 — Interactive Behaviours (~10 components) ⭐ user-bias category

Behaviour-heavy patterns.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-drag-and-drop | DragAndDrop | interactive | dnd-kit wrapper. |
| 🆕 mc-sortable-list | SortableList | interactive | Reorderable list with handle. |
| 🆕 mc-resize-handle | ResizeHandle | interactive | For panels and panes. |
| 🆕 mc-swipe-action | SwipeAction | interactive | Swipe-left for delete/archive (mobile). |
| 🆕 mc-pull-to-refresh | PullToRefresh | interactive | Mobile refresh gesture. |
| 🆕 mc-virtualized-list | VirtualizedList | basic | react-window for huge lists. |
| 🆕 mc-virtualized-table | VirtualizedTable | basic | tanstack-table virtualised. |
| 🆕 mc-keyboard-shortcuts | KeyboardShortcuts | interactive, accessibility-first | Cmd/Ctrl+K registry. |
| 🆕 mc-undo-redo-toast | UndoRedoToast | interactive, modern | "Deleted — Undo" with countdown. |
| 🆕 mc-copy-paste-handler | PasteImageHandler | interactive | Paste-to-upload. |

---

## Category 15 — Forms & Validation (~7 components)

Form-level patterns.

| ID | Name | Tags | Notes |
|---|---|---|---|
| 🆕 mc-form-wrapper | FormWrapper | basic | react-hook-form + zod template. |
| 🆕 mc-form-multi-step | MultiStepForm | interactive | With progress + back/next + summary. |
| 🆕 mc-form-autosave | AutosaveForm | interactive | Debounced save + "saved 3s ago" indicator. |
| 🆕 mc-fieldset-grouped | GroupedFieldset | basic | Visual section grouping. |
| 🆕 mc-validation-message | ValidationMessage | basic, accessibility-first | aria-live + icon. |
| 🆕 mc-honeypot | Honeypot | basic | Spam-prevention hidden field. |
| 🆕 mc-captcha-wrapper | CaptchaWrapper | basic | Cloudflare Turnstile / hCaptcha. |

---

## Total counts

| Category | Target | Live count (2026-05-19) | User-bias |
|---|---|---|---|
| 1 — Inputs | 22 | 9 | — |
| 2 — Selection | 10 | 8 | — |
| 3 — Buttons & Actions | 14 | 7 | partial |
| 4 — Display | 17 | 20 | — |
| 5 — Navigation | 13 | 12 | partial |
| 6 — Feedback | 16 | 15 | partial |
| 7 — Overlay | 9 | 6 | — |
| 8 — Layout | 13 | 7 | partial |
| 9 — Animation Primitives | 22 | 20 | ⭐ |
| 10 — Transitions | 10 | 7 | ⭐ |
| 11 — Data Visualisation | 14 | 9 | — |
| 12 — Media | 13 | 8 | partial |
| 13 — Modern / Specialty | 22 | 26 | ⭐ |
| 14 — Interactive Behaviours | 10 | 4 | ⭐ |
| 15 — Forms & Validation | 7 | 4 | — |
| 16 — Auth Screens | 8 | 8 | — |
| 17 — Dashboard Shells | 6 | 6 | — |
| 18 — AI Blocks | 10 | 11 | — |
| **Total** | **236** | **187** | |

**As of 2026-05-19**:
- 187 entries live; 49 more to hit full target.
- Every category has ≥3 entries → Stage 2.3 gap check passes for any project.
- 3 new categories (16-18) introduced 2026-05-19 — see "Categories 16-18" section below.
- Parallel `inspirations` table (27 rows) holds visual refs from Dribbble/Figma that don't carry code.

## Category 16 — Auth Screens (target 8) ⭐ new 2026-05-19

Full sign-in / sign-up / forgot-password / OAuth-button-cluster / 2FA / magic-link / SSO compositions. Whole-page patterns, not individual buttons.

Live entries: mc-auth-signin-split, mc-auth-signup-shadcn, mc-auth-forgot-password, mc-auth-otp-form, mc-auth-layout-shadcn, mc-auth-oauth-github, mc-auth-interactive-grid, mc-auth-user-form.

## Category 17 — Dashboard Shells (target 6) ⭐ new 2026-05-19

Whole-page dashboard layouts (sidebar + topbar + main grid). Lets Stage 2.4 pick a SHELL once for a project. Maps to Dribbble dashboard inspirations.

Live entries: mc-shell-collapsible-sidebar, mc-shell-app-header, mc-shell-shadcn-admin, mc-shell-kiranism-app, mc-shell-vision-glass, mc-shell-horizon-sidebar-card.

## Category 18 — AI Blocks (target 10) ⭐ new 2026-05-19

2026-specific AI surfaces: chat threads, prompt inputs, agent traces, tool-call blocks, model pickers, streaming responses, token counters.

Live entries: mc-ai-chat-thread, mc-ai-message, mc-ai-prompt-input, mc-ai-model-picker, mc-ai-code-block, mc-ai-reasoning, mc-ai-shimmer, mc-ai-suggestion-cards, mc-ai-tool-call-block, mc-ai-chain-of-thought, mc-ai-token-counter.

## Inspirations track (separate from master_components)

Parallel `inspirations` table (SQL: `inspirations` with id/title/source_url/source_type/domain/style_tags/notes/matched_master_component_ids/match_confidence). 27 rows seeded 2026-05-19 from `UI inspos.txt` (9 Dribbble + 18 Figma community templates). Stage 2.4 can read this when the user references a visual style — to find the closest implementation in `master_components`.

## New structured columns on master_components (2026-05-19)

Schema migration `0005_ui_library_expand` added:
- `library` — source-library tag (`magicui` / `aceternity` / `vercel-ai-chatbot` / `kibo` / `originui` / `tremor-blocks` / `tailadmin-v2` / `satnaing-shadcn-admin` / `kiranism-shadcn` / `react-bits` / `vision-ui` / `horizon-ui` / `custom`).
- `source_url` — canonical upstream URL.
- `quality_grade` — `A` (production-grade) / `B` (solid w/ caveats) / `C` (basic).
- `ingestion_method` — `manual-copy` / `shadcn-cli` / `gh-raw` / `figma-extract` / `chrome-mcp-scrape` / `21st-dev-mcp`.

Stage 2.4 ranking SHOULD prefer `quality_grade='A'` and filter by `library` when the project's `ui_master_plan` calls for a specific aesthetic family.

## Suggested external references for source code

When walking each category, these are good source-of-truth libraries to mine:

| Need | Source |
|---|---|
| Modern + animated components (your bias) | [Aceternity UI](https://ui.aceternity.com), [Magic UI](https://magicui.design), [HyperUI](https://hyperui.dev), [Cult UI](https://www.cult-ui.com), [Animate UI](https://animate-ui.com) |
| Headless / accessible primitives | [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://www.radix-ui.com), [Headless UI](https://headlessui.com) |
| Animation libs | [Framer Motion](https://www.framer.com/motion/) (via motion.dev), [GSAP](https://gsap.com), [react-spring](https://react-spring.dev) |
| Charting | [Recharts](https://recharts.org), [Nivo](https://nivo.rocks), [Tremor Blocks](https://blocks.tremor.so) |
| Form/inputs | [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev), [OriginUI](https://originui.com) |
| Drag-and-drop / interactive | [dnd-kit](https://dndkit.com), [Kibo UI](https://www.kibo-ui.com) |
| AI / chat surfaces | [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot), [Assistant-UI](https://www.assistant-ui.com), [AI Elements (Vercel)](https://ai-sdk.dev/elements) |
| Dashboard shells | [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard), [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin), [Kiranism shadcn dashboard starter](https://github.com/Kiranism/next-shadcn-dashboard-starter), [Vision UI](https://github.com/creativetimofficial/vision-ui-dashboard-react), [Horizon UI](https://github.com/horizon-ui/horizon-tailwind-react-nextjs) |
| Auth screens | [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin), [Clerk registry](https://clerk.com), [Supabase UI](https://supabase.com/ui) |

## Bulk-clone scaffold

Curated source repos live at `/home/pdsv/ui-library/` on VAULT7A:
- `kits/` — 15 React/Tailwind kits (existing as of 2026-05-11)
- `kits-new/` — 13 additional kits added 2026-05-19 (untitled-ui-react, tailadmin-v2, horizon-ui, vision-ui, purity-ui, argon, kiranism-shadcn, satnaing-shadcn-admin, vercel-ai-chatbot, assistant-ui, tremor-blocks, saasboard, nextcrm)

## Ingestion pipeline (2026-05-19)

Six lanes, in priority order:

1. **OSS git twin** — when a Figma kit has an upstream React repo, `git clone` and ingest its components verbatim. Highest quality. Used to seed all 187 current entries via this lane.
2. **Framelink Figma MCP** (`figma-developer-mcp`) — npm MIT, the workhorse for community Figma kits without an OSS twin. Add to `~/.claude.json`.
3. **shadcn MCP server** — universal install/search surface across all configured registries. Unlimited free. `pnpm dlx shadcn@latest mcp init --client claude`.
4. **21st.dev Magic MCP** — 100 credits/month free. Reserve for novel Stage 2.4 gap-fill, NEVER bulk seeding.
5. **v0 Platform API or Google Stitch** — prompt-to-code for genuinely new components. Stitch has a community MCP bridge to Claude Code.
6. **Claude-in-Chrome scrape** — fallback for paid/locked kits with viewer URLs (the user's Vision UI Dashboard pilot used this lane).

## Workflow

1. **One-time seeding** runs the ingestion script above into `master_components` + copies primary files to `/mnt/storage/ottomate/assets/components/<mc-id>/`.
2. Stage 2.3 of any new project queries this catalog; gap check is per-category ≥3 SOFT / ≥1 HARD.
3. Stage 2.4 surfaces ≥2-3 options matching the page's needs, filtered by `library`/`quality_grade` from the project's `ui_master_plan`. User picks via Ottomate UI.
4. Stage 4 component_modification or new UI feature_request: same query → same pick UI page (`/iterations/<id>/items/<itemId>/pick-component`).
5. Catalog grows organically as new patterns emerge — append to `clone-all.sh` + re-run ingestion batch script.
