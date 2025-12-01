document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('whiteboard');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('color-picker');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const brushSize = document.getElementById('brush-size');
    const brushSizeValue = document.getElementById('brush-size-value');
    const menuToggle = document.getElementById('menu-toggle');
    const floatingMenu = document.getElementById('floating-menu');
    const clearBtn = document.getElementById('clear');
    const fullscreenBtn = document.getElementById('fullscreen');
    const penBtn = document.getElementById('pen');
    const eraserBtn = document.getElementById('eraser');
    const rectangleBtn = document.getElementById('rectangle');
    const circleBtn = document.getElementById('circle');
    const lineBtn = document.getElementById('line');
    const textBtn = document.getElementById('text');
    const shapesMenu = document.getElementById('shapes-menu');
    const shapesSubmenu = document.getElementById('shapes-submenu');
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    const saveBtn = document.getElementById('save');
    const loadBtn = document.getElementById('load');
    const fileInput = document.getElementById('file-input');
    const textInput = document.getElementById('text-input');
    const colorDropdown = document.getElementById('color-dropdown');
    const currentColorBtn = document.getElementById('current-color-btn');
    const colorDropdownMenu = document.getElementById('color-dropdown-menu');
    
    // Debug: Check if all elements are found
    console.log('Element check:', {
        canvas: !!canvas,
        bgColorPicker: !!bgColorPicker,
        colorPicker: !!colorPicker,
        menuToggle: !!menuToggle,
        shapesMenu: !!shapesMenu,
        shapesSubmenu: !!shapesSubmenu
    });
    
    // Set initial active tool and state
    let currentTool = 'pen';
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = colorPicker ? colorPicker.value : '#000000';
    let currentSize = brushSize ? parseInt(brushSize.value) : 3;
    let currentBgColor = bgColorPicker ? bgColorPicker.value : '#ffffff';
    
    // History management
    let history = [];
    let historyStep = -1;
    const maxHistorySteps = 50;
    
    // Shape drawing variables
    let startX, startY;
    let isShapeMode = false;
    let previewCanvas, previewCtx;
    
    // Text tool variables
    let textX, textY;
    let isTextMode = false;
    
    
    // Redraw canvas with current transformation
    function redrawCanvas() {
        // Clear the entire canvas
        resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformation and redraw background
        applyTransform();
        
        // Set background with transformed coordinates
        const bgX = -translateX / scale;
        const bgY = -translateY / scale;
        const bgWidth = canvas.width / scale;
        const bgHeight = canvas.height / scale;
        
        ctx.fillStyle = currentBgColor;
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        // Redraw all content from history if available
        if (history.length > 0 && historyStep >= 0) {
            const img = new Image();
            img.onload = function() {
                resetTransform();
                ctx.drawImage(img, 0, 0);
                applyTransform();
            };
            img.src = history[historyStep];
        }
    }
    
    // Initialize the infinite canvas
    function initializeInfiniteCanvas() {
        // Set initial transformation
        applyTransform();
        console.log('Infinite canvas initialized');
    }
    function createPreviewCanvas() {
        previewCanvas = document.createElement('canvas');
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        previewCanvas.style.position = 'absolute';
        previewCanvas.style.top = '0';
        previewCanvas.style.left = '0';
        previewCanvas.style.pointerEvents = 'none';
        previewCanvas.style.zIndex = '999';
        previewCtx = previewCanvas.getContext('2d');
        canvas.parentNode.appendChild(previewCanvas);
    }
    
    // History management functions
    function saveState() {
        historyStep++;
        if (historyStep < history.length) {
            history.length = historyStep;
        }
        history.push(canvas.toDataURL());
        if (history.length > maxHistorySteps) {
            history.shift();
            historyStep--;
        }
        updateUndoRedoButtons();
    }
    
    function undo() {
        if (historyStep > 0) {
            historyStep--;
            restoreState(history[historyStep]);
            updateUndoRedoButtons();
        }
    }
    
    function redo() {
        if (historyStep < history.length - 1) {
            historyStep++;
            restoreState(history[historyStep]);
            updateUndoRedoButtons();
        }
    }
    
    function restoreState(state) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = state;
    }
    
    function updateUndoRedoButtons() {
        undoBtn.disabled = historyStep <= 0;
        redoBtn.disabled = historyStep >= history.length - 1;
        
        if (undoBtn.disabled) {
            undoBtn.style.opacity = '0.5';
        } else {
            undoBtn.style.opacity = '1';
        }
        
        if (redoBtn.disabled) {
            redoBtn.style.opacity = '0.5';
        } else {
            redoBtn.style.opacity = '1';
        }
    }

    // Initialize canvas size first
    function initializeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // FORCE SET initial background color
        console.log('FORCING initial background color:', currentBgColor);
        ctx.fillStyle = currentBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Ensure background color picker shows the correct initial value
        if (bgColorPicker) {
            bgColorPicker.value = currentBgColor;
            console.log('Set background color picker to:', currentBgColor);
        }
        
        // Save initial state
        saveState();
        console.log('Canvas initialized successfully with background:', currentBgColor);
    }
    
    // Call initialization
    initializeCanvas();
    createPreviewCanvas();
    
    // FORCE background color again after 1 second to ensure it works
    setTimeout(() => {
        console.log('FORCING background color after delay...');
        ctx.fillStyle = currentBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('Background forced successfully');
    }, 1000);
    
    penBtn.classList.add('active');

    // Resize canvas function
    function resizeCanvas() {
        // Get the current drawing (if any)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Resize the canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Set background color first
        ctx.fillStyle = currentBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restore the drawing if it fits in the new size
        if (imageData.width <= canvas.width && imageData.height <= canvas.height) {
            ctx.putImageData(imageData, 0, 0);
        }
        
        // Resize preview canvas if it exists
        if (previewCanvas) {
            previewCanvas.width = canvas.width;
            previewCanvas.height = canvas.height;
        }
        
        // Save initial state after proper setup
        if (historyStep === -1) {
            saveState();
        }
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    createPreviewCanvas();

    // Drawing state (variables moved to the top)

    // Tool functions - SIMPLIFIED
    function startDrawing(e) {
        const [x, y] = getCoordinates(e);
        
        if (currentTool === 'text') {
            handleTextTool(x, y);
            return;
        }
        
        isDrawing = true;
        [lastX, lastY] = [x, y];
        [startX, startY] = [x, y];
        
        if (['rectangle', 'circle', 'line'].includes(currentTool)) {
            isShapeMode = true;
        }
    }

    function draw(e) {
        if (!isDrawing) return;
        
        const [x, y] = getCoordinates(e);
        
        if (isShapeMode) {
            // Clear preview canvas and draw shape preview
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            previewCtx.strokeStyle = currentColor;
            previewCtx.lineWidth = currentSize / scale; // Adjust line width for zoom
            previewCtx.lineCap = 'round';
            previewCtx.lineJoin = 'round';
            
            drawShape(previewCtx, startX, startY, x, y, currentTool);
            return;
        }
        
        // Regular drawing (pen/eraser)
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        
        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = (currentSize * 2) / scale; // Adjust for zoom
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentSize / scale; // Adjust for zoom
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        [lastX, lastY] = [x, y];
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        
        if (isShapeMode) {
            const [x, y] = getCoordinates(e);
            
            // Draw final shape on main canvas
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            drawShape(ctx, startX, startY, x, y, currentTool);
            
            // Clear preview
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            isShapeMode = false;
            
            // Save state for undo/redo
            saveState();
        } else if (currentTool === 'pen' || currentTool === 'eraser') {
            // Save state for pen/eraser
            saveState();
        }
        
        isDrawing = false;
    }
    
    function drawShape(context, x1, y1, x2, y2, shape) {
        context.beginPath();
        
        switch(shape) {
            case 'rectangle':
                context.rect(x1, y1, x2 - x1, y2 - y1);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                context.arc(x1, y1, radius, 0, 2 * Math.PI);
                break;
            case 'line':
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                break;
        }
        
        context.stroke();
    }
    
    function handleTextTool(x, y) {
        textX = x;
        textY = y;
        textInput.style.position = 'absolute';
        textInput.style.left = x + 'px';
        textInput.style.top = y + 'px';
        textInput.style.opacity = '1';
        textInput.style.pointerEvents = 'auto';
        textInput.style.zIndex = '1002';
        textInput.style.fontSize = currentSize * 2 + 'px';
        textInput.style.color = currentColor;
        textInput.style.border = '2px solid ' + currentColor;
        textInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        textInput.style.padding = '4px';
        textInput.style.borderRadius = '4px';
        textInput.focus();
        isTextMode = true;
    }
    
    function finishTextInput() {
        if (!isTextMode || !textInput.value.trim()) {
            hideTextInput();
            return;
        }
        
        ctx.font = (currentSize * 2) + 'px Arial, sans-serif';
        ctx.fillStyle = currentColor;
        ctx.textBaseline = 'top';
        ctx.fillText(textInput.value, textX, textY);
        
        saveState();
        hideTextInput();
    }
    
    function hideTextInput() {
        textInput.style.opacity = '0';
        textInput.style.pointerEvents = 'none';
        textInput.style.zIndex = '-1';
        textInput.value = '';
        isTextMode = false;
    }

    function getCoordinates(e) {
        let x, y;
        if (e.touches) {
            const rect = canvas.getBoundingClientRect();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }
        return [x, y];
    }

    // Event Listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Basic mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    
    // Touch support - BASIC VERSION THAT WORKS
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            startDrawing(e.touches[0]);
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            draw(e.touches[0]);
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopDrawing(e);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-container') && !e.target.matches('.menu-btn')) {
            floatingMenu.classList.remove('visible');
        }
    });

    // Menu toggle
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        floatingMenu.classList.toggle('visible');
    });

    // Update brush size
    brushSize.addEventListener('input', (e) => {
        currentSize = parseInt(e.target.value);
        brushSizeValue.textContent = currentSize;
    });

    // Set initial brush size display
    brushSizeValue.textContent = currentSize;

    // Tool selection
    function setActiveTool(tool) {
        currentTool = tool;
        
        // Remove active class from all tool buttons
        [penBtn, eraserBtn, rectangleBtn, circleBtn, lineBtn, textBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // Remove active from shapes menu
        shapesMenu.classList.remove('active');
        
        // Add active class to current tool
        const toolButtons = {
            'pen': penBtn,
            'eraser': eraserBtn,
            'rectangle': rectangleBtn,
            'circle': circleBtn,
            'line': lineBtn,
            'text': textBtn
        };
        
        if (toolButtons[tool]) {
            toolButtons[tool].classList.add('active');
            
            // If it's a shape tool, also highlight the shapes menu
            if (['rectangle', 'circle', 'line'].includes(tool)) {
                shapesMenu.classList.add('active');
            }
        }
        
        // Update cursor
        if (tool === 'text') {
            canvas.style.cursor = 'text';
        } else if (tool === 'pan') {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'crosshair';
        }
        
        // Hide text input if switching away from text tool
        if (tool !== 'text' && isTextMode) {
            hideTextInput();
        }
        
        // Close menu after selection
        floatingMenu.classList.remove('visible');
        shapesSubmenu.classList.remove('visible');
    }

    penBtn.addEventListener('click', () => setActiveTool('pen'));
    eraserBtn.addEventListener('click', () => setActiveTool('eraser'));
    rectangleBtn.addEventListener('click', () => setActiveTool('rectangle'));
    circleBtn.addEventListener('click', () => setActiveTool('circle'));
    lineBtn.addEventListener('click', () => setActiveTool('line'));
    textBtn.addEventListener('click', () => setActiveTool('text'));
    
    // FIXED Shape submenu handling - with proper positioning
    shapesMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = shapesSubmenu.classList.contains('visible');
        
        console.log('Shapes menu clicked, currently visible:', isVisible);
        
        // Close all other dropdowns first
        document.querySelectorAll('.submenu.visible').forEach(menu => {
            menu.classList.remove('visible');
        });
        
        // Remove active state from all submenu triggers
        document.querySelectorAll('.submenu-trigger').forEach(trigger => {
            trigger.classList.remove('active');
        });
        
        // Toggle this dropdown
        if (!isVisible) {
            // Position the submenu next to the shapes button
            const rect = shapesMenu.getBoundingClientRect();
            shapesSubmenu.style.top = rect.top + 'px';
            shapesSubmenu.style.left = (rect.left - 200) + 'px'; // Position to the left
            
            shapesSubmenu.classList.add('visible');
            shapesMenu.classList.add('active');
            console.log('Shapes dropdown opened at position:', rect);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.submenu-container')) {
            shapesSubmenu.classList.remove('visible');
            shapesMenu.classList.remove('active');
            console.log('Shapes dropdown closed');
        }
    });
    
    // Undo/Redo
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    
    // Save/Load functionality
    saveBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'whiteboard_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
        link.href = canvas.toDataURL();
        link.click();
    });
    
    loadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = currentBgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Scale image to fit canvas while maintaining aspect ratio
                    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    const x = (canvas.width - scaledWidth) / 2;
                    const y = (canvas.height - scaledHeight) / 2;
                    
                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                    saveState();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Text input handling
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishTextInput();
        } else if (e.key === 'Escape') {
            hideTextInput();
        }
    });
    
    textInput.addEventListener('blur', finishTextInput);

    colorPicker.addEventListener('input', (e) => {
        changeColor(e.target.value, 'picker');
    });
    
    // Quick color button handlers
    const quickColorButtons = document.querySelectorAll('.quick-color-btn');
    
    // Unified color change function
    function changeColor(newColor, source) {
        console.log(`Color change from ${source}:`, newColor);
        currentColor = newColor;
        colorPicker.value = newColor;
        
        // Update all color button states
        updateAllColorButtons();
        
        // Switch to pen if selecting color
        if (currentTool !== 'pen') {
            setActiveTool('pen');
        }
    }
    
    function updateAllColorButtons() {
        // Update menu quick color buttons
        quickColorButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === currentColor) {
                btn.classList.add('active');
            }
        });
        
        // Update current color button display
        if (currentColorBtn) {
            currentColorBtn.style.backgroundColor = currentColor;
        }
        
        console.log('Updated all color buttons for:', currentColor);
    }
    
    function updateActiveColorButton() {
        updateAllColorButtons();
    }
    
    quickColorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            changeColor(btn.dataset.color, 'menu');
            floatingMenu.classList.remove('visible');
        });
    });
    
    // Initialize active color button
    updateAllColorButtons();
    
    // Color dropdown handlers
    if (currentColorBtn) {
        currentColorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            colorDropdown.classList.toggle('open');
        });
    }
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.color-dropdown')) {
            colorDropdown.classList.remove('open');
        }
    });
    
    // Dropdown color selection
    const dropdownColorButtons = document.querySelectorAll('.dropdown-color-btn');
    dropdownColorButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Dropdown color clicked:', btn.dataset.color);
            changeColor(btn.dataset.color, 'dropdown');
            colorDropdown.classList.remove('open');
        });
    });
    
    // Canvas color palette handlers
    const canvasColorButtons = document.querySelectorAll('.canvas-color-btn');
    
    // Remove canvas palette functionality as it's not in HTML
    console.log('Canvas color buttons found:', canvasColorButtons.length);
    
    function updateActiveColorButton() {
        // Update menu quick color buttons
        quickColorButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === currentColor) {
                btn.classList.add('active');
            }
        });
        
        // Update current color button display
        if (currentColorBtn) {
            currentColorBtn.style.backgroundColor = currentColor;
        }
        
        console.log('Updated active color buttons for color:', currentColor);
    }
    
    quickColorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            changeColor(btn.dataset.color, 'menu');
            floatingMenu.classList.remove('visible');
        });
    });
    
    // Initialize active color button
    updateActiveColorButton();

    brushSize.addEventListener('input', (e) => {
        currentSize = parseInt(e.target.value);
        brushSizeValue.textContent = currentSize;
    });

    // Clear canvas
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            ctx.fillStyle = currentBgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            saveState();
        }
    });
    
    // Background color change - COMPLETELY REWRITTEN
    function setBackgroundColor(color) {
        console.log('SETTING BACKGROUND COLOR TO:', color);
        currentBgColor = color;
        
        // Update the picker
        if (bgColorPicker) {
            bgColorPicker.value = color;
        }
        
        // Create a temporary canvas to store current drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy current canvas to temp (this includes background + drawings)
        tempCtx.drawImage(canvas, 0, 0);
        
        // Get only the drawing data by using composite operation
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Clear main canvas completely
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set new background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // DON'T restore old drawing - start fresh with new background
        
        console.log('BACKGROUND SUCCESSFULLY CHANGED TO:', color);
        saveState();
    }

    // Background color picker event listeners - FIXED
    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            console.log('BG COLOR INPUT EVENT:', e.target.value);
            setBackgroundColor(e.target.value);
        });
        
        bgColorPicker.addEventListener('change', (e) => {
            console.log('BG COLOR CHANGE EVENT:', e.target.value);
            setBackgroundColor(e.target.value);
        });
        
        // Force immediate background set on click
        bgColorPicker.addEventListener('click', () => {
            console.log('BG COLOR CLICKED');
            setTimeout(() => {
                if (bgColorPicker.value !== currentBgColor) {
                    setBackgroundColor(bgColorPicker.value);
                }
            }, 100);
        });
        
        console.log('Background color picker listeners added successfully');
    } else {
        console.error('CRITICAL ERROR: Background color picker not found!');
    }
    
    // Set initial background
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    // Prevent scrolling on touch devices
    document.addEventListener('touchmove', (e) => {
        if (e.target === canvas || e.target === previewCanvas) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (isTextMode) return; // Don't interfere with text input
        
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
                case 's':
                    e.preventDefault();
                    saveBtn.click();
                    break;
                case 'o':
                    e.preventDefault();
                    loadBtn.click();
                    break;
            }
        }
        
        // Tool shortcuts
        switch(e.key) {
            case 'p':
                setActiveTool('pen');
                break;
            case 'e':
                setActiveTool('eraser');
                break;
            case 'r':
                setActiveTool('rectangle');
                break;
            case 'c':
                setActiveTool('circle');
                break;
            case 'l':
                setActiveTool('line');
                break;
            case 't':
                setActiveTool('text');
                break;
            case 'Escape':
                if (isTextMode) {
                    hideTextInput();
                }
                floatingMenu.classList.remove('visible');
                break;
        }
    });
    
    // Initialize the app
    setActiveTool('pen');
    updateUndoRedoButtons();
});
