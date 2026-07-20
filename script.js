const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0, wrongQuestions: []
};

// --- GIAO DIỆN & CÁC HÀM CŨ GIỮ NGUYÊN ---
(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .container { background: #e4cbf5; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 20px auto; }
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
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) { if (!str) return ""; return String(str).replace(/[&<>"']/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); }

// --- HÀM XỬ LÝ GIAO DIỆN MỚI ---
window.handleSubjectChange = function() {
    window.updateTopicList();
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    // Ẩn cấp độ nếu là Toán
    levelContainer.style.display = (mon === 'Toán') ? 'none' : 'block';
    window.renderLeaderboard(mon);
};

// --- CÁC HÀM CŨ (GIỮ NGUYÊN) ---
window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.className = "leaderboard-container";
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") { data = data.filter(item => item.subject === subjectFilter); }
    const qualifiedData = data.filter(item => item.score >= 8);
    if (qualifiedData.length === 0) { list.innerHTML = `<div style="text-align:center; padding: 15px; color: #888;">Chưa có dữ liệu xếp hạng (>= 8).</div>`; return; }
    const top3 = qualifiedData.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        let dateDisplay = item.date ? `<span class="time-text">Ngày: ${item.date}</span>` : "";
        return `<div class="leaderboard-item"><div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b>${dateDisplay}</div><span class="score-badge">${item.score} đ</span></div>`;
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
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}"><input type="checkbox" name="topic" value="${escapeHTML(topic)}" ${isAllowed ? 'checked' : 'disabled'}> ${escapeHTML(topic)}</label>`;
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

// --- LOGIC BÀI THI (ĐÃ CẬP NHẬT ĐIỀU KIỆN LEVEL) ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (!selected.length) return alert("Vui lòng chọn chủ đề!");
    
    let limit = (mon === 'Toán') ? 10 : 20;
    // LOGIC LỌC MỚI: Chỉ lọc Level nếu là Tiếng Anh
    let filtered = AppState.allQuizData.filter(i => {
        const matchesSubject = (i.mon === mon);
        const matchesTopic = selected.includes(i.chuDe);
        const matchesLevel = (mon !== 'Tiếng anh') || (String(i.level || 1) === String(levelSelected));
        return matchesSubject && matchesTopic && matchesLevel;
    });

    if (filtered.length === 0) return alert("Không tìm thấy câu hỏi phù hợp!");

    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, limit);
    AppState.correctCount = 0; AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    window.startTimer(mon === 'Toán' ? 15 : 8);
};

// --- CÁC HÀM CÒN LẠI (renderQuiz, checkAnswer, submitQuiz,...) GIỮ NGUYÊN NHƯ CŨ ---
// (Bạn copy các hàm checkAnswer, renderQuiz, submitQuiz, speakText, startTimer,... từ code cũ của bạn vào đây)
