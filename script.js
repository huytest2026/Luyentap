const AppState = {
    allQuizData: [],
    userPermissions: [],
    rankings: [],
    currentQuizData: [],
    timerInterval: null,
    correctCount: 0,
    wrongCount: 0,
    wrongQuestions: []
};

window.handleMadeChange = function() {
    const madeSelect = document.getElementById('made-select');
    const previewEl = document.getElementById('made-passage-preview');
    if (!madeSelect || !previewEl) return;
    
    const selectedMade = madeSelect.value.trim();
    if (!selectedMade) {
        previewEl.innerHTML = '';
        return;
    }

    const found = AppState.allQuizData.find(i => String(i.made).trim() === selectedMade && i.passage && i.passage.trim() !== '');
    if (found) {
        const subText = escapeHTML(found.passage.substring(0, 150));
        previewEl.innerHTML = '<div style="background: #f8f9fa; border: 1px solid #540606; padding: 10px; border-radius: 6px; margin-top: 5px; font-size: 0.9em;"><b style="color: #540606;">📄 Xem trước đoạn văn:</b><br>' + subText + '...</div>';
    } else {
        previewEl.innerHTML = '';
    }
};

window.toggleMadeMode = function() {
    const toggleMade = document.getElementById('toggle-made');
    if (!toggleMade) return;

    let madeContainer = document.getElementById('made-container');
    const topicContainer = document.getElementById('topic-container');
    const topicWrapper = topicContainer ? topicContainer.previousElementSibling : null;
    const selectAllBtn = document.querySelector('button[onclick*="toggleAllTopics"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chọn/Bỏ chọn tất cả'));

    const isChecked = toggleMade.checked;

    if (madeContainer) madeContainer.style.display = isChecked ? 'block' : 'none';
    if (topicContainer) topicContainer.style.display = isChecked ? 'none' : 'block';
    if (topicWrapper && topicWrapper !== madeContainer) topicWrapper.style.display = isChecked ? 'none' : 'block';
    if (selectAllBtn) selectAllBtn.style.display = isChecked ? 'none' : 'inline-block';

    if (isChecked) {
        window.updateMadeList();
    }
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

