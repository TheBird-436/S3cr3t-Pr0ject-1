// ── Clock ──
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
setInterval(updateClock, 1000);
updateClock();

// ── Window Manager (Focus, Close, Minimize, Maximize) ──
function focusWindow(id) {
    document.querySelectorAll('.window').forEach(w => w.style.zIndex = 10);
    document.querySelectorAll('.taskbar-app').forEach(app => app.classList.remove('active'));
    const win = document.getElementById(id);
    const taskbarApp = document.getElementById(`taskbar-${id}`);
    if (win && !win.classList.contains('minimized')) {
        win.style.zIndex = 100;
        if (taskbarApp) taskbarApp.classList.add('active');
    }
}

function closeWindow(id) {
    const win = document.getElementById(id);
    const taskbarApp = document.getElementById(`taskbar-${id}`);
    if (win) win.remove();
    if (taskbarApp) taskbarApp.remove();
}

function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) win.classList.add('minimized');
    focusWindow(null);
}

function toggleMaximize(id) {
    const win = document.getElementById(id);
    if (win) win.classList.toggle('maximized');
    focusWindow(id);
}

function handleTaskbarClick(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.classList.contains('minimized')) {
        win.classList.remove('minimized');
        focusWindow(id);
    } else if (win.style.zIndex === '100') {
        minimizeWindow(id);
    } else {
        focusWindow(id);
    }
}

// ── Window Dragging & Resizing ──
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.title-bar');
    if (header) header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (element.classList.contains('maximized') || e.target.closest('.window-controls')) return;
        e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        focusWindow(element.id);
        element.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
    }
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
        pos3 = e.clientX; pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
    }
    function closeDragElement() {
        document.onmouseup = null; document.onmousemove = null;
        element.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '');
    }
}

function makeResizable(element) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    element.appendChild(handle);
    let startX, startY, startW, startH;

    handle.addEventListener('mousedown', (e) => {
        if (element.classList.contains('maximized')) return;
        e.preventDefault(); e.stopPropagation();
        startX = e.clientX; startY = e.clientY;
        startW = element.offsetWidth; startH = element.offsetHeight;
        focusWindow(element.id);
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);
        element.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
    });
    function onResize(e) {
        element.style.width = Math.max(260, startW + (e.clientX - startX)) + 'px';
        element.style.height = Math.max(180, startH + (e.clientY - startY)) + 'px';
    }
    function stopResize() {
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
        element.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '');
    }
}

// ── Desktop Icons Logic ──
function makeIconDraggable(icon) {
    let isDragging = false, startX, startY, initialLeft, initialTop;

    icon.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('icon-text') && e.target.contentEditable === "true") return;
        isDragging = false;
        startX = e.clientX; startY = e.clientY;
        initialLeft = icon.offsetLeft; initialTop = icon.offsetTop;

        function onMouseMove(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                isDragging = true;
                icon.classList.add('dragging');
                icon.style.left = `${initialLeft + dx}px`;
                icon.style.top = `${initialTop + dy}px`;
            }
        }
        function onMouseUp() {
            icon.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function makeIconRenamable(icon) {
    const textEl = icon.querySelector('.icon-text');
    
    textEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        textEl.contentEditable = "true";
        textEl.focus();
        const range = document.createRange();
        range.selectNodeContents(textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });

    textEl.addEventListener('blur', () => {
        textEl.contentEditable = "false";
        if (textEl.textContent.trim() === '') textEl.textContent = "New App";
    });

    textEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            textEl.blur();
        }
    });
}

function pinToDesktop(appId, iconEmoji, defaultName, posX = 20, posY = 20) {
    if (document.getElementById(`icon-${appId}`)) return;

    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.id = `icon-${appId}`;
    icon.style.top = `${posY + (document.querySelectorAll('.desktop-icon').length * 90)}px`;
    icon.style.left = `${posX}px`;
    
    icon.innerHTML = `
        <div class="icon-img">${iconEmoji}</div>
        <div class="icon-text">${defaultName}</div>
    `;
    
    icon.ondblclick = () => openApp(appId);
    makeIconDraggable(icon);
    makeIconRenamable(icon);
    document.getElementById('desktop').appendChild(icon);
    document.getElementById('start-menu').classList.remove('active');
}

// ── Settings Tab Switcher ──
window.switchSettingsTab = function(tabElement, panelId) {
    const sidebar = tabElement.parentElement;
    if (sidebar) {
        sidebar.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    }
    tabElement.classList.add('active');
    document.querySelectorAll('.settings-panel').forEach(p => p.style.display = 'none');
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) targetPanel.style.display = 'block';
}

