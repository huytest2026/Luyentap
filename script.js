// --- KHO CHỨA DỮ LIỆU ---
const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], correctCount: 0, wrongCount: 0
};

// --- 1. NẠP DỮ LIỆU ---
window.loadData = function() {
    const maHS = document.getElementById('student-code')?.value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = API_URL + '?ma=' + encodeURIComponent(maHS) + '&callback=handleQuizData';
    document.body.appendChild(script);
};

// --- 2. XỬ LÝ DỮ LIỆU TRẢ VỀ (Hàm chính) ---
window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi từ Google: " + data.error);
    
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    
    // Gọi các hàm render giao diện
    window.renderLeaderboard();
    window.renderSubjectOptions();
};

// --- 3. BẢNG XẾP HẠNG ---
window.renderLeaderboard = function() {
    const container = document.getElementById('ranking-list'); // PHẢI CÓ ID NÀY
    if (!container) { console.error("Thiếu thẻ HTML có id='ranking-list'"); return; }
    
    if (AppState.rankings.length === 0) {
        container.innerHTML = "Chưa có dữ liệu xếp hạng.";
        return;
    }
    
    container.innerHTML = AppState.rankings
        .sort((a, b) => b.diem - a.diem)
        .slice(0, 5)
        .map(r => `<div class="leaderboard-item"><span>${r.tenHS || 'Ẩn danh'}</span><span><strong>${r.diem} điểm</strong></span></div>`).join('');
};

// --- 4. TỰ ĐỘNG ĐIỀN MÔN HỌC ---
window.renderSubjectOptions = function() {
    const select = document.getElementById('subject-select'); // PHẢI CÓ ID NÀY
    if (!select) { console.error("Thiếu thẻ HTML có id='subject-select'"); return; }
    
    const subjects = [...new Set(AppState.allQuizData.map(i => String(i.Môn).trim()))];
    select.innerHTML = '<option value="">-- Chọn môn --</option>' + 
        subjects.map(s => `<option value="${s}">${s}</option>`).join('');
};

// --- 5. CẬP NHẬT CHỦ ĐỀ ---
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value.trim();
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container'); // PHẢI CÓ ID NÀY
    if (!container) return;
    if (!mon) { container.innerHTML = ""; return; }

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

// --- 6. BẮT ĐẦU BÀI THI ---
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
    
    if (filtered.length === 0) return alert("Không có câu hỏi!");
    
    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, 10);
    AppState.correctCount = 0; AppState.wrongCount = 0;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    
    window.renderQuiz();
};

window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    container.innerHTML = '';
    AppState.currentQuizData.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'quiz-card';
        div.innerHTML = `<p><strong>Câu ${index + 1}:</strong> ${q["Nội dung câu hỏi"]}</p>` +
            ['A', 'B', 'C', 'D'].map(opt => `<div class="option-box" onclick="window.checkAnswer(${index}, '${q['Đáp án ' + opt]}', '${q['Đáp án đúng']}', this)">${opt}: ${q['Đáp án ' + opt]}</div>`).join('');
        container.appendChild(div);
    });
};

window.checkAnswer = function(index, choice, correct, element) {
    if (choice === correct) {
        element.style.backgroundColor = "#d4edda";
        AppState.correctCount++;
    } else {
        element.style.backgroundColor = "#f8d7da";
        AppState.wrongCount++;
    }
};

// --- 7. KẾT NỐI SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('subject-select').onchange = window.updateTopicList;
});
