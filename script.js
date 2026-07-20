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
        .container { background: #bbe9f0; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 20px auto; }
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        .explanation-box { margin-top: 15px; padding: 12px; background: #fff3cd; border-left: 5px solid #ffc107; border-radius: 4px; display: none; color: #856404; font-size: 0.95em; line-height: 1.4; }
        .leaderboard-container { background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: #4f46e5; }
        .time-text { font-size: 0.8em; color: #888; display: block; }
        .speaker-btn { background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-bottom: 10px; }
        #retry-wrong-btn { background: #d9534f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; width: 100%; font-weight: bold; }
        
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
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

function normalizeItem(item) {
    const getVal = (keys) => {
        for (let k of keys) {
            if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '') return item[k];
            const foundKey = Object.keys(item).find(realKey => realKey.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) return item[foundKey];
        }
        return '';
    };

    return {
        mon: String(getVal(['mon', 'môn'])).trim(),
        chuDe: String(getVal(['chude', 'chủ đề', 'chu de'])).trim(),
        question: String(getVal(['question', 'noidungcauhoi', 'noi_dung_cau_hoi', 'noi dung cau hỏi'])).trim(),
        a: String(getVal(['a', 'dapan_a', 'dap an a', 'đáp án a'])).trim(),
        b: String(getVal(['b', 'dapan_b', 'dap an b', 'đáp án b'])).trim(),
        c: String(getVal(['c', 'dapan_c', 'dap an c', 'đáp án c'])).trim(),
        d: String(getVal(['d', 'dapan_d', 'dap an d', 'đáp án d'])).trim(),
        correct: String(getVal(['correct', 'dapan_dung', 'dap an dung', 'đáp án đúng', 'dapandung', 'đáp_án_đúng'])).trim(),
        explanation: String(getVal(['explanation', 'giaithich', 'giai_thich', 'diễn giải', 'dien giai'])).trim(),
        loai: String(getVal(['loai', 'loại'])).trim(),
        level: String(getVal(['level', 'cấp độ', 'cap do'])).trim(),
        passage: String(getVal(['passage', 'doanvan', 'đoạn văn', 'doan_van', 'đoạn_văn', 'noidungdoanvan', 'noidung', 'reading', 'content'])).trim()
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const savedMa = localStorage.getItem('saved_maHS') || 'Huy';
    const input = document.getElementById('student-code');
    if (input) input.value = savedMa;
    
    loadFromCache(savedMa);
    window.loadData();
});

function loadFromCache(maHS) {
    const cachedData = localStorage.getItem('cache_quiz_data_' + maHS);
    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            AppState.allQuizData = (data.questions || []).map(normalizeItem);
            AppState.userPermissions = data.permissions || [];
            AppState.rankings = data.rankings || [];
            window.renderLeaderboard();
            window.updateTopicList();
            window.updateLevelOptions();
        } catch(e) {}
    }
}

window.handleSubjectChange = function() {
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    if (levelContainer) {
        levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    }
    window.updateTopicList();
    window.updateLevelOptions();
    window.renderLeaderboard(mon);
};

window.updateLevelOptions = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelect = document.getElementById('level-select');
    if (!levelSelect) return;
    if (mon !== 'Tiếng Anh') return;

    const rankings = AppState.rankings || [];

    const passedLevel1 = rankings.some(r => {
        const rMon = String(r.subject || r.mon || '').trim().toLowerCase();
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === 'tiếng anh' && rLvl.includes('1') && rScore >= 8;
    });

    const passedLevel2 = rankings.some(r => {
        const rMon = String(r.subject || r.mon || '').trim().toLowerCase();
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === 'tiếng anh' && rLvl.includes('2') && rScore >= 8;
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
    const monSelect = document.getElementById('subject-select').value.trim().toLowerCase();
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !monSelect) return;

    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && String(p.mon).trim().toLowerCase() === monSelect)
        .map(p => String(p.chuDe).trim());

    const topics = [...new Set(AppState.allQuizData
        .filter(i => i.mon.toLowerCase() === monSelect)
        .map(i => i.chuDe))].filter(topic => topic !== "");

    if (topics.length === 0) {
        container.innerHTML = "Không tìm thấy chủ đề cho môn này.";
        return;
    }

    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${escapeHTML(topic)}" ${isAllowed ? 'checked' : 'disabled'}> ${escapeHTML(topic)}
        </label>`;
    }).join('');
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('saved_maHS', maHS);

    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    script.onerror = () => { script.remove(); };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (data.error) return;
    AppState.allQuizData = (data.questions || []).map(normalizeItem);
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];

    const maHS = document.getElementById('student-code').value.trim();
    localStorage.setItem('cache_quiz_data_' + maHS, JSON.stringify(data));

    window.renderLeaderboard();
    window.updateTopicList();
    window.updateLevelOptions();
};

window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.className = "leaderboard-container";
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => item.subject === subjectFilter);
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
        let levelDisplay = item.level ? ` - <span style="font-size:0.85em; color:#555;">${escapeHTML(item.level)}</span>` : "";
        return `<div class="leaderboard-item"><div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b>${levelDisplay}${dateDisplay}</div><span class="score-badge">${item.score} đ</span></div>`;
    }).join('');
};

function getOriginalCorrectKey(item) {
    const raw = item.correct;
    const upper = raw.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) {
        return upper.toLowerCase();
    }
    for (let key of ['a', 'b', 'c', 'd']) {
        if (item[key] && item[key].toLowerCase() === raw.toLowerCase()) {
            return key;
        }
    }
    return raw; 
}

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (!selectedTopics.length) return alert("Vui lòng chọn chủ đề!");
    
    let readingTopics = selectedTopics.filter(t => t.toUpperCase().startsWith('DH'));
    let normalTopics = selectedTopics.filter(t => !t.toUpperCase().startsWith('DH'));

    // Lấy câu hỏi đọc hiểu và giữ nguyên thứ tự sắp xếp như trong Google Sheets
    let readingQuestions = AppState.allQuizData.filter(i => {
        const isSameSubject = (i.mon.toLowerCase() === mon.trim().toLowerCase());
        const isTopicMatch = readingTopics.includes(i.chuDe);
        const isLevelMatch = (mon !== 'Tiếng Anh') || (i.level === String(levelSelected).trim());
        return isSameSubject && isTopicMatch && isLevelMatch;
    });

    let normalQuestions = [];
    if (normalTopics.length > 0) {
        let filteredNormal = AppState.allQuizData.filter(i => {
            const isSameSubject = (i.mon.toLowerCase() === mon.trim().toLowerCase());
            const isTopicMatch = normalTopics.includes(i.chuDe);
            const isLevelMatch = (mon !== 'Tiếng Anh') || (i.level === String(levelSelected).trim());
            return isSameSubject && isTopicMatch && isLevelMatch;
        });
        normalQuestions = filteredNormal.sort(() => 0.5 - Math.random()).slice(0, 20);
    }

    let rawSelectedQuestions = [...readingQuestions, ...normalQuestions];
    if (rawSelectedQuestions.length === 0) return alert("Không tìm thấy câu hỏi phù hợp cho lựa chọn này!");

    let isReadingComp = readingTopics.length > 0;
    
    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        
        let isDH = item.chuDe && item.chuDe.toUpperCase().startsWith('DH');
        
        // Bài đọc hiểu (DH): Giữ nguyên thứ tự đáp án gốc, không xáo trộn
        // Chủ đề thường: Xáo trộn ngẫu nhiên vị trí đáp án A, B, C, D
        let shuffledKeys = isDH ? validKeys : [...validKeys].sort(() => 0.5 - Math.random());

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
    window.renderQuiz();
    
    let totalSeconds = 10 * 60;
    if (isReadingComp) {
        totalSeconds = 22 * 60; 
    } else if (mon === 'Toán') {
        totalSeconds = 15 * 60;
    }
    window.startTimerTotal(totalSeconds);
};

window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    if (!container) return;

    let passageHtml = '';
    let passageItems = AppState.currentQuizData.filter(i => i.passage && i.passage.trim() !== '');
    if (passageItems.length > 0) {
        let uniquePassages = {};
        passageItems.forEach(item => {
            if (!uniquePassages[item.chuDe]) {
                uniquePassages[item.chuDe] = item.passage;
            }
        });

        for (let code in uniquePassages) {
            passageHtml += `
                <div class="passage-box">
                    <div class="passage-tag">${escapeHTML(code)}</div>
                    <div style="white-space: pre-line;">${escapeHTML(uniquePassages[code])}</div>
                </div>
            `;
        }
    }

    let questionsHtml = AppState.currentQuizData.map((item, index) => {
        let loaiVal = item.loai.toLowerCase();
        let hasNoOptions = (!item.a || item.a.trim() === '') &&
                           (!item.b || item.b.trim() === '') &&
                           (!item.c || item.c.trim() === '') &&
                           (!item.d || item.d.trim() === '');
        let isVoca = loaiVal.includes('voca') || loaiVal.includes('dien') || loaiVal.includes('từ') || hasNoOptions;
        
        let questionText = item.question;
        let explanationText = item.explanation || 'Không có giải thích.';

        let speakerBtn = '';
        if (item.mon.toLowerCase() === 'tiếng anh' && !item.chuDe.toUpperCase().startsWith('DH')) {
            let chuDeLower = String(item.chuDe || '').toLowerCase();
            let loaiLower = String(item.loai || '').toLowerCase();
            let speakTextContent = questionText;
            let speakerLabel = '🔊 Nghe câu hỏi';

            if (isVoca) {
                const hasVietnameseChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(questionText);
                const isVietAnh = chuDeLower.includes('việt anh') || chuDeLower.includes('viet anh') || 
                                  loaiLower.includes('việt anh') || loaiLower.includes('viet anh') || 
                                  hasVietnameseChars;

                if (isVietAnh) {
                    speakTextContent = item._correctKey || questionText;
                    speakerLabel = '🔊 Nghe từ tiếng Anh';
                } else {
                    speakTextContent = questionText;
                    speakerLabel = '🔊 Nghe câu hỏi';
                }
            }

            speakerBtn = `<button class="speaker-btn" data-question="${escapeHTML(speakTextContent)}" onclick="window.handleSpeak(this)">${speakerLabel}</button>`;
        }

        let bodyHtml = '';
        if (isVoca) {
            bodyHtml = `
                <div style="margin-top: 10px;">
                    <input type="text" id="voca-input-${index}" placeholder="Nhập đáp án tiếng Anh...">
                    <button type="button" onclick="window.checkVocaAnswer(${index})" style="margin-top: 8px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Kiểm tra</button>
                </div>
            `;
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

        return `<div class="quiz-card" id="q-card-${index}">
            <p><b>Câu ${index + 1}:</b> ${escapeHTML(questionText)}</p>
            ${speakerBtn}
            ${bodyHtml}
            <div class="explanation-box" id="exp-${index}"><b>Giải thích:</b> ${escapeHTML(explanationText)}</div>
        </div>`;
    }).join('');

    container.innerHTML = passageHtml + questionsHtml;
};

window.handleSpeak = function(btn) {
    const text = btn.getAttribute('data-question');
    window.speakText(text);
};

window.checkAnswer = function(element, chosenKey, index) {
    const card = document.getElementById(`q-card-${index}`);
    if (card.getAttribute('data-answered') === 'true') return;
    card.setAttribute('data-answered', 'true');

    const item = AppState.currentQuizData[index];
    const correctKey = item._correctKey;
    
    const options = card.querySelectorAll('.option-box');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        const optOrigKey = opt.getAttribute('data-orig-key');
        if (optOrigKey === correctKey) {
            opt.style.backgroundColor = '#d4edda';
            opt.style.borderColor = '#28a745';
        }
    });

    if (chosenKey === correctKey) {
        AppState.correctCount++;
        element.style.backgroundColor = '#d4edda';
        element.style.borderColor = '#28a745';
    } else {
        AppState.wrongCount++;
        element.style.backgroundColor = '#f8d7da';
        element.style.borderColor = '#dc3545';
        AppState.wrongQuestions.push(item);
    }

    document.getElementById('count-correct').textContent = AppState.correctCount;
    document.getElementById('count-wrong').textContent = AppState.wrongCount;

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';

    if (AppState.correctCount + AppState.wrongCount === AppState.currentQuizData.length) {
        clearInterval(AppState.timerInterval);
    }
};

window.checkVocaAnswer = function(index) {
    const card = document.getElementById(`q-card-${index}`);
    if (card.getAttribute('data-answered') === 'true') return;
    
    const inputElem = document.getElementById(`voca-input-${index}`);
    if (!inputElem) return;
    
    const userVal = inputElem.value.trim().toLowerCase();
    if (!userVal) return alert("Vui lòng nhập đáp án!");
    
    card.setAttribute('data-answered', 'true');
    inputElem.disabled = true;

    const item = AppState.currentQuizData[index];
    const correctVal = item._correctKey.toLowerCase();

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';

    if (userVal === correctVal) {
        AppState.correctCount++;
        inputElem.style.backgroundColor = '#d4edda';
        inputElem.style.borderColor = '#28a745';
    } else {
        AppState.wrongCount++;
        inputElem.style.backgroundColor = '#f8d7da';
        inputElem.style.borderColor = '#dc3545';
        if (expBox) {
            expBox.innerHTML = `<b>Đáp án đúng:</b> <span style="color: green; font-weight: bold;">${escapeHTML(item._correctKey)}</span><br>` + expBox.innerHTML;
        }
        AppState.wrongQuestions.push(item);
    }

    document.getElementById('count-correct').textContent = AppState.correctCount;
    document.getElementById('count-wrong').textContent = AppState.wrongCount;

    if (AppState.correctCount + AppState.wrongCount === AppState.currentQuizData.length) {
        clearInterval(AppState.timerInterval);
    }
};

window.submitQuiz = function() {
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    
    let total = AppState.currentQuizData.length;
    let score = Math.round((AppState.correctCount / total) * 10 * 10) / 10;
    let maHS = document.getElementById('student-code').value.trim();
    let mon = document.getElementById('subject-select').value;
    let levelSelected = document.getElementById('level-select') ? document.getElementById('level-select').value : 'Level 1';

    alert(`Bài làm kết thúc!\nĐúng: ${AppState.correctCount}/${total}\nĐiểm của bạn: ${score} điểm`);

    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maHS: maHS, score: score, total: total, mon: mon, level: levelSelected })
    }).catch(err => console.error("Lỗi gửi kết quả:", err));

    let retryBtnHtml = AppState.wrongQuestions.length > 0 ? `<button id="retry-wrong-btn" onclick="window.retryWrongAnswers()">Làm lại các câu sai (${AppState.wrongQuestions.length})</button>` : '';

    document.getElementById('quiz-screen').innerHTML = `
        <div class="container" style="text-align:center;">
            <h2>Kết Quả Bài Thi</h2>
            <p>Số câu đúng: <b>${AppState.correctCount}/${total}</b></p>
            <p>Điểm số: <b style="color:blue; font-size: 1.5em;">${score} đ</b></p>
            ${retryBtnHtml}
            <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; width:100%;">Làm bài mới / Về trang chủ</button>
        </div>
    `;
};

window.retryWrongAnswers = function() {
    if (AppState.wrongQuestions.length === 0) return;
    
    AppState.currentQuizData = AppState.wrongQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        let isDH = item.chuDe && item.chuDe.toUpperCase().startsWith('DH');
        let shuffledKeys = isDH ? validKeys : [...validKeys].sort(() => 0.5 - Math.random());
        return {
            ...item,
            _shuffledKeys: shuffledKeys,
            _correctKey: originalCorrectKey
        };
    });

    AppState.correctCount = 0;
    AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    
    document.getElementById('quiz-screen').innerHTML = `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px;">
            <div>Thời gian: <span id="timer-display" style="color: red;">--:--</span></div>
            <div>Đúng: <span id="count-correct" style="color: green;">0</span> | Sai: <span id="count-wrong" style="color: red;">0</span></div>
        </div>
        <div id="quiz"></div>
        <button type="button" id="submit-btn" onclick="window.submitQuiz()" style="width: 100%; padding: 15px; background: #28a745; color: white; border: none; cursor: pointer; margin-top: 15px;">Nộp bài</button>
    `;
    window.renderQuiz();
    window.startTimerTotal(AppState.currentQuizData.length * 30);
};

window.startTimerTotal = function(totalSeconds) {
    const display = document.getElementById('timer-display');
    if (!display) return;
    
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    
    AppState.timerInterval = setInterval(() => {
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (totalSeconds <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Hết thời gian làm bài!");
            window.submitQuiz();
        }
        totalSeconds--;
    }, 1000);
};

window.speakText = function(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let processedText = text.replace(/[_]+/g, ', ');
        let utterance = new SpeechSynthesisUtterance(processedText);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt không hỗ trợ đọc văn bản!");
    }
};