// ── Open Apps ──
function openApp(appName) {
    const startMenu = document.getElementById('start-menu');
    if (startMenu) startMenu.classList.remove('active');
    
    const existing = document.getElementById(`${appName}-window`);
    if (existing) {
        if (existing.classList.contains('minimized')) existing.classList.remove('minimized');
        focusWindow(`${appName}-window`);
        return;
    }

    if (appName === 'spacefarer') {
        const appUrl = 'https://thebird-436.github.io/spacefarer/'; 
        createWindow('spacefarer-window', 'Spacefarer', '🪐', appUrl, { width: 1024, height: 700 }, true);
    } 
    else if (appName === 'settings') {
        const settingsHTML = `
            <div style="display: flex; height: 100%; width: 100%; position: absolute; inset: 0; background: rgba(15, 20, 35, 0.4);">
                <div class="settings-sidebar" style="padding: 20px;">
                    <div class="settings-tab active" onclick="switchSettingsTab(this, 'tab-system')">System</div>
                    <div class="settings-tab" onclick="switchSettingsTab(this, 'tab-personal')">Personalization</div>
                    <div class="settings-tab" onclick="switchSettingsTab(this, 'tab-about')">About Phiumis</div>
                </div>
                <div class="settings-content" style="padding: 20px; overflow-y: auto;">
                    <div id="tab-system" class="settings-panel">
                        <h2>System Settings</h2>
                        <div class="settings-row"><span>OS Name</span><strong style="color: white;">Phiumis v0.2 (Alpha)</strong></div>
                        <div class="settings-row"><span>Hardware</span><strong style="color: white;">Ailphium Core</strong></div>
                        <div class="settings-row"><span>Developer</span><strong style="color: white;">Jefe @ Ailphium</strong></div>
                    </div>
                    <div id="tab-personal" class="settings-panel" style="display: none;">
                        <h2>Personalization</h2>
                        <div class="settings-row"><span>Theme</span><span style="color: #c77dff;">Dark Space (Default)</span></div>
                        <div class="settings-row"><span>Wallpaper</span><strong style="color: white;">Nebula Gradient</strong></div>
                        <div class="settings-row"><span>Taskbar</span><strong style="color: white;">Transparent Glass</strong></div>
                    </div>
                    <div id="tab-about" class="settings-panel" style="display: none;">
                        <h2>About Phiumis</h2>
                        <p style="line-height: 1.6; margin-bottom: 15px; color: #cbd5e1;">Phiumis is a next-generation Web OS built from scratch by Ailphium for Innovation Month.</p>
                        <div class="settings-row"><span>Version</span><strong style="color: white;">0.2.0</strong></div>
                        <div class="settings-row"><span>Build</span><strong style="color: white;">2026.11</strong></div>
                    </div>
                </div>
            </div>
        `;
        createWindow('settings-window', 'Settings', '⚙️', settingsHTML, { width: 650, height: 450 }, false);
    }
    else if (appName === 'phonk') {
        const phonkHTML = `
            <div class="phonk-container" style="padding: 15px; position: relative; height: 100%; display: flex; flex-direction: column;">
                <canvas id="phonk-visualizer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.3; z-index: 0;"></canvas>
                <div style="z-index: 10; flex-shrink: 0;">
                    <div class="phonk-disc" id="phonk-disc" style="margin: 10px auto;"></div>
                    <div class="phonk-pulser" id="phonk-pulser"></div>
                    <div class="phonk-title" id="phonk-title" style="margin-top: 15px;">TRACK 1</div>
                    <div class="phonk-sub" id="phonk-sub">PHONK PLAYLIST</div>
                    <div class="phonk-controls" style="margin-top: 15px; margin-bottom: 15px;">
                        <button class="phonk-btn" onclick="prevPhonk()">⏮</button>
                        <button class="phonk-btn play-btn" id="phonk-play-btn" onclick="togglePhonk()">▶</button>
                        <button class="phonk-btn" onclick="nextPhonk()">⏭</button>
                    </div>
                    <!-- THE UPLOAD BUTTON -->
                    <div style="margin-bottom: 15px;">
                        <label style="background: rgba(199, 125, 255, 0.1); border: 1px solid rgba(199, 125, 255, 0.3); color: #c77dff; padding: 8px 15px; border-radius: 8px; font-size: 0.8rem; font-family: 'Orbitron', sans-serif; cursor: pointer; display: inline-block; transition: all 0.2s;">
                            📂 Load Local MP3
                            <input type="file" id="phonk-file-input" accept="audio/*" style="display: none;">
                        </label>
                    </div>
                </div>
                <div id="phonk-playlist-ui" style="z-index: 10; flex: 1; overflow-y: auto; width: 100%; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;"></div>
                <audio id="phonk-audio" crossorigin="anonymous" src=""></audio>
            </div>
        `;
        createWindow('phonk-window', 'Phonk Player', '🎧', phonkHTML, { width: 380, height: 650 }, false);
        setTimeout(initPhonkPlayer, 100);
    }
}

