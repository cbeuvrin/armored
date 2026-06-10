// ========================================
// IMAGE SEQUENCE SCROLL - HERO SECTION
// ========================================

// Configuration
const CONFIG = {
    totalFrames: 96,  // Adjusted to match actual file count in parallax3
    imagePath: '/parallax3/ezgif-frame-',
    imageExtension: '.webp',
};

// State
const state = {
    images: [],
    imagesLoaded: 0,
    currentFrame: 0,
    canvas: null,
    ctx: null,
    preloader: null,
    progressFill: null,
    loadingPercentage: null,
};

// ========================================
// INITIALIZATION
// ========================================

// Toggle: set to true to re-enable the loading animation.
const PRELOADER_ENABLED = false;

function init() {
    // The canvas scroll animation (#hero-blindaje) is desktop-only — hidden on mobile
    // via `display: none` in styles.css. Skip grabbing the canvas on mobile so we
    // don't preload ~5-6 MB of parallax frames the user will never see.
    const isMobile = window.innerWidth <= 768;

    // Get DOM elements
    state.canvas = isMobile ? null : document.getElementById('heroCanvas');
    if (state.canvas) {
        state.ctx = state.canvas.getContext('2d');
    }
    state.preloader = document.getElementById('preloader');
    state.progressFill = document.getElementById('progressFill');
    state.loadingPercentage = document.getElementById('loadingPercentage');

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // If preloader is disabled, hide it immediately and mark animation done.
    if (!PRELOADER_ENABLED && state.preloader) {
        state.preloader.style.display = 'none';
        state.loadingAnimationDone = true;
    }

    // If there is no canvas (mobile or page without it), skip the 96-frame preload.
    if (state.canvas) {
        preloadImages();
    } else {
        state.imagesReady = true;
    }

    // Start visual loading sequence (only if enabled)
    if (PRELOADER_ENABLED) {
        runPreloaderSequence();
    }

    // Setup Mobile Menu
    setupMobileMenu();

    // Setup Language Switcher
    setupLanguageSwitcher();
}

// ========================================
// IMAGE PRELOADER
// ========================================

