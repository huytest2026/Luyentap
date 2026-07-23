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

function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function cleanOptionText(text) {
    if (!text) return '';
    return String(text).replace(/^[a-dA-D][\.\)]\s*/, '').trim();
}

function updateScoreDisplay() {
    const correctEl = document.getElementById('correct-count-display');
    const wrongEl = document.getElementById('wrong-count-display');
    if (correctEl) correctEl.innerText = AppState.correctCount;
    if (wrongEl) wrongEl.innerText = AppState.wrongCount;
}

(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        .explanation-box { margin-top: 15px; padding: 12px; background: #fff3cd; border-left: 5px solid #ffc107; border-radius: 4px; display: none; color: #856404; font-size: 0.95em; line-height: 1.4; }
        .leaderboard-container { background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: #4f46e5; }
        .speech-btn { background: #ffc107; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 0.85em; font-weight: bold; color: #000; display: inline-flex; align-items: center; gap: 4px; }
        .speech-btn:hover { background: #e0a800; }
        .passage-box { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; font-size: 1.05em; line-height: 1.6; color: #333; }
        .passage-tag { display: inline-block; background: #e9ecef; border: 1px solid #ced4da; padding: 5px 15px; font-weight: bold; border-radius: 6px; margin-bottom: 12px; color: #333; font-size: 1em; }
        input[type="text"], select { width: 100%; padding: 12px 15px; margin: 8px 0 15px 0; border: 1px solid #540606; border-radius: 8px; box-sizing: border-box; font-size: 1em; background: #ffffff; color: #000; }
        #topic-container { width: 100%; background: #ffffff; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0 15px 0; box-sizing: border-box; min-height: 50px; max-height: 200px; overflow-y: auto; }
        body.dark-mode { background-color: #121212 !important; color: #e0e0e0; }
        body.dark-mode .container { background: #1e1e1e; color: #e0e0e0; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        body.dark-mode .quiz-card, body.dark-mode .passage-box, body.dark-mode .leaderboard-container { background: #2d2d2d; border-color: #777; color: #e0e0e0; }
        body.dark-mode .option-box { background: #3a3a3a; border-color: #666; color: #e0e0e0; }
        body.dark-mode .option-box:hover { background: #4a4a4a; border-color: #888; }
        body.dark-mode input[type="text"], body.dark-mode select { background: #2d2d2d; color: #e0e0e0; border-color: #777; }
        body.dark-mode #topic-container { background: #2d2d2d; border-color: #777; color: #e0e0e0; }
        .dark-mode-btn { position: absolute; top: 20px; right: 20px; background: #ffffff; color: #333; border: 2px solid #540606; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.9em; z-index: 10; }
    `;
    document.head.appendChild(style);
})();

if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
}

window.speakQuestion = function(index) {
    const item = AppState.currentQuizData[index];
    if (!item) return;
    const chuDeLower = (item.chuDe || '').toLowerCase();
    const isVietAnh = chuDeLower.includes('việt anh') || chuDeLower.includes('viet anh');
    let textToRead = isVietAnh ? item.correct : item.question;
    if (textToRead && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
};

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
    if (cleanM.includes('anh') || cleanM.includes('english')) return 'Tiếng Anh';
    if (cleanM.includes('toan') || cleanM.includes('math')) return 'Toán';
    if (cleanM.includes('tiengviet') || cleanM.includes('tv')) return 'Tiếng Việt';
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
                        if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
                    }
                }
            }
            return '';
        };
        return {
            mon: findKey(['mon', 'môn', 'subject']),
            chuDe: findKey(['chude', 'chủ đề', 'chu de', 'topic']),
            question: findKey(['question', 'noidungcauhoi', 'noi_dung_cau_hoi', 'noi_dung', 'noidung', 'cauhoi', 'cau_hoi', 'cau', 'de_bai', 'de', 'nd', 'content', 'text']),
            a: findKey(['a', 'dapan_a', 'dap an a', 'đáp án a', 'option_a']),
            b: findKey(['b', 'dapan_b', 'dap an b', 'đáp án b', 'option_b']),
            c: findKey(['c', 'dapan_c', 'dap an c', 'đáp án c', 'option_c']),
            d: findKey(['d', 'dapan_d', 'dap an d', 'đáp án d', 'option_d']),
            correct: findKey(['correct', 'dapan_dung', 'dap an dung', 'đáp án đúng', 'dapandung', 'đáp_án_đúng', 'answer']),
            explanation: findKey(['explanation', 'giaithich', 'giai_thich', 'diễn giải', 'dien giai', 'giải thích']),
            loai: findKey(['loai', 'loại', 'type']),
            level: findKey(['level', 'cấp độ', 'cap do', 'muc do']),
            passage: findKey(['passage', 'doanvan', 'đoạn văn', 'doan_van', 'đoạn_văn', 'noidungdoanvan', 'reading']),
            made: findKey(['made', 'ma_de', 'mã đề', 'madề'])
        };
    }
    let values = Array.isArray(item) ? item : [];
    if (values.length === 0) return null;
    let hasStt = /^\d+$/.test(String(values[0]).trim());
    const getVal = (indexWithoutId) => {
        let idx = hasStt ? indexWithoutId + 1 : indexWithoutId;
        return (idx < values.length && values[idx] !== null) ? String(values[idx]).trim() : '';
    };
    return {
        mon: getVal(0), chuDe: getVal(1), question: getVal(2),
        a: getVal(3), b: getVal(4), c: getVal(5), d: getVal(6),
        correct: getVal(7), explanation: getVal(8), loai: getVal(9),
        level: getVal(10), passage: getVal(11), made: getVal(12)
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
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    window.loadData();
});

window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('dark-mode-toggle-btn');
    if (btn) btn.innerHTML = isDark ? '☀️ Sáng' : '🌙 Tối';
};

window.toggleMadeMode = function() {
    const checkbox = document.getElementById('toggle-made');
    const madeContainer = document.getElementById('made-container');
    const madeSelect = document.getElementById('made-select');
    
    if (!checkbox || !madeContainer) return;
    
    if (checkbox.checked) {
        madeContainer.style.display = 'block';
        window.updateMadePassagePreview();
    } else {
        madeContainer.style.display = 'none';
        if (madeSelect) madeSelect.value = '';
        window.handleMadeChange();
    }
};

window.handleSubjectChange = function() {
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    if (levelContainer) levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    
    const toggleMade = document.getElementById('toggle-made');
    const madeContainer = document.getElementById('made-container');
    const madeSelect = document.getElementById('made-select');
    
    if (toggleMade) toggleMade.checked = false;
    if (madeContainer) madeContainer.style.display = 'none';
    if (madeSelect) madeSelect.value = '';

    window.updateMadePassagePreview();
    window.updateTopicList();
    window.renderLeaderboard(mon);
};

window.updateMadePassagePreview = function() {
    const monSelect = document.getElementById('subject-select') ? document.getElementById('subject-select').value.trim() : '';
    const madeSelect = document.getElementById('made-select');
    if (!madeSelect) return;
    if (!monSelect) {
        madeSelect.innerHTML = '<option value="">-- Chọn mã đề --</option>';
        return;
    }
    const cleanMon = cleanKey(monSelect);
    const mades = [...new Set(AppState.allQuizData
        .filter(i => cleanKey(i.mon) === cleanMon && i.made && String(i.made).trim() !== '')
        .map(i => String(i.made).trim())
    )];
    
    madeSelect.innerHTML = `<option value="">-- Chọn mã đề --</option>` + 
        mades.map(m => `<option value="${escapeHTML(m)}">Mã đề: ${escapeHTML(m)}</option>`).join('');
}

window.handleMadeChange = function() {
    const toggleMade = document.getElementById('toggle-made');
    const selectedMade = (toggleMade && toggleMade.checked && document.getElementById('made-select')) ? document.getElementById('made-select').value.trim() : '';
    const previewDiv = document.getElementById('made-passage-preview');
    if (!previewDiv) return;

    if (!selectedMade) {
        previewDiv.innerHTML = '';
        window.updateTopicList();
        return;
    }

    const matchedItem = AppState.allQuizData.find(i => String(i.made).trim() === selectedMade && i.passage && i.passage.trim() !== '');
    if (matchedItem) {
        previewDiv.innerHTML = `
            <div class="passage-box" style="margin-top: 10px; font-size: 0.95em;">
                <div class="passage-tag">Đoạn văn mã đề: ${escapeHTML(selectedMade)}</div>
                <div style="white-space: pre-line; margin-top: 8px;">${escapeHTML(matchedItem.passage)}</div>
            </div>`;
    } else {
        previewDiv.innerHTML = '';
    }
    window.updateTopicList();
};

window.updateTopicList = function() {
    const monSelect = document.getElementById('subject-select') ? document.getElementById('subject-select').value.trim() : '';
    const maHS = document.getElementById('student-code').value.trim();
    const toggleMade = document.getElementById('toggle-made');
    const selectedMade = (toggleMade && toggleMade.checked && document.getElementById('made-select')) ? document.getElementById('made-select').value.trim() : '';
    const container = document.getElementById('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade) {
        container.innerHTML = `<i style="color: #666;">Đang bật chế độ làm theo Mã đề [${escapeHTML(selectedMade)}]. Sẽ làm toàn bộ câu hỏi theo mã đề này.</i>`;
        return;
    }

    const cleanMonSelect = cleanKey(monSelect);
    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && cleanKey(p.mon) === cleanMonSelect)
        .map(p => String(p.chuDe).trim());

    const topics = [...new Set(AppState.allQuizData
        .filter(i => cleanKey(i.mon) === cleanMonSelect && i.question !== '')
        .map(i => i.chuDe))].filter(Boolean);

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
    checkboxes.forEach(cb => cb.checked = !allChecked);
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('saved_maHS', maHS);

    const container = document.getElementById('topic-container');
    if (container) container.innerHTML = "Đang tải dữ liệu chủ đề...";

    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    script.onerror = () => { script.remove(); if (container) container.innerHTML = "Lỗi kết nối tải dữ liệu."; };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (!data || data.error) return;
    let lastMon = '', lastChuDe = '', lastLevel = '', lastLoai = '', lastPassage = '', lastMade = '';

    AppState.allQuizData = (data.questions || []).map(rawItem => {
        let item = normalizeItem(rawItem);
        if (!item) return null;
        if (item.mon) lastMon = item.mon; else item.mon = lastMon;
        if (item.mon) item.mon = standardizeSubject(item.mon);
        if (item.chuDe) lastChuDe = item.chuDe; else item.chuDe = lastChuDe;
        if (item.level) lastLevel = item.level; else if (lastLevel) item.level = lastLevel;
        if (item.loai) lastLoai = item.loai; else if (lastLoai) item.loai = lastLoai;
        if (item.made) lastMade = item.made; else if (lastMade) item.made = lastMade;
        if (item.passage) lastPassage = item.passage; else if (lastPassage) item.passage = lastPassage;
        return item;
    }).filter(item => item && item.question !== '' && item.mon !== '' && cleanKey(item.mon) !== 'id');

    AppState.userPermissions = (data.permissions || []).map(p => ({
        maHS: String(p.maHS || p[0] || '').trim(),
        mon: standardizeSubject(String(p.mon || p[1] || '').trim()),
        chuDe: String(p.chuDe || p[2] || '').trim()
    })).filter(p => p.chuDe !== '');

    AppState.rankings = data.rankings || [];

    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        const subjects = [...new Set(AppState.allQuizData.map(i => i.mon).filter(s => s && cleanKey(s) !== 'id'))];
        subjectSelect.innerHTML = `<option value="">-- Chọn môn --</option>` + subjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
    }

    window.renderLeaderboard();
    window.updateTopicList();
    window.updateMadePassagePreview();
};

window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => cleanKey(item.subject || item.mon || '') === cleanKey(subjectFilter));
    }
    const qualifiedData = data.filter(item => item.score >= 8);
    if (qualifiedData.length === 0) {
        list.innerHTML = `<p style="color: #666;">Chưa có dữ liệu xếp hạng (>= 8).</p>`;
        return;
    }
    const top3 = qualifiedData.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        return `<div class="leaderboard-item"><div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b></div><span class="score-badge">${item.score} đ</span></div>`;
    }).join('');
};

function getOriginalCorrectKey(item) {
    const raw = String(item.correct || '').trim();
    if (!raw) return '';
    const upper = raw.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) return upper.toLowerCase();
    for (let key of ['a', 'b', 'c', 'd']) {
        if (item[key] && cleanOptionText(String(item[key])).toLowerCase() === cleanOptionText(raw).toLowerCase()) return key;
    }
    return raw;
}

window.startQuiz = function() {
    const mon = document.getElementById('subject-select') ? document.getElementById('subject-select').value : '';
    if (!mon) return alert("Vui lòng chọn môn học trước khi bắt đầu!");

    const toggleMade = document.getElementById('toggle-made');
    const selectedMade = (toggleMade && toggleMade.checked && document.getElementById('made-select')) ? document.getElementById('made-select').value.trim() : '';
    
    let rawSelectedQuestions = [];
    let totalSeconds = 10 * 60;
    const cleanM = standardizeSubject(mon);

    if (selectedMade) {
        rawSelectedQuestions = AppState.allQuizData.filter(i => cleanKey(i.mon) === cleanKey(mon) && String(i.made).trim() === selectedMade && i.question !== '');
        totalSeconds = 45 * 60;
    } else {
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        if (!selectedTopics.length) return alert("Vui lòng chọn chủ đề!");
        rawSelectedQuestions = AppState.allQuizData.filter(i => cleanKey(i.mon) === cleanKey(mon) && selectedTopics.includes(i.chuDe) && i.question !== '');

        rawSelectedQuestions = shuffleArray(rawSelectedQuestions);

        let targetCount = 10;
        if (cleanM === 'Tiếng Anh') {
            targetCount = 20;
            totalSeconds = 10 * 60;
        } else if (cleanM === 'Toán') {
            targetCount = 10;
            totalSeconds = 20 * 60;
        } else if (cleanM === 'Tiếng Việt') {
            targetCount = 10;
            totalSeconds = 15 * 60;
        }

        if (rawSelectedQuestions.length > targetCount) {
            rawSelectedQuestions = rawSelectedQuestions.slice(0, targetCount);
        }
    }

    if (rawSelectedQuestions.length === 0) return alert("Không tìm thấy câu hỏi phù hợp!");

    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        validKeys = shuffleArray(validKeys);
        return { ...item, _shuffledKeys: validKeys, _correctKey: originalCorrectKey };
    });

    AppState.correctCount = 0;
    AppState.wrongCount = 0;

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'block';

    updateScoreDisplay();
    window.renderQuiz();
    window.startTimerTotal(totalSeconds);
};

window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    if (!container) return;

    let renderedPassages = new Set();
    let html = '';

    AppState.currentQuizData.forEach((item, index) => {
        let passage = item.passage;
        if (passage && passage.trim() !== '' && !renderedPassages.has(passage)) {
            renderedPassages.add(passage);
            html += `
                <div class="passage-box">
                    <div class="passage-tag">Đoạn văn đọc hiểu</div>
                    <div style="white-space: pre-line; margin-top: 10px;">${escapeHTML(passage)}</div>
                </div>
            `;
        }

        let keysToRender = item._shuffledKeys || ['a', 'b', 'c', 'd'].filter(k => item[k]);
        let bodyHtml = '';

        if (keysToRender.length === 0) {
            bodyHtml = `
                <div style="margin-top: 12px;">
                    <input type="text" id="input-answer-${index}" placeholder="Nhập đáp án của bạn..." style="margin-bottom: 8px;" onkeydown="if(event.key==='Enter') window.submitTextAnswer(${index})">
                    <button type="button" onclick="window.submitTextAnswer(${index})" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Gửi đáp án</button>
                </div>
            `;
        } else {
            bodyHtml = keysToRender.map((optKey, displayIndex) => {
                if (!item[optKey]) return '';
                let displayLetter = String.fromCharCode(65 + displayIndex);
                let cleanText = cleanOptionText(item[optKey]);
                return `
                    <div class="option-box" onclick="window.selectAnswer(${index}, '${optKey}')" id="q${index}-opt-${optKey}">
                        <b>${displayLetter}.</b> ${escapeHTML(cleanText)}
                    </div>
                `;
            }).join('');
        }

        // Kiểm tra nếu là môn Tiếng Việt thì không hiển thị nút Nghe
        const isVietnamese = cleanKey(item.mon).includes('tiengviet') || cleanKey(item.mon).includes('tv');
        let speechBtnHtml = isVietnamese ? '' : `<button type="button" class="speech-btn" onclick="window.speakQuestion(${index})">🔊 Nghe</button>`;

        html += `
            <div class="quiz-card" id="question-card-${index}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #540606;">Câu ${index + 1}:</div>
                    ${speechBtnHtml}
                </div>
                <div style="margin-bottom: 12px; font-weight: 500; white-space: pre-line;">${escapeHTML(item.question)}</div>
                ${bodyHtml}
                <div class="explanation-box" id="explanation-${index}">
                    <b>💡 Giải thích:</b> ${escapeHTML(item.explanation || 'Không có giải thích.')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
};

window.selectAnswer = function(index, optKey) {
    const item = AppState.currentQuizData[index];
    if (item._isAnswered) return;
    item._isAnswered = true;
    item._userAnswer = optKey;

    let correctKey = item._correctKey;
    let isCorrect = (optKey.toLowerCase() === correctKey.toLowerCase());

    if (isCorrect) {
        AppState.correctCount++;
        const box = document.getElementById(`q${index}-opt-${optKey}`);
        if (box) { box.style.background = '#d4edda'; box.style.borderColor = '#28a745'; }
    } else {
        AppState.wrongCount++;
        const wrongBox = document.getElementById(`q${index}-opt-${optKey}`);
        if (wrongBox) { wrongBox.style.background = '#f8d7da'; wrongBox.style.borderColor = '#dc3545'; }
        if (correctKey) {
            const correctBox = document.getElementById(`q${index}-opt-${correctKey}`);
            if (correctBox) { correctBox.style.background = '#d4edda'; correctBox.style.borderColor = '#28a745'; }
        }
    }

    updateScoreDisplay();

    item._shuffledKeys.forEach(k => {
        const el = document.getElementById(`q${index}-opt-${k}`);
        if (el) el.style.pointerEvents = 'none';
    });

    const expBox = document.getElementById(`explanation-${index}`);
    if (expBox) expBox.style.display = 'block';
};

window.submitTextAnswer = function(index) {
    const item = AppState.currentQuizData[index];
    if (item._isAnswered) return;

    const inputEl = document.getElementById(`input-answer-${index}`);
    if (!inputEl) return;
    let userVal = inputEl.value.trim();
    if (!userVal) return alert("Vui lòng nhập câu trả lời!");

    item._isAnswered = true;
    item._userAnswer = userVal;

    let correctVal = String(item.correct || '').trim();
    let isCorrect = removeDiacritics(userVal).toLowerCase() === removeDiacritics(correctVal).toLowerCase();

    if (isCorrect) {
        AppState.correctCount++;
        inputEl.style.background = '#d4edda';
        inputEl.style.borderColor = '#28a745';
    } else {
        AppState.wrongCount++;
        inputEl.style.background = '#f8d7da';
        inputEl.style.borderColor = '#dc3545';
    }
    inputEl.disabled = true;

    updateScoreDisplay();

    const expBox = document.getElementById(`explanation-${index}`);
    if (expBox) {
        expBox.innerHTML = `<b>💡 Đáp án đúng:</b> ${escapeHTML(correctVal)}<br><b>💡 Giải thích:</b> ${escapeHTML(item.explanation || 'Không có giải thích.')}`;
        expBox.style.display = 'block';
    }
};

window.startTimerTotal = function(durationSeconds) {
    clearInterval(AppState.timerInterval);
    let remainingTime = durationSeconds;
    const timerDisplay = document.getElementById('timer-display');
    
    AppState.timerInterval = setInterval(() => {
        remainingTime--;
        let minutes = Math.floor(remainingTime / 60);
        let seconds = remainingTime % 60;
        if (timerDisplay) {
            timerDisplay.innerHTML = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        if (remainingTime <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Đã hết thời gian làm bài!");
            window.submitQuiz();
        }
    }, 1000);
};

window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    let totalQuestions = AppState.currentQuizData.length;
    let score = Math.round((AppState.correctCount / totalQuestions) * 10 * 10) / 10;
    
    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'none';

    let resultContainer = document.getElementById('result-container');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.id = 'result-container';
        resultContainer.className = 'container';
        document.body.appendChild(resultContainer);
    }

    resultContainer.innerHTML = `
        <h2 style="text-align: center; color: #540606;">Kết Quả Bài Làm</h2>
        <p style="font-size: 1.1em; text-align: center;">Số câu hỏi đúng: <b>${AppState.correctCount} / ${totalQuestions}</b></p>
        <p style="font-size: 1.3em; text-align: center; color: #28a745; font-weight: bold;">Điểm số: ${score} đ</p>
        <div style="text-align: center; margin-top: 20px;">
            <button type="button" onclick="window.location.reload()" style="padding: 12px 25px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Làm bài mới</button>
        </div>
    `;
};

window.backToHome = function() {
    if (confirm("Bạn có chắc muốn thoát ra màn hình chính? Bài làm hiện tại sẽ không được lưu.")) {
        if (typeof AppState !== 'undefined' && AppState.timerInterval) {
            clearInterval(AppState.timerInterval);
        }
        document.getElementById('quiz-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
        const resContainer = document.getElementById('result-container');
        if (resContainer) resContainer.remove();
    }
};
