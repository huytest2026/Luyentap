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
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: #4f46e5; }
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// --- LOGIC MỞ KHÓA & TIẾN TRÌNH ---
window.checkLevelUnlock = function() {
    const maxLevel = parseInt(localStorage.getItem('maxLevelReached') || 1);
    const select = document.getElementById('level-select');
    if (!select) return;
    for (let i = 0; i < select.options.length; i++) {
        select.options[i].disabled = (i + 1) > maxLevel;
    }
};

window.updateProgressBar = function() {
    const total = AppState.currentQuizData.length;
    const answered = AppState.correctCount + AppState.wrongCount;
    const percent = (total === 0) ? 0 : (answered / total) * 100;
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = percent + '%';
};

// --- XỬ LÝ DỮ LIỆU ---
window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    window.renderLeaderboard();
    window.updateTopicList();
    window.checkLevelUnlock();
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

window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => item.subject === subjectFilter);
    }
    const qualifiedData = data.filter(item => item.score >= 8);
    if (qualifiedData.length === 0) {
        list.innerHTML = `<p style="color: #666; text-align:center;">Chưa có dữ liệu xếp hạng (>= 8).</p>`;
        return;
    }
    const top3 = qualifiedData.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        return `<div class="leaderboard-item"><div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b></div><span class="score-badge">${item.score} đ</span></div>`;
    }).join('');
};

// --- QUIZ LOGIC ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    
    if (!selected.length) return alert("Vui lòng chọn chủ đề!");
    
    let filtered = AppState.allQuizData.filter(i => 
        i.mon === mon && 
        selected.includes(i.chuDe) && 
        String(i.level) === String(levelSelected)
    );
    
    if (filtered.length === 0) return alert("Không có câu hỏi cho cấp độ này!");
    
    let limit = (mon === 'Toán') ? 10 : 20;
    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, limit);
    AppState.correctCount = 0; AppState.wrongCount = 0;
    
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    window.renderQuiz(); // Hàm này cần tồn tại trong dự án của bạn
    window.startTimer(mon === 'Toán' ? 15 : 8); // Hàm này cần tồn tại
};

window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    const mon = document.getElementById('subject-select').value;
    const currentLevel = parseInt(document.getElementById('level-select').value);
    const correct = AppState.correctCount;
    let score = (mon === 'Toán') ? correct : (correct * 0.5);
    score = parseFloat(score.toFixed(1));

    if (score >= 8) {
        let maxLevel = parseInt(localStorage.getItem('maxLevelReached') || 1);
        if (currentLevel >= maxLevel) {
            localStorage.setItem('maxLevelReached', currentLevel + 1);
            alert("Chúc mừng! Bạn đã đạt trên 8 điểm và mở khóa Level mới!");
        }
    }
    
    const dataToSend = { maHS: document.getElementById('student-code').value, score: score, total: AppState.currentQuizData.length, mon: mon };
    fetch("https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec", {
        method: "POST", mode: "no-cors", body: JSON.stringify(dataToSend)
    }).then(() => { 
        alert("Nộp bài thành công! Điểm: " + score); 
        location.reload();
    });
};

// Hàm checkAnswer bạn cần đảm bảo gọi updateProgressBar
window.checkAnswer = function(i, isCorrect) {
    if(isCorrect) AppState.correctCount++;
    else AppState.wrongCount++;
    
    document.getElementById('count-correct').innerText = AppState.correctCount;
    document.getElementById('count-wrong').innerText = AppState.wrongCount;
    
    window.updateProgressBar(); 
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
