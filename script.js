const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0, wrongQuestions: []
};

// --- HÀM ĐIỀU KHIỂN SỰ KIỆN (Để tránh lỗi is not a function) ---
window.handleSubjectChange = function() {
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    
    // Hiển thị Level nếu là Tiếng Anh
    levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    
    window.updateTopicList();
    window.renderLeaderboard(mon);
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
        .map(i => String(i.chuDe).trim()))];

    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> ${topic}
        </label>`;
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
        // Chỉ áp dụng Level cho Tiếng Anh
        const isLevelMatch = (mon !== 'Tiếng Anh') || (String(i.level).trim() === String(levelSelected).trim());
        return isSameSubject && isTopicMatch && isLevelMatch;
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

// --- CÁC HÀM CŨ GIỮ NGUYÊN (Copy các hàm cũ của bạn vào dưới đây) ---
// (renderLeaderboard, handleQuizData, loadData, renderQuiz, checkAnswer, checkVoca, submitQuiz, startTimer, speakText)
// [Dán các hàm còn lại của bạn vào đây...]