function getStoredWrongQuestions(maHS, mon) {
    try {
        const data = localStorage.getItem('wrong_q_' + maHS + '_' + mon);
        return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
}

function saveStoredWrongQuestions(maHS, mon, wrongs) {
    try {
        localStorage.setItem('wrong_q_' + maHS + '_' + mon, JSON.stringify(wrongs));
    } catch(e) {}
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
        body.dark-mode .quiz-card, body.dark-mode .passage-box { background: #2d2d2d; border-color: #777; color: #e0e0e0; }
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
    const isIrregularVerbs = chuDeLower.includes('dongtubatquytac') || chuDeLower.includes('động từ bất quy tắc');

    let textToRead = '';
    if (isVietAnh) {
        textToRead = item.correct;
    } else if (isIrregularVerbs) {
        let match = item.question.match(/["']([^"']+)["']/);
        if (match) {
            textToRead = match[1].trim();
        } else {
            let matchDt = item.question.match(/(?:động từ|từ)\s+["']?([a-zA-Z\-]+)["']?/i);
            if (matchDt) {
                textToRead = matchDt[1].trim();
            } else {
                let cleanQ = item.question.toLowerCase()
                    .replace(/dạng quá khứ|v2|v3|của|động từ|là gì|\(|\)|\?/g, '')
                    .trim();
                textToRead = cleanQ || item.question;
            }
        }
    } else {
        textToRead = item.question;
    }

    if (textToRead) {
        textToRead = textToRead.replace(/_+/g, ', ');
    }

    if (textToRead && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
};

function escapeHTML(str) {
    if (!str) return '';
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
    const savedMa = localStorage.getItem('saved_maHS') || '';
    const input = document.getElementById('student-code');
    if (input && savedMa) input.value = savedMa;

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

    if (startScreen && !document.getElementById('practice-wrong-btn')) {
        const wrongBtn = document.createElement('button');
        wrongBtn.id = 'practice-wrong-btn';
        wrongBtn.type = 'button';
        wrongBtn.innerHTML = '🔄 Luyện tập lại các câu đã làm sai';
        wrongBtn.style.cssText = 'width: 100%; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px; font-weight: bold;';
        wrongBtn.onclick = window.startWrongQuiz;
        
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.parentNode.insertBefore(wrongBtn, startBtn.nextSibling);
        }
    }

    if (savedMa) {
        window.loadData();
    }
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
    window.updateMadeList();
    window.renderLeaderboard(mon);
};

window.updateMadeList = function() {
    const monSelect = document.getElementById('subject-select') ? document.getElementById('subject-select').value.trim() : '';
    const madeSelect = document.getElementById('made-select');
    if (!madeSelect || !monSelect) return;

    const cleanMonSelect = cleanKey(monSelect);
    const mades = [...new Set(AppState.allQuizData
        .filter(i => cleanKey(i.mon) === cleanMonSelect && i.made && String(i.made).trim() !== '')
        .map(i => String(i.made).trim())
    )].filter(Boolean);

    madeSelect.innerHTML = '<option value="">-- Chọn mã đề --</option>' + mades.map(m => '<option value="' + escapeHTML(m) + '">Mã đề: ' + escapeHTML(m) + '</option>').join('');
};

window.updateTopicList = function() {
    const monSelect = document.getElementById('subject-select') ? document.getElementById('subject-select').value.trim() : '';
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !monSelect) return;

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

    const authorizedTopics = topics.filter(topic => allowed.includes(topic));

    if (authorizedTopics.length === 0) {
        container.innerHTML = '<i style="color: #d9534f;">Bạn chưa được phân quyền chủ đề nào cho môn này.</i>';
        return;
    }

    container.innerHTML = authorizedTopics.map(topic => {
        return '<label style="display:block; margin:5px 0;"><input type="checkbox" name="topic" value="' + escapeHTML(topic) + '" checked> ' + escapeHTML(topic) + '</label>';
    }).join('');
};

window.toggleAllTopics = function() {
    const checkboxes = document.querySelectorAll('input[name="topic"]');
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
};

window.initInterface = function() {
    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        const subjects = [...new Set(AppState.allQuizData.map(i => i.mon).filter(s => s && cleanKey(s) !== 'id'))];
        subjectSelect.innerHTML = '<option value="">-- Chọn môn --</option>' + subjects.map(s => '<option value="' + escapeHTML(s) + '">' + escapeHTML(s) + '</option>').join('');
    }
    window.renderLeaderboard();
    window.updateTopicList();
    window.updateMadeList();
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('saved_maHS', maHS);

    const container = document.getElementById('topic-container');
    if (container) container.innerHTML = "Đang tải dữ liệu...";

    const API_URL = "https://script.google.com/macros/s/AKfycbwABOWdjRcG_rX9tVXjrLDsXFRMEbgUfn01QC6U5Z91qwdwq5askg7CrQHEDjf8np-H/exec";
    const script = document.createElement('script');
    script.src = API_URL + '?ma=' + encodeURIComponent(maHS) + '&callback=handleQuizData';
    script.onerror = () => { 
        script.remove(); 
        if (container) container.innerHTML = "Lỗi kết nối mạng khi tải dữ liệu."; 
    };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (data && !data.error && data.questions && data.questions.length > 0) {
        let lastMon = '', lastChuDe = '', lastLevel = '', lastLoai = '', lastPassage = '', lastMade = '';

        AppState.allQuizData = (data.questions || []).map(rawItem => {
            let item = normalizeItem(rawItem);
            if (!item) return null;

            if (item.mon) {
                lastMon = standardizeSubject(item.mon);
                lastChuDe = ''; lastLevel = ''; lastLoai = ''; lastPassage = ''; lastMade = '';
            }
            item.mon = lastMon;

            if (item.made) {
                if (item.made !== lastMade) lastPassage = '';
                lastMade = item.made;
            } else if (lastMade) {
                item.made = lastMade;
            }

            if (item.chuDe) lastChuDe = item.chuDe; else item.chuDe = lastChuDe;
            if (item.level) lastLevel = item.level; else if (lastLevel) item.level = lastLevel;
            if (item.loai) lastLoai = item.loai; else if (lastLoai) item.loai = lastLoai;
            if (item.passage) lastPassage = item.passage; else if (lastPassage) item.passage = lastPassage;

            return item;
        }).filter(item => item && item.question !== '' && item.mon !== '' && cleanKey(item.mon) !== 'id');

        AppState.userPermissions = (data.permissions || []).map(p => ({
            maHS: String(p.maHS || p[0] || '').trim(),
            mon: standardizeSubject(String(p.mon || p[1] || '').trim()),
            chuDe: String(p.chuDe || p[2] || '').trim()
        })).filter(p => p.chuDe !== '');

        AppState.rankings = data.rankings || [];
    }

    window.initInterface();
};

window.renderLeaderboard = function(subjectFilter) {
    const listEl = document.getElementById('ranking-list');
    if (!listEl) return;

    let filtered = AppState.rankings;
    if (subjectFilter && subjectFilter !== 'all') {
        filtered = filtered.filter(item => String(item.subject).trim().toLowerCase() === String(subjectFilter).trim().toLowerCase());
    }

    // Lọc điểm >= 8 và sắp xếp giảm dần theo điểm
    filtered = filtered.filter(item => Number(item.score) >= 8)
                       .sort((a, b) => Number(b.score) - Number(a.score));

    if (filtered.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">Chưa có dữ liệu xếp hạng.</p>';
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    
    filtered.forEach((item, index) => {
        let medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : (index + 1)));
        
        // Hiển thị thêm thông tin Môn học và Thời gian vào dòng của từng học sinh
        html += `<div style="display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 10px 12px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2em; font-weight: bold; min-width: 25px;">${medal}</span>
                <div>
                    <div style="font-weight: bold; color: #333;">${item.name}</div>
                    <div style="font-size: 0.85em; color: #666; margin-top: 2px;">
                        📚 Môn: <span style="color: #007bff; font-weight: 500;">${item.subject || 'N/A'}</span> &nbsp;|&nbsp; 
                        ⏰ ${item.date || ''}
                    </div>
                </div>
            </div>
            <div style="background: #e3f2fd; color: #0d6efd; font-weight: bold; padding: 4px 10px; border-radius: 20px; font-size: 0.9em;">
                ${item.score} đ
            </div>
        </div>`;
    });
    
    html += '</div>';
    listEl.innerHTML = html;
};

function getCorrectKeys(item) {
    const raw = String(item.correct || '').trim();
    if (!raw) return [];
    let parts = raw.split(/[\s,;]+/);
    let keys = [];
    for (let p of parts) {
        let upper = p.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(upper)) {
            keys.push(upper.toLowerCase());
        } else {
            for (let k of ['a', 'b', 'c', 'd']) {
                if (item[k] && cleanOptionText(String(item[k])).toLowerCase() === cleanOptionText(p).toLowerCase()) {
                    keys.push(k);
                }
            }
        }
    }
    return [...new Set(keys)];
}

window.startQuiz = function() {
    const mon = document.getElementById('subject-select') ? document.getElementById('subject-select').value : '';
    if (!mon) return alert("Vui lòng chọn môn học trước khi bắt đầu!");

    const maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : localStorage.getItem('saved_maHS');
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

        const isIrregularVerbs = selectedTopics.some(t => 
            cleanKey(t).includes('dongtubatquytac') || 
            t.toLowerCase().includes('động từ bất quy tắc')
        );

        let storedWrongs = getStoredWrongQuestions(maHS, mon);
        let targetCount = 20;

        let topicPool = AppState.allQuizData.filter(i => 
            cleanKey(i.mon) === cleanKey(mon) && 
            selectedTopics.includes(i.chuDe) && 
            i.question !== ''
        );

        let uniquePool = [];
        let seenQ = new Set();
        for (let item of topicPool) {
            if (!seenQ.has(item.question + (item.a || ''))) {
                seenQ.add(item.question + (item.a || ''));
                uniquePool.push(item);
            }
        }

        if (isIrregularVerbs) {
            targetCount = 10;
            totalSeconds = 10 * 60;

            let verbMap = {};
            uniquePool.forEach(item => {
                let verb = '';
                let match = item.question.match(/["']([^"']+)["']/);
                if (match) {
                    verb = match[1].toLowerCase().trim();
                } else {
                    let matchDt = item.question.match(/(?:động từ|từ)\s+["']?([a-zA-Z\-]+)["']?/i);
                    if (matchDt) {
                        verb = matchDt[1].toLowerCase().trim();
                    } else {
                        let cleanQ = item.question.toLowerCase()
                            .replace(/dạng quá khứ|v2|v3|của|động từ|là gì|\(|\)|\?/g, '')
                            .trim();
                        verb = cleanQ || item.question.toLowerCase();
                    }
                }

                if (!verbMap[verb]) {
                    verbMap[verb] = { textQ: [], mcqQ: [] };
                }
                let hasOptions = item.a || item.b || item.c || item.d;
                if (!hasOptions) {
                    verbMap[verb].textQ.push(item);
                } else {
                    verbMap[verb].mcqQ.push(item);
                }
            });

            let finalSelected = [];
            let verbs = Object.keys(verbMap);
            verbs = shuffleArray(verbs);

            for (let v of verbs) {
                if (finalSelected.length >= 10) break;
                let group = verbMap[v];
                if (group.textQ.length > 0 && finalSelected.length < 10) {
                    finalSelected.push(group.textQ[Math.floor(Math.random() * group.textQ.length)]);
                }
                if (group.mcqQ.length > 0 && finalSelected.length < 10) {
                    finalSelected.push(group.mcqQ[Math.floor(Math.random() * group.mcqQ.length)]);
                }
            }
            rawSelectedQuestions = finalSelected;
        } else {
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

            let wrongPool = uniquePool.filter(i => storedWrongs.some(w => w.question === i.question && w.chuDe === i.chuDe));
            let normalPool = shuffleArray(uniquePool.filter(i => !storedWrongs.some(w => w.question === i.question && w.chuDe === i.chuDe)));

            rawSelectedQuestions = [...wrongPool, ...normalPool];

            if (rawSelectedQuestions.length > targetCount) {
                rawSelectedQuestions = rawSelectedQuestions.slice(0, targetCount);
            }
        }
    }

    if (rawSelectedQuestions.length === 0) return alert("Không tìm thấy câu hỏi phù hợp!");

    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let correctKeys = getCorrectKeys(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        validKeys = shuffleArray(validKeys);

        return { ...item, _shuffledKeys: validKeys, _correctKeys: correctKeys };
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

window.startWrongQuiz = function() {
    const mon = document.getElementById('subject-select') ? document.getElementById('subject-select').value : '';
    if (!mon) return alert("Vui lòng chọn môn học để ôn tập câu sai!");

    const maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : localStorage.getItem('saved_maHS');
    let storedWrongs = getStoredWrongQuestions(maHS, mon);

    if (storedWrongs.length === 0) {
        return alert("Tuyệt vời! Bạn chưa có câu hỏi sai nào cần luyện tập lại trong môn này.");
    }

    let rawSelectedQuestions = AppState.allQuizData.filter(i => 
        cleanKey(i.mon) === cleanKey(mon) && 
        storedWrongs.some(w => w.question === i.question) && 
        i.question !== ''
    );

    if (rawSelectedQuestions.length === 0) {
        return alert("Không tìm thấy dữ liệu câu sai tương ứng trong hệ thống!");
    }

    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let correctKeys = getCorrectKeys(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        validKeys = shuffleArray(validKeys);

        return { ...item, _shuffledKeys: validKeys, _correctKeys: correctKeys };
    });

    AppState.correctCount = 0;
    AppState.wrongCount = 0;

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'block';

    updateScoreDisplay();
    window.renderQuiz();
    window.startTimerTotal(10 * 60);
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
            html += '<div class="passage-box"><div class="passage-tag">Đoạn văn đọc hiểu</div><div style="white-space: pre-line; margin-top: 10px;">' + escapeHTML(passage) + '</div></div>';
        }

        let hasOptions = item.a || item.b || item.c || item.d;
        let bodyHtml = '';
        let correctKeys = item._correctKeys || [];
        let isMultiChoice = correctKeys.length > 1;

        if (hasOptions) {
            let keysToRender = item._shuffledKeys || ['a', 'b', 'c', 'd'].filter(k => item[k]);
            bodyHtml = keysToRender.map((optKey, displayIndex) => {
                if (!item[optKey]) return '';
                let displayLetter = String.fromCharCode(65 + displayIndex);
                let cleanText = cleanOptionText(item[optKey]);
                
                if (isMultiChoice) {
                    return '<label class="option-box" style="display: block; cursor: pointer;" id="q' + index + '-opt-' + optKey + '">' +
                           '<input type="checkbox" name="multi-q' + index + '" value="' + optKey + '" style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer;">' +
                           '<b>' + displayLetter + '.</b> ' + escapeHTML(cleanText) + '</label>';
                } else {
                    return '<div class="option-box" onclick="window.selectAnswer(' + index + ', \'' + optKey + '\')" id="q' + index + '-opt-' + optKey + '"><b>' + displayLetter + '.</b> ' + escapeHTML(cleanText) + '</div>';
                }
            }).join('');

            if (isMultiChoice) {
                bodyHtml += '<button type="button" onclick="window.submitMultiAnswer(' + index + ')" id="multi-btn-' + index + '" style="margin-top: 10px; background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Xác nhận đáp án</button>';
            }
        } else {
            bodyHtml = '<div style="margin-top: 10px;"><input type="text" id="text-input-' + index + '" placeholder="Nhập đáp án..."><button type="button" onclick="window.submitTextAnswer(' + index + ')" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: inline-block;">Gửi đáp án</button></div>';
        }

        const cleanMon = cleanKey(item.mon);
        const isMathOrVietnamese = cleanMon.includes('toan') || cleanMon.includes('math') || cleanMon.includes('tiengviet') || cleanMon.includes('tv');
        let speechBtnHtml = isMathOrVietnamese ? '' : '<button type="button" class="speech-btn" onclick="window.speakQuestion(' + index + ')">🔊 Nghe</button>';

        html += '<div class="quiz-card" id="question-card-' + index + '"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><div style="font-weight: bold; color: #540606;">Câu ' + (index + 1) + ':</div>' + speechBtnHtml + '</div><div style="margin-bottom: 12px; font-weight: 500; white-space: pre-line;">' + escapeHTML(item.question) + '</div>' + bodyHtml + '<div class="explanation-box" id="explanation-' + index + '"><b>💡 Giải thích:</b> ' + escapeHTML(item.explanation || 'Không có giải thích.') + '</div></div>';
    });

    container.innerHTML = html;
};

window.selectAnswer = function(index, optKey) {
    const item = AppState.currentQuizData[index];
    if (item._isAnswered) return;
    item._isAnswered = true;
    item._userAnswer = [optKey];

    let correctKeys = item._correctKeys || [];
    let correctKey = correctKeys[0] || '';
    let isCorrect = (optKey.toLowerCase() === correctKey.toLowerCase());

    const maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : localStorage.getItem('saved_maHS');
    let storedWrongs = getStoredWrongQuestions(maHS, item.mon);

    if (isCorrect) {
        AppState.correctCount++;
        const box = document.getElementById('q' + index + '-opt-' + optKey);
        if (box) { box.style.background = '#d4edda'; box.style.borderColor = '#28a745'; }
        storedWrongs = storedWrongs.filter(w => w.question !== item.question);
    } else {
        AppState.wrongCount++;
        const wrongBox = document.getElementById('q' + index + '-opt-' + optKey);
        if (wrongBox) { wrongBox.style.background = '#f8d7da'; wrongBox.style.borderColor = '#dc3545'; }
        if (correctKey) {
            const correctBox = document.getElementById('q' + index + '-opt-' + correctKey);
            if (correctBox) { correctBox.style.background = '#d4edda'; correctBox.style.borderColor = '#28a745'; }
        }
        if (!storedWrongs.some(w => w.question === item.question)) {
            storedWrongs.push({ question: item.question, chuDe: item.chuDe });
        }
    }
    saveStoredWrongQuestions(maHS, item.mon, storedWrongs);
    updateScoreDisplay();

    item._shuffledKeys.forEach(k => {
        const el = document.getElementById('q' + index + '-opt-' + k);
        if (el) el.style.pointerEvents = 'none';
    });

    const expBox = document.getElementById('explanation-' + index);
    if (expBox) expBox.style.display = 'block';
};

