const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0
};

(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; }
        .option-box:hover { background: #e9ecef; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
    `;
    document.head.appendChild(style);
})();

// Hàm hiển thị câu hỏi (Đã sửa lỗi SyntaxError)
window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    container.innerHTML = '';
    
    AppState.currentQuizData.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'quiz-card';
        
        // Tiêu đề câu hỏi
        const qText = document.createElement('p');
        qText.innerHTML = `<strong>Câu ${index + 1}:</strong> ${q["Nội dung câu hỏi"] || ""}`;
        div.appendChild(qText);
        
        // Các đáp án
        ['A', 'B', 'C', 'D'].forEach(opt => {
            const optDiv = document.createElement('div');
            optDiv.className = 'option-box';
            optDiv.innerText = `${opt}: ${q['Đáp án ' + opt]}`;
            
            // Xử lý sự kiện click an toàn
            optDiv.onclick = function() {
                const isCorrect = (q['Đáp án ' + opt] === q['Đáp án đúng']);
                window.checkAnswer(index, isCorrect);
                // Tạo hiệu ứng click
                optDiv.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
            };
            div.appendChild(optDiv);
        });
        container.appendChild(div);
    });
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

window.updateProgressBar = function() {
    const total = AppState.currentQuizData.length;
    const answered = AppState.correctCount + AppState.wrongCount;
    document.getElementById('progress-bar').style.width = (total === 0) ? '0%' : ((answered / total) * 100) + '%';
};

window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    window.updateTopicList();
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    document.body.appendChild(script);
};

window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !mon) return;
    const allowed = AppState.userPermissions.filter(p => String(p.maHS) === maHS && p.mon === mon).map(p => p.chuDe);
    const topics = [...new Set(AppState.allQuizData.filter(i => i.Môn === mon).map(i => i.Chủ đề))];
    container.innerHTML = topics.map(topic => `
        <label><input type="checkbox" name="topic" value="${topic}" ${allowed.includes(topic) ? 'checked' : 'disabled'}> ${topic}</label>
    `).join('<br>');
};

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    
    if (!selected.length) return alert("Vui lòng chọn chủ đề!");
    
    let filtered = AppState.allQuizData.filter(i => 
        i.Môn === mon && selected.includes(i['Chủ đề']) && String(i.Level) === String(levelSelected)
    );
    
    if (filtered.length === 0) return alert("Không có câu hỏi! (Kiểm tra lại cột Level trong Sheet phải là 1, 2, 3)");
    
    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, 10);
    AppState.correctCount = 0; AppState.wrongCount = 0;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    window.startTimer(15);
};

window.checkAnswer = function(i, isCorrect) {
    if(isCorrect) AppState.correctCount++; else AppState.wrongCount++;
    document.getElementById('count-correct').innerText = AppState.correctCount;
    document.getElementById('count-wrong').innerText = AppState.wrongCount;
    window.updateProgressBar();
};

window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    alert("Nộp bài thành công! Đúng: " + AppState.correctCount);
    location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
