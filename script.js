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
    state.ctx = state.canvas.getContext('2d');
    state.preloader = document.getElementById('preloader');
    state.progressFill = document.getElementById('progressFill');
    state.loadingPercentage = document.getElementById('loadingPercentage');

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Start preloading images
    preloadImages();
    // Start visual loading sequence
    runPreloaderSequence();

    // Setup Mobile Menu
    setupMobileMenu();
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
        gsap.to(state.preloader, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => {
                state.preloader.style.display = 'none';
            }
        });
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

    // --- Dynamic Header Styling ---
    ScrollTrigger.create({
        trigger: "#black-section",
        start: "top 100px", // When black section is near the top (header area)
        onEnter: () => document.body.classList.add("scrolled-header"),
        onLeaveBack: () => document.body.classList.remove("scrolled-header"),
        // Ensure it stays if we scroll past the black section (unless we want something else later)
    });

    // --- Staggered Text Entrance (Requested Animation) ---
    // Animates Title and Paragraph upwards with a delay
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
    })

    // Video Zoom Effect - added here to ensure ScrollTrigger is ready
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
