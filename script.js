// --- Quản lý trạng thái ---
const AppState = {
    allQuizData: [],
    userPermissions: [],
    rankings: [],
    currentQuizData: [],
    timerInterval: null,
    correctCount: 0,
    wrongCount: 0
};

// Hàm làm sạch dữ liệu
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// --- 1. Tải dữ liệu & Xếp hạng ---
window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    
    script.onerror = () => { alert("Lỗi tải dữ liệu!"); script.remove(); };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    
    // Hiển thị bảng xếp hạng ban đầu (không lọc)
    window.renderLeaderboard();
    window.updateTopicList();
    alert("Tải dữ liệu thành công!");
};

// --- 2. Bảng xếp hạng (Đã cập nhật: Lọc theo môn) ---
window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;

    // Lọc dữ liệu theo môn học nếu có
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => item.subject === subjectFilter);
    }

    if (data.length === 0) {
        list.innerHTML = "Chưa có dữ liệu cho môn này.";
        return;
    }

    // Sắp xếp và lấy top 3
    const top3 = data.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        return `<div style="margin: 8px 0; font-size: 1.1em; border-bottom: 1px solid #eee;">${medal} <b>${escapeHTML(item.name)}</b>: ${item.score} điểm (${item.subject})</div>`;
    }).join('');
};

// --- 3. Đồng hồ đếm ngược ---
window.startTimer = function(minutes) {
    let seconds = minutes * 60;
    const display = document.getElementById('timer-display');
    
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = setInterval(() => {
        let m = Math.floor(seconds / 60);
        let s = seconds % 60;
        display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        
        if (seconds <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Hết giờ! Bài làm của bạn sẽ được nộp tự động.");
            window.submitQuiz();
        }
        seconds--;
    }, 1000);
};

// --- 4. Logic chọn câu hỏi và bắt đầu ---
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

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (!selected.length) return alert("Vui lòng chọn chủ đề!");
    
    let limit = (mon === 'Toán') ? 10 : 20;
    
    let filtered = AppState.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe));
    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, limit);
    
    AppState.correctCount = 0;
    AppState.wrongCount = 0;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    window.renderQuiz();
    window.startTimer(mon === 'Toán' ? 15 : 8);
};

// --- 5. Hiển thị & Xử lý ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    const subjectValue = document.getElementById('subject-select').value;
    
    quizDiv.innerHTML = AppState.currentQuizData.map((item, i) => {
        const type = (item.loai || "").toLowerCase().trim();
        const safeQuestion = escapeHTML(item.question);
        
        const speakBtn = (subjectValue === 'Tiếng anh') ? 
            `<button onclick="window.speakText('${safeQuestion.replace(/'/g, "\\'")}', ${i}, '${subjectValue}')" style="margin-bottom:10px; cursor:pointer;">🔊 Nghe</button>` : '';

        if (type === 'voca') {
            return `<div class="quiz-card">${speakBtn}<h2>${safeQuestion}</h2><input type="text" id="input-voca-${i}" placeholder="Nhập nghĩa..."><button onclick="window.checkVoca(${i}, '${escapeHTML(item.correct).replace(/'/g, "\\'")}')">Kiểm tra</button></div>`;
        }
        
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        return `<div class="quiz-card">${speakBtn}<b>Câu ${i+1}: ${safeQuestion}</b><br>${options.map(opt => `<div class="option-box" onclick="window.checkAnswer(${i}, '${opt.k}', this, '${escapeHTML(String(opt.v)).replace(/'/g, "\\'")}')">${escapeHTML(String(opt.v))}</div>`).join('')}</div>`;
    }).join('');
};

window.checkAnswer = function(i, selectedKey, element, selectedText) {
    const correctValue = String(AppState.currentQuizData[i].correct).trim();
    const isCorrect = (selectedText.trim() === correctValue) || (selectedKey.toLowerCase() === correctValue.toLowerCase());
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    element.parentElement.querySelectorAll('.option-box').forEach(box => box.style.pointerEvents = 'none');
    
    if (isCorrect) {
        AppState.correctCount++;
        document.getElementById('count-correct').innerText = AppState.correctCount;
    } else {
        AppState.wrongCount++;
        document.getElementById('count-wrong').innerText = AppState.wrongCount;
    }
};

window.checkVoca = function(i, correctAnswer) {
    const input = document.getElementById(`input-voca-${i}`);
    if (input.value.trim().toLowerCase() === correctAnswer.toLowerCase()) {
        input.style.backgroundColor = '#d4edda';
        AppState.correctCount++;
        document.getElementById('count-correct').innerText = AppState.correctCount;
    } else {
        input.style.backgroundColor = '#f8d7da';
        AppState.wrongCount++;
        document.getElementById('count-wrong').innerText = AppState.wrongCount;
    }
    input.disabled = true;
};

// --- 6. Nộp bài ---
window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    
    const mon = document.getElementById('subject-select').value;
    const correct = AppState.correctCount;
    let score = (mon === 'Toán') ? correct : (correct * 0.5);
    score = parseFloat(score.toFixed(1));
    
    const dataToSend = { 
        maHS: document.getElementById('student-code').value, 
        score: score, 
        total: AppState.currentQuizData.length, 
        mon: mon 
    };
    
    fetch("https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec", {
        method: "POST", mode: "no-cors",
        body: JSON.stringify(dataToSend)
    }).then(() => {
        alert("Nộp bài thành công! Bạn được: " + score + " điểm.");
        location.reload();
    });
};

// --- 7. Âm thanh ---
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
    
    // Tự động cập nhật bảng xếp hạng khi đổi môn
    document.getElementById('subject-select').addEventListener('change', function() {
        window.renderLeaderboard(this.value);
    });
});