window.submitMultiAnswer = function(index) {
    const item = AppState.currentQuizData[index];
    if (item._isAnswered) return;

    const checkboxes = document.querySelectorAll('input[name="multi-q' + index + '"]');
    let userSelected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) userSelected.push(cb.value);
    });

    if (userSelected.length === 0) {
        return alert("Vui lòng chọn ít nhất một đáp án!");
    }

    item._isAnswered = true;
    item._userAnswer = userSelected;

    let correctKeys = item._correctKeys || [];
    let isCorrect = userSelected.length === correctKeys.length && userSelected.every(k => correctKeys.includes(k));

    const maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : localStorage.getItem('saved_maHS');
    let storedWrongs = getStoredWrongQuestions(maHS, item.mon);

    item._shuffledKeys.forEach(k => {
        const box = document.getElementById('q' + index + '-opt-' + k);
        const cb = box ? box.querySelector('input') : null;
        if (cb) cb.disabled = true;

        if (correctKeys.includes(k)) {
            if (box) { box.style.background = '#d4edda'; box.style.borderColor = '#28a745'; }
        } else if (userSelected.includes(k)) {
            if (box) { box.style.background = '#f8d7da'; box.style.borderColor = '#dc3545'; }
        }
    });

    const submitBtn = document.getElementById('multi-btn-' + index);
    if (submitBtn) submitBtn.disabled = true;

    if (isCorrect) {
        AppState.correctCount++;
        storedWrongs = storedWrongs.filter(w => w.question !== item.question);
    } else {
        AppState.wrongCount++;
        if (!storedWrongs.some(w => w.question === item.question)) {
            storedWrongs.push({ question: item.question, chuDe: item.chuDe });
        }
    }
    saveStoredWrongQuestions(maHS, item.mon, storedWrongs);
    updateScoreDisplay();

    const expBox = document.getElementById('explanation-' + index);
    if (expBox) expBox.style.display = 'block';
};

