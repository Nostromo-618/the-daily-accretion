document.addEventListener("DOMContentLoaded", () => {
    // 1. Create and inject spinner loader if not present
    let loader = document.getElementById("spa-loader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "spa-loader";
        loader.className = "vd-preloader";
        // Create inner spinner
        const spinner = document.createElement("div");
        spinner.className = "vd-spinner-circular";
        loader.appendChild(spinner);
        document.body.appendChild(loader);
    }

    // Add CSS for loader and transitions
    const style = document.createElement("style");
    style.textContent = `
        #spa-loader {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: var(--vd-bg-primary);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        #spa-loader.active {
            opacity: 1;
            pointer-events: all;
        }
        .vd-spinner-circular {
            width: 40px; height: 40px;
            border: 3px solid var(--vd-border-color);
            border-top-color: var(--vd-color-primary);
            border-radius: 50%;
            animation: vd-spin 1s linear infinite;
        }
        @keyframes vd-spin { 
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); } 
        }
        
        #main-content {
            transition: opacity 0.3s ease;
        }
        #main-content.loading {
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);

    const mainContent = document.getElementById("main-content");

    // Convert static relative URLs to absolute so they don't break after pushState
    document.querySelectorAll("head link, head script, .vd-navbar a, .vd-navbar img").forEach(el => {
        if (el.hasAttribute("href") && !el.getAttribute("href").startsWith("http")) el.setAttribute("href", el.href);
        if (el.hasAttribute("src") && !el.getAttribute("src").startsWith("http")) el.setAttribute("src", el.src);
    });

    const navigateTo = async (url, pushToHistory = true) => {
        loader.classList.add("active");
        if (mainContent) mainContent.classList.add("loading");

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Page not found");
            const text = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");

            const newMain = doc.getElementById("main-content");
            if (newMain && mainContent) {
                // Change URL FIRST so relative links in injected content resolve correctly
                if (pushToHistory) {
                    window.history.pushState({ url }, doc.title, url);
                }

                document.title = doc.title;
                mainContent.innerHTML = newMain.innerHTML;

                // Update active state in navbar
                document.querySelectorAll('.vd-nav-link').forEach(link => {
                    link.classList.remove('active', 'vd-active');
                    if (link.href === url) {
                        link.classList.add('active');
                    }
                });

                // Re-initialize Vanduo components
                if (window.Vanduo) {
                    window.Vanduo.init();
                }

                // Scroll to top or hash
                const hash = new URL(url, window.location.origin).hash;
                if (hash) {
                    const target = document.querySelector(hash);
                    if (target) {
                        // Account for navbar
                        const navHeight = document.querySelector('.vd-navbar').offsetHeight || 0;
                        window.scrollTo({
                            top: target.offsetTop - navHeight,
                            behavior: 'smooth'
                        });
                    }
                } else {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }
            } else {
                // Fallback: full page load
                window.location.href = url;
            }
        } catch (e) {
            console.error("SPA Navigation error:", e);
            window.location.href = url;
        } finally {
            loader.classList.remove("active");
            if (mainContent) mainContent.classList.remove("loading");
        }
    };

    document.addEventListener("click", e => {
        const link = e.target.closest("a");
        if (!link) return;

        const href = link.getAttribute("href");
        if (!href) return; // Not a real link

        // Exclude external links and special links
        const target = link.getAttribute("target");
        if (target === "_blank") return;

        const url = new URL(link.href);
        if (url.origin !== window.location.origin) return;

        // Allow default behavior for hash links on the same page
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
            return;
        }

        // Only handle HTML routes
        if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html') && url.pathname !== '') {
            return;
        }

        e.preventDefault();
        navigateTo(link.href);
    });

    window.addEventListener("popstate", e => {
        if (e.state && e.state.url) {
            navigateTo(e.state.url, false);
        } else {
            navigateTo(window.location.href, false);
        }
    });

    // Initialize state for current page
    window.history.replaceState({ url: window.location.href }, document.title, window.location.href);
});
