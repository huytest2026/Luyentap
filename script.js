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
            AppState.allQuizData = data.questions || [];
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
        .filter(i => String(i.mon).trim().toLowerCase() === monSelect)
        .map(i => String(i.chuDe).trim()))].filter(topic => topic !== "");

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
    AppState.allQuizData = data.questions || [];
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

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (!selected.length) return alert("Vui lòng chọn chủ đề!");
    
    let limit = (mon === 'Toán') ? 10 : 20;
    
    let filtered = AppState.allQuizData.filter(i => {
        const isSameSubject = (String(i.mon).trim().toLowerCase() === mon.trim().toLowerCase());
        const isTopicMatch = selected.includes(String(i.chuDe).trim());
        const isLevelMatch = (mon !== 'Tiếng Anh') || (String(i.level).trim() === String(levelSelected).trim());
        return isSameSubject && isTopicMatch && isLevelMatch;
    });

    if (filtered.length === 0) return alert("Không tìm thấy câu hỏi phù hợp cho lựa chọn này!");

    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, limit);
    AppState.correctCount = 0; 
    AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    
    let totalSeconds = (mon === 'Toán') ? 15 * 60 : 10 * 60;
    window.startTimerTotal(totalSeconds);
};

window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    if (!container) return;
    container.innerHTML = AppState.currentQuizData.map((item, index) => {
        let optionsHtml = ['a', 'b', 'c', 'd'].map(optKey => {
            if (!item[optKey]) return '';
            return `<div class="option-box" onclick="window.checkAnswer(this, '${optKey.toUpperCase()}', ${index})">
                <b>${optKey.toUpperCase()}.</b> ${escapeHTML(item[optKey])}
            </div>`;
        }).join('');

        let speakerBtn = (item.mon === 'Tiếng Anh') ? `<button class="speaker-btn" data-question="${escapeHTML(item.question)}" onclick="window.handleSpeak(this)">🔊 Nghe câu hỏi</button>` : '';

        return `<div class="quiz-card" id="q-card-${index}">
            <p><b>Câu ${index + 1}:</b> ${escapeHTML(item.question)}</p>
            ${speakerBtn}
            ${optionsHtml}
            <div class="explanation-box" id="exp-${index}"><b>Giải thích:</b> ${escapeHTML(item.giai_thich || 'Không có giải thích.')}</div>
        </div>`;
    }).join('');
};

window.handleSpeak = function(btn) {
    const text = btn.getAttribute('data-question');
    window.speakText(text);
};

function getCorrectLetter(item) {
    const raw = String(item.correct || '').trim();
    const upper = raw.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) {
        return upper;
    }
    for (let key of ['a', 'b', 'c', 'd']) {
        if (item[key] && String(item[key]).trim().toLowerCase() === raw.toLowerCase()) {
            return key.toUpperCase();
        }
    }
    return upper;
}

window.checkAnswer = function(element, chosen, index) {
    const card = document.getElementById(`q-card-${index}`);
    if (card.getAttribute('data-answered') === 'true') return;
    card.setAttribute('data-answered', 'true');

    const item = AppState.currentQuizData[index];
    const correctOpt = getCorrectLetter(item);
    
    const options = card.querySelectorAll('.option-box');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        const optLetter = opt.querySelector('b').textContent.replace('.', '').trim().toUpperCase();
        if (optLetter === correctOpt) {
            opt.style.backgroundColor = '#d4edda';
            opt.style.borderColor = '#28a745';
        }
    });

    if (chosen === correctOpt) {
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
    AppState.currentQuizData = [...AppState.wrongQuestions];
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
        // Thay thế các dấu gạch dưới (_) bằng dấu phẩy để tạo khoảng ngưng (pause) tự nhiên, không phát âm tiếng lạ
        let processedText = text.replace(/[_]+/g, ', ');
        let utterance = new SpeechSynthesisUtterance(processedText);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt không hỗ trợ đọc văn bản!");
    }
};
