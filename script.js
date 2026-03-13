// ========================================
// IMAGE SEQUENCE SCROLL - HERO SECTION
// ========================================

// Configuration
const CONFIG = {
    totalFrames: 80,  // Frames 001-080
    imagePath: './parallax3/ezgif-frame-',
    imageExtension: '.jpg',
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

function init() {
    // Get DOM elements
    state.canvas = document.getElementById('heroCanvas');
    if (state.canvas) {
        state.ctx = state.canvas.getContext('2d');
    }
    state.preloader = document.getElementById('preloader');
    state.progressFill = document.getElementById('progressFill');
    state.loadingPercentage = document.getElementById('loadingPercentage');

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // If there is no canvas, skip preloading images to avoid loading 80+ frames unnecessarily
    if (state.canvas) {
        // Start preloading images
        preloadImages();
    } else {
        // Just run standard preloader and mark images as ready
        state.imagesReady = true;
    }

    // Start visual loading sequence
    runPreloaderSequence();

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
    const step = isMobile ? 3 : 1; // Load every 3rd frame on mobile (approx 27 images) vs 80 on desktop

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
                    console.error(`Failed to load: ${imagePath}`);
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
            console.error('Error loading images:', error);
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

    // Extra: If #hero-blindaje does not exist on this page, skip sequential animation
    if (!document.getElementById('hero-blindaje')) {
        setupCommonScrollAnimations();
        return;
    }

    // Initial Setup: Hide all hotspots
    gsap.set('.hotspot', { opacity: 0, scale: 0.5 });
    gsap.set('.hotspot-callout', { opacity: 0, visibility: 'hidden' });

    // Determine scroll distance (duration of animation)
    const scrollDistance = window.innerHeight * 4; // 400vh equivalent

    // --- Main Timeline with Pinning ---
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#hero-blindaje', // Target the section directly
            start: 'top top',
            end: '+=100%', // Final reduction to 100% to eliminate ALL dead space
            scrub: 0.5, // Smooth scrubbing
            pin: true, // Enable pinning

            // Header Color Toggling (scrolled-header = White Pill/Text, Default = Black Text)
            onEnter: () => document.body.classList.remove('scrolled-header'), // Enter White Canvas -> Remove White Pill
            onLeave: () => document.body.classList.add('scrolled-header'),    // Leave Canvas -> Add White Pill (for Black Section)
            onEnterBack: () => document.body.classList.remove('scrolled-header'), // Return to White Canvas -> Remove White Pill
            onLeaveBack: () => document.body.classList.add('scrolled-header'),    // Return to Video Hero -> Add White Pill

            onUpdate: (self) => {
                // RENDER FRAME UPDATES
                const frameIndex = Math.round(state.currentFrame);
                renderFrame(frameIndex);
            }
        }
    });

    // Initialize Header State for Video Hero
    document.body.classList.add('scrolled-header');

    tl.addLabel("start"); // Label for the beginning

    // Intro Elements stay visible on mobile as per user request
    // --- Intro Elements Entrance Animation ---
    gsap.from(['.intro-logo', '.intro-badge'], {
        y: 80,
        opacity: 0,
        duration: 1.5,
        stagger: 0.3,
        ease: "power3.out", // More elegant ease
        scrollTrigger: {
            trigger: "#hero-blindaje",
            start: "top 70%", // Start before it hits the top
            toggleActions: "play none none reverse"
        }
    });

    // --- STEP 1: Animate to Frame 14 (Glass Hotspot) ---
    tl.to(state, {
        currentFrame: 14,
        ease: 'none',
        duration: 2
    });

    // SHOW Glass Hotspot
    tl.to('#hotspot-cristales', { opacity: 1, scale: 1, duration: 0.5 });
    tl.to('#hotspot-cristales .hotspot-callout', { opacity: 1, visibility: 'visible', duration: 0.5 }, '<');




    tl.addLabel("point1"); // Snap Point 1: Glass

    // PAUSE (Empty spacer)
    tl.to({}, { duration: 2 });

    // HIDE Glass Hotspot
    tl.to('#hotspot-cristales .hotspot-callout', { opacity: 0, visibility: 'hidden', duration: 0.3 });
    tl.to('#hotspot-cristales', { opacity: 0, scale: 0.5, duration: 0.3 }, '<');


    // --- STEP 2: Animate to Frame 45 (Door Hotspot - Guessing mid-rotation) ---
    // -------------------------------------------------------------------------
    tl.to(state, {
        currentFrame: 45,
        ease: 'none',
        duration: 3
    });

    // FADE OUT Intro Overlay (Delayed to approx Frame 28)
    tl.to(['.intro-logo', '.intro-badge', '.intro-badge span'], {
        opacity: 0,
        x: 50, // Move slightly right as requested ("desaparecen a la derecha")
        duration: 0.5,
        ease: "power2.in"
    }, "<+1"); // Delay 1s into the movement


    // SHOW Door Hotspot
    tl.to('#hotspot-puertas', { opacity: 1, scale: 1, duration: 0.5 });
    tl.to('#hotspot-puertas .hotspot-callout', { opacity: 1, visibility: 'visible', duration: 0.5 }, '<');



    tl.addLabel("point2"); // Snap Point 2: Doors

    // PAUSE
    tl.to({}, { duration: 2 });

    // HIDE Door Hotspot
    tl.to('#hotspot-puertas .hotspot-callout', { opacity: 0, visibility: 'hidden', duration: 0.3 });
    tl.to('#hotspot-puertas', { opacity: 0, scale: 0.5, duration: 0.3 }, '<');


    // --- STEP 3: Animate to Frame 79 (Tire Hotspot - Side View) ---
    // -------------------------------------------------------------
    tl.to(state, {
        currentFrame: 79,
        ease: 'none',
        duration: 3
    });

    // SHOW Tire Hotspot
    tl.to('#hotspot-suspension', { opacity: 1, scale: 1, duration: 0.5 });
    tl.to('#hotspot-suspension .hotspot-callout', { opacity: 1, visibility: 'visible', duration: 0.5 }, '<');



    tl.addLabel("point3"); // Snap Point 3: Suspension (Tires)

    // PAUSE REMOVED to eliminate white space gap
    // tl.to({}, { duration: 2 });

    // Lead out (just in case we want to scroll past cleanly)

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
            heroVideo.src = 'video-hero-movil/video-hero-mobile.mp4?v=4'; // New cache bust
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
