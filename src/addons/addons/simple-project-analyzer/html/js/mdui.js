/**
 * MDUI JavaScript Framework - Minimal Local Copy
 * This is a minimal local copy of MDUI JavaScript for offline functionality
 */

// MDUI Global Object
window.mdui = {
    // Drawer functionality
    drawer: {
        open: function(drawerId) {
            const drawer = document.getElementById(drawerId);
            if (drawer) {
                drawer.classList.add('mdui-drawer-open');
            }
        },
        close: function(drawerId) {
            const drawer = document.getElementById(drawerId);
            if (drawer) {
                drawer.classList.remove('mdui-drawer-open');
            }
        }
    },

    // Ripple effect
    ripple: {
        init: function() {
            document.addEventListener('click', function(e) {
                const rippleElements = document.querySelectorAll('.mdui-ripple');
                rippleElements.forEach(function(element) {
                    if (element.contains(e.target)) {
                        const ripple = document.createElement('span');
                        ripple.classList.add('mdui-ripple-effect');
                        element.appendChild(ripple);
                        
                        setTimeout(() => {
                            ripple.remove();
                        }, 600);
                    }
                });
            });
        }
    },

    // Initialize MDUI components
    init: function() {
        this.ripple.init();
        
        // Initialize drawer toggles
        const drawerToggles = document.querySelectorAll('[mdui-drawer]');
        drawerToggles.forEach(function(toggle) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('mdui-drawer').replace('{target: \'', '').replace('\'}', '');
                const drawer = document.getElementById(targetId);
                if (drawer) {
                    if (drawer.classList.contains('mdui-drawer-open')) {
                        mdui.drawer.close(targetId);
                    } else {
                        mdui.drawer.open(targetId);
                    }
                }
            });
        });
    }
};

// Initialize MDUI when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    mdui.init();
});

// Add ripple effect styles
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    .mdui-ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyles);