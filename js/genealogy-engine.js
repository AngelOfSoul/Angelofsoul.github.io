/*
genealogy-engine.js — Calnic Online v2
A lightweight, template-driven genealogy renderer.
Assumes:
  - admin-nav.js has injected header/footer and set up window.supabase
  - genealogie-familie.html is a minimal markdown-style template
  - Supabase is configured with valid keys
*/

(function () {
    'use strict';

    // === CONFIG ===
    const API = {
        FAMILY_ID_PARAM: 'family',
        DEFAULT_FAMILY_ID: null,
        MAX_RETRIES: 3,
        RETRY_DELAY_MS: 1000
    };

    // === STATE ===
    let state = {
        familyId: null,
        family: null,
        members: [],
        relations: [],
        selectedPersonId: null,
        unsavedChanges: false,
        isOffline: false,
        isDemoMode: true, // Will be set to false if Supabase loads real data
        demoData: {
            family: { id: 'demo-family-123', name: 'Familia Popescu', village: 'Calnic', since: 1874 },
            members: [
                { id: 'p1', name: 'Ion Popescu', birth_year: 1920, death_year: 2010, is_deceased: true, is_living: false, visibility: 'public', location: 'Calnic', profession: 'Fermier', generation: 0, canonical_id: null },
                { id: 'p2', name: 'Maria Popescu', birth_year: 1924, death_year: null, is_deceased: false, is_living: true, visibility: 'public', location: 'Calnic', profession: 'Invatatoare', generation: 0, canonical_id: null },
                { id: 'p3', name: 'Petre Muresan', birth_year: 1970, death_year: null, is_deceased: false, is_living: true, visibility: 'public', location: 'Brasov', profession: 'Medic', generation: 1, canonical_id: null },
                { id: 'p4', name: 'Elena Muresan', birth_year: 1975, death_year: null, is_deceased: false, is_living: true, visibility: 'family', location: 'Cluj', profession: 'Avocat', generation: 1, canonical_id: null },
                { id: 'p5', name: 'Gheorghe Buta', birth_year: 1968, death_year: null, is_deceased: false, is_living: true, visibility: 'private', location: 'Brasov', profession: 'Inginer', generation: 1, canonical_id: null },
                { id: 'p6', name: 'Ana Moldovan', birth_year: 1972, death_year: null, is_deceased: false, is_living: true, visibility: 'private', location: 'Brasov', profession: 'Economist', generation: 1, canonical_id: null },
                { id: 'p7', name: 'Vasile Buta', birth_year: 2005, death_year: null, is_deceased: false, is_living: true, visibility: 'private', location: 'Brasov', profession: '', generation: 2, canonical_id: null },
                { id: 'p8', name: 'Nicolae Popescu', birth_year: 1950, death_year: 1995, is_deceased: true, is_living: false, visibility: 'public', location: 'Calnic', profession: 'Carpentier', generation: -1, canonical_id: null }
            ],
            relations: [
                { id: 'r1', from: 'p1', to: 'p2', relation_type: 'marriage', confirmed: true, auto_detected: false },
                { id: 'r2', from: 'p1', to: 'p3', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r3', from: 'p2', to: 'p3', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r4', from: 'p1', to: 'p4', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r5', from: 'p2', to: 'p4', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r6', from: 'p3', to: 'p5', relation_type: 'marriage', confirmed: true, auto_detected: false },
                { id: 'r7', from: 'p3', to: 'p6', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r8', from: 'p5', to: 'p6', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r9', from: 'p3', to: 'p7', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r10', from: 'p5', to: 'p7', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r11', from: 'p1', to: 'p8', relation_type: 'parent', confirmed: true, auto_detected: false },
                { id: 'r12', from: 'p2', to: 'p8', relation_type: 'parent', confirmed: true, auto_detected: false }
            ]
        }
    };

    // === UTILS ===
    function $(selector, context = document) {
        return context.querySelector(selector);
    }

    function $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function createElement(tag, props = {}, children = []) {
        const isSvgTag = ['svg', 'line', 'path', 'circle', 'rect', 'g', 'polyline', 'polygon', 'text', 'use', 'defs', 'marker'].includes(tag);
        const el = isSvgTag
            ? document.createElementNS(SVG_NS, tag)
            : document.createElement(tag);
        Object.keys(props).forEach(key => {
            if (key === 'className') {
                el.className = props[key];
            } else if (key === 'dataset') {
                Object.keys(props[key]).forEach(dk => {
                    el.dataset[dk] = props[key][dk];
                });
            } else if (key === 'style' && typeof props[key] === 'string') {
                el.style.cssText = props[key];
            } else if (isSvgTag && key !== 'style') {
                // SVG attributes must use setAttribute with kebab-case names
                // Skip empty string values (used to mean "no attribute")
                if (props[key] === '' || props[key] === null || props[key] === undefined) return;
                const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                el.setAttribute(attrName, props[key]);
            } else {
                el[key] = props[key];
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child) {
                el.appendChild(child);
            }
        });
        return el;
    }

    function formatDate(year) {
        return year ? `${year}` : '—';
    }

    function getVisibilityColor(visibility) {
        switch (visibility) {
            case 'public': return '#d4a84a';
            case 'family': return '#b08030';
            case 'private': return '#c04040';
            default: return '#7a5828';
        }
    }

    function getRelationStyle(type) {
        const styles = {
            parent: { color: '#d4a84a', dash: '' },
            sibling: { color: '#4CAF50', dash: '' },
            marriage: { color: '#4CAF50', dash: '5,5' },
            alliance: { color: '#7a5828', dash: '3,3' },
            distant: { color: '#a0a0a0', dash: '2,2' },
            adopted: { color: '#c04040', dash: '1,1' }
        };
        return styles[type] || styles.parent;
    }

    // === DOM MANIPULATION ===
    function showElement(el) {
        if (el) el.style.display = 'block';
    }

    function hideElement(el) {
        if (el) el.style.display = 'none';
    }

    function toggleClass(el, cls, force) {
        if (force !== undefined) el.classList.toggle(cls, force);
        else el.classList.toggle(cls);
    }

    function updateUnsavedIndicator() {
        const indicator = $('.unsaved-indicator');
        if (indicator) {
            indicator.style.display = state.unsavedChanges ? 'inline' : 'none';
        }
    }

    // === DATA LOADING ===
    async function loadFamilyData() {
        const url = new URL(window.location.href);
        state.familyId = url.searchParams.get(API.FAMILY_ID_PARAM) || API.DEFAULT_FAMILY_ID;

        if (!state.familyId) {
            showError('Parametrul ?family=UUID este obligatoriu.');
            return;
        }

        // Try Supabase first
        if (window.supabase) {
            try {
                const [familyRes, membersRes] = await Promise.all([
                    window.supabase.from('families').select('*').eq('id', state.familyId).single(),
                    window.supabase.from('members').select('*').eq('family_id', state.familyId)
                ]);

                if (familyRes.error) throw familyRes.error;
                if (membersRes.error) throw membersRes.error;

                state.family = familyRes.data;
                state.members = membersRes.data || [];

                // Fetch relations for these members (from both directions)
                const memberIds = state.members.map(m => m.id);
                let relations = [];
                if (memberIds.length > 0) {
                    const [fromRes, toRes] = await Promise.all([
                        window.supabase.from('member_relations').select('*').in('from_member_id', memberIds),
                        window.supabase.from('member_relations').select('*').in('to_member_id', memberIds)
                    ]);
                    const seen = {};
                    (fromRes.data || []).concat(toRes.data || []).forEach(r => {
                        if (!seen[r.id]) { seen[r.id] = true; relations.push(r); }
                    });
                }
                // Normalize: support both old (from/to) and new (from_member_id/to_member_id) field names
                state.relations = relations.map(r => ({
                    ...r,
                    from: r.from_member_id || r.from,
                    to: r.to_member_id || r.to
                }));
                state.isDemoMode = false;
                console.log('[Genealogy] Loaded real data:', state.family, state.members.length, 'members', state.relations.length, 'relations');
            } catch (err) {
                console.warn('[Genealogy] Supabase load failed:', err.message);
                // Fall back to demo
                state.family = state.demoData.family;
                state.members = state.demoData.members;
                state.relations = state.demoData.relations;
                state.isDemoMode = true;
            }
        } else {
            // No Supabase, use demo
            state.family = state.demoData.family;
            state.members = state.demoData.members;
            state.relations = state.demoData.relations;
            state.isDemoMode = true;
        }

        renderTree();
    }

    function showError(message) {
        const container = $('.container') || document.body;
        container.innerHTML = `
            <div class="card" style="text-align:center; background:#1a0808; border:2px solid #c04040;">
                <h3 style="color:#c04040;">⚠️ Eroare</h3>
                <p>${message}</p>
                <a href="familiile.html" class="btn">← Înapoi la familiile</a>
            </div>
        `;
    }

    // === TREE RENDERING ===
    function renderTree() {
        const container = $('#tree-container');
        if (!container) return;

        // Clear
        container.innerHTML = '';

        // If no members, show empty state
        if (state.members.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:2rem;">
                    <p>Nicio persoana în acest arbore.</p>
                    <button class="btn" onclick="addPerson()">+ Adaugă prima persoană</button>
                </div>
            `;
            return;
        }

        // Group by generation (simplified: min birth_year = gen 0)
        const minBirth = Math.min(...state.members.filter(m => m.birth_year).map(m => m.birth_year));
        const generations = {};
        state.members.forEach(m => {
            const gen = m.birth_year ? Math.floor((m.birth_year - minBirth) / 25) : 0;
            if (!generations[gen]) generations[gen] = [];
            generations[gen].push(m);
        });

        const sortedGens = Object.keys(generations).sort((a, b) => parseInt(a) - parseInt(b));

        // Create centered wrapper
        const treeWrapper = createElement('div', {
            style: `
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                padding: 2rem 0;
                gap: 1.5rem;
            `
        });

        sortedGens.forEach(genNum => {
            const genDiv = createElement('div', {
                style: `
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                `
            });

            generations[genNum].forEach(person => {
                const node = createPersonNode(person);
                genDiv.appendChild(node);
            });

            treeWrapper.appendChild(genDiv);
        });

        container.appendChild(treeWrapper);

        // Draw connections (simple vertical lines between parents and children)
        drawConnections();
    }

    function createPersonNode(person) {
        const isAlive = !person.is_deceased && person.is_living;
        const visColor = getVisibilityColor(person.visibility);
        const bgColor = person.visibility === 'private' ? '#1a0808' : '#161616';

        const node = createElement('div', {
            className: `tree-node ${isAlive ? 'alive' : 'deceased'} ${person.visibility}`,
            dataset: { personId: person.id },
            style: `
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0.5rem;
                padding: 0.7rem;
                border: 1px solid ${visColor};
                border-radius: 4px;
                background: ${bgColor};
                min-width: 120px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            `
        });

        // Avatar circle
        const avatar = createElement('div', {
            style: `
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: ${visColor};
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: "Playfair Display", serif;
                font-size: 20px;
                color: #050505;
                margin-bottom: 0.5rem;
                border: 2px solid #d4a84a;
            `
        }, [person.name.charAt(0).toUpperCase()]);

        // Name
        const name = createElement('div', {
            style: `
                font-weight: bold;
                color: ${visColor};
                font-size: 0.9rem;
                margin-bottom: 0.3rem;
            `
        }, [person.name]);

        // Dates
        const dates = createElement('div', {
            style: `
                font-size: 0.8rem;
                color: #7a5828;
            `
        }, [`${formatDate(person.birth_year)} – ${formatDate(person.death_year)}`]);

        // Profession
        const prof = person.profession ? createElement('div', {
            style: `font-size: 0.7rem; color: #a0a0a0;`
        }, [person.profession]) : null;

        node.appendChild(avatar);
        node.appendChild(name);
        node.appendChild(dates);
        if (prof) node.appendChild(prof);

        // Hover effect
        node.addEventListener('mouseenter', () => {
            node.style.transform = 'scale(1.05)';
            node.style.boxShadow = '0 0 0 2px rgba(212, 168, 74, 0.5)';
        });
        node.addEventListener('mouseleave', () => {
            node.style.transform = '';
            node.style.boxShadow = '';
        });

        // Click to select/edit
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            selectPerson(person.id);
        });

        return node;
    }

    function drawConnections() {
        // Simple: draw vertical lines from parents to children
        const container = $('#tree-container');
        if (!container) return;

        state.relations.forEach(rel => {
            const fromEl = $(`.tree-node[data-person-id="${rel.from}"]`);
            const toEl = $(`.tree-node[data-person-id="${rel.to}"]`);
            if (!fromEl || !toEl) return;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
            const fromY = fromRect.top + fromRect.height - containerRect.top;
            const toX = toRect.left + toRect.width / 2 - containerRect.left;
            const toY = toRect.top - containerRect.top;

            const style = getRelationStyle(rel.relation_type);
            const svg = createElement('svg', {
                style: `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    overflow: visible;
                `
            });
            const line = createElement('line', {
                x1: String(fromX),
                y1: String(fromY),
                x2: String(toX),
                y2: String(toY),
                stroke: style.color,
                strokeWidth: '2',
                strokeDasharray: style.dash || ''
            });

            svg.appendChild(line);
            container.appendChild(svg);
        });
    }

    // === INTERACTION ===
    function selectPerson(personId) {
        state.selectedPersonId = personId;
        console.log('Selected:', personId);

        // Highlight
        $$('.tree-node').forEach(n => n.classList.remove('selected'));
        const node = $(`.tree-node[data-person-id="${personId}"]`);
        if (node) node.classList.add('selected');

        // Show edit panel
        showEditPanel(personId);
    }

    function showEditPanel(personId) {
        const person = state.members.find(m => m.id === personId);
        if (!person) return;

        const panel = $('#editing-panel');
        const overlay = $('#modal-overlay');
        if (!panel || !overlay) return;

        // Populate form
        $('#edit-name').value = person.name;
        $('#edit-birth').value = person.birth_year || '';
        $('#edit-death').value = person.death_year || '';
        $('#edit-location').value = person.location || '';
        $('#edit-profession').value = person.profession || '';
        $('#edit-bio').value = person.biography || '';
        $('#edit-private').checked = person.visibility === 'private';
        $('#edit-alive').checked = !person.is_deceased;

        // Show
        panel.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function cancelEdit() {
        $('#editing-panel').style.display = 'none';
        $('#modal-overlay').style.display = 'none';
        document.body.style.overflow = '';
        state.selectedPersonId = null;
    }

    function saveEditedPerson() {
        const personId = state.selectedPersonId;
        if (!personId) return;

        const updated = {
            name: $('#edit-name').value,
            birth_year: $('#edit-birth').value ? parseInt($('#edit-birth').value) : null,
            death_year: $('#edit-death').value ? parseInt($('#edit-death').value) : null,
            is_deceased: !!$('#edit-death').value,
            is_living: !$('#edit-death').value,
            visibility: $('#edit-private').checked ? 'private' : 'public',
            location: $('#edit-location').value,
            profession: $('#edit-profession').value,
            biography: $('#edit-bio').value
        };

        // Update local state
        const idx = state.members.findIndex(m => m.id === personId);
        if (idx !== -1) {
            state.members[idx] = { ...state.members[idx], ...updated };
        }

        // Update DOM node
        const node = $(`.tree-node[data-person-id="${personId}"]`);
        if (node) {
            const nameEl = node.querySelector('div:nth-child(2)');
            const datesEl = node.querySelector('div:nth-child(3)');
            nameEl.textContent = updated.name;
            datesEl.textContent = `${formatDate(updated.birth_year)} – ${formatDate(updated.death_year)}`;
            node.style.borderColor = getVisibilityColor(updated.visibility);
            node.style.background = updated.visibility === 'private' ? '#1a0808' : '#161616';
        }

        state.unsavedChanges = true;
        updateUnsavedIndicator();
        cancelEdit();
    }

    function addPerson() {
        const newId = 'new_' + Date.now();
        const newPerson = {
            id: newId,
            name: 'Persoana Nouă',
            birth_year: null,
            death_year: null,
            is_deceased: false,
            is_living: true,
            visibility: 'public',
            location: '',
            profession: '',
            biography: '',
            generation: 0
        };
        state.members.push(newPerson);
        renderTree();
        state.unsavedChanges = true;
        updateUnsavedIndicator();
        // Auto-select for editing
        setTimeout(() => selectPerson(newId), 100);
    }

    function deletePerson() {
        if (!state.selectedPersonId) return;
        const person = state.members.find(m => m.id === state.selectedPersonId);
        if (!person) return;

        if (confirm(`Sigur doriți să ștergeți "${person.name}"? Această acțiune poate fi anulată în 30 de zile.`)) {
            // Remove from members
            state.members = state.members.filter(m => m.id !== state.selectedPersonId);
            // Remove relations involving this person
            state.relations = state.relations.filter(r =>
                r.from !== state.selectedPersonId &&
                r.to !== state.selectedPersonId &&
                r.from_member_id !== state.selectedPersonId &&
                r.to_member_id !== state.selectedPersonId
            );
            renderTree();
            state.unsavedChanges = true;
            updateUnsavedIndicator();
            cancelEdit();
        }
    }

    function saveChanges() {
        // In a real app, this would sync to Supabase
        alert('Modificarile ar fi fost salvate în Supabase. (Demo)');
        state.unsavedChanges = false;
        updateUnsavedIndicator();
    }

    // === INIT ===
    function init() {
        // Wait for admin-nav.js to inject the container
        if (document.querySelector('.container')) {
            setupEventListeners();
            loadFamilyData();
        } else {
            // for container
            const timer = setInterval(() => {
                if (document.querySelector('.container')) {
                    clearInterval(timer);
                    setupEventListeners();
                    loadFamilyData();
                }
            }, 500);
        }
    }

    function setupEventListeners() {
        // Unsaved indicator
        updateUnsavedIndicator();

        // Buttons
        $('#add-person-btn')?.addEventListener('click', addPerson);
        $('#save-changes-btn')?.addEventListener('click', saveChanges);
        $('#cancel-edit-btn')?.addEventListener('click', cancelEdit);
        $('#save-edit-btn')?.addEventListener('click', saveEditedPerson);
        $('#delete-person-btn')?.addEventListener('click', deletePerson);

        // Modal overlay
        $('#modal-overlay')?.addEventListener('click', cancelEdit);

        // Double-click edit on person nodes
        document.addEventListener('dblclick', (e) => {
            const node = e.target.closest('.tree-node');
            if (node) {
                const id = node.dataset.personId;
                selectPerson(id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEdit();
            }
        });
    }

    // === BOOTSTRAP ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.genealogyEngine = {
        state,
        renderTree,
        selectPerson,
        addPerson,
        saveChanges
    };

})();