// --- KHO CHỨA DỮ LIỆU TẠM THỜI ---
const AppState = {
    allQuizData: [], 
    userPermissions: [], 
    rankings: [],
    currentQuizData: [], 
    timerInterval: null,
    correctCount: 0, 
    wrongCount: 0
};

// --- GIAO DIỆN CHUNG ---
(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: 0.2s; }
        .option-box:hover { background: #e9ecef; }
        .leaderboard-item { padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    `;
    document.head.appendChild(style);
})();

// --- 1. NẠP DỮ LIỆU ---
window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = API_URL + '?ma=' + encodeURIComponent(maHS) + '&callback=handleQuizData';
    document.body.appendChild(script);
};

// --- 2. XỬ LÝ DỮ LIỆU TRẢ VỀ ---
window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    
    // Tự động cập nhật menu Môn học
    const subjectSelect = document.getElementById('subject-select');
    const subjects = [...new Set(AppState.allQuizData.map(i => String(i.Môn).trim()))];
    subjectSelect.innerHTML = '<option value="">-- Chọn môn --</option>';
    subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.innerHTML = sub;
        subjectSelect.appendChild(opt);
    });

    // Vẽ bảng xếp hạng
    window.renderLeaderboard();
};

// --- 3. BẢNG XẾP HẠNG ---
window.renderLeaderboard = function() {
    const container = document.getElementById('ranking-list');
    if (!container) return;
    if (AppState.rankings.length === 0) {
        container.innerHTML = "Chưa có dữ liệu xếp hạng.";
        return;
    }
    container.innerHTML = AppState.rankings
        .sort((a, b) => b.diem - a.diem)
        .slice(0, 5)
        .map(r => `<div class="leaderboard-item"><span>${r.tenHS || 'Ẩn danh'}</span><span><strong>${r.diem} điểm</strong></span></div>`).join('');
};

// --- 4. CẬP NHẬT CHỦ ĐỀ (Dựa vào môn đã chọn) ---
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value.trim();
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !mon) return;

    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && String(p.mon).trim() === mon)
        .map(p => String(p.chuDe).trim());

    const topics = [...new Set(AppState.allQuizData
        .filter(i => String(i.Môn).trim() === mon)
        .map(i => String(i['Chủ đề']).trim()))];

    container.innerHTML = topics.map(topic => {
        const isChecked = allowed.includes(topic) ? 'checked' : '';
        const isDisabled = allowed.includes(topic) ? '' : 'disabled';
        return `<label><input type="checkbox" name="topic" value="${topic}" ${isChecked} ${isDisabled}> ${topic}</label><br>`;
    }).join('');
};

// --- 5. BẮT ĐẦU BÀI THI ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value.trim();
    const levelSelected = document.getElementById('level-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    
    const filtered = AppState.allQuizData.filter(i => 
        String(i.Môn).trim() === mon && 
        selected.includes(String(i['Chủ đề']).trim()) && 
        String(i.Level).trim() === String(levelSelected)
    );
    
    if (filtered.length === 0) return alert("Không có câu hỏi! Kiểm tra lại dữ liệu.");
    
    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, 10);
    AppState.correctCount = 0; AppState.wrongCount = 0;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    window.renderQuiz();
    window.startTimer(15);
};

// --- 6. HÀM HIỂN THỊ CÂU HỎI ---
window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    container.innerHTML = '';
    AppState.currentQuizData.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'quiz-card';
        div.innerHTML = `<p><strong>Câu ${index + 1}:</strong> ${q["Nội dung câu hỏi"] || ""}</p>`;
        ['A', 'B', 'C', 'D'].forEach(opt => {
            const optDiv = document.createElement('div');
            optDiv.className = 'option-box';
            optDiv.innerText = `${opt}: ${q['Đáp án ' + opt] || ""}`;
            optDiv.onclick = function() {
                const isCorrect = (q['Đáp án ' + opt] === q['Đáp án đúng']);
                optDiv.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
                window.checkAnswer(index, isCorrect);
            };
            div.appendChild(optDiv);
        });
        container.appendChild(div);
    });
};

// --- 7. TÍNH ĐIỂM & ĐỒNG HỒ ---
window.checkAnswer = function(i, isCorrect) {
    if(isCorrect) AppState.correctCount++; else AppState.wrongCount++;
    document.getElementById('count-correct').innerText = AppState.correctCount;
    document.getElementById('count-wrong').innerText = AppState.wrongCount;
    const total = AppState.currentQuizData.length;
    document.getElementById('progress-bar').style.width = (((AppState.correctCount + AppState.wrongCount) / total) * 100) + '%';
};

window.startTimer = function(minutes) {
    let time = minutes * 60;
    const display = document.getElementById('timer-display');
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = setInterval(() => {
        const m = Math.floor(time / 60);
        const s = time % 60;
        display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (time <= 0) { clearInterval(AppState.timerInterval); alert("Hết giờ!"); window.submitQuiz(); }
        time--;
    }, 1000);
};

window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    alert("Nộp bài! Tổng đúng: " + AppState.correctCount);
    location.reload();
};

// --- ĐĂNG KÝ SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('subject-select').onchange = window.updateTopicList;
});
