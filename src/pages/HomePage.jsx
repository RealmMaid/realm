import React from 'react';

// --- Real Dependencies ---
import { useCart } from '../contexts/CartContext.jsx';

/**
 * --- STYLES FOR THE HOMEPAGE FACELIFT ---
 */
const HomePageStyles = () => (
    <style>{`
        @keyframes dynamic-neon-glow {
            0%, 100% { text-shadow: 0 0 4px #fff, 0 0 8px #fff, 0 0 12px #ff33a1, 0 0 16px #ff33a1, 0 0 20px #ff33a1; }
            50% { text-shadow: 0 0 6px #fff, 0 0 12px #fff, 0 0 18px #c433ff, 0 0 24px #c433ff, 0 0 30px #c433ff; }
        }

        .hero-section-facelift {
            padding-top: 12vh;
            padding-bottom: 5vh;
            display: flex;
            justify-content: center;
            width: 100%;
        }
        .hero-content { text-align: center; max-width: 900px; }

        .title-glow {
            font-size: 3.2rem;
            animation: dynamic-neon-glow 4s ease-in-out infinite alternate;
        }

        .text-glow { text-shadow: 0 0 12px rgba(255, 182, 193, 0.7); }

        .products-section-facelift {
            padding-top: 5vh;
        }
        .products-section-facelift .section-title {
            margin-bottom: 2rem;
            text-align: center; /* --- ADDED: Ensures the text is centered --- */
        }

        .placeholder-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            padding: 0 2rem;
        }
        .placeholder-card {
            background-color: rgba(50, 13, 66, 0.4);
            border: 1px solid #4a1566;
            border-radius: 12px;
            aspect-ratio: 4 / 5;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            color: rgba(255, 255, 255, 0.2);
            font-family: 'Press Start 2P', monospace;
            font-size: 1.5rem;
        }
        .placeholder-card:hover {
            transform: translateY(-10px) scale(1.05);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 20px #c433ff;
        }

        @media (max-width: 992px) {
            .placeholder-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
            .title-glow { font-size: 2.3rem; }
            .placeholder-grid { grid-template-columns: 1fr; }
        }
    `}</style>
);


/**
 * The main HomePage component with all requested updates.
 */
function HomePage() {
    // This component is now focused purely on display.
    // Product fetching logic can be added back here when ready.
    
    return (
        <div className="homepage-container">
            <HomePageStyles />
            
            <section id="hero" className="hero-section hero-section-facelift">
                <div className="hero-content">
                    <h1 className="text-gradient title-glow">Welcome to Realm Maid</h1>
                    <p className="text-glow">
                        Your one-stop shop for all things fabulous and
                        realm-enhancing! Explore our sparkly services and make
                        your adventures extra cute! UwU
                    </p>
                </div>
            </section>

            <section id="services-section" className="products-section products-section-facelift">
                <h2 className="section-title text-glow">Our Full Catalog of Shinies! ✨</h2>
                
                <div className="placeholder-grid">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="placeholder-card">
                            <span>?</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default HomePage;