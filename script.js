// --- KHỞI TẠO DỮ LIỆU ---
const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0
};

// --- HÀM TẠO GIAO DIỆN (CSS) ---
(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: 0.2s; }
        .option-box:hover { background: #e9ecef; }
    `;
    document.head.appendChild(style);
})();

// --- HÀM NẠP DỮ LIỆU (Đã thêm log để kiểm tra) ---
window.loadData = function() {
    console.log("1. Đã bấm nút Tải đề!");
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) {
        alert("Vui lòng nhập mã học sinh!");
        return;
    }
    
    console.log("2. Mã học sinh là: " + maHS);
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    
    // Đính kèm callback để nhận dữ liệu
    script.src = API_URL + '?ma=' + encodeURIComponent(maHS) + '&callback=handleQuizData';
    
    script.onload = function() { console.log("3. Đã kết nối tới Google Script thành công!"); };
    script.onerror = function() { console.error("3. LỖI: Không thể kết nối tới Google Script!"); };
    
    document.body.appendChild(script);
};

// --- HÀM NHẬN DỮ LIỆU TỪ GOOGLE ---
window.handleQuizData = function(data) {
    console.log("4. Dữ liệu nhận được:", data); // Kiểm tra xem data có về không
    if (data.error) {
        alert("Lỗi từ Google: " + data.error);
        return;
    }
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    window.updateTopicList();
};

// --- HÀM CẬP NHẬT CHỦ ĐỀ ---
window.updateTopicList = function() {
    console.log("5. Đang cập nhật danh sách chủ đề...");
    const mon = document.getElementById('subject-select').value;
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    
    if (!container || !mon) return;

    const allowed = [];
    AppState.userPermissions.forEach(function(p) {
        if (String(p.maHS) === maHS && p.mon === mon) allowed.push(p.chuDe);
    });

    const topics = [];
    AppState.allQuizData.forEach(function(i) {
        if (i.Môn === mon && !topics.includes(i['Chủ đề'])) topics.push(i['Chủ đề']);
    });

    let html = '';
    topics.forEach(function(topic) {
        const isChecked = allowed.includes(topic) ? 'checked' : 'disabled';
        html += '<label><input type="checkbox" name="topic" value="' + topic + '" ' + isChecked + '> ' + topic + '</label><br>';
    });
    container.innerHTML = html;
};

// --- HÀM KHỞI TẠO BÀI THI ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const checkboxes = document.querySelectorAll('input[name="topic"]:checked');
    const selected = [];
    checkboxes.forEach(function(cb) { selected.push(cb.value); });
    
    if (selected.length === 0) return alert("Vui lòng chọn chủ đề!");
    
    const filtered = AppState.allQuizData.filter(function(i) {
        return i.Môn === mon && selected.includes(i['Chủ đề']) && String(i.Level) === String(levelSelected);
    });
    
    if (filtered.length === 0) return alert("Không có câu hỏi! Kiểm tra lại cột Level (1, 2, 3).");
    
    AppState.currentQuizData = filtered.sort(function() { return 0.5 - Math.random(); }).slice(0, 10);
    AppState.correctCount = 0; 
    AppState.wrongCount = 0;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    window.startTimer(15);
};

// --- HÀM HIỂN THỊ CÂU HỎI ---
window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    container.innerHTML = '';
    AppState.currentQuizData.forEach(function(q, index) {
        const div = document.createElement('div');
        div.className = 'quiz-card';
        div.innerHTML = '<p><strong>Câu ' + (index + 1) + ':</strong> ' + (q["Nội dung câu hỏi"] || "") + '</p>';
        ['A', 'B', 'C', 'D'].forEach(function(opt) {
            const optDiv = document.createElement('div');
            optDiv.className = 'option-box';
            optDiv.innerText = opt + ': ' + (q['Đáp án ' + opt] || "");
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

window.checkAnswer = function(i, isCorrect) {
    if(isCorrect) AppState.correctCount++; else AppState.wrongCount++;
    document.getElementById('count-correct').innerText = AppState.correctCount;
    document.getElementById('count-wrong').innerText = AppState.wrongCount;
    const total = AppState.currentQuizData.length;
    const answered = AppState.correctCount + AppState.wrongCount;
    document.getElementById('progress-bar').style.width = ((answered / total) * 100) + '%';
};

// --- CÀI ĐẶT SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("Trang đã sẵn sàng.");
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
