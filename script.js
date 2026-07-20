const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0, wrongQuestions: []
};

// Đảm bảo hàm này được gắn vào window
window.handleSubjectChange = function() {
    console.log("Đã kích hoạt handleSubjectChange");
    window.updateTopicList();
    
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    
    // Ẩn/hiện Level (Lưu ý: khớp chính xác với value trong HTML)
    levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    
    window.renderLeaderboard(mon);
};

window.updateTopicList = function() {
    // Lấy value từ select và chuyển về chữ thường để so sánh
    const monSelect = document.getElementById('subject-select').value.toLowerCase();
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    
    if (!container || !monSelect) return;

    // Lọc dữ liệu: So sánh không phân biệt hoa thường
    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && String(p.mon).trim().toLowerCase() === monSelect)
        .map(p => String(p.chuDe).trim());

    const topics = [...new Set(AppState.allQuizData
        .filter(i => String(i.mon).trim().toLowerCase() === monSelect)
        .map(i => String(i.chuDe).trim()))];

    if (topics.length === 0) {
        container.innerHTML = "Không tìm thấy dữ liệu cho môn này. Hãy kiểm tra lại cột 'Môn' trong file Excel.";
        return;
    }

    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${topic}" ${isAllowed ? 'checked' : 'disabled'}> ${topic}
        </label>`;
    }).join('');
};

// ... Các hàm cũ khác (renderQuiz, startQuiz, submitQuiz,...) vẫn để nguyên bên dưới ...
