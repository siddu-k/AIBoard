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
    
    // Set initial active tool and state
    let currentTool = 'pen';
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = colorPicker.value;
    let currentSize = parseInt(brushSize.value);
    let currentBgColor = bgColorPicker.value;
    
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
    
    
    // Create preview canvas for shapes
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

    // Set initial background color
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    penBtn.classList.add('active');

    // Resize canvas function
    function resizeCanvas() {
        // Get the current drawing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Resize the canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Redraw with current background color
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
        
        // Save initial state
        saveState();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    createPreviewCanvas();

    // Drawing state (variables moved to the top)

    // Tool functions
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
            previewCtx.lineWidth = currentSize;
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
            ctx.lineWidth = currentSize * 2;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentSize;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
        
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
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e.touches[0]);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e.touches[0]);
    });
    
    canvas.addEventListener('touchend', stopDrawing);

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
    
    // Submenu handling
    shapesMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        shapesSubmenu.classList.toggle('visible');
    });
    
    // Close submenu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.submenu-container')) {
            shapesSubmenu.classList.remove('visible');
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
        currentColor = e.target.value;
        updateActiveColorButton();
    });
    
    // Quick color button handlers
    const quickColorButtons = document.querySelectorAll('.quick-color-btn');
    
    function updateActiveColorButton() {
        quickColorButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === currentColor) {
                btn.classList.add('active');
            }
        });
    }
    
    quickColorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentColor = btn.dataset.color;
            colorPicker.value = currentColor;
            updateActiveColorButton();
            
            // Close menu after color selection
            floatingMenu.classList.remove('visible');
        });
    });
    
    // Initialize active color button
    updateActiveColorButton();
    
    function updateActiveColorButton() {
        quickColorButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === currentColor) {
                btn.classList.add('active');
            }
        });
    }
    
    quickColorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentColor = btn.dataset.color;
            colorPicker.value = currentColor;
            updateActiveColorButton();
            
            // Close menu after color selection
            floatingMenu.classList.remove('visible');
        });
    });
    
    // Initialize active color button
    updateActiveColorButton();

    brushSize.addEventListener('input', (e) => {
        currentSize = e.target.value;
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
    
    // Background color change
    function setBackgroundColor(color) {
        currentBgColor = color;
        bgColorPicker.value = color;
        
        // Create a temporary canvas to store the current drawing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Create a new ImageData with the new background color
        const newImageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Parse the background color
        const tempDiv = document.createElement('div');
        tempDiv.style.color = color;
        document.body.appendChild(tempDiv);
        const rgbColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);
        
        // Extract RGB values
        const rgb = rgbColor.match(/\d+/g);
        const bgR = parseInt(rgb[0]);
        const bgG = parseInt(rgb[1]);
        const bgB = parseInt(rgb[2]);
        
        // Process each pixel
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            // If pixel is transparent or matches old background, use new background
            if (a === 0 || (r === 255 && g === 255 && b === 255)) {
                newImageData.data[i] = bgR;
                newImageData.data[i + 1] = bgG;
                newImageData.data[i + 2] = bgB;
                newImageData.data[i + 3] = 255;
            } else {
                // Keep the original pixel
                newImageData.data[i] = r;
                newImageData.data[i + 1] = g;
                newImageData.data[i + 2] = b;
                newImageData.data[i + 3] = a;
            }
        }
        
        // Clear canvas and draw new image data
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(newImageData, 0, 0);
        
        saveState();
    }

    bgColorPicker.addEventListener('input', (e) => {
        setBackgroundColor(e.target.value);
    });
    
    // Set initial background
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
