// ==========================================
// FILE: script.js (Đã hỗ trợ cả câu hỏi trắc nghiệm lẫn tự luận nhập chữ)
// ==========================================

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

function cleanOptionText(text) {
    if (!text) return '';
    return String(text).replace(/^[a-dA-D][\.\)]\s*/, '').trim();
}

function updateScoreDisplay() {
    const correctEl = document.getElementById('custom-correct-count');
    const wrongEl = document.getElementById('custom-wrong-count');
    if (correctEl) correctEl.innerText = AppState.correctCount;
    if (wrongEl) wrongEl.innerText = AppState.wrongCount;
}

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
        
        .custom-quiz-header {
            position: sticky;
            top: 0;
            background: #ffffff;
            border: 2px solid #540606;
            border-radius: 12px;
            padding: 12px 15px;
            margin-bottom: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .custom-header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .home-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.9em;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .home-btn:hover { background: #5a6268; }
        .timer-display {
            font-weight: bold;
            color: #dc3545;
            font-size: 1.1em;
        }
        .score-display-box {
            text-align: center;
            font-weight: bold;
            font-size: 1.05em;
            border-top: 1px solid #eee;
            padding-top: 8px;
        }

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

        body.dark-mode { background-color: #121212 !important; color: #e0e0e0; }
        body.dark-mode .container { background: #1e1e1e; color: #e0e0e0; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        body.dark-mode .quiz-card, body.dark-mode .passage-box, body.dark-mode .leaderboard-container, body.dark-mode .custom-quiz-header { background: #2d2d2d; border-color: #777; color: #e0e0e0; }
        body.dark-mode .option-box { background: #3a3a3a; border-color: #666; color: #e0e0e0; }
        body.dark-mode .option-box:hover { background: #4a4a4a; border-color: #888; }
        body.dark-mode input[type="text"], body.dark-mode select { background: #2d2d2d; color: #e0e0e0; border-color: #777; }
        body.dark-mode #topic-container { background: #2d2d2d; border-color: #777; color: #e0e0e0; }
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
            z-index: 10;
        }
    `;
    document.head.appendChild(style);
})();

if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
}

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

window.handleSubjectChange = function() {
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    if (levelContainer) levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    window.updateTopicList();
    window.updateLevelOptions();
    window.renderLeaderboard(mon);
    window.updateMadePassagePreview();
};

window.updateTopicList = function() {
    const monSelect = document.getElementById('subject-select') ? document.getElementById('subject-select').value.trim() : '';
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
    }).filter(item => item && item.question !== '' && item.mon !== '');

    AppState.userPermissions = (data.permissions || []).map(p => ({
        maHS: String(p.maHS || p[0] || '').trim(),
        mon: standardizeSubject(String(p.mon || p[1] || '').trim()),
        chuDe: String(p.chuDe || p[2] || '').trim()
    })).filter(p => p.chuDe !== '');

    AppState.rankings = data.rankings || [];

    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        const subjects = [...new Set(AppState.allQuizData.map(i => i.mon).filter(Boolean))];
        subjectSelect.innerHTML = `<option value="">-- Chọn môn --</option>` + subjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
    }

    window.renderLeaderboard();
    window.updateTopicList();
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

    const selectedMade = document.getElementById('made-select') ? document.getElementById('made-select').value.trim() : '';
    let rawSelectedQuestions = [];
    let totalSeconds = 10 * 60;

    if (selectedMade) {
        rawSelectedQuestions = AppState.allQuizData.filter(i => cleanKey(i.mon) === cleanKey(mon) && String(i.made).trim() === selectedMade && i.question !== '');
        totalSeconds = 45 * 60;
    } else {
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
        if (!selectedTopics.length) return alert("Vui lòng chọn chủ đề!");
        rawSelectedQuestions = AppState.allQuizData.filter(i => cleanKey(i.mon) === cleanKey(mon) && selectedTopics.includes(i.chuDe) && i.question !== '');
    }

    if (rawSelectedQuestions.length === 0) return alert("Không tìm thấy câu hỏi phù hợp!");

    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        return { ...item, _shuffledKeys: validKeys, _correctKey: originalCorrectKey };
    });

    AppState.correctCount = 0;
    AppState.wrongCount = 0;
    let totalQuestions = AppState.currentQuizData.length;

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) {
        quizScreen.style.display = 'block';
        
        Array.from(quizScreen.children).forEach(child => {
            if (child.id !== 'custom-quiz-header' && child.id !== 'quiz') {
                child.remove();
            }
        });

        let customHeader = document.getElementById('custom-quiz-header');
        if (!customHeader) {
            customHeader = document.createElement('div');
            customHeader.id = 'custom-quiz-header';
            customHeader.className = 'custom-quiz-header';
            quizScreen.insertBefore(customHeader, quizScreen.firstChild);
        }
        customHeader.innerHTML = `
            <div class="custom-header-top">
                <button class="home-btn" onclick="window.returnHome()">🏠 Trang chủ</button>
                <div class="timer-display" id="custom-timer-display">⏱️ Thời gian: 00:00</div>
            </div>
            <div class="score-display-box">
                Đúng: <span id="custom-correct-count" style="color: #28a745; font-weight: bold;">0</span> | 
                Sai: <span id="custom-wrong-count" style="color: #dc3545; font-weight: bold;">0</span> | 
                Tổng số câu: <span style="color: #4f46e5; font-weight: bold;">${totalQuestions}</span>
            </div>
        `;
    }

    const oldResult = document.getElementById('result-container');
    if (oldResult) oldResult.remove();

    window.renderQuiz();
    window.startTimerTotal(totalSeconds);
};

window.returnHome = function() {
    if (confirm("Bạn có chắc chắn muốn rời khỏi bài thi để về trang chủ?")) {
        clearInterval(AppState.timerInterval);
        const quizScreen = document.getElementById('quiz-screen');
        if (quizScreen) quizScreen.style.display = 'none';
        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.style.display = 'block';
        const oldResult = document.getElementById('result-container');
        if (oldResult) oldResult.remove();
    }
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
                    <div class="passage-tag">${escapeHTML(item.chuDe)}</div>
                    <div style="white-space: pre-line; margin-top: 10px;">${escapeHTML(passage)}</div>
                </div>
            `;
        }

        let keysToRender = item._shuffledKeys || ['a', 'b', 'c', 'd'].filter(k => item[k]);
        let bodyHtml = '';

        if (keysToRender.length === 0) {
            // Dạng câu hỏi tự luận / điền từ vựng (không có A, B, C, D)
            bodyHtml = `
                <div style="margin-top: 12px;">
                    <input type="text" id="input-answer-${index}" placeholder="Nhập đáp án của bạn..." style="margin-bottom: 8px;" onkeydown="if(event.key==='Enter') window.submitTextAnswer(${index})">
                    <button onclick="window.submitTextAnswer(${index})" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Gửi đáp án</button>
                </div>
            `;
        } else {
            // Dạng trắc nghiệm thông thường
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

        html += `
            <div class="quiz-card" id="question-card-${index}">
                <div style="font-weight: bold; margin-bottom: 8px; color: #540606;">Câu ${index + 1}:</div>
                <div style="margin-bottom: 12px; font-weight: 500; white-space: pre-line;">${escapeHTML(item.question)}</div>
                ${bodyHtml}
                <div class="explanation-box" id="explanation-${index}">
                    <b>💡 Giải thích:</b> ${escapeHTML(item.explanation || 'Không có giải thích.')}
                </div>
            </div>
        `;
    });

    html += `<button onclick="window.submitQuiz()" style="width: 100%; padding: 15px; background: #28a745; color: white; border: none; border-radius: 8px; font-size: 1.1em; font-weight: bold; cursor: pointer; margin-top: 20px;">Nộp bài</button>`;
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
    const timerDisplay = document.getElementById('custom-timer-display');
    
    AppState.timerInterval = setInterval(() => {
        remainingTime--;
        let minutes = Math.floor(remainingTime / 60);
        let seconds = remainingTime % 60;
        if (timerDisplay) {
            timerDisplay.innerHTML = `⏱️ Thời gian: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
        <p style="font-size: 1.1em; text-align: center;">Số câu đúng: <b>${AppState.correctCount} / ${totalQuestions}</b></p>
        <p style="font-size: 1.3em; text-align: center; color: #28a745; font-weight: bold;">Điểm số: ${score} đ</p>
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 12px 25px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Làm bài mới</button>
        </div>
    `;
};