// ── Window Creation Engine ──
function createWindow(id, title, icon, content, opts = {}, isIframe = false) {
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 48 - 40;
    const width = Math.min(opts.width || 480, maxW);
    const height = Math.min(opts.height || 360, maxH);
    const left = Math.max(10, Math.round((window.innerWidth - width) / 2));
    const top = Math.max(10, Math.round((window.innerHeight - 48 - height) / 2));

    const win = document.createElement('div');
    win.className = 'window';
    win.id = id;
    win.style.top = top + 'px';
    win.style.left = left + 'px';
    win.style.width = width + 'px';
    win.style.height = height + 'px';

    const bodyContent = isIframe 
        ? `<div class="window-content no-padding"><iframe src="${content}" allow="autoplay; fullscreen"></iframe></div>`
        : `<div class="window-content" style="padding:0; position: relative; overflow: hidden;">${content}</div>`;

    win.innerHTML = `
        <div class="title-bar">
            <span class="title-text">${title}</span>
            <div class="window-controls">
                <button class="win-btn min-btn" onclick="minimizeWindow('${id}')">—</button>
                <button class="win-btn max-btn" onclick="toggleMaximize('${id}')">□</button>
                <button class="win-btn close-btn" onclick="closeWindow('${id}')">×</button>
            </div>
        </div>
        ${bodyContent}
    `;

    document.getElementById('desktop').appendChild(win);
    makeDraggable(win);
    makeResizable(win);

    const taskbarApp = document.createElement('div');
    taskbarApp.className = 'taskbar-app';
    taskbarApp.id = `taskbar-${id}`;
    taskbarApp.innerHTML = `<span class="icon">${icon}</span> <span>${title}</span>`;
    taskbarApp.onclick = () => handleTaskbarClick(id);
    document.getElementById('open-apps').appendChild(taskbarApp);

    focusWindow(id);
}

// ── Start Menu Logic ──
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');
if (startBtn && startMenu) {
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && e.target !== startBtn) startMenu.classList.remove('active');
    });
}

// ── PHONK PLAYER ENGINE ──
let phonkPlaylist = [
    { 
        title: "METAMORPHOSIS", 
        artist: "INTERWORLD", 
        src: "music/track1.mp3",
        fallback: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=phonk-drift-112194.mp3"
    },
    { 
        title: "FEELS FUNK", 
        artist: "KIYOTAKA", 
        src: "music/track2.mp3",
        fallback: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    { 
        title: "NEON BLADE", 
        artist: "MOONDEITY", 
        src: "music/track3.mp3",
        fallback: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    }
];

let currentTrackIndex = 0;
let audioCtx, analyser, source;
let isVisualizerRunning = false;
let isAudioConnected = false;

function initPhonkPlayer() {
    renderPlaylist();
    loadTrack(0);

    // 🚀 The Uploader Logic
    const fileInput = document.getElementById('phonk-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const fileURL = URL.createObjectURL(file);
            const audio = document.getElementById('phonk-audio');
            const titleEl = document.getElementById('phonk-title');
            const subEl = document.getElementById('phonk-sub');
            const btn = document.getElementById('phonk-play-btn');
            const disc = document.getElementById('phonk-disc');

            if (audio) {
                audio.src = fileURL;
                titleEl.textContent = file.name.replace('.mp3', '').toUpperCase();
                subEl.textContent = "LOCAL FILE";
                
                audio.play().then(() => {
                    btn.textContent = "⏸";
                    disc.classList.add('playing');
                    startVisualizer();
                }).catch(err => console.log("Playback error:", err));
            }
        });
    }
}

function renderPlaylist() {
    const playlistUI = document.getElementById('phonk-playlist-ui');
    if (!playlistUI) return;
    
    playlistUI.innerHTML = ""; 
    
    phonkPlaylist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'phonk-track-item';
        item.id = `phonk-track-${index}`;
        
        item.innerHTML = `
            <div class="phonk-track-num">0${index + 1}</div>
            <div class="phonk-track-info">
                <div class="phonk-track-name">${track.title}</div>
                <div class="phonk-track-artist">${track.artist}</div>
            </div>
        `;
        
        item.onclick = () => {
            loadTrack(index);
            togglePhonk();
        };
        
        playlistUI.appendChild(item);
    });
}

function loadTrack(index) {
    const audio = document.getElementById('phonk-audio');
    const titleEl = document.getElementById('phonk-title');
    const subEl = document.getElementById('phonk-sub');
    const btn = document.getElementById('phonk-play-btn');
    const disc = document.getElementById('phonk-disc');

    if (!audio) return;

    if (index >= phonkPlaylist.length) index = 0;
    if (index < 0) index = phonkPlaylist.length - 1;

    currentTrackIndex = index;
    const track = phonkPlaylist[currentTrackIndex];

    audio.src = track.src;
    
    // If local file fails, play fallback
    audio.onerror = () => {
        if (audio.src !== track.fallback) {
            audio.src = track.fallback;
        }
    };

    titleEl.textContent = track.title;
    subEl.textContent = track.artist;
    
    if (btn) btn.textContent = "▶";
    if (disc) disc.classList.remove('playing');
    
    document.querySelectorAll('.phonk-track-item').forEach(el => el.classList.remove('active'));
    const activeTrack = document.getElementById(`phonk-track-${index}`);
    if (activeTrack) {
        activeTrack.classList.add('active');
        activeTrack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function togglePhonk() {
    const audio = document.getElementById('phonk-audio');
    const btn = document.getElementById('phonk-play-btn');
    const disc = document.getElementById('phonk-disc');
    
    if (!audio || !audio.src) return;

    if (audio.paused) {
        audio.play().then(() => {
            btn.textContent = "⏸";
            disc.classList.add('playing');
            startVisualizer();
        }).catch(e => {
            console.warn("Local file missing or failed. Playing fallback...");
            const fallbackUrl = phonkPlaylist[currentTrackIndex].fallback;
            if (audio.src !== fallbackUrl) {
                audio.src = fallbackUrl;
                audio.play().then(() => {
                    btn.textContent = "⏸";
                    disc.classList.add('playing');
                    startVisualizer();
                }).catch(err => console.error("Fallback also failed:", err));
            }
        });
    } else {
        audio.pause();
        btn.textContent = "▶";
        disc.classList.remove('playing');
    }
}

function nextPhonk() {
    loadTrack(currentTrackIndex + 1);
    togglePhonk();
}

function prevPhonk() {
    loadTrack(currentTrackIndex - 1);
    togglePhonk();
}

function startVisualizer() {
    if (isVisualizerRunning) return;
    
    if (window.location.protocol === 'file:') {
        console.log("Local file detected. Visualizer disabled to allow audio playback.");
        return; 
    }

    const audio = document.getElementById('phonk-audio');
    const canvas = document.getElementById('phonk-visualizer');
    if (!audio || !canvas) return;

    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            if (!isAudioConnected) {
                source = audioCtx.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                isAudioConnected = true;
            }
            analyser.fftSize = 64;
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (error) {
        console.warn("Visualizer blocked, but audio still playing.");
        return; 
    }

    isVisualizerRunning = true;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!isVisualizerRunning) return;
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            ctx.fillStyle = `rgba(199, 125, 255, ${barHeight / 255})`;
            ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 2;
        }
    }
    draw();
}

// ── BOOT UP PHIUMIS ──
window.addEventListener('DOMContentLoaded', () => {
    pinToDesktop('spacefarer', '🪐', 'Spacefarer', 20, 20);
    pinToDesktop('phonk', '🎧', 'Phonk Player', 20, 110);

    setTimeout(() => {
        if (!document.getElementById('mystery-window')) {
            const unknownHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 15px;">
                    <div style="font-size: 4rem; filter: drop-shadow(0 0 20px rgba(108, 99, 255, 0.5));">👾</div>
                    <h2 style="font-family: 'Orbitron', sans-serif; color: #c7d2fe; letter-spacing: 2px;">SYSTEM ANOMALY</h2>
                    <p style="color: #64748b; font-size: 0.9rem; max-width: 300px;">Warning: Unregistered executable found. Proceed with caution.</p>
                    <button style="margin-top: 10px; padding: 8px 16px; background: rgba(108, 99, 255, 0.2); border: 1px solid rgba(108, 99, 255, 0.4); color: white; border-radius: 6px; cursor: pointer; font-family: 'Orbitron', sans-serif;" onclick="closeWindow('mystery-window')">Terminate</button>
                </div>
            `;
            createWindow('mystery-window', 'Unknown_Entity.sys', '👾', unknownHTML, { width: 400, height: 300 });
        }
    }, 1000);

    const audio = document.getElementById('phonk-audio');
    if (audio) audio.addEventListener('ended', nextPhonk);
});