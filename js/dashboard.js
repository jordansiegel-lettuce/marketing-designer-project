


let activeDrop = null;
const DEBUG_DND = false;
const logDND = (...a) => DEBUG_DND && console.log('[DND]', ...a);


document.addEventListener('dragover', e => e.preventDefault(), { passive: false });
document.addEventListener('drop',     e => e.preventDefault(), { passive: false });

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  document.getElementById('userName').textContent = currentUser?.username || "Guest";

  const bannerBtn = document.getElementById('bannerEditorBtn');
  const landingBtn = document.getElementById('landingEditorBtn');
  const marketingBtn = document.getElementById('marketingEditorBtn');

  if (bannerBtn)  bannerBtn.addEventListener('click', loadBannerEditor);
  if (landingBtn) landingBtn.addEventListener('click', loadLandingEditor);
  if (marketingBtn) marketingBtn.addEventListener('click', loadMarketingEditor);
});

// -------- Auth / Save / Load --------
function Logout() {
  localStorage.removeItem('currentUser');
  window.location.href = "index.html";
}

function saveHistory() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: "Guest" };
  const workspace = document.getElementById('bannerWorkspace');
  if (!workspace) return alert("No banner editor content found to save!");

  const rawName = prompt("Enter project name", "My project");
  // If user clicked Cancel, do nothing
  if (rawName === null) {
    // optional: alert("Save canceled.");
    return;
  }
  const projectName = rawName.trim();
  if (!projectName) {
    alert("Project name can't be empty. Save canceled.");
    return;
  }

  const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');

  const projectData = {
    id: Date.now() + '-' + Math.floor(Math.random() * 1000),
    user: currentUser.username,
    name: projectName,
    content: workspace.innerHTML,
    timestamp: new Date().toLocaleString()
  };

  savedProjects.push(projectData);
  localStorage.setItem('savedProjects', JSON.stringify(savedProjects));
  alert(`Project "${projectName}" saved to localStorage!`);
}

function loadProject() {
  const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
  if (savedProjects.length === 0) return alert("No saved projects found!");

  let message = "Choose a project to load:\n\n";
  savedProjects.forEach((project, index) => {
    message += `${index + 1}. ${project.name} (Saved on: ${project.timestamp})\n`;
  });

  const rawChoice = prompt(message, "1");
  if (rawChoice === null) return; // user canceled

  const choice = parseInt(rawChoice, 10) - 1;
  if (isNaN(choice) || choice < 0 || choice >= savedProjects.length) {
    alert("Invalid selection.");
    return;
  }

  const mainView = document.getElementById('mainView');
  mainView.innerHTML = `
    <div class="editor-toolbar">
      <h2>${savedProjects[choice].name}</h2>
      <p>Select an editor to get started.</p>
    </div>
    <div id="bannerWorkspace" class="workspace">
      ${savedProjects[choice].content}
    </div>
  `;

  // …(rebind your buttons + make things draggable as you already do)…
  alert(`Loaded project: ${savedProjects[choice].name}`);
}


// -------- Banner Editor --------
function loadBannerEditor() {
  activeDrop = 'banner';
  const toolbar = document.querySelector('.editor-toolbar');
  if (!toolbar) return;

  toolbar.innerHTML = `
    <h2>Banner Editor</h2>
    <div class="banner-toolbar">
      <div class="banner-shape" draggable="true" data-size="250x250">250x250 Banner</div>
      <div class="banner-shape" draggable="true" data-size="300x600">300x600 Banner</div>
    </div>
    <div class="banner-edit-panel" style="display:none; margin-top:10px;">
      <label>Text:</label>
      <input type="text" id="bannerTextInput" />
      <label>Background:</label>
      <input type="color" id="bannerBgColorInput" />
      <label>Text Color:</label>
      <input type="color" id="bannerTextColorInput" />
      <label>Font Size:</label>
      <input type="number" id="bannerFontSizeInput" min="8" max="48" value="12" />
      <label>Font Style:</label>
      <select id="bannerFontStyleSelect">
        <option value="normal">Normal</option>
        <option value="bold">Bold</option>
        <option value="italic">Italic</option>
      </select>
      <label>Border Style:</label>
      <select id="bannerBorderSelect">
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="double">Double</option>
      </select>
      <button id="deleteBannerBtn">Delete Banner</button>
    </div>
  `;
  setupBannerDragDrop();
}

function setupBannerDragDrop() {
  const bannerShapes = document.querySelectorAll('.banner-shape');
  const workspace = document.getElementById('bannerWorkspace');
  if (!workspace) return;

  bannerShapes.forEach(shape => {
    shape.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('bannerType', 'new');
      e.dataTransfer.setData('bannerSize', shape.dataset.size);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  const allow = (e) => {
    if (activeDrop !== 'banner') return;
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  workspace.ondragenter = allow;
  workspace.ondragover  = allow;
  workspace.ondrop = (e) => {
    if (activeDrop !== 'banner') return;
    e.preventDefault(); e.stopPropagation();
    const bannerSize = e.dataTransfer.getData('bannerSize');
    if (bannerSize) {
      createBannerElement(bannerSize, workspace);
      saveWorkspaceToStorage();
    }
  };
}

function createBannerElement(size, workspace) {
  const banner = document.createElement('div');
  banner.classList.add('banner');
  banner.style.position = 'absolute';
  banner.style.left = '50px';
  banner.style.top  = '50px';
  banner.style.cursor = 'grab';
  banner.style.userSelect = 'none';
  banner.style.fontSize = '12px';
  banner.style.borderStyle = 'solid';
  banner.style.fontStyle = 'normal';
  banner.style.fontWeight = 'normal';

  const content = document.createElement('div');
  content.className = 'banner-content';
  content.textContent = size + ' Banner';
  content.contentEditable = 'true';
  content.style.outline = 'none';
  content.style.pointerEvents = 'auto';

  if (size === '250x250') {
    banner.style.width = '250px';
    banner.style.height = '250px';
  } else if (size === '300x600') {
    banner.style.width = '300px';
    banner.style.height = '600px';
  }

  banner.appendChild(content);
  workspace.appendChild(banner);
  attachCommonChrome(banner);           // ✖ + handle on the container
  makeDraggable(banner, workspace);

  // save when typing in content
  content.addEventListener('input', saveWorkspaceToStorage);

  // click to show panel
  banner.addEventListener('click', (e) => {
    e.stopPropagation();
    enableBannerEditing(banner);
  });
}

function saveWorkspaceToStorage() {
  const workspace = document.getElementById('bannerWorkspace');
  if (workspace) {
    localStorage.setItem('currentWorkspaceContent', workspace.innerHTML);
  }
}
function makeDraggable(element, workspace) {
  element.setAttribute('draggable', 'false');
  element.addEventListener('dragstart', (e) => e.preventDefault());

  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  element.addEventListener('mousedown', (e) => {
    const fromHandle = e.target.closest('.drag-handle');
    const isImageBody = element.tagName === 'IMG' && e.target === element;
    const interactive = e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName);

    if (!fromHandle && !isImageBody && !e.ctrlKey) {
      // when clicking text/inputs without handle/Ctrl, just edit
      if (interactive) return;
      // clicking non-interactive part of a div still needs handle or Ctrl
      return;
    }

    e.preventDefault();
    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    const wsRect = workspace.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();

    element.style.left = Math.max(0, Math.min(x, wsRect.width  - elRect.width)) + 'px';
    element.style.top  = Math.max(0, Math.min(y, wsRect.height - elRect.height)) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) saveWorkspaceToStorage();
    isDragging = false;
    element.style.cursor = 'grab';
  });
}

function enableBannerEditing(banner) {
  const editPanel = document.querySelector('.banner-edit-panel');
  if (!editPanel) return;

  const content = banner.querySelector('.banner-content');

  banner.style.outline = '2px solid #00ffff';
  editPanel.style.display = 'block';

  // — bind to CONTENT, not the container
  document.getElementById('bannerTextInput').value = content.textContent;
  document.getElementById('bannerBgColorInput').value   = rgbToHex(banner.style.backgroundColor || '#008cff');
  document.getElementById('bannerTextColorInput').value = rgbToHex(getComputedStyle(content).color || '#008cff');
  document.getElementById('bannerFontSizeInput').value  = parseInt(getComputedStyle(content).fontSize) || 12;
  document.getElementById('bannerFontStyleSelect').value = content.style.fontStyle || 'normal';
  document.getElementById('bannerBorderSelect').value    = banner.style.borderStyle || 'solid';

  document.getElementById('bannerTextInput').oninput = (e) => { content.textContent = e.target.value; saveWorkspaceToStorage(); };
  document.getElementById('bannerBgColorInput').oninput = (e) => { banner.style.background = e.target.value; saveWorkspaceToStorage(); };
  document.getElementById('bannerTextColorInput').oninput = (e) => { content.style.color = e.target.value; saveWorkspaceToStorage(); };
  document.getElementById('bannerFontSizeInput').oninput = (e) => { content.style.fontSize = e.target.value + 'px'; saveWorkspaceToStorage(); };
  document.getElementById('bannerFontStyleSelect').onchange = (e) => {
    content.style.fontStyle = e.target.value;
    content.style.fontWeight = e.target.value === 'bold' ? 'bold' : 'normal';
    saveWorkspaceToStorage();
  };
  document.getElementById('bannerBorderSelect').onchange = (e) => { banner.style.borderStyle = e.target.value; saveWorkspaceToStorage(); };

  document.getElementById('deleteBannerBtn').onclick = () => {
    banner.remove(); editPanel.style.display = 'none'; saveWorkspaceToStorage();
  };
}

function rgbToHex(rgb) {
  if (!rgb) return '#008cff';
  const result = rgb.match(/\d+/g);
  if (!result) return '#008cff';
  return "#" + result.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// -------- Landing Editor --------
function loadLandingEditor() {
  activeDrop = 'landing';
  const toolbar = document.querySelector('.editor-toolbar');
  if (!toolbar) return;

  toolbar.innerHTML = `
    <h2>Landing Page Editor</h2>
    <div class="landing-toolbar">
      <div class="landing-component" draggable="true" data-type="heading">Heading</div>
      <div class="landing-component" draggable="true" data-type="paragraph">Text Block</div>
      <div class="landing-component" draggable="true" data-type="image">Image</div>
      <div class="landing-component" draggable="true" data-type="button">Button</div>
      <div class="landing-component" draggable="true" data-type="form">Form</div>
    </div>
  `;

  // Click-to-add fallback (center of workspace)
  const ws = document.getElementById('bannerWorkspace');
  document.querySelectorAll('.landing-component').forEach(comp => {
    comp.addEventListener('click', () => {
      if (!ws) return;
      const rect = ws.getBoundingClientRect();
      const x = ws.scrollLeft + rect.width / 2 - 120;
      const y = ws.scrollTop  + rect.height / 2 - 40;
      const t = comp.dataset.type;
      if (t === 'image') {
        createImageElement('https://via.placeholder.com/200', ws, x, y);
      } else {
        createLandingElement(t, ws, x, y);
      }
      saveWorkspaceToStorage();
    });
  });

  setupLandingDragDrop();
  normalizeLandingNodes(document.getElementById('bannerWorkspace'));

}
// after you re-enable dragging/editing on loaded content:
normalizeLandingNodes(document.getElementById('bannerWorkspace'));

function setupLandingDragDrop() {
  const components = document.querySelectorAll('.landing-component');
  const workspace = document.getElementById('bannerWorkspace');
  if (!workspace) return;

  components.forEach(comp => {
    comp.addEventListener('dragstart', (e) => {
      const t = comp.dataset.type;
      e.dataTransfer.setData('text/plain', t);
      e.dataTransfer.setData('application/x-landing-type', t);
      e.dataTransfer.setData('landingType', t);
      e.dataTransfer.effectAllowed = 'copy';
      logDND('dragstart', t);
    });
  });

  const allow = (e) => {
    if (activeDrop !== 'landing') return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };
  workspace.addEventListener('dragenter', allow, true);
  workspace.addEventListener('dragover',  allow, true);

  workspace.addEventListener('drop', (e) => {
    if (activeDrop !== 'landing') return;
    e.preventDefault();
    e.stopPropagation();

    const rect = workspace.getBoundingClientRect();
    const x = e.clientX - rect.left + workspace.scrollLeft;
    const y = e.clientY - rect.top  + workspace.scrollTop;

    const files = e.dataTransfer.files;
    if (files && files.length && files[0].type.startsWith('image/')) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        logDND('drop:file', file.type, x, y);
        createImageElement(reader.result, workspace, x, y);
        saveWorkspaceToStorage();
      };
      reader.readAsDataURL(file);
      return;
    }

    const type =
      e.dataTransfer.getData('application/x-landing-type') ||
      e.dataTransfer.getData('landingType') ||
      e.dataTransfer.getData('text/plain');

    logDND('drop:tool', type, x, y);

    if (!type) return;
    if (type === 'image') {
      createImageElement('https://via.placeholder.com/200', workspace, x, y);
    } else {
      createLandingElement(type, workspace, x, y);
    }
    saveWorkspaceToStorage();
  }, true);
}

function createLandingElement(type, workspace, x, y) {
  let el;

  if (type === 'image') {
    // keep image path: use createImageElement
    createImageElement('https://via.placeholder.com/200', workspace, x, y);
    return;
  }

  if (type === 'form') {
    el = document.createElement('form');
    el.classList.add('landing-element', 'landing-form'); // container
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.innerHTML = `
      <label>Full Name</label>
      <input type="text" name="fullName" placeholder="Your name" />
      <label>Email</label>
      <input type="email" name="email" placeholder="you@example.com" />
      <label>Message</label>
      <textarea name="message" rows="3" placeholder="Say hi..."></textarea>
      <button type="submit" class="landing-button" style="margin-top:10px;">Send</button>
    `;
    el.addEventListener('submit', (e) => { e.preventDefault(); alert('Form submit intercepted (demo).'); });
    workspace.appendChild(el);
    attachCommonChrome(el);
    makeDraggable(el, workspace);
    // persist values
    el.querySelectorAll('input, textarea').forEach(ctrl => {
      ctrl.addEventListener('input', () => {
        ctrl.setAttribute('value', ctrl.value);
        if (ctrl.tagName === 'TEXTAREA') ctrl.textContent = ctrl.value;
        saveWorkspaceToStorage();
      });
    });
    return;
  }

  // Text-like: container + inner .editable
  el = document.createElement('div');
  el.classList.add('landing-element');
  el.style.left = x + 'px';
  el.style.top  = y + 'px';

  const editable = document.createElement('div');
  editable.className = 'editable';
  editable.contentEditable = 'true';

  if (type === 'heading') {
    editable.textContent = 'WELCOME';
    editable.style.fontSize = '24px';
    editable.style.fontWeight = 'bold';
  } else if (type === 'paragraph') {
    editable.textContent = 'This is a text block. Click to edit me.';
  } else if (type === 'button') {
    editable.textContent = 'Click Me';
    editable.classList.add('landing-button'); // keep your button styling
  }

  el.appendChild(editable);
  workspace.appendChild(el);

  attachCommonChrome(el);
  makeDraggable(el, workspace);

  // save on edits
  editable.addEventListener('input', saveWorkspaceToStorage);
}

function createImageElement(src, workspace, x, y){
  const img = document.createElement('img');
  img.src = src;
  img.alt = "Image";
  img.classList.add('landing-element');
  img.style.position = 'absolute';
  img.style.left = x + 'px';
  img.style.top  = y + 'px';
  img.style.width = '200px';
  img.style.cursor = 'grab';
  img.setAttribute('draggable', 'false');

  workspace.appendChild(img);

  // add ✖ and ⠿ on images too
  attachCommonChrome(img);
  makeDraggable(img, workspace);

  // click changes URL, optional:
  img.addEventListener('dblclick', (e)=>{
    e.stopPropagation();
    const newSrc = prompt("Enter new image URL:", img.src);
    if (newSrc && newSrc.trim()) {
      img.src = newSrc.trim();
      saveWorkspaceToStorage();
    }
  });

  saveWorkspaceToStorage();
}


function enableLandingEditing(element) {
  if (element.tagName === 'IMG' || element.tagName === 'FORM') return; // handled elsewhere

  const editable = element.querySelector('.editable');
  if (editable) {
    editable.focus();
    // ensure it’s editable (in case it came from old saved content)
    editable.contentEditable = 'true';
    editable.addEventListener('input', saveWorkspaceToStorage);
  }
}

let mkSavedRange = null;

function normalizeLandingNodes(root = document) {
  root.querySelectorAll('.landing-element').forEach(el => {
    // already normalized?
    if (el.querySelector('.editable')) return;

    // if it's a FORM or IMG, leave as-is (not text-editable)
    if (el.tagName === 'FORM' || el.tagName === 'IMG') {
      attachCommonChrome(el);
      return;
    }

    // move existing content into an .editable wrapper
    const editable = document.createElement('div');
    editable.className = 'editable';
    editable.contentEditable = 'true';

    // move children/text into editable
    while (el.firstChild) editable.appendChild(el.firstChild);
    el.appendChild(editable);

    attachCommonChrome(el);
  });
}
function bindMarketingSelectionMemory(canvas) {
  if (!canvas) return;
  const save = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && canvas.contains(sel.anchorNode)) {
      mkSavedRange = sel.getRangeAt(0);
    }
  };
  canvas.addEventListener('mouseup', save);
  canvas.addEventListener('keyup', save);
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && canvas.contains(sel.anchorNode)) {
      mkSavedRange = sel.getRangeAt(0);
    }
  });
}

function restoreMarketingSelection(canvas) {
  const sel = window.getSelection();
  if (mkSavedRange) {
    sel.removeAllRanges();
    sel.addRange(mkSavedRange);
  } else {
    canvas.focus();
  }
}

function loadMarketingEditor() {
  activeDrop = null; // no DnD here

  const toolbar = document.querySelector('.editor-toolbar');
  if (!toolbar) return;

  toolbar.innerHTML = `
    <h2>Marketing Email Editor</h2>
    <div class="marketing-toolbar">
      <div class="template-row">
        <button class="mk-btn" data-tpl="1">Template 1</button>
        <button class="mk-btn" data-tpl="2">Template 2</button>
        <button class="mk-btn" data-tpl="3">Template 3</button>
        <button class="mk-btn danger" id="mkRemove">Remove Template</button>
      </div>
      <div class="format-row">
        <button class="mk-btn" data-cmd="bold">B</button>
        <button class="mk-btn" data-cmd="italic"><em>I</em></button>
        <button class="mk-btn" data-cmd="underline"><u>U</u></button>

        <select id="mkHeading" title="Block">
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
        </select>

        <input id="mkFontSize" type="number" min="8" max="32" value="14" title="Font size (px)" />

        <select id="mkFontFamily" title="Font family">
          <option value="'Press Start 2P', cursive">Press Start 2P</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
        </select>

        <label>Text <input id="mkTextColor" type="color" value="#111111" /></label>
        <label>BG <input id="mkBgColor" type="color" value="#ffffff" /></label>

        <button id="mkInsertImage" class="mk-btn">Insert Image (URL)</button>
      </div>
      <div class="action-row">
        <button id="mkSave" class="mk-btn">Save Site</button>
      </div>
    </div>
  `;

  const ws = document.getElementById('bannerWorkspace');

  const existingCanvas = document.getElementById('emailCanvas');
  if (existingCanvas) bindMarketingSelectionMemory(existingCanvas);

  // Templates (inject/replace inside the canvas, do NOT clear other workspace items)
  toolbar.querySelectorAll('.mk-btn[data-tpl]').forEach(btn => {
    btn.addEventListener('click', () => {
      const canvas = ensureEmailCanvas(ws);
      bindMarketingSelectionMemory(canvas);
      applyTemplateIntoCanvas(parseInt(btn.dataset.tpl, 10));
      saveWorkspaceToStorage();
    });
  });

  // Remove Template
  document.getElementById('mkRemove').addEventListener('click', () => {
    removeMarketingTemplate();
  });

  try { document.execCommand('styleWithCSS', true); } catch (_) {}

  toolbar.querySelectorAll('.mk-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = document.getElementById('emailCanvas');
      if (!c) return;
      restoreMarketingSelection(c);
      document.execCommand(btn.dataset.cmd, false, null);
      saveWorkspaceToStorage();
    });
  });

  document.getElementById('mkHeading').addEventListener('change', (e) => {
    const c = document.getElementById('emailCanvas');
    if (!c) return;
    restoreMarketingSelection(c);
    document.execCommand('formatBlock', false, e.target.value);
    saveWorkspaceToStorage();
  });

  const fontSizeEl = document.getElementById('mkFontSize');
  const applySize = () => {
    const c = document.getElementById('emailCanvas');
    if (!c) return;
    restoreMarketingSelection(c);
    applyInlineStyle('fontSize', fontSizeEl.value + 'px');
  };
  fontSizeEl.addEventListener('input', applySize);
  fontSizeEl.addEventListener('change', applySize);

  const fontFamilyEl = document.getElementById('mkFontFamily');
  fontFamilyEl.addEventListener('change', () => {
    const c = document.getElementById('emailCanvas');
    if (!c) return;
    restoreMarketingSelection(c);
    applyInlineStyle('fontFamily', fontFamilyEl.value);
  });

  document.getElementById('mkTextColor').addEventListener('input', (e) => {
    const c = document.getElementById('emailCanvas');
    if (!c) return;
    restoreMarketingSelection(c);
    document.execCommand('foreColor', false, e.target.value);
    saveWorkspaceToStorage();
  });

  document.getElementById('mkBgColor').addEventListener('input', (e) => {
    const c = document.getElementById('emailCanvas');
    if (c) { c.style.background = e.target.value; saveWorkspaceToStorage(); }
  });

  document.getElementById('mkInsertImage').addEventListener('click', () => {
    const url = prompt('Image URL:');
    if (!url) return;
    const c = document.getElementById('emailCanvas');
    if (!c) return;
    restoreMarketingSelection(c);
    document.execCommand('insertImage', false, url);
    const imgs = c.querySelectorAll('img');
    const img = imgs[imgs.length - 1];
    if (img) img.style.cssText = 'max-width:100%; height:auto; display:block;';
    saveWorkspaceToStorage();
  });

  document.getElementById('mkSave').addEventListener('click', () => {
    saveHistory();
  });
}

function addDragHandle(el) {
  if (el.querySelector('.drag-handle')) return;

  const h = document.createElement('span');
  h.className = 'drag-handle';
  h.textContent = '⠿';
  h.setAttribute('contenteditable', 'false');

  Object.assign(h.style, {
    position: 'absolute',
    top: '-8px',
    right: '14px',
    background: '#111',
    border: '1px solid #008cff',
    borderRadius: '4px',
    fontSize: '10px',
    lineHeight: '12px',
    padding: '2px 4px',
    cursor: 'grab',
    userSelect: 'none',
    zIndex: '3'
  });

  // ensure positioned container
  el.style.position = 'absolute';
  el.appendChild(h);
}

function attachCommonChrome(el) {
  addDeleteButton(el);
  addDragHandle(el);
}


function addDeleteButton(el) {
  if (el.querySelector('.element-delete-btn')) return;

  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'element-delete-btn';
  b.textContent = '✖';
  b.setAttribute('contenteditable', 'false');

  b.addEventListener('click', (e) => {
    e.stopPropagation();
    el.remove();
    saveWorkspaceToStorage();
  });

  Object.assign(b.style, {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#ff3860',
    color: '#fff',
    border: '1px solid #ff6b83',
    borderRadius: '10px',
    fontSize: '10px',
    lineHeight: '12px',
    padding: '2px 6px',
    cursor: 'pointer',
    zIndex: '3',
    userSelect: 'none'
  });

  el.appendChild(b);
}

function attachCommonChrome(el) {
  addDeleteButton(el);
  addDragHandle(el);
}

function addDeleteButton(el) {
  if (el.querySelector('.element-delete-btn')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'element-delete-btn';
  b.textContent = '✖';
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    el.remove();
    saveWorkspaceToStorage();
  });
  el.appendChild(b);
}

function attachCommonChrome(el) {
  addDeleteButton(el);
  addDragHandle(el);
}

function ensureEmailCanvas(workspace) {
  let canvas = document.getElementById('emailCanvas');
  if (canvas) return canvas;

  if (workspace) {
    canvas = document.createElement('div');
    canvas.id = 'emailCanvas';
    canvas.className = 'email-canvas';
    canvas.contentEditable = 'true';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '1';
    workspace.appendChild(canvas);
  }
  bindMarketingSelectionMemory(canvas);
  return canvas;
}

function removeMarketingTemplate() {
  const canvas = document.getElementById('emailCanvas');
  if (canvas && canvas.parentElement) {
    canvas.parentElement.removeChild(canvas);
    mkSavedRange = null;
    saveWorkspaceToStorage();
  }
}

/* Apply one of 3 templates INTO the existing marketing canvas */
function applyTemplateIntoCanvas(n) {
  const c = document.getElementById('emailCanvas');
  if (!c) return;

  // keep colors inherit so toolbar can recolor text
  const baseStyle = `style="margin:0 auto; width:650px; max-width:650px; background:#ffffff; color:inherit; font-family:inherit; line-height:1.5; padding:24px;"`;

  let html = '';
  if (n === 1) {
    html = `
      <div ${baseStyle}>
        <h1 style="margin:0 0 12px; font-size:24px;">Welcome to Our Newsletter</h1>
        <p style="margin:0 0 16px;">Quick intro paragraph. Replace this with your content.</p>
        <img src="https://via.placeholder.com/650x200" alt="Banner" style="max-width:100%; height:auto; display:block; margin:0 0 16px;" />
        <p style="margin:0;">Another paragraph block with more details.</p>
      </div>`;
  } else if (n === 2) {
    html = `
      <div ${baseStyle}>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; color:inherit;">
          <tr>
            <td style="padding:0 0 16px;">
              <h1 style="margin:0; font-size:22px;">Product Update</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 16px;">
              <p style="margin:0;">Use this area to announce new features.</p>
            </td>
          </tr>
          <tr>
            <td>
              <img src="https://via.placeholder.com/650x180" alt="Feature" style="max-width:100%; height:auto; display:block;" />
            </td>
          </tr>
        </table>
      </div>`;
  } else {
    html = `
      <div ${baseStyle}>
        <h1 style="margin:0 0 12px; font-size:24px; text-align:center;">Event Invitation</h1>
        <p style="margin:0 0 16px; text-align:center;">Join us for a special event. Details below.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; color:inherit;">
          <tr>
            <td width="50%" style="vertical-align:top; padding:0 8px;">
              <p style="margin:0 0 12px;"><strong>When:</strong> Date & time here</p>
              <p style="margin:0 0 12px;"><strong>Where:</strong> Location here</p>
            </td>
            <td width="50%" style="vertical-align:top; padding:0 8px;">
              <img src="https://via.placeholder.com/300x180" alt="Venue" style="max-width:100%; height:auto; display:block;" />
            </td>
          </tr>
        </table>
      </div>`;
  }
  c.innerHTML = html;

  // normalize
  c.querySelectorAll('img').forEach(img => {
    img.style.cssText = 'max-width:100%; height:auto; display:block;';
  });

  saveWorkspaceToStorage();
}

/* Style current selection or current block */
function applyInlineStyle(prop, value) {
  const canvas = document.getElementById('emailCanvas');
  const sel = window.getSelection();
  if (!canvas || !sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  if (range.collapsed) {
    let node = range.startContainer.nodeType === 1
      ? range.startContainer
      : range.startContainer.parentElement;

    const isBlock = (el) => el && el.tagName && /^(P|H1|H2|DIV|TD|TH)$/.test(el.tagName);
    while (node && node !== canvas && !isBlock(node)) node = node.parentElement;

    (node || canvas).style[prop] = value;
  } else {
    try { document.execCommand('styleWithCSS', true); } catch (_) {}
    const span = document.createElement('span');
    span.style[prop] = value;
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    const sel2 = window.getSelection();
    sel2.removeAllRanges();
    const after = document.createRange();
    after.selectNodeContents(span);
    after.collapse(false);
    sel2.addRange(after);
  }

  saveWorkspaceToStorage();
}