window.submitTextAnswer = function(index) {
    const item = AppState.currentQuizData[index];
    if (item._isAnswered) return;

    const inputEl = document.getElementById('text-input-' + index);
    if (!inputEl) return;
    const userVal = inputEl.value.trim();
    if (!userVal) return alert("Vui lòng nhập đáp án!");

    item._isAnswered = true;
    item._userAnswer = [userVal];

    let correctVal = String(item.correct || '').trim();
    let isCorrect = cleanKey(userVal) === cleanKey(correctVal);

    const maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : localStorage.getItem('saved_maHS');
    let storedWrongs = getStoredWrongQuestions(maHS, item.mon);

    if (isCorrect) {
        AppState.correctCount++;
        inputEl.style.background = '#d4edda';
        inputEl.style.borderColor = '#28a745';
        storedWrongs = storedWrongs.filter(w => w.question !== item.question);
    } else {
        AppState.wrongCount++;
        inputEl.style.background = '#f8d7da';
        inputEl.style.borderColor = '#dc3545';
        if (!storedWrongs.some(w => w.question === item.question)) {
            storedWrongs.push({ question: item.question, chuDe: item.chuDe });
        }
    }
    saveStoredWrongQuestions(maHS, item.mon, storedWrongs);
    updateScoreDisplay();

    inputEl.disabled = true;
    const btn = inputEl.nextElementSibling;
    if (btn) btn.disabled = true;

    const expBox = document.getElementById('explanation-' + index);
    if (expBox) {
        expBox.innerHTML = '<b>💡 Giải thích:</b> Đáp án đúng là: <b>' + escapeHTML(correctVal) + '</b>. ' + escapeHTML(item.explanation || '');
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
            timerDisplay.innerHTML = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
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
    
    // Lấy thông tin học sinh và môn học để gửi lên Google Sheets
    const maHS = document.getElementById('student-code') ? document.getElementById('student-code').value.trim() : localStorage.getItem('saved_maHS');
    const mon = document.getElementById('subject-select') ? document.getElementById('subject-select').value : '';
    const levelSelect = document.getElementById('level-select');
    const level = levelSelect ? levelSelect.value : '';

    // Gửi điểm tự động về Google Apps Script Web App
    const API_URL = "https://script.google.com/macros/s/AKfycbwABOWdjRcG_rX9tVXjrLDsXFRMEbgUfn01QC6U5Z91qwdwq5askg7CrQHEDjf8np-H/exec"; // Giữ nguyên URL hiện tại của bạn
    if (maHS && mon) {
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maHS: maHS, mon: mon, score: score, level: level })
        }).catch(err => console.log(err));
    }

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'none';

    let resultContainer = document.getElementById('result-container');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.id = 'result-container';
        resultContainer.className = 'container';
        document.body.appendChild(resultContainer);
    }

    resultContainer.innerHTML = '<h2 style="text-align: center; color: #540606;">Kết Quả Bài Làm</h2>' +
        '<p style="font-size: 1.1em; text-align: center;">Số câu hỏi đúng: <b>' + AppState.correctCount + ' / ' + totalQuestions + '</b></p>' +
        '<p style="font-size: 1.3em; text-align: center; color: #28a745; font-weight: bold;">Điểm số: ' + score + ' đ</p>' +
        '<div style="display: flex; gap: 10px; margin-top: 20px;">' +
        '<button type="button" onclick="window.location.reload()" style="flex: 1; padding: 12px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Làm bài mới</button>' +
        '<button type="button" onclick="window.viewReviewDetails()" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">🔍 Xem lại đề đã làm</button>' +
        '</div>' +
        '<div id="review-detail-box" style="margin-top: 20px;"></div>';
};

