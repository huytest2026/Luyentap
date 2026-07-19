const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0
};

// --- HÀM NẠP DỮ LIỆU ---
window.loadData = function() {
    console.log("1. Đã bấm nút Tải đề!");
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = API_URL + '?ma=' + encodeURIComponent(maHS) + '&callback=handleQuizData';
    script.onerror = function() { console.error("LỖI: Không thể kết nối tới Google Script!"); };
    document.body.appendChild(script);
};

// --- HÀM NHẬN DỮ LIỆU ---
window.handleQuizData = function(data) {
    console.log("4. Dữ liệu nhận được:", data);
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    
    // Cập nhật xong thì chạy hàm liệt kê chủ đề
    window.updateTopicList();
};

// --- HÀM CẬP NHẬT CHỦ ĐỀ (ĐÃ CẢI TIẾN) ---
window.updateTopicList = function() {
    console.log("5. Đang chạy hàm cập nhật danh sách chủ đề...");
    const mon = document.getElementById('subject-select').value.trim();
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    
    if (!container) return;
    if (!mon || mon === "-- Chọn môn --") {
        container.innerHTML = "Vui lòng chọn môn học hợp lệ.";
        return;
    }

    // 1. Lọc quyền truy cập
    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && String(p.mon).trim() === mon)
        .map(p => String(p.chuDe).trim());

    // 2. Lọc các chủ đề có trong dữ liệu
    const topics = [...new Set(AppState.allQuizData
        .filter(i => String(i.Môn).trim() === mon)
        .map(i => String(i['Chủ đề']).trim()))];

    console.log("Tìm thấy chủ đề cho môn " + mon + ":", topics);
    
    if (topics.length === 0) {
        container.innerHTML = "Không tìm thấy chủ đề nào cho môn này. Hãy kiểm tra lại cột 'Môn' trong Sheet.";
        return;
    }

    // 3. Render ra HTML
    let html = '';
    topics.forEach(function(topic) {
        const isChecked = allowed.includes(topic) ? 'checked' : '';
        const isDisabled = allowed.includes(topic) ? '' : 'disabled'; // Chỉ cho chọn nếu có quyền
        html += `<label><input type="checkbox" name="topic" value="${topic}" ${isChecked} ${isDisabled}> ${topic}</label><br>`;
    });
    container.innerHTML = html;
};

// --- KHỞI TẠO SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    
    // TỰ ĐỘNG CẬP NHẬT KHI ĐỔI MÔN
    document.getElementById('subject-select').addEventListener('change', function() {
        console.log("Đã đổi môn, cập nhật lại danh sách...");
        window.updateTopicList();
    });
});

// --- CÁC HÀM KHÁC (Giữ nguyên) ---
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
    
    if (filtered.length === 0) return alert("Không có câu hỏi! Kiểm tra lại cột Level (1, 2, 3) hoặc nội dung câu hỏi.");
    
    AppState.currentQuizData = filtered.sort(() => 0.5 - Math.random()).slice(0, 10);
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    window.startTimer(15);
};

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

window.checkAnswer = function(i, isCorrect) {
    if(isCorrect) AppState.correctCount++; else AppState.wrongCount++;
    document.getElementById('count-correct').innerText = AppState.correctCount;
    document.getElementById('count-wrong').innerText = AppState.wrongCount;
    const total = AppState.currentQuizData.length;
    document.getElementById('progress-bar').style.width = (((AppState.correctCount + AppState.wrongCount) / total) * 100) + '%';
};
