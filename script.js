// --- Quản lý trạng thái ---
const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0,
    wrongQuestions: []
};

// --- CÀI ĐẶT GIAO DIỆN ---
(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .container { background: #e4cbf5; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 20px auto; }
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        
        .explanation-box { 
            margin-top: 15px; padding: 12px; background: #fff3cd; border-left: 5px solid #ffc107; 
            border-radius: 4px; display: none; color: #856404; font-size: 0.95em; line-height: 1.4;
        }

        .leaderboard-container { background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: #4f46e5; }
        .time-text { font-size: 0.8em; color: #888; display: block; }
        .speaker-btn { background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-bottom: 10px; }
        #retry-wrong-btn { background: #d9534f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; width: 100%; font-weight: bold; }
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// --- CÁC HÀM XỬ LÝ DỮ LIỆU ---
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
        let dateDisplay = item.date ? `<span class="time-text">Ngày: ${item.date}</span>` : "";
        return `
            <div class="leaderboard-item">
                <div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b>${dateDisplay}</div>
                <span class="score-badge">${item.score} đ</span>
            </div>`;
    }).join('');
};

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !mon) return;
    const allowed = AppState.userPermissions.filter(p => String(p.maHS) === maHS && p.mon === mon).map(p => p.chuDe);
    const topics = [...new Set(AppState.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${escapeHTML(topic)}" ${isAllowed ? 'checked' : 'disabled'}> ${escapeHTML(topic)}
        </label>`;
    }).join('');
};

window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    window.renderLeaderboard();
    window.updateTopicList();
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('saved_maHS', maHS);
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    script.onerror = () => { alert("Lỗi tải dữ liệu!"); script.remove(); };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

// --- QUIZ LOGIC ---
window.retryWrongAnswers = function() {
    if (AppState.wrongQuestions.length === 0) return;
    AppState.currentQuizData = AppState.wrongQuestions;
    AppState.correctCount = 0; AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    const mon = document.getElementById('subject-select').value;
    window.startTimer(mon === 'Toán' ? 10 : 5);
};

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (!selected.length) return alert("Vui lòng chọn chủ đề!");
    let limit = (mon === 'Toán') ? 10 : 20;
    let filtered = AppState.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe));
    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, limit);
    AppState.correctCount = 0; AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    window.startTimer(mon === 'Toán' ? 15 : 8);
};

window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    const subjectValue = document.getElementById('subject-select').value;
    quizDiv.innerHTML = AppState.currentQuizData.map((item, i) => {
        const type = (item.loai || "").toLowerCase().trim();
        const safeQuestion = escapeHTML(item.question);
        
        // --- LOGIC MỚI: Tự động tìm cột giải thích ---
        const textGiaiThich = item.giai_thich || item.giaiThich || item.explain || item.explanation || item["Diễn giải"] || "";
        const explanationHtml = (textGiaiThich) ? 
            `<div class="explanation-box" id="explanation-${i}"><b>💡 Giải thích:</b> ${escapeHTML(textGiaiThich)}</div>` : '';

        const speakBtn = (subjectValue === 'Tiếng anh') ? 
            `<button onclick="window.speakText('${safeQuestion.replace(/'/g, "\\'")}', ${i}, '${subjectValue}')" class="speaker-btn">🔊 Nghe</button>` : '';
            
        if (type === 'voca') {
            return `<div class="quiz-card">${speakBtn}<h2>${safeQuestion}</h2><input type="text" id="input-voca-${i}" placeholder="Nhập nghĩa..."><button class="check-voca-btn" onclick="window.checkVoca(${i}, '${escapeHTML(item.correct).replace(/'/g, "\\'")}')">Kiểm tra</button>${explanationHtml}</div>`;
        }
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        return `<div class="quiz-card">${speakBtn}<b>Câu ${i+1}: ${safeQuestion}</b><br>${options.map(opt => `<div class="option-box" onclick="window.checkAnswer(${i}, '${opt.k}', this, '${escapeHTML(String(opt.v)).replace(/'/g, "\\'")}')">${escapeHTML(String(opt.v))}</div>`).join('')}${explanationHtml}</div>`;
    }).join('');
};