window.viewReviewDetails = function() {
    const box = document.getElementById('review-detail-box');
    if (!box) return;

    let html = '<h3 style="color: #540606; border-bottom: 2px solid #540606; padding-bottom: 5px;">Chi Tiết Bài Làm</h3>';

    AppState.currentQuizData.forEach((item, index) => {
        let hasOptions = item.a || item.b || item.c || item.d;
        let userAnswerText = 'Chưa trả lời';
        let correctAnswerText = '';
        let isCorrect = false;
        let correctKeys = item._correctKeys || [];
        let isMultiChoice = correctKeys.length > 1;

        if (hasOptions) {
            if (isMultiChoice) {
                correctAnswerText = correctKeys.map(k => k.toUpperCase() + '. ' + cleanOptionText(item[k])).join('; ');
                if (Array.isArray(item._userAnswer) && item._userAnswer.length > 0) {
                    userAnswerText = item._userAnswer.map(k => k.toUpperCase() + '. ' + cleanOptionText(item[k])).join('; ');
                    isCorrect = item._userAnswer.length === correctKeys.length && item._userAnswer.every(k => correctKeys.includes(k));
                }
            } else {
                let correctKey = correctKeys[0] || '';
                correctAnswerText = correctKey ? correctKey.toUpperCase() + '. ' + cleanOptionText(item[correctKey]) : item.correct;
                
                if (item._userAnswer && item._userAnswer.length > 0) {
                    let userKey = item._userAnswer[0];
                    userAnswerText = userKey.toUpperCase() + '. ' + cleanOptionText(item[userKey]);
                    isCorrect = (userKey.toLowerCase() === correctKey.toLowerCase());
                }
            }
        } else {
            correctAnswerText = item.correct;
            if (item._userAnswer && item._userAnswer.length > 0) {
                userAnswerText = item._userAnswer[0];
                isCorrect = (cleanKey(userAnswerText) === cleanKey(correctAnswerText));
            }
        }

        let statusColor = isCorrect ? 'green' : 'red';
        let statusText = isCorrect ? '✅ Đúng' : '❌ Sai';

        html += '<div style="background: #fff; border: 1px solid #ddd; padding: 12px; border-radius: 8px; margin-bottom: 10px;">' +
            '<div style="font-weight: bold; margin-bottom: 5px;">Câu ' + (index + 1) + ': ' + escapeHTML(item.question) + '</div>' +
            '<div style="font-size: 0.95em; color: ' + statusColor + '; font-weight: bold; margin-bottom: 4px;">Trạng thái: ' + statusText + '</div>' +
            '<div style="font-size: 0.95em;">Bạn chọn: <b>' + escapeHTML(userAnswerText) + '</b></div>' +
            '<div style="font-size: 0.95em; color: #28a745;">Đáp án đúng: <b>' + escapeHTML(correctAnswerText) + '</b></div>' +
            '</div>';
    });

    box.innerHTML = html;
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
