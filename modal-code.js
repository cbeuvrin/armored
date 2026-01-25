
// ========================================
// MODAL SYSTEM
// ========================================

// Armor content data
const armorContent = {
    cristales: {
        title: 'Cristales Blindados Nivel 5 Plus',
        description: 'Nuestros cristales blindados de nivel 5 plus ofrecen protección contra armas de alto calibre. Fabricados con múltiples capas de vidrio laminado y policarbonato, proporcionan resistencia balística certificada manteniendo una excelente visibilidad.',
        image: './assets/cristales.jpg'
    },
    puertas: {
        title: 'Blindaje Opaco Acero Balístico',
        description: 'Las puertas están reforzadas con placas de acero balístico de alta resistencia Este blindaje opaco protege contra múltiples impactos de armas de fuego, incluyendo rifles de asalto, sin comprometer la integridad estructural del vehículo.',
        image: './assets/puertas.jpg'
    },
    suspension: {
        title: 'Sistema de Suspensión Reforzada y Run-Flat',
        description: 'Sistema de suspensión especialmente diseñado para soportar el peso adicional del blindaje. Incluye neumáticos run-flat que permiten continuar conduciendo hasta 80km después de una perforación, garantizando la evacuación segura.',
        image: './assets/suspension.jpg'
    }
};

function setupModalSystem() {
    const modal = document.getElementById('armorModal');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalImage = document.getElementById('modalImage');

    // Get all hotspots
    const hotspots = document.querySelectorAll('.hotspot');

    // Add click handlers to hotspots
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', (e) => {
            const modalType = hotspot.getAttribute('data-modal');
            const content = armorContent[modalType];

            if (content) {
                // Set modal content
                modalTitle.textContent = content.title;
                modalDescription.textContent = content.description;
                modalImage.src = content.image;
                modalImage.alt = content.title;

                // Show modal
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close modal handlers
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