window.checkAnswer = function(i, selectedKey, element, selectedText) {
    const quizItem = AppState.currentQuizData[i];
    const correctValue = String(quizItem.correct).trim();
    const isCorrect = (selectedText.trim() === correctValue) || (selectedKey.toLowerCase() === correctValue.toLowerCase());
    
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    
    // Hiển thị giải thích nếu sai
    const explanationDiv = document.getElementById(`explanation-${i}`);
    if (!isCorrect && explanationDiv) explanationDiv.style.display = 'block';

    const allBoxes = element.parentElement.querySelectorAll('.option-box');
    allBoxes.forEach(box => {
        box.style.pointerEvents = 'none';
        let correctContent = correctValue;
        if (['a','b','c','d'].includes(correctValue.toLowerCase())) correctContent = quizItem[correctValue.toLowerCase()];
        if (box.innerText.trim() === String(correctContent).trim()) box.style.backgroundColor = '#d4edda';
    });

    if (isCorrect) { 
        AppState.correctCount++; 
        document.getElementById('count-correct').innerText = AppState.correctCount; 
    } else { 
        AppState.wrongCount++; 
        document.getElementById('count-wrong').innerText = AppState.wrongCount; 
        AppState.wrongQuestions.push(quizItem);
    }
};

window.checkVoca = function(i, correctAnswer) {
    const input = document.getElementById(`input-voca-${i}`);
    const explanationDiv = document.getElementById(`explanation-${i}`);
    
    if (input.value.trim().toLowerCase() === correctAnswer.toLowerCase()) {
        input.style.backgroundColor = '#d4edda'; AppState.correctCount++;
        document.getElementById('count-correct').innerText = AppState.correctCount;
    } else {
        input.style.backgroundColor = '#f8d7da'; AppState.wrongCount++;
        document.getElementById('count-wrong').innerText = AppState.wrongCount;
        input.value = correctAnswer;
        AppState.wrongQuestions.push(AppState.currentQuizData[i]);
        if (explanationDiv) explanationDiv.style.display = 'block';
    }
    input.disabled = true;
};

window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    const mon = document.getElementById('subject-select').value;
    const correct = AppState.correctCount;
    let score = (mon === 'Toán') ? correct : (correct * 0.5);
    score = parseFloat(score.toFixed(1));
    const dataToSend = { maHS: document.getElementById('student-code').value, score: score, total: AppState.currentQuizData.length, mon: mon };
    
    fetch("https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec", {
        method: "POST", mode: "no-cors", body: JSON.stringify(dataToSend)
    }).then(() => { 
        alert("Nộp bài thành công! Bạn được: " + score + " điểm."); 
        document.getElementById('quiz-screen').style.display = 'none';
        
        const startScreen = document.getElementById('start-screen');
        startScreen.style.display = 'block';
        
        const oldBtn = document.getElementById('retry-wrong-btn');
        if (oldBtn) oldBtn.remove();
        
        if (AppState.wrongQuestions.length > 0) {
            const btn = document.createElement('button');
            btn.id = 'retry-wrong-btn';
            btn.innerText = `Làm lại ${AppState.wrongQuestions.length} câu sai`;
            btn.onclick = window.retryWrongAnswers;
            startScreen.appendChild(btn);
        }
        window.loadData(); 
    });
};

window.startTimer = function(minutes) {
    let seconds = minutes * 60;
    const display = document.getElementById('timer-display');
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = setInterval(() => {
        let m = Math.floor(seconds / 60);
        let s = seconds % 60;
        display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (seconds <= 0) { clearInterval(AppState.timerInterval); alert("Hết giờ!"); window.submitQuiz(); }
        seconds--;
    }, 1000);
};

window.speakText = function(text, questionIndex, mon) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let cleanText = text.replace(/_+/g, " ");
        const utterance = new SpeechSynthesisUtterance("Câu " + (parseInt(questionIndex) + 1) + ". " + cleanText);
        utterance.lang = (mon === 'Tiếng anh') ? 'en-US' : 'vi-VN';
        window.speechSynthesis.speak(utterance);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('subject-select').addEventListener('change', function() {
        window.renderLeaderboard(this.value);
    });
    const savedMa = localStorage.getItem('saved_maHS');
    if (savedMa) {
        document.getElementById('student-code').value = savedMa;
        window.loadData();
    }
});
