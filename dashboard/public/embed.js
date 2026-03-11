(function () {
    const script = document.currentScript;
    const botId = script.dataset.botId;

    if (!botId) {
        console.error('TangentCloud AI Bots: data-bot-id attribute is missing from script tag.');
        return;
    }

    const scriptUrl = new URL(script.src);
    const host = scriptUrl.origin;

    const styles = `
        @keyframes tangentcloud-bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-10px);}
            60% {transform: translateY(-5px);}
        }
        @keyframes tangentcloud-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .tangentcloud-launcher {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 64px;
            height: 64px;
            background-color: #2563EB;
            border-radius: 22px;
            cursor: pointer;
            box-shadow: 0 12px 24px -6px rgba(37, 99, 235, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .tangentcloud-launcher:hover {
            transform: scale(1.08) translateY(-4px);
            box-shadow: 0 16px 32px -8px rgba(37, 99, 235, 0.5);
        }
        .tangentcloud-launcher:active {
            transform: scale(0.92);
        }
        .tangentcloud-launcher svg {
            width: 32px;
            height: 32px;
            color: white;
            transition: transform 0.4s ease;
        }
        .tangentcloud-bubble {
            position: fixed;
            bottom: 34px;
            right: 100px;
            background: white;
            padding: 12px 20px;
            border-radius: 18px 18px 2px 18px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #1F2937;
            z-index: 999998;
            max-width: 240px;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.5s ease;
            border: 1px solid rgba(0,0,0,0.05);
            pointer-events: none;
        }
        .tangentcloud-bubble.show {
            opacity: 1;
            transform: translateY(0);
        }
        .tangentcloud-iframe-container {
            position: fixed;
            bottom: 104px;
            right: 24px;
            width: 420px;
            height: 680px;
            max-height: calc(100vh - 140px);
            background: white;
            border-radius: 32px;
            box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.25);
            z-index: 999999;
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.08);
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 0;
            transform: translateY(40px) scale(0.92);
            pointer-events: none;
            transform-origin: bottom right;
        }
        .tangentcloud-iframe-container.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        .tangentcloud-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        @media (max-width: 480px) {
            .tangentcloud-iframe-container {
                width: 100%;
                height: 100%;
                bottom: 0;
                right: 0;
                max-height: 100%;
                border-radius: 0;
                transform: translateY(100%);
                border: none;
            }
            .tangentcloud-iframe-container.open {
                transform: translateY(0);
            }
            .tangentcloud-launcher {
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 18px;
            }
            .tangentcloud-bubble {
                display: none;
            }
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Create Launcher
    const launcher = document.createElement('div');
    launcher.className = 'tangentcloud-launcher';
    launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    document.body.appendChild(launcher);

    // Create Bubble
    const bubble = document.createElement('div');
    bubble.className = 'tangentcloud-bubble';
    document.body.appendChild(bubble);

    // Create Container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'tangentcloud-iframe-container';
    const iframe = document.createElement('iframe');
    iframe.className = 'tangentcloud-iframe';
    iframe.src = `${host}/chat/${botId}`;
    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);

    // Fetch config
    const apiHost = host.includes('9101') ? host.replace('9101', '9100') : host;
    fetch(`${apiHost}/api/v1/dashboard/public/${botId}`)
        .then(res => res.json())
        .then(bot => {
            if (bot.primary_color) {
                launcher.style.backgroundColor = bot.primary_color;
                launcher.style.boxShadow = `0 12px 24px -6px ${bot.primary_color}50`;
            }
            if (bot.bubble_greeting) {
                bubble.innerText = bot.bubble_greeting;
                setTimeout(() => bubble.classList.add('show'), 2000);
            }
        }).catch(() => { });

    let isOpen = false;
    function toggleChat(force) {
        isOpen = typeof force === 'boolean' ? force : !isOpen;
        if (isOpen) {
            iframeContainer.classList.add('open');
            bubble.classList.remove('show');
            launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            launcher.querySelector('svg').style.transform = 'rotate(90deg)';
        } else {
            iframeContainer.classList.remove('open');
            launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        }
    }

    launcher.addEventListener('click', () => toggleChat());
    globalThis.addEventListener('message', (e) => {
        if (e.data === 'tangentcloud-close') toggleChat(false);
    });
})();