function preloadImages() {
    const loadPromises = [];
    const isMobile = window.innerWidth <= 768;
    const step = isMobile ? 2 : 1; // Load every 2nd frame on mobile (~40 images) vs 80 on desktop

    // Adjust preloader duration based on device
    const preloaderDuration = isMobile ? 2.0 : 3.5;

    for (let i = 1; i <= CONFIG.totalFrames; i++) {
        // Skip frames logic: if mobile, only load if (i % step === 0) OR if it's the first/last frame
        if (isMobile && (i % step !== 0 && i !== 1 && i !== CONFIG.totalFrames)) {
            // For skipped frames, we push a null or placeholder handled by renderer? 
            // Simpler approach: Load ALL but rely on browser cache or just load subset and mapped index? 
            // "Frame Skipping" implies we show fewer frames. 
            // Let's actually load subset and let the renderer pick the closest loaded frame.
            // BUT simpler for this variable structure: Just push NULL and handle it in renderFrame? 
            // NO, safest is: Load subset, and if renderFrame(5) is called but 5 is null, show 4.
            // Let's populate the array fully but with references to previous image for skipped ones.

            // Wait, the "state.images" is an array. Index matches frame number? 
            // script uses `state.images[frameIndex - 1]`.
            // So we must fill the array.
            continue; // We will fill holes later using a smart filler or just modify the loop.
        }

        // Wait, filling holes is complex. 
        // Better: Load 'step' frames. 
        // Actually, let's keep it robust. Load specific frames, fill holes with previous loaded frame object.
    }

    // RE-WRITING LOOP FOR ROBUST FILLING
    let lastLoadedImage = null;

    for (let i = 1; i <= CONFIG.totalFrames; i++) {
        // Decide if we load this frame
        const shouldLoad = !isMobile || (i === 1 || i === CONFIG.totalFrames || i % step === 0);

        if (shouldLoad) {
            const img = new Image();
            const frameNumber = String(i).padStart(3, '0');
            const imagePath = `${CONFIG.imagePath}${frameNumber}${CONFIG.imageExtension}`;

            const promise = new Promise((resolve, reject) => {
                img.onload = () => {
                    // state.imagesLoaded++; // We count differently now
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Parallax frame missing: ${imagePath}`);
                    resolve(); // Resolve anyway to not break Promise.all
                };
                img.src = imagePath;
            });

            state.images.push(img); // Push REAL image
            lastLoadedImage = img;  // Update reference
            loadPromises.push(promise);
        } else {
            // SKIPPED FRAME: Push the reference to the LAST loaded image (or a placeholder if none).
            // Since we always load frame 1, 'lastLoadedImage' will be valid from i=2 onwards.
            state.images.push(lastLoadedImage);
            // No promise needed for skipped frames, they are "instant"
        }
    }

    Promise.all(loadPromises)
        .then(() => {
            console.log('All images loaded successfully!');
            state.imagesReady = true;
            checkPreloaderComplete();
            setupCanvas();
            setupSequentialAnimation();
        })
        .catch((error) => {
            console.warn('Some parallax frames failed to load:', error);
            state.imagesReady = true;
            checkPreloaderComplete();
        });
}

// --- New Preloader Logic ---

function runPreloaderSequence() {
    state.loadingAnimationDone = false;
    state.imagesReady = false;

    // If preloader element doesn't exist (like on subpages), bypass preloader logic 
    if (!state.preloader) {
        state.loadingAnimationDone = true;
        state.imagesReady = true;
        return;
    }

    // ONLY SHOW ONCE PER SESSION
    if (sessionStorage.getItem('armoredPreloaderShown') === 'true') {
        state.preloader.style.display = 'none';
        state.loadingAnimationDone = true;
        return;
    }

    // Mark as shown for this session
    sessionStorage.setItem('armoredPreloaderShown', 'true');

    // Reset impacts
    gsap.set("#impact-1, #impact-2, #impact-3", { opacity: 0, scale: 0.5 });

    // Main Loading Timeline
    const loadTl = gsap.timeline({
        onComplete: () => {
            state.loadingAnimationDone = true;
            checkPreloaderComplete();
        }
    });

    // Animate Progress 0-100%
    loadTl.to(state.progressFill, {
        width: "100%",
        duration: 3.5,
        ease: "power1.inOut",
        onUpdate: function () {
            const progress = Math.round(this.progress() * 100);
            if (state.loadingPercentage) state.loadingPercentage.innerText = progress + "%";
        }
    });

    // Impact Triggers relative to timeline
    loadTl.add(() => { showImpact("#impact-1"); shakeScreen(); }, 1.0); // ~30%
    loadTl.add(() => { showImpact("#impact-2"); shakeScreen(); }, 2.0); // ~60%
    loadTl.add(() => { showImpact("#impact-3"); shakeScreen(); }, 3.0); // ~85%
}

function showImpact(selector) {
    gsap.to(selector, {
        opacity: 1,
        scale: 1,
        duration: 0.1,
        ease: "elastic.out(1, 0.3)"
    });
    // Optional: Play Sound
}

function shakeScreen() {
    // Shake only the content (Title + Bar), not the background
    const content = document.querySelector('.preloader-content');
    if (content) {
        content.classList.add('shake-animation');
        setTimeout(() => {
            content.classList.remove('shake-animation');
        }, 500);
    }
}

function checkPreloaderComplete() {
    // Only hide if both images are loaded AND visual sequence is done
    if (state.imagesReady && state.loadingAnimationDone) {
        if (state.preloader) {
            gsap.to(state.preloader, {
                opacity: 0,
                duration: 0.8,
                onComplete: () => {
                    state.preloader.style.display = 'none';
                }
            });
        }
    }
}

// Placeholder to prevent errors if still referenced
function updatePreloaderProgress() { }
function hidePreloader() { }

// ========================================
// CANVAS SETUP
// ========================================

function setupCanvas() {
    if (state.images.length === 0) return;

    const firstImage = state.images[0];
    state.canvas.width = firstImage.width;
    state.canvas.height = firstImage.height;

    // Clear inline styles to let CSS handle responsiveness
    state.canvas.style.width = '';
    state.canvas.style.height = '';

    renderFrame(0);
}

function renderFrame(frameIndex) {
    if (!state.ctx || !state.images[frameIndex]) return;
    const img = state.images[frameIndex];
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    state.ctx.drawImage(img, 0, 0, state.canvas.width, state.canvas.height);
}

// ========================================
// SEQUENTIAL ANIMATION LOGIC
// ========================================

function setupSequentialAnimation() {

    // ── Device detection ──────────────────────────────────────────────────────
    const W = window.innerWidth;
    const isMobileDevice = W <= 768;
    
    // Si estamos en móvil, la sección de fondo blanco ya no va, así que saltamos
    // toda esta lógica pesada para no consumir RAM y dejamos solo las animaciones comunes.
    if (!document.getElementById('hero-blindaje') || isMobileDevice) {
        setupCommonScrollAnimations();
        return;
    }

    const isTabletDevice  = W > 768 && W <= 1024;
    // isDesktop = everything else

    // Per-device scroll config
    // Mobile  → shorter pin (2 blocks), faster scrub, NO snap (touch conflicts)
    // Tablet  → medium pin (3 blocks), medium scrub, NO snap (safer on touch)
    // Desktop → full 4-block experience with snap
    const scrollDist = isMobileDevice ? '+=300%' : isTabletDevice ? '+=300%' : '+=400%';
    const scrubVal   = isMobileDevice ? 0.3       : isTabletDevice ? 1.0      : 1.5;
    const useSnap    = !isMobileDevice && !isTabletDevice; // snap only on desktop

    // Initial Setup: Hide all hotspots
    gsap.set('.hotspot', { opacity: 0, scale: 0.5 });
    gsap.set('.hotspot-callout', { opacity: 0, visibility: 'hidden' });

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN TIMELINE
    //  Desktop (>1024px):   Uses Observer pattern for "Presentation Slider" (No scrub)
    //  Tablet (769-1024): 3 blocks, 300vh, scrub 1.0, no snap
    //  Mobile (≤768px):   2 blocks, 200vh, scrub 0.8, no snap
    // ─────────────────────────────────────────────────────────────────────────
    const tl = gsap.timeline({
        paused: useSnap, // For desktop, timeline is manually driven by Observer
        scrollTrigger: useSnap ? null : {
            trigger: '#hero-blindaje',
            start: 'top top',
            end: scrollDist,
            scrub: scrubVal,
            pin: true,
            onEnter:     () => document.body.classList.remove('scrolled-header'),
            onLeave:     () => document.body.classList.add('scrolled-header'),
            onEnterBack: () => document.body.classList.remove('scrolled-header'),
            onLeaveBack: () => document.body.classList.add('scrolled-header'),
            onUpdate: () => {
                renderFrame(Math.round(state.currentFrame));
            }
        },
        onUpdate: () => {
            if (useSnap) renderFrame(Math.round(state.currentFrame));
        }
    });

    // Header state on load
    document.body.classList.add('scrolled-header');

    // Intro elements float in when section scrolls into view
    gsap.from(['.intro-logo', '.intro-badge'], {
        y: 80, opacity: 0, duration: 1.5, stagger: 0.3, ease: 'power3.out',
        scrollTrigger: {
            trigger: '#hero-blindaje',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });

    // ╔══════════════════════════════╗
    // ║  BLOCK 1  —  Cristales       ║ (ALL devices)
    // ╚══════════════════════════════╝
    tl.addLabel('start');

    tl.to(state, { currentFrame: 14, ease: 'power2.inOut', duration: 6 });

    tl.to('#hotspot-cristales', { opacity: 1, scale: 1, duration: 1.5, ease: 'back.out(1.5)' });
    tl.to('#hotspot-cristales .hotspot-callout', { opacity: 1, visibility: 'visible', duration: 1 }, '<+0.3');

    tl.addLabel('block1');

    tl.to({}, { duration: 4 });

    // Callout exits before next rotation
    tl.to('#hotspot-cristales .hotspot-callout', { opacity: 0, visibility: 'hidden', duration: 0.8 });
    tl.to('#hotspot-cristales', { opacity: 0, scale: 0.5, duration: 0.6 }, '<+0.2');

    // ╔══════════════════════════════╗
    // ║  BLOCK 2  —  Puertas         ║ (ALL devices)
    // ╚══════════════════════════════╝

    tl.to(state, { currentFrame: 45, ease: 'power2.inOut', duration: 7 });

    // Fade intro overlay mid-rotation
    tl.to(['.intro-logo', '.intro-badge', '.intro-badge span'], {
        opacity: 0, x: 50, duration: 1, ease: 'power2.in'
    }, '<+2');

    tl.to('#hotspot-puertas', { opacity: 1, scale: 1, duration: 1.5, ease: 'back.out(1.5)' });
    tl.to('#hotspot-puertas .hotspot-callout', { opacity: 1, visibility: 'visible', duration: 1 }, '<+0.3');

    tl.addLabel('block2');

    tl.to({}, { duration: 4 });

    tl.to('#hotspot-puertas .hotspot-callout', { opacity: 0, visibility: 'hidden', duration: 0.8 });
    tl.to('#hotspot-puertas', { opacity: 0, scale: 0.5, duration: 0.6 }, '<+0.2');

    // ╔══════════════════════════════╗
    // ║  BLOCK 3  —  Suspensión      ║ (Tablet + Desktop only)
    // ╚══════════════════════════════╝
    if (!isMobileDevice) {

        tl.to(state, { currentFrame: 79, ease: 'power2.inOut', duration: 7 });

        tl.to('#hotspot-suspension', { opacity: 1, scale: 1, duration: 1.5, ease: 'back.out(1.5)' });
        tl.to('#hotspot-suspension .hotspot-callout', { opacity: 1, visibility: 'visible', duration: 1 }, '<+0.3');

        tl.addLabel('block3');

        // Brief beat so users see the final state with all 3 dots before onComplete fires.
        tl.to({}, { duration: 1.5 });
    }

    // ╔══════════════════════════════════════════════════╗
    // ║  AUTO-PLAY ON ENTRY (Desktop)                    ║
    // ║  No scroll lock, no pin. Timeline plays once     ║
    // ║  when the section enters viewport, then the      ║
    // ║  3 hotspot dots stay visible and reveal their    ║
    // ║  callouts on hover. User scrolls normally.       ║
    // ╚══════════════════════════════════════════════════╝
    if (useSnap) {
        // Speed up the existing cinematic timeline so auto-play finishes
        // in ~8s instead of ~30s. Eases stay intact.
        tl.timeScale(3.5);

        const HOTSPOT_IDS = ['#hotspot-cristales', '#hotspot-puertas', '#hotspot-suspension'];

        // Inject a Play button into the section (hidden until animation completes)
        let playBtn = document.getElementById('hero-replay-btn');
        if (!playBtn) {
            playBtn = document.createElement('button');
            playBtn.id = 'hero-replay-btn';
            playBtn.className = 'hero-replay-btn';
            playBtn.setAttribute('aria-label', 'Reproducir animación de nuevo');
            playBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Reproducir</span>';
            document.getElementById('hero-blindaje').appendChild(playBtn);
        }

        let hoverWired = false;
        function wireHotspotHover() {
            if (hoverWired) return;
            hoverWired = true;
            HOTSPOT_IDS.forEach(sel => {
                const hotspot = document.querySelector(sel);
                if (!hotspot) return;
                hotspot.addEventListener('mouseenter', () => hotspot.classList.add('active'));
                hotspot.addEventListener('mouseleave', () => hotspot.classList.remove('active'));
            });
        }

        function showFinalState() {
            document.body.classList.add('scrolled-header');

            // Force all 3 dots visible — timeline faded earlier ones out
            gsap.set(HOTSPOT_IDS, { opacity: 1, scale: 1, clearProps: 'visibility' });

            // Clear inline callout styles so CSS .hotspot.active rule drives hover
            HOTSPOT_IDS.forEach(sel => {
                const callout = document.querySelector(sel + ' .hotspot-callout');
                if (callout) gsap.set(callout, { clearProps: 'opacity,visibility' });
            });

            wireHotspotHover();
            playBtn.classList.add('is-visible');
        }

        function playAnimation() {
            playBtn.classList.remove('is-visible');
            // Reset hotspots so the animation can reveal them again
            HOTSPOT_IDS.forEach(sel => {
                const hotspot = document.querySelector(sel);
                if (hotspot) hotspot.classList.remove('active');
            });
            gsap.set(HOTSPOT_IDS, { opacity: 0, scale: 0.5 });
            gsap.set('.hotspot-callout', { opacity: 0, visibility: 'hidden' });
            document.body.classList.remove('scrolled-header');
            tl.restart();
        }

        // No auto-play: button is visible from the start. User opts in by clicking.
        playBtn.classList.add('is-visible');

        // Animation done → re-show button so user can replay (or scroll past)
        tl.eventCallback('onComplete', showFinalState);

        // Click → play (or replay)
        playBtn.addEventListener('click', playAnimation);
    }

}

function setupCommonScrollAnimations() {
    // --- Dynamic Header Styling ---

    // 1. Enter Black Services Section -> Text turns White
    if (document.getElementById('black-section')) {
        ScrollTrigger.create({
            trigger: "#black-section",
            start: "top 100px",
            onEnter: () => document.body.classList.add("scrolled-header"),
            onLeaveBack: () => document.body.classList.remove("scrolled-header"),
        });
    }

    // 2. Enter White 'Niveles de Blindaje' Section -> Text turns Black
    if (document.getElementById('shielding-presentation')) {
        ScrollTrigger.create({
            trigger: "#shielding-presentation",
            start: "top 100px",
            onEnter: () => document.body.classList.remove("scrolled-header"),
            onLeaveBack: () => document.body.classList.add("scrolled-header"),
        });
    }

    // 3. Enter Black 'Contacto' Section (and footer) -> Text turns White
    if (document.getElementById('contacto')) {
        ScrollTrigger.create({
            trigger: "#contacto",
            start: "top 100px",
            onEnter: () => document.body.classList.add("scrolled-header"),
            onLeaveBack: () => document.body.classList.remove("scrolled-header"),
        });
    }

    // --- Staggered Text Entrance (Requested Animation) ---
    // Animates Title and Paragraph upwards with a delay
    if (document.querySelector('.content-wrapper')) {
        gsap.from(".content-wrapper h2, .content-wrapper p", {
            y: 100,
            opacity: 0,
            duration: 1.5,
            stagger: 0.8, // "A destiempo" más marcado
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".content-wrapper",
                start: "top 80%", // Start when content is near bottom of screen
                toggleActions: "play none none reverse"
            }
        });
    }

    // Video Zoom Effect - added here to ensure ScrollTrigger is ready
    if (document.querySelector('.video-section')) {
        gsap.fromTo(".video-container",
            { width: "40%" },
            {
                width: "90%",
                ease: "none",
                scrollTrigger: {
                    trigger: ".video-section",
                    start: "top 90%",
                    end: "top 30%",
                    scrub: 2,
                    markers: false
                }
            }
        );
    }
}


// ========================================
// RESPONSIVE BEHAVIOR
// ========================================

function handleResize() {
    setupCanvas();
    renderFrame(Math.round(state.currentFrame));
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 200);
});

// ========================================
// START APPLICATION
// ========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========================================
// MOBILE HOTSPOTS — Animación Coche Estático
// ========================================

(function() {
    'use strict';

    function initMobileHotspots() {
        // Solo ejecutar en móvil (≤768px)
        if (window.innerWidth > 768) return;

        const container = document.getElementById('mobile-scrollytelling');
        if (!container) return;

        // Animar Hotspots cuando entren en la pantalla
        ScrollTrigger.create({
            trigger: container,
            start: 'top 50%', // Seactiva cuando la mitad de la foto entra desde abajo
            once: false,      // Puede modificarse a true si solo quieres que salgan 1 vez
            onEnter: () => {
                const tl = gsap.timeline();
                const hotspots = document.querySelectorAll('.m-hotspot');
                
                hotspots.forEach((spot, index) => {
                    const dot = spot.querySelector('.m-dot');
                    const line = spot.querySelector('.m-line');
                    const text = spot.querySelector('.m-text');

                    // Set initial hidden states
                    gsap.set(dot, { opacity: 0, scale: 0 });
                    gsap.set(line, { opacity: 0, width: 0 });
                    // Aseguramos que el texto salga siempre disparado "alejándose" del punto
                    gsap.set(text, { opacity: 0, x: spot.classList.contains('m-hotspot-2') ? 20 : -20 });

                    // Calcular delay escalonado (cada uno sale después del anterior)
                    let startTime = index * 0.8; 

                    // 1. Punto
                    tl.to(dot, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, startTime);
                    
                    // 2. Línea
                    let lineWidth = '40px';
                    if (spot.classList.contains('m-hotspot-2')) lineWidth = '60px';
                    if (spot.classList.contains('m-hotspot-3')) lineWidth = '50px';
                    
                    tl.to(line, { width: lineWidth, opacity: 1, duration: 0.4, ease: 'power2.out' }, startTime + 0.3);
                    
                    // 3. Texto
                    tl.to(text, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, startTime + 0.5);
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileHotspots);
    } else {
        initMobileHotspots();
    }
})();

// ========================================
// LAZY LOADING SYSTEM (Videos & Iframes)
// ========================================

(function() {
    'use strict';

    // --- Lazy Load Videos ---
    // Videos with [data-lazy-video] have their <source> elements using data-src instead of src.
    // When the video enters the viewport (with a 300px rootMargin buffer), we swap data-src → src and call .load()

    function setupLazyVideoLoading() {
        const lazyVideos = document.querySelectorAll('video[data-lazy-video]');
        if (lazyVideos.length === 0) return;

        if ('IntersectionObserver' in window) {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const video = entry.target;
                        loadVideoSources(video);
                        videoObserver.unobserve(video);
                    }
                });
            }, {
                rootMargin: '300px 0px', // Start loading 300px BEFORE the video enters the viewport
                threshold: 0
            });

            lazyVideos.forEach(video => videoObserver.observe(video));
        } else {
            // Fallback: Load all videos immediately if IntersectionObserver is not supported
            lazyVideos.forEach(video => loadVideoSources(video));
        }
    }

    function loadVideoSources(video) {
        const sources = video.querySelectorAll('source[data-src]');
        if (sources.length === 0) return;

        sources.forEach(source => {
            const dataSrc = source.getAttribute('data-src');
            if (dataSrc) {
                source.setAttribute('src', dataSrc);
                source.removeAttribute('data-src');
            }
        });

        video.load();
        video.play().catch(e => {
            // Autoplay might be blocked, that's OK
            console.log('Lazy video autoplay prevented:', e.message);
        });
        video.removeAttribute('data-lazy-video');
    }

    // --- Lazy Load Iframes (YouTube etc.) ---
    // Iframes inside [data-lazy-iframe] containers have data-src instead of src.
    // When the container nears the viewport, we swap data-src → src.

    function setupLazyIframeLoading() {
        const lazyIframeContainers = document.querySelectorAll('[data-lazy-iframe]');
        if (lazyIframeContainers.length === 0) return;

        if ('IntersectionObserver' in window) {
            const iframeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const container = entry.target;
                        const iframe = container.querySelector('iframe[data-src]');
                        if (iframe) {
                            iframe.src = iframe.getAttribute('data-src');
                            iframe.removeAttribute('data-src');
                        }
                        iframeObserver.unobserve(container);
                    }
                });
            }, {
                rootMargin: '400px 0px', // Start loading 400px before entering viewport
                threshold: 0
            });

            lazyIframeContainers.forEach(container => iframeObserver.observe(container));
        } else {
            // Fallback
            lazyIframeContainers.forEach(container => {
                const iframe = container.querySelector('iframe[data-src]');
                if (iframe) {
                    iframe.src = iframe.getAttribute('data-src');
                    iframe.removeAttribute('data-src');
                }
            });
        }
    }

    // --- Pause/Resume Videos Based on Visibility ---
    // Videos that are not in the viewport should be paused to save CPU/GPU/battery.

    function setupVideoPauseOnScroll() {
        const allVideos = document.querySelectorAll('video[autoplay]');
        if (allVideos.length === 0) return;

        if ('IntersectionObserver' in window) {
            const pauseObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        // Only play if it has a valid source loaded
                        if (video.currentSrc || video.querySelector('source[src]')) {
                            video.play().catch(() => {});
                        }
                    } else {
                        video.pause();
                    }
                });
            }, {
                rootMargin: '100px 0px',
                threshold: 0
            });

            allVideos.forEach(video => pauseObserver.observe(video));
        }
    }

    // Initialize all lazy loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupLazyVideoLoading();
            setupLazyIframeLoading();
            // Delay pause observer slightly to let initial videos start playing
            setTimeout(setupVideoPauseOnScroll, 1000);
        });
    } else {
        setupLazyVideoLoading();
        setupLazyIframeLoading();
        setTimeout(setupVideoPauseOnScroll, 1000);
    }
})();

// --- Shielding Level Selector Logic ---

// --- Section 3: Horizontal Levels Animation ---
document.addEventListener('DOMContentLoaded', () => {
    gsap.to(".level-item", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".levels-strip-container",
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    });
});

// ========================================
// FORCE MOBILE VIDEO (Fallback)
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.innerWidth <= 768;
    const heroVideo = document.querySelector('#video-hero video');

    if (isMobile && heroVideo) {
        // Explicitly force the mobile source if the browser is being stubborn
        const currentSrc = heroVideo.currentSrc;
        // Check if it's already playing the mobile one
        if (!currentSrc.includes('video-hero-mobile')) {
            console.log("Forcing mobile video source via JS");
            heroVideo.src = 'video-hero-movil/video-hero-mobile-web.mp4';
            heroVideo.load();
            heroVideo.play().catch(e => console.log("Auto-play prevented:", e));
        }
    }
});

// ========================================
// MOBILE MENU LOGIC
// ========================================

function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!hamburger || !nav) return;

    // Toggle Menu
    hamburger.addEventListener('click', () => {
        const isActive = hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
        nav.setAttribute('aria-hidden', !isActive);
    });

    // Close Menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        });
    });
}

// ========================================
// VIDEO MODAL LOGIC (Niveles de Blindaje)
// ========================================

function setupVideoModal() {
    const videoItems = document.querySelectorAll('.level-video-item');
    const videoModal = document.getElementById('videoModal');
    if (!videoModal) return;

    const modalVideo = document.getElementById('modalVideo');
    const closeModalBtn = videoModal.querySelector('.close-modal');

    // Open Modal
    videoItems.forEach(item => {
        item.addEventListener('click', () => {
            const sourceSelector = item.querySelector('source');
            if (sourceSelector) {
                const videoSrc = sourceSelector.getAttribute('src') || sourceSelector.getAttribute('data-src');
                if (videoSrc) {
                    modalVideo.src = videoSrc;
                    videoModal.classList.add('active');
                    modalVideo.play().catch(err => console.log('Auto-play prevent:', err));
                }
            }
        });
    });

    // Close Modal Function
    const closeAndStopVideo = () => {
        videoModal.classList.remove('active');
        modalVideo.pause();
        modalVideo.src = '';
    };

    // Close on X click
    closeModalBtn.addEventListener('click', closeAndStopVideo);

    // Close on background click
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal || e.target.classList.contains('video-modal-content')) {
            closeAndStopVideo();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeAndStopVideo();
        }
    });
}

// ========================================
// CERTIFICATIONS ANIMATION (Bullet Draw)
// ========================================

function setupCertificationsAnimation() {
    const separator = document.querySelector('.cert-separator-line');
    if (!separator) return;

    gsap.to(separator, {
        width: "350px",
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".certificaciones-bottom",
            start: "top 85%", // Dispara cuando la sección entra al 85% de la pantalla
            once: true // Solo una vez
        }
    });
}

// Ensure modal and animations are setup
document.addEventListener('DOMContentLoaded', () => {
    setupVideoModal();
    setupNosotrosSlider();
    setupNosotrosParallax();
    setupAccordions(); // Initialize all accordions (Nosotros & Servicios)
    setupNosotrosVideoScrollScale(); // Initialize the video scroll-to-scale effect
    setupHomeFinalVideoScroll(); // Initialize the final video on the home page
    setupServiciosReveal(); // Initialize Servicios page animations
    setupServiciosHeroAnimation(); // Initialize the diagonal hero animations
    setupServiciosGridReveal(); // Initialize the grid reveal animations
    setupServiciosTimeline(); // Initialize the vertical process timeline
    try {
        setupCertificationsAnimation();
    } catch (e) {
        console.log("Certifications animation setup skipped.", e);
    }
    setupContactForm(); // Initialize contact form submit handler & Google Ads conversion
    setupClickConversions(); // Initialize WhatsApp & Phone click conversions
});

// ========================================
// NOSOTROS SLIDER LOGIC
// ========================================

function setupNosotrosSlider() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let autoScrollSpeed = 1; // Pixels per frame
    let animationId;
    let isHovered = false;

    // Clone handling for infinite scroll is already in HTML (duplicated set)
    // We just need to reset scrollLeft when it reaches halfway.

    function autoScroll() {
        if (!isDown && !isHovered) {
            track.scrollLeft += autoScrollSpeed;
            // Reset when reaching halfway (the end of the first original set)
            if (track.scrollLeft >= track.scrollWidth / 2) {
                track.scrollLeft = 0;
            }
        }
        animationId = requestAnimationFrame(autoScroll);
    }

    // Start auto scroll
    autoScroll();

    track.addEventListener('mouseenter', () => {
        isHovered = true;
    });

    track.addEventListener('mouseleave', () => {
        isDown = false;
        isHovered = false;
        track.style.cursor = 'grab';
    });

    track.addEventListener('mousedown', (e) => {
        isDown = true;
        track.style.cursor = 'grabbing';
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
        cancelAnimationFrame(animationId); // Pause auto-scroll during drag
    });

    track.addEventListener('mouseup', () => {
        isDown = false;
        track.style.cursor = 'grab';
        autoScroll(); // Resume auto-scroll
    });

    track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast multiplier
        track.scrollLeft = scrollLeft - walk;
    });
}

// ========================================
// NOSOTROS PARALLAX EFFECT
// ========================================

function setupNosotrosParallax() {
    // Only run if on Nosotros page and GSAP is loaded
    if (!document.querySelector('.nosotros-page') || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Register ScrollTrigger if not already done globally
    gsap.registerPlugin(ScrollTrigger);

    // Select paragraphs and headings we want to animate
    const textElements = document.querySelectorAll(
        '.nosotros-header-text p, .nosotros-header-text h1, .nosotros-header-text h2, ' +
        '.nosotros-about-text p, .nosotros-about-text h2'
    );

    textElements.forEach((el, index) => {
        // Simple parallax: move up and fade in as it scrolls into view
        gsap.fromTo(el,
            {
                y: 40,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                delay: index * 0.1, // Stagger slightly if multiple are on screen
                ease: "power2.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%", // Starts animation when the top of the element hits 85% of the viewport height
                    toggleActions: "play none none reverse" // Animates in when scrolling down, out when scrolling up
                }
            }
        );
    });
}

// ACCORDIONS LOGIC (Generic)
// ========================================

function setupAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            const isActive = item.classList.contains('active');

            // Close all other items (optional, but cleaner)
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.accordion-content').style.maxHeight = null;
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                content.style.maxHeight = null;
            } else {
                item.classList.add('active');
                // Use scrollHeight for a smooth transition
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
}

// ========================================
// NOSOTROS VIDEO SCROLL-TO-SCALE
// ========================================

function setupNosotrosVideoScrollScale() {
    // Only run if on Nosotros page and GSAP is loaded
    const section = document.querySelector('.nosotros-video-parallax-sec');
    const video = document.querySelector('.parallax-video-container video');

    if (!section || !video || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.to(video, {
        scale: 1,
        ease: "none",
        scrollTrigger: {
            trigger: section,
            start: "top bottom", // Starts when section top hits viewport bottom
            end: "bottom bottom", // Ends when section bottom hits viewport bottom
            scrub: true, // Smoothly link animation to scroll
        }
    });
}

// ========================================
// HOME FINAL VIDEO SCROLL-TO-FULLWIDTH
// ========================================

function setupHomeFinalVideoScroll() {
    const section = document.querySelector('.home-video-parallax-sec');
    const container = document.querySelector('.home-video-container');

    if (!section || !container || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.to(container, {
        width: "100%",
        height: "100vh",
        borderRadius: "0px",
        ease: "none",
        scrollTrigger: {
            trigger: section,
            start: "top center", // Animation starts when the top of the section hits the center of the viewport
            end: "center center", // Animation ends when the center of the section hits the center of the viewport
            scrub: 1, // Smooth scrubbing, takes 1 second to catch up
        }
    });
}

// ========================================
// SERVICIOS PAGE REVEAL
// ========================================

function setupServiciosReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const stageItems = document.querySelectorAll('.stage-item');
    if (stageItems.length === 0) return;

    stageItems.forEach((item, index) => {
        gsap.from(item, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: item,
                start: "top 90%",
                toggleActions: "play none none none"
            }
        });
    });
}

// ========================================
// SERVICIOS DIAGONAL HERO ANIMATION
// ========================================

function setupServiciosHeroAnimation() {
    if (typeof gsap === 'undefined') return;

    const hero = document.getElementById('servicios-hero-diagonal');
    if (!hero) return;

    const item1 = hero.querySelector('.item-1');
    const item2 = hero.querySelector('.item-2');
    const item3 = hero.querySelector('.item-3');
    const content = hero.querySelector('.servicios-hero-content-diagonal');

    // Set initial states
    gsap.set(item1, { x: "-100%" });
    gsap.set(item2, { y: "-100%" });
    gsap.set(item3, { x: "-100%" }); // User specifically asked for left entry for the 3rd one too
    gsap.set(content, { opacity: 0, scale: 0.8 });

    // Timeline for coordinated entry
    const tl = gsap.timeline({ defaults: { duration: 1.2, ease: "power4.out" } });

    tl.to(item1, { x: "0%", delay: 0.5 })
        .to(item2, { y: "0%" }, "-=0.8")
        .to(item3, { x: "0%" }, "-=0.8")
        .to(content, { opacity: 1, scale: 1, duration: 1 }, "-=0.5");
}

// ========================================
// SERVICIOS GRID REVEAL
// ========================================

function setupServiciosGridReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const gridItems = document.querySelectorAll('.service-grid-card');
    if (gridItems.length === 0) return;

    gsap.from(gridItems, {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".services-grid",
            start: "top 85%",
            toggleActions: "play none none none"
        }
    });

    // Toggle Expansion on Click
    gridItems.forEach(card => {
        card.addEventListener('click', () => {
            // Optional: Close other cards when one is opened
            gridItems.forEach(otherCard => {
                if (otherCard !== card) {
                    otherCard.classList.remove('expanded');
                }
            });
            
            card.classList.toggle('expanded');
        });
    });
}

// ========================================
// SERVICIOS PROCESS TIMELINE
// ========================================

function setupServiciosTimeline() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const timelineContainer = document.querySelector('.proceso-timeline-container');
    if (!timelineContainer) return;

    const progressLine = document.querySelector('.line-progress');
    const steps = document.querySelectorAll('.timeline-step');

    // Animate the vertical progress line
    gsap.to(progressLine, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
            trigger: timelineContainer,
            start: 'top 30%',
            end: 'bottom 80%',
            scrub: true
        }
    });

    // Animate each step and its dot
    steps.forEach((step, index) => {
        ScrollTrigger.create({
            trigger: step,
            start: 'top 75%',
            onEnter: () => {
                step.classList.add('visible');
                step.classList.add('active');
            },
            onLeaveBack: () => {
                step.classList.remove('active');
            }
        });
    });
}
// ========================================
// LANGUAGE SWITCHER (i18n)
// ========================================

function setupLanguageSwitcher() {
    const langBtns = document.querySelectorAll('.lang-btn');
    const currentLang = localStorage.getItem('preferredLang') || 'es';

    // Apply initial language
    setLanguage(currentLang);

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
            localStorage.setItem('preferredLang', lang);
        });
    });
}

function setLanguage(lang) {
    if (!window.translations || !window.translations[lang]) return;

    const t = window.translations[lang];

    // Update buttons state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerHTML = t[key];
        }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.setAttribute('placeholder', t[key]);
        }
    });

    // Set HTML lang attribute
    document.documentElement.lang = lang;
    
    // Refresh ScrollTrigger as content size might change slightly
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}

// ========================================
// CONTACT FORM SUBMISSION & GOOGLE ADS CONVERSION
// ========================================

function setupContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('.contact-submit-btn');
        const emailInput = form.querySelector('#email');
        const phoneInput = form.querySelector('#phone');

        if (!emailInput || !phoneInput) return;

        // Extract and normalize values
        const emailVal = emailInput.value.trim().toLowerCase();
        const rawPhone = phoneInput.value;
        const normalizedPhone = normalizePhone(rawPhone);

        // Add loading state to button
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        // Simulate contact form submission / network request (1.5 seconds)
        // Since barmoredsecurity.com is a client-side single page app without dynamic backend,
        // we simulate a premium AJAX submission and perform the conversion inside the success callback.
        simulateFormSubmission()
            .then(() => {
                // SOLO cuando el envío sea EXITOSO, ejecuta el código de Google Ads:
                
                // 1. Conversiones avanzadas: pasa los datos del formulario (gtag los encripta solo)
                if (typeof gtag === 'function') {
                    gtag('set', 'user_data', {
                        email: emailVal,
                        phone_number: normalizedPhone
                    });

                    // 2. Dispara la conversión
                    gtag('event', 'conversion', {
                        'send_to': 'AW-18074395482/JmGYCPbmtrAcENrGxapD'
                    });
                    console.log('Google Ads conversion tracking fired successfully with user data.');
                } else {
                    console.warn('gtag is not defined. Google Ads conversion tracking skipped.');
                }

                // Show success feedback
                const isEn = document.documentElement.lang === 'en';
                const successTitle = isEn ? 'Message Sent' : 'Mensaje Enviado';
                const successDesc = isEn 
                    ? 'Thank you! A security advisor will contact you shortly.' 
                    : '¡Gracias! Un asesor experto en seguridad se comunicará contigo a la brevedad.';

                showSuccessToast(successTitle, successDesc);

                // Reset the form
                form.reset();
            })
            .catch((error) => {
                console.error('Form submission failed:', error);
            })
            .finally(() => {
                // Restore button state
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
            });
    });
}

function simulateFormSubmission() {
    return new Promise((resolve) => {
        setTimeout(resolve, 1500);
    });
}

function normalizePhone(phone) {
    // Trim and keep only numbers and + sign
    let cleaned = phone.trim().replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    
    // Remove any remaining non-digit characters
    cleaned = cleaned.replace(/\D/g, '');
    
    // Mexican number without area code: 10 digits
    if (cleaned.length === 15 || cleaned.length === 10) {
        // Handle 10-digit local Mexican numbers
        return '+52' + (cleaned.length === 10 ? cleaned : cleaned.slice(-10));
    }
    
    // Mexican number with country code 52 prefix, but no +
    if (cleaned.startsWith('52') && cleaned.length === 12) {
        return '+' + cleaned;
    }
    
    // If it's already got some other length, just prepend +52 if it doesn't start with it
    if (cleaned.length > 10) {
        if (cleaned.startsWith('52')) {
            return '+' + cleaned;
        } else {
            return '+' + cleaned; // assume it has its own country code
        }
    }
    
    // Fallback: prepend +52
    return '+52' + cleaned;
}

function showSuccessToast(title, description) {
    // Remove any existing toast first
    const existingToast = document.querySelector('.armored-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast elements
    const toast = document.createElement('div');
    toast.className = 'armored-toast';
    
    // SVG Checkmark Icon
    toast.innerHTML = `
        <div class="armored-toast-icon">
            <svg viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
        </div>
        <div class="armored-toast-content">
            <span class="armored-toast-title">${title}</span>
            <span class="armored-toast-desc">${description}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Trigger reflow to ensure transition runs
    toast.offsetHeight;

    // Show toast
    toast.classList.add('show');

    // Hide and remove toast after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for slide-out transition to finish before removal
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}

// ========================================
// CLICK CONVERSIONS (WHATSAPP & PHONE LINKS)
// ========================================

function setupClickConversions() {
    // 1. WhatsApp Button Clicks
    // Select the floating WhatsApp button and any links pointing to wa.me or api.whatsapp.com
    const whatsappLinks = document.querySelectorAll('.whatsapp-float, a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    whatsappLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Check if link is opening in the same tab or if we need a callback (for bulletproof safety)
            const isTabNew = this.getAttribute('target') === '_blank' || e.ctrlKey || e.shiftKey || e.metaKey || e.button === 1;
            
            if (typeof gtag === 'function') {
                if (isTabNew) {
                    // Opens in new tab, just fire the event normally
                    gtag('event', 'conversion', {
                        'send_to': 'AW-18074395482/W5EyCMH20LAcENrGxapD'
                    });
                    console.log('WhatsApp new tab click conversion tracked.');
                } else {
                    // Opens in same tab, prevent default and use callback to ensure hit is sent
                    e.preventDefault();
                    const targetUrl = this.href;
                    gtag('event', 'conversion', {
                        'send_to': 'AW-18074395482/W5EyCMH20LAcENrGxapD',
                        'event_callback': function() {
                            window.location.href = targetUrl;
                        }
                    });
                    // Fallback timeout in case event_callback is blocked/slow
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 500);
                    console.log('WhatsApp same tab click conversion tracked with callback.');
                }
            }
        });
    });

    // 2. Phone Link Clicks (a href^="tel:")
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (typeof gtag === 'function') {
                gtag('event', 'conversion', {
                    'send_to': 'AW-18074395482/WrXqCLT40LAcENrGxapD'
                });
                console.log('Phone link click conversion tracked: ' + this.href);
            }
        });
    });
}


