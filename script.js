const AppState = {
    allQuizData: [],
    userPermissions: [],
    rankings: [],
    currentQuizData: [],
    timerInterval: null,
    correctCount: 0,
    wrongCount: 0,
    wrongQuestions: [],
    isReadingComp: false
};

(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .container { background: #bbe9f0; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 20px auto; transition: background 0.3s, color 0.3s; position: relative; }
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: background 0.3s, border-color 0.3s, color 0.3s; }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        .explanation-box { margin-top: 15px; padding: 12px; background: #fff3cd; border-left: 5px solid #ffc107; border-radius: 4px; display: none; color: #856404; font-size: 0.95em; line-height: 1.4; }
        .leaderboard-container { background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; transition: background 0.3s, border-color 0.3s, color 0.3s; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: #4f46e5; }
        .time-text { font-size: 0.8em; color: #888; display: block; }
        .speaker-btn { background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-bottom: 10px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; }
        .speaker-btn:hover { background: #5a6268; }
        
        .passage-box { 
            background: #ffffff; 
            border: 2px solid #540606; 
            border-radius: 12px; 
            padding: 20px; 
            margin-bottom: 20px; 
            font-size: 1.05em; 
            line-height: 1.6; 
            color: #333; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
            transition: background 0.3s, border-color 0.3s, color 0.3s;
        }

        .passage-tag {
            display: inline-block;
            background: #e9ecef;
            border: 1px solid #ced4da;
            padding: 5px 15px;
            font-weight: bold;
            border-radius: 6px;
            margin-bottom: 12px;
            color: #333;
            font-size: 1em;
        }

        input[type="text"], select {
            width: 100%;
            padding: 12px 15px;
            margin: 8px 0 15px 0;
            border: 1px solid #540606;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 1em;
            background: #ffffff;
            color: #000;
        }

        #topic-container {
            width: 100%;
            background: #ffffff;
            border: 1px solid #540606;
            border-radius: 8px;
            padding: 12px 15px;
            margin: 8px 0 15px 0;
            box-sizing: border-box;
            min-height: 50px;
            max-height: 200px;
            overflow-y: auto;
        }

        select option:disabled { color: #aaa; background: #f1f1f1; }

        /* --- Dark Mode Styles --- */
        body.dark-mode { background-color: #121212 !important; color: #e0e0e0; transition: background 0.3s, color 0.3s; }
        body.dark-mode .container { background: #1e1e1e; color: #e0e0e0; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        body.dark-mode .quiz-card, body.dark-mode .passage-box, body.dark-mode .leaderboard-container { background: #2d2d2d; border-color: #777; color: #e0e0e0; }
        body.dark-mode .option-box { background: #3a3a3a; border-color: #666; color: #e0e0e0; }
        body.dark-mode .option-box:hover { background: #4a4a4a; border-color: #888; }
        body.dark-mode input[type="text"], body.dark-mode select { background: #2d2d2d; color: #e0e0e0; border-color: #777; }
        body.dark-mode #topic-container { background: #2d2d2d; border-color: #777; color: #e0e0e0; }
        body.dark-mode select option { background: #2d2d2d; color: #e0e0e0; }
        body.dark-mode .passage-tag { background: #3a3a3a; border-color: #666; color: #e0e0e0; }
        body.dark-mode .explanation-box { background: #332701; color: #ffeb3b; border-left-color: #ffc107; }

        .dark-mode-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ffffff;
            color: #333;
            border: 2px solid #540606;
            padding: 6px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.9em;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s;
            z-index: 10;
        }
        .dark-mode-btn:hover { background: #f1f1f1; }
        body.dark-mode .dark-mode-btn {
            background: #2d2d2d;
            color: #f8f9fa;
            border-color: #777;
        }
        body.dark-mode .dark-mode-btn:hover { background: #3a3a3a; }
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

function removeDiacritics(str) {
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function cleanKey(str) {
    return removeDiacritics(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function standardizeSubject(monStr) {
    if (!monStr) return '';
    const cleanM = cleanKey(monStr);
    if (cleanM.includes('anh') || cleanM.includes('english')) {
        return 'Tiếng Anh';
    }
    if (cleanM.includes('toan') || cleanM.includes('math')) {
        return 'Toán';
    }
    return monStr.trim();
}

function normalizeItem(item) {
    if (!item) return null;
    
    if (!Array.isArray(item) && typeof item === 'object') {
        const findKey = (possibleNames) => {
            for (let name of possibleNames) {
                const cleanN = cleanKey(name);
                for (let realKey of Object.keys(item)) {
                    if (cleanKey(realKey) === cleanN) {
                        const val = item[realKey];
                        if (val !== undefined && val !== null && String(val).trim() !== '') {
                            return String(val).trim();
                        }
                    }
                }
            }
            return '';
        };

        return {
            mon: findKey(['mon', 'môn', 'subject']),
            chuDe: findKey(['chude', 'chủ đề', 'chu de', 'topic']),
            question: findKey(['question', 'noidungcauhoi', 'noi_dung_cau_hoi', 'noi_dung', 'noidung', 'cauhoi', 'cau_hoi', 'cau', 'de_bai', 'de', 'nd', 'content', 'text', 'câu hỏi', 'nội dung câu hỏi', 'đề bài', 'đề']),
            a: findKey(['a', 'dapan_a', 'dap an a', 'đáp án a', 'option_a']),
            b: findKey(['b', 'dapan_b', 'dap an b', 'đáp án b', 'option_b']),
            c: findKey(['c', 'dapan_c', 'dap an c', 'đáp án c', 'option_c']),
            d: findKey(['d', 'dapan_d', 'dap an d', 'đáp án d', 'option_d']),
            correct: findKey(['correct', 'dapan_dung', 'dap an dung', 'đáp án đúng', 'dapandung', 'đáp_án_đúng', 'answer']),
            explanation: findKey(['explanation', 'giaithich', 'giai_thich', 'diễn giải', 'dien giai', 'giải thích', 'giai thich']),
            loai: findKey(['loai', 'loại', 'type']),
            level: findKey(['level', 'cấp độ', 'cap do', 'muc do']),
            passage: findKey(['passage', 'doanvan', 'đoạn văn', 'doan_van', 'đoạn_văn', 'noidungdoanvan', 'noidung', 'reading', 'content']),
            made: findKey(['made', 'ma_de', 'mã đề', 'madề'])
        };
    }
    
    let values = Array.isArray(item) ? item : [];
    if (values.length === 0) return null;

    let v0 = String(values[0] || '').trim().toLowerCase();
    if (v0 === 'id' || v0 === 'môn' || v0 === 'mon') {
        return null;
    }

    let hasStt = /^\d+$/.test(String(values[0]).trim());

    const getVal = (indexWithoutId) => {
        let idx = hasStt ? indexWithoutId + 1 : indexWithoutId;
        if (idx < values.length && values[idx] !== undefined && values[idx] !== null) {
            return String(values[idx]).trim();
        }
        return '';
    };

    return {
        mon: getVal(0),
        chuDe: getVal(1),
        question: getVal(2),
        a: getVal(3),
        b: getVal(4),
        c: getVal(5),
        d: getVal(6),
        correct: getVal(7),
        explanation: getVal(8),
        loai: getVal(9),
        level: getVal(10),
        passage: getVal(11),
        made: getVal(12)
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const savedMa = localStorage.getItem('saved_maHS') || 'Huy';
    const input = document.getElementById('student-code');
    if (input) input.value = savedMa;

    const startScreen = document.getElementById('start-screen');
    if (startScreen && !document.getElementById('dark-mode-toggle-btn')) {
        const btn = document.createElement('button');
        btn.id = 'dark-mode-toggle-btn';
        btn.className = 'dark-mode-btn';
        btn.innerHTML = localStorage.getItem('theme') === 'dark' ? '☀️ Sáng' : '🌙 Tối';
        btn.onclick = window.toggleDarkMode;
        startScreen.insertBefore(btn, startScreen.firstChild);
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    window.loadData();
});

window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('dark-mode-toggle-btn');
    if (btn) {
        btn.innerHTML = isDark ? '☀️ Sáng' : '🌙 Tối';
    }
};

window.handleSubjectChange = function() {
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    if (levelContainer) {
        levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    }
    window.updateTopicList();
    window.updateLevelOptions();
    window.renderLeaderboard(mon);
    window.updateMadePassagePreview();
};

window.handleMadeChange = function() {
    window.updateTopicList();
    window.updateMadePassagePreview();
};

window.updateMadePassagePreview = function() {
    const selectedMade = document.getElementById('made-select') ? document.getElementById('made-select').value.trim() : '';
    const previewContainer = document.getElementById('made-passage-preview');
    if (!previewContainer) return;

    if (!selectedMade) {
        previewContainer.innerHTML = '';
        return;
    }

    let passageItems = AppState.allQuizData.filter(i => String(i.made).trim() === selectedMade && i.passage && i.passage.trim() !== '');
    if (passageItems.length === 0) {
        previewContainer.innerHTML = '';
        return;
    }

    let uniquePassages = {};
    passageItems.forEach(item => {
        if (!uniquePassages[item.chuDe]) {
            uniquePassages[item.chuDe] = item.passage;
        }
    });

    let html = '<h4 style="margin: 10px 0 5px 0;">📖 Đoạn văn (Passage) trong Mã đề:</h4>';
    for (let code in uniquePassages) {
        html += `
            <div class="passage-box" style="margin-top: 5px; font-size: 0.95em;">
                <div class="passage-tag">${escapeHTML(code)}</div>
                <div>
                    <button class="speaker-btn" data-question="${escapeHTML(uniquePassages[code])}" onclick="window.handleSpeak(this)">🔊 Nghe đoạn văn</button>
                </div>
                <div style="white-space: pre-line; margin-top: 5px; max-height: 150px; overflow-y: auto;">${escapeHTML(uniquePassages[code])}</div>
            </div>
        `;
    }
    previewContainer.innerHTML = html;
};

window.updateLevelOptions = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelect = document.getElementById('level-select');
    if (!levelSelect) return;
    if (mon !== 'Tiếng Anh') return;

    const rankings = AppState.rankings || [];

    const passedLevel1 = rankings.some(r => {
        const rMon = cleanKey(r.subject || r.mon || '');
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === cleanKey('Tiếng Anh') && rLvl.includes('1') && rScore >= 8;
    });

    const passedLevel2 = rankings.some(r => {
        const rMon = cleanKey(r.subject || r.mon || '');
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === cleanKey('Tiếng Anh') && rLvl.includes('2') && rScore >= 8;
    });

    for (let option of levelSelect.options) {
        const val = option.value.trim();
        if (val.includes('1') || val === '1') {
            option.disabled = false;
            option.style.opacity = '1';
        } else if (val.includes('2') || val === '2') {
            option.disabled = !passedLevel1;
            option.style.opacity = passedLevel1 ? '1' : '0.4';
        } else if (val.includes('3') || val === '3') {
            option.disabled = !passedLevel2;
            option.style.opacity = passedLevel2 ? '1' : '0.4';
        }
    }

    if (levelSelect.selectedOptions[0] && levelSelect.selectedOptions[0].disabled) {
        levelSelect.value = levelSelect.options[0].value;
    }
};

window.updateTopicList = function() {
    const monSelect = document.getElementById('subject-select').value.trim();
    const maHS = document.getElementById('student-code').value.trim();
    const selectedMade = document.getElementById('made-select') ? document.getElementById('made-select').value.trim() : '';
    const container = document.getElementById('topic-container');
    if (!container || !monSelect) return;

    const cleanMonSelect = cleanKey(monSelect);

    const allowed = selectedMade ? [] : AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && cleanKey(p.mon) === cleanMonSelect)
        .map(p => String(p.chuDe).trim());

    const topics = [...new Set(AppState.allQuizData
        .filter(i => cleanKey(i.mon) === cleanMonSelect && i.question !== '')
        .map(i => i.chuDe))].filter(topic => topic !== "");

    if (topics.length === 0) {
        container.innerHTML = "Không tìm thấy chủ đề cho môn này.";
        return;
    }

    const hasSpecificPermissions = allowed.length > 0;

    container.innerHTML = topics.map(topic => {
        const isAllowed = !hasSpecificPermissions || allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${escapeHTML(topic)}" ${isAllowed ? 'checked' : ''}> ${escapeHTML(topic)}
        </label>`;
    }).join('');
};

window.toggleAllTopics = function() {
    const checkboxes = document.querySelectorAll('input[name="topic"]');
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('saved_maHS', maHS);
    localStorage.removeItem('cache_quiz_data_' + maHS);

    const container = document.getElementById('topic-container');
    if (container) container.innerHTML = "Đang tải dữ liệu chủ đề...";

    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    script.onerror = () => { 
        script.remove(); 
        if (container) container.innerHTML = "Lỗi kết nối tải dữ liệu.";
    };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (!data || data.error) {
        const container = document.getElementById('topic-container');
        if (container) container.innerHTML = "Không thể tải dữ liệu từ máy chủ.";
        return;
    }
    
    let lastMon = '';
    let lastChuDe = '';
    let lastLevel = '';
    let lastLoai = '';
    let lastPassage = '';
    let lastMade = '';

    AppState.allQuizData = (data.questions || [])
        .map(rawItem => {
            let item = normalizeItem(rawItem);
            if (!item) return null;

            if (item.mon) lastMon = item.mon;
            else item.mon = lastMon;

            if (item.mon) {
                item.mon = standardizeSubject(item.mon);
            }

            if (item.chuDe) lastChuDe = item.chuDe;
            else item.chuDe = lastChuDe;

            if (item.level) lastLevel = item.level;
            else if (lastLevel) item.level = lastLevel;

            if (item.loai) lastLoai = item.loai;
            else if (lastLoai) item.loai = lastLoai;

            if (item.made) lastMade = item.made;
            else if (lastMade) item.made = lastMade;

            let chuDeUpper = String(item.chuDe || '').toUpperCase();
            let isDH = chuDeUpper.startsWith('DH');
            let isTV = chuDeUpper.startsWith('TV');

            if (item.passage) {
                lastPassage = item.passage;
            } else if (!isDH && !isTV) {
                lastPassage = ''; 
            } else if (lastPassage) {
                item.passage = lastPassage;
            }

            return item;
        })
        .filter(item => item && item.question !== '' && item.mon !== '');
        
    let lastMaHS = '';
    let lastPermMon = '';
    AppState.userPermissions = (data.permissions || []).map(p => {
        let maHS = String(p.maHS || p[0] || '').trim();
        let mon = String(p.mon || p[1] || '').trim();
        let chuDe = String(p.chuDe || p[2] || '').trim();
        
        if (maHS !== '') lastMaHS = maHS;
        else maHS = lastMaHS;
        
        if (mon !== '') {
            mon = standardizeSubject(mon);
            lastPermMon = mon;
        } else {
            mon = lastPermMon;
        }
        
        return { maHS, mon, chuDe };
    }).filter(p => p.chuDe !== '');

    AppState.rankings = data.rankings || [];

    const maHS = document.getElementById('student-code').value.trim();
    localStorage.setItem('cache_quiz_data_' + maHS, JSON.stringify(data));

    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        const currentVal = subjectSelect.value;
        const subjects = [...new Set(AppState.allQuizData.map(i => i.mon).filter(Boolean))];
        subjectSelect.innerHTML = `<option value="">-- Chọn môn --</option>` + 
            subjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
        if (subjects.includes(currentVal)) {
            subjectSelect.value = currentVal;
        }
    }

    const madeSelect = document.getElementById('made-select');
    const madeContainer = document.getElementById('made-container');
    if (madeSelect && madeContainer) {
        const mades = [...new Set(AppState.allQuizData.map(i => i.made).filter(Boolean))];
        if (mades.length > 0) {
            madeContainer.style.display = 'block';
            madeSelect.innerHTML = `<option value="">-- Tất cả mã đề --</option>` + 
                mades.map(m => `<option value="${escapeHTML(m)}">Mã đề: ${escapeHTML(m)}</option>`).join('');
        } else {
            madeContainer.style.display = 'none';
        }
    }

    window.renderLeaderboard();
    window.updateTopicList();
    window.updateLevelOptions();
    window.updateMadePassagePreview();
};

window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.className = "leaderboard-container";
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => cleanKey(item.subject || item.mon || '') === cleanKey(subjectFilter));
    }
    const qualifiedData = data.filter(item => item.score >= 8);
    if (qualifiedData.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 15px; color: #888;">Chưa có dữ liệu xếp hạng (>= 8).</div>`;
        return;
    }
    const top3 = qualifiedData.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        let dateDisplay = item.date ? `<span class="time-text">Ngày: ${escapeHTML(item.date)}</span>` : "";
        let levelDisplay = item.level ? ` - <span style="font-size:0.85em;">${escapeHTML(item.level)}</span>` : "";
        return `<div class="leaderboard-item"><div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b>${levelDisplay}${dateDisplay}</div><span class="score-badge">${item.score} đ</span></div>`;
    }).join('');
};

function getOriginalCorrectKey(item) {
    const raw = String(item.correct || '').trim();
    if (!raw) return '';
    const upper = raw.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) {
        return upper.toLowerCase();
    }
    for (let key of ['a', 'b', 'c', 'd']) {
        if (item[key] && String(item[key]).trim().toLowerCase() === raw.toLowerCase()) {
            return key;
        }
    }
    return raw; 
}

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select') ? document.getElementById('level-select').value : '';
    const selectedMade = document.getElementById('made-select') ? document.getElementById('made-select').value.trim() : '';
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (!selectedTopics.length) return alert("Vui lòng chọn chủ đề!");
    
    let readingTopics = selectedTopics.filter(t => {
        let u = t.toUpperCase();
        return u.startsWith('DH') || u.startsWith('TV');
    });
    let normalTopics = selectedTopics.filter(t => {
        let u = t.toUpperCase();
        return !u.startsWith('DH') && !u.startsWith('TV');
    });

    let readingQuestions = AppState.allQuizData.filter(i => {
        const isSameSubject = (cleanKey(i.mon) === cleanKey(mon));
        const isTopicMatch = readingTopics.includes(i.chuDe);
        const isMadeMatch = !selectedMade || (String(i.made).trim() === selectedMade);
        return isSameSubject && isTopicMatch && isMadeMatch && i.question !== '';
    });

    let normalQuestions = [];
    if (normalTopics.length > 0) {
        let filteredNormal = AppState.allQuizData.filter(i => {
            const isSameSubject = (cleanKey(i.mon) === cleanKey(mon));
            const isTopicMatch = normalTopics.includes(i.chuDe);
            const isLevelMatch = (cleanKey(mon) !== cleanKey('Tiếng Anh')) || (String(i.level).trim() === String(levelSelected).trim());
            const isMadeMatch = !selectedMade || (String(i.made).trim() === selectedMade);
            return isSameSubject && isTopicMatch && isLevelMatch && isMadeMatch && i.question !== '';
        });
        normalQuestions = filteredNormal.sort(() => 0.5 - Math.random()).slice(0, 20);
    }

    let rawSelectedQuestions = [...readingQuestions, ...normalQuestions];
    if (rawSelectedQuestions.length === 0) return alert("Không tìm thấy câu hỏi phù hợp cho lựa chọn này!");

    let isReadingComp = readingTopics.length > 0;
    
    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        let chuDeU = String(item.chuDe || '').toUpperCase();
        let isSpecial = chuDeU.startsWith('DH') || chuDeU.startsWith('TV');
        let shuffledKeys = isSpecial ? validKeys : [...validKeys].sort(() => 0.5 - Math.random());

        return {
            ...item,
            _shuffledKeys: shuffledKeys,
            _correctKey: originalCorrectKey
        };
    });

    AppState.isReadingComp = isReadingComp;
    AppState.correctCount = 0; 
    AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    const oldResult = document.getElementById('result-container');
    if (oldResult) oldResult.remove();

    window.renderQuiz();
    
    let totalSeconds = 10 * 60;
    if (isReadingComp) {
        totalSeconds = 22 * 60; 
    } else if (cleanKey(mon) === cleanKey('Toán')) {
        totalSeconds = 15 * 60;
    }
    window.startTimerTotal(totalSeconds);
};

window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    if (!container) return;

    let renderedPassages = new Set();
    let html = '';

    AppState.currentQuizData.forEach((item, index) => {
        let passage = item.passage;
        let chuDe = item.chuDe;

        if (passage && passage.trim() !== '' && !renderedPassages.has(passage)) {
            renderedPassages.add(passage);
            html += `
                <div class="passage-box">
                    <div class="passage-tag">${escapeHTML(chuDe)}</div>
                    <div>
                        <button class="speaker-btn" data-question="${escapeHTML(passage)}" onclick="window.handleSpeak(this)">🔊 Nghe đoạn văn</button>
                    </div>
                    <div style="white-space: pre-line; margin-top: 10px; max-height: 250px; overflow-y: auto;">${escapeHTML(passage)}</div>
                </div>
            `;
        }

        let loaiVal = (item.loai || '').toLowerCase();
        let hasNoOptions = (!item.a || item.a.trim() === '') &&
                            (!item.b || item.b.trim() === '') &&
                            (!item.c || item.c.trim() === '') &&
                            (!item.d || item.d.trim() === '');
        let isVoca = loaiVal.includes('voca') || loaiVal.includes('dien') || loaiVal.includes('từ') || hasNoOptions;
        
        let questionText = item.question;
        let explanationText = item.explanation || 'Không có giải thích.';

        let speakerBtn = '';
        let bodyHtml = '';

        if (cleanKey(item.mon) === cleanKey('Tiếng Anh')) {
            let chuDeLower = String(item.chuDe || '').toLowerCase();
            let loaiLower = String(item.loai || '').toLowerCase();
            
            if (isVoca) {
                const hasVietnameseChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(questionText);
                const isVietAnh = chuDeLower.includes('việt anh') || chuDeLower.includes('viet anh') || 
                                  loaiLower.includes('việt anh') || loaiLower.includes('viet anh') || 
                                  hasVietnameseChars;
                const isAnhViet = chuDeLower.includes('anh việt') || chuDeLower.includes('anh viet') || 
                                  loaiLower.includes('anh việt') || loaiLower.includes('anh viet') || 
                                  (!hasVietnameseChars && !isVietAnh);

                let placeholderText = "Nhập đáp án tiếng Anh...";
                let speakTextContent = questionText;
                let speakerLabel = '🔊 Nghe từ tiếng Anh';

                if (isVietAnh) {
                    placeholderText = "Nhập đáp án tiếng Anh...";
                    speakerLabel = '🔊 Nghe từ tiếng Anh';
                    speakTextContent = item._correctKey || questionText;
                } else if (isAnhViet) {
                    placeholderText = "Nhập đáp án tiếng Việt...";
                    speakerLabel = '🔊 Nghe từ tiếng Anh';
                    speakTextContent = questionText;
                }

                speakerBtn = `<button class="speaker-btn" data-question="${escapeHTML(speakTextContent)}" onclick="window.handleSpeak(this)">${speakerLabel}</button>`;

                bodyHtml = `
                    <div style="margin-top: 10px;">
                        <input type="text" id="voca-input-${index}" placeholder="${placeholderText}">
                        <button type="button" onclick="window.checkVocaAnswer(${index})" style="margin-top: 8px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Kiểm tra</button>
                    </div>
                `;
            } else {
                speakerBtn = `<button class="speaker-btn" data-question="${escapeHTML(questionText)}" onclick="window.handleSpeak(this)">🔊 Nghe câu hỏi</button>`;
                let keysToRender = item._shuffledKeys.length > 0 ? item._shuffledKeys : ['a', 'b', 'c', 'd'].filter(k => item[k]);
                bodyHtml = keysToRender.map((optKey, displayIndex) => {
                    if (!item[optKey]) return '';
                    let displayLetter = String.fromCharCode(65 + displayIndex);
                    return `<div class="option-box" data-orig-key="${optKey}" onclick="window.checkAnswer(this, '${optKey}', ${index})">
                        <b>${displayLetter}.</b> ${escapeHTML(item[optKey])}
                    </div>`;
                }).join('');
            }
        } else {
            let keysToRender = item._shuffledKeys.length > 0 ? item._shuffledKeys : ['a', 'b', 'c', 'd'].filter(k => item[k]);
            bodyHtml = keysToRender.map((optKey, displayIndex) => {
                if (!item[optKey]) return '';
                let displayLetter = String.fromCharCode(65 + displayIndex);
                return `<div class="option-box" data-orig-key="${optKey}" onclick="window.checkAnswer(this, '${optKey}', ${index})">
                    <b>${displayLetter}.</b> ${escapeHTML(item[optKey])}
                </div>`;
            }).join('');
        }

        html += `<div class="quiz-card" id="q-card-${index}">
            <p><b>Câu ${index + 1}:</b> ${escapeHTML(questionText)}</p>
            ${speakerBtn}
            ${bodyHtml}
            <div class="explanation-box" id="exp-${index}"><b>Giải thích:</b> ${escapeHTML(explanationText)}</div>
        </div>`;
    });

    container.innerHTML = html;
};

window.handleSpeak = function(btn) {
    const text = btn.getAttribute('data-question');
    window.speakText(text);
};

function updateScoreDisplay() {
    const correctEls = document.querySelectorAll('#correct-count-display');
    const wrongEls = document.querySelectorAll('#wrong-count-display');
    correctEls.forEach(el => el.textContent = AppState.correctCount);
    wrongEls.forEach(el => el.textContent = AppState.wrongCount);
}

window.checkAnswer = function(element, chosenKey, index) {
    const card = document.getElementById(`q-card-${index}`);
    if (card.getAttribute('data-answered') === 'true') return;
    card.setAttribute('data-answered', 'true');

    const item = AppState.currentQuizData[index];
    const correctKey = item._correctKey;
    
    item._userChoiceKey = chosenKey;

    const options = card.querySelectorAll('.option-box');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        const optOrigKey = opt.getAttribute('data-orig-key');
        if (optOrigKey === correctKey) {
            opt.style.backgroundColor = '#d1e7dd';
            opt.style.borderColor = '#0f5132';
            opt.style.color = '#0f5132';
        }
    });

    if (chosenKey === correctKey) {
        AppState.correctCount++;
        element.style.backgroundColor = '#d1e7dd';
        element.style.borderColor = '#0f5132';
    } else {
        AppState.wrongCount++;
        AppState.wrongQuestions.push(item);
        element.style.backgroundColor = '#f8d7da';
        element.style.borderColor = '#842029';
    }

    updateScoreDisplay();

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';
    checkQuizFinished();
};

window.checkVocaAnswer = function(index) {
    const card = document.getElementById(`q-card-${index}`);
    if (card.getAttribute('data-answered') === 'true') return;
    
    const input = document.getElementById(`voca-input-${index}`);
    if (!input) return;
    const userVal = input.value.trim();
    if (!userVal) return alert("Vui lòng nhập câu trả lời!");
    
    card.setAttribute('data-answered', 'true');
    input.disabled = true;

    const item = AppState.currentQuizData[index];
    item._userTextChoice = userVal;

    const correctVal = item._correctKey || item.correct || '';
    const isCorrect = cleanKey(userVal) === cleanKey(correctVal);

    if (isCorrect) {
        AppState.correctCount++;
        input.style.backgroundColor = '#d1e7dd';
        input.style.borderColor = '#0f5132';
    } else {
        AppState.wrongCount++;
        AppState.wrongQuestions.push(item);
        input.style.backgroundColor = '#f8d7da';
        input.style.borderColor = '#842029';
    }

    updateScoreDisplay();

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';
    checkQuizFinished();
};

function checkQuizFinished() {
    const cards = document.querySelectorAll('.quiz-card');
    const answeredCards = document.querySelectorAll('.quiz-card[data-answered="true"]');
    if (cards.length > 0 && cards.length === answeredCards.length) {
        setTimeout(() => {
            window.submitQuiz();
        }, 1000);
    }
}

window.startTimerTotal = function(seconds) {
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    let timeLeft = seconds;

    updateScoreDisplay();

    AppState.timerInterval = setInterval(() => {
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        const timerDisplays = document.querySelectorAll('#timer-display');
        timerDisplays.forEach(el => {
            el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        });
        if (timeLeft <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Hết giờ làm bài!");
            window.submitQuiz();
        }
        timeLeft--;
    }, 1000);
};

window.submitQuiz = function() {
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);

    const totalQ = AppState.currentQuizData.length;
    
    AppState.currentQuizData.forEach((item, index) => {
        const card = document.getElementById(`q-card-${index}`);
        if (card && card.getAttribute('data-answered') !== 'true') {
            AppState.wrongCount++;
            if (!AppState.wrongQuestions.includes(item)) {
                AppState.wrongQuestions.push(item);
            }
        }
    });

    let score = totalQ > 0 ? (AppState.correctCount / totalQ) * 10 : 0;
    score = Math.round(score * 100) / 100;

    const maHS = document.getElementById('student-code').value.trim() || 'Huy';
    const mon = document.getElementById('subject-select').value;
    const level = document.getElementById('level-select') ? document.getElementById('level-select').value : '1';
    const today = new Date().toLocaleDateString('vi-VN');

    if (!AppState.rankings) AppState.rankings = [];
    AppState.rankings.push({
        name: maHS,
        subject: mon,
        score: score,
        level: level,
        date: today
    });

    localStorage.setItem('cached_rankings', JSON.stringify(AppState.rankings));

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'none';

    let startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'block';

    let resultContainer = document.getElementById('result-container');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.id = 'result-container';
        resultContainer.className = 'container';
        document.body.appendChild(resultContainer);
    }

    resultContainer.innerHTML = `
        <h2 style="text-align: center; color: #007bff;">🎉 Tổng Kết Bài Làm</h2>
        <p>Học sinh: <b>${escapeHTML(maHS)}</b></p>
        <p>Môn: <b>${escapeHTML(mon)}</b></p>
        <p>Số câu đúng: <span style="color: green; font-weight: bold;">${AppState.correctCount}</span> / ${totalQ}</p>
        <p>Điểm số: <span class="score-badge" style="font-size: 1.2em;">${score} đ</span></p>
        
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="window.viewDetailedReview()" style="flex: 1; background: #17a2b8; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">🔍 Xem lại chi tiết</button>
            ${AppState.wrongQuestions.length > 0 ? `<button id="retry-wrong-btn" onclick="window.retryWrongQuestions()" style="flex: 1; background: #d9534f; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">🔄 Làm lại câu sai (${AppState.wrongQuestions.length})</button>` : ''}
        </div>

        <button onclick="window.location.reload()" style="background: #6c757d; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin-top: 10px; width: 100%; font-weight: bold;">🏠 Về màn hình chính</button>
        
        <div id="detailed-review-container" style="margin-top: 20px;"></div>
    `;
    window.renderLeaderboard(mon);
};

window.viewDetailedReview = function() {
    const container = document.getElementById('detailed-review-container');
    if (!container) return;

    let reviewHtml = '<h3 style="border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-top: 20px;">📖 Chi Tiết Bài Làm:</h3>';

    AppState.currentQuizData.forEach((item, index) => {
        let userChoice = item._userChoiceKey;
        let correctKey = item._correctKey;
        let isCorrect = (userChoice === correctKey);

        let optionsHtml = '';
        ['a', 'b', 'c', 'd'].forEach((key, optIdx) => {
            if (!item[key]) return;
            let letter = String.fromCharCode(65 + optIdx);
            let style = "padding: 8px 12px; margin: 4px 0; border-radius: 6px; border: 1px solid #ccc;";
            
            if (key === correctKey) {
                style += " background-color: #d1e7dd; border-color: #0f5132; font-weight: bold; color: #0f5132;";
            } else if (key === userChoice && !isCorrect) {
                style += " background-color: #f8d7da; border-color: #842029; text-decoration: line-through; color: #842029;";
            }
            optionsHtml += `<div style="${style}"><b>${letter}.</b> ${escapeHTML(item[key])}</div>`;
        });

        reviewHtml += `
            <div class="quiz-card" style="border-color: ${isCorrect ? '#28a745' : '#dc3545'};">
                <p><b>Câu ${index + 1}:</b> ${escapeHTML(item.question)} <span style="float: right; font-weight: bold; color: ${isCorrect ? '#28a745' : '#dc3545'};">${isCorrect ? '✔ Đúng' : '✘ Sai'}</span></p>
                ${optionsHtml}
                <div class="explanation-box" style="display: block; margin-top: 10px;"><b>Giải thích:</b> ${escapeHTML(item.explanation || 'Không có giải thích.')}</div>
            </div>
        `;
    });

    container.innerHTML = reviewHtml;
};

window.retryWrongQuestions = function() {
    if (!AppState.wrongQuestions || AppState.wrongQuestions.length === 0) return;
    AppState.currentQuizData = [...AppState.wrongQuestions];
    AppState.wrongQuestions = [];
    AppState.correctCount = 0;
    AppState.wrongCount = 0;

    const resContainer = document.getElementById('result-container');
    if (resContainer) resContainer.remove();

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) {
        quizScreen.style.display = 'block';
        window.renderQuiz();
        window.startTimerTotal(10 * 60);
    }
};

window.speakText = function(text) {
    if (!('speechSynthesis' in window)) {
        alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
};
