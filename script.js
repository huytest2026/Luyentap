// --- Quản lý trạng thái ---
const AppState = {
    allQuizData: [],
    userPermissions: [],
    currentQuizData: [],
    timerInterval: null,
    correctCount: 0,
    wrongCount: 0
};

// Hàm làm sạch dữ liệu đầu vào để tránh lỗi XSS
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// --- 1. Hàm tải dữ liệu ---
window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    
    // Thêm xử lý lỗi mạng
    script.onerror = () => {
        alert("Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau!");
        script.remove();
    };
    
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    alert("Tải dữ liệu thành công!");
    window.updateTopicList();
};

// --- 2. Hàm quản lý chủ đề ---
window.updateTopicList = function() {
    const mon = document.getElementById('subject-select').value;
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    
    if (!container || !mon) return;
    
    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS) === maHS && p.mon === mon)
        .map(p => p.chuDe);
        
    const topics = [...new Set(AppState.allQuizData.filter(i => i.mon === mon).map(i => i.chuDe))];
    
    container.innerHTML = topics.map(topic => {
        const isAllowed = allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${escapeHTML(topic)}" ${isAllowed ? 'checked' : 'disabled'}> ${escapeHTML(topic)}
        </label>`;
    }).join('');
};

// --- 3. Hàm hiển thị ---
window.renderQuiz = function() {
    const quizDiv = document.getElementById('quiz');
    if (!quizDiv) return;
    
    quizDiv.innerHTML = AppState.currentQuizData.map((item, i) => {
        const type = (item.loai || "").toLowerCase().trim();
        const safeQuestion = escapeHTML(item.question);
        
        // Giao diện cho VOCA
        if (type === 'voca') {
            return `
            <div class="quiz-card" style="margin-bottom:20px; padding:20px; border:2px solid #007bff; border-radius:12px; background: #f8fbff;">
                <button onclick="window.speak('${escapeHTML(item.question).replace(/'/g, "\\'")}')" style="margin-bottom:15px; cursor:pointer; padding:8px 15px; background: #007bff; color: white; border: none; border-radius: 5px;">🔊 Nghe từ vựng</button>
                <h2 style="margin:5px 0; color: #333;">${safeQuestion}</h2>
                <div style="font-size: 1.1em; margin-top:10px;">
                    <p>Nghĩa: <b>${escapeHTML(item.correct)}</b></p>
                    <p style="color: #666;">Phiên âm: <i>${escapeHTML(item.diengiai || '')}</i></p>
                </div>
            </div>`;
        }
        
        // Giao diện cho Trắc nghiệm (Quiz)
        let options = [{k:'a',v:item.a}, {k:'b',v:item.b}, {k:'c',v:item.c}, {k:'d',v:item.d}].sort(() => Math.random() - 0.5);
        return `
        <div class="quiz-card" id="q-card-${i}" style="margin-bottom:15px; padding:15px; border:2px solid #ddd; border-radius:8px;">
            <button onclick="window.speak('${('Câu ' + (i+1) + ': ' + safeQuestion).replace(/'/g, "\\'")}')" style="margin-bottom:10px; cursor:pointer;">🔊 Nghe câu hỏi</button>
            <b style="font-size: 1.1em;">Câu ${i+1}: ${safeQuestion}</b><br>
            ${options.map(opt => `
                <div class="option-box" style="display:block; margin:8px 0; padding:10px; border:1px solid #ccc; border-radius:5px; cursor:pointer; background: white;" 
                     onclick="window.checkAnswer(${i}, '${opt.k}', this, '${escapeHTML(String(opt.v)).replace(/'/g, "\\'")}')">
                    ${escapeHTML(String(opt.v))}
                </div>
            `).join('')}
        </div>`;
    }).join('');
};

window.speakText = function(text, questionIndex) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let cleanText = text.replace(/_+/g, " "); 
        let fullText = "Câu " + (questionIndex + 1) + ". " + cleanText;
        const utterance = new SpeechSynthesisUtterance(fullText);
        // 2. Tự động chọn giọng đọc theo môn học
        if (mon === 'Tiếng anh') {
            utterance.lang = 'en-US'; // Đọc tiếng Anh chuẩn
        } else {
            utterance.lang = 'vi-VN'; // Đọc tiếng Việt
        }

        window.speechSynthesis.speak(utterance);
    }
};
// --- 4. Logic chấm điểm ---
window.checkAnswer = function(i, selectedKey, element, selectedText) {
    const questionData = AppState.currentQuizData[i];
    const correctValue = String(questionData.correct).trim();
    const currentSubject = document.getElementById('subject-select').value;
    
    let isCorrect = (selectedText.trim() === correctValue) || (selectedKey.toLowerCase() === correctValue.toLowerCase());
    
    element.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
    
    const card = document.getElementById(`q-card-${i}`);
    card.querySelectorAll('.option-box').forEach(box => {
        if (currentSubject === 'Tiếng anh' && !isCorrect && box.innerText.trim() === correctValue) {
            box.style.backgroundColor = '#d4edda';
        }
        box.style.pointerEvents = 'none'; // Khóa không cho chọn tiếp
        box.style.opacity = '0.7';
    });
    
    // Cập nhật điểm
    if (isCorrect) {
        AppState.correctCount++;
        document.getElementById('count-correct').innerText = AppState.correctCount;
    } else {
        AppState.wrongCount++;
        document.getElementById('count-wrong').innerText = AppState.wrongCount;
    }
};

// --- 5. Bắt đầu và Nộp bài ---
window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const selected = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    
    if (selected.length === 0) return alert("Vui lòng chọn ít nhất một chủ đề!");
    
    AppState.currentQuizData = AppState.allQuizData.filter(i => i.mon === mon && selected.includes(i.chuDe)).sort(() => Math.random() - 0.5);
    if (AppState.currentQuizData.length === 0) return alert("Không có câu hỏi nào cho chủ đề này!");

    AppState.correctCount = 0;
    AppState.wrongCount = 0;
    document.getElementById('count-correct').innerText = "0";
    document.getElementById('count-wrong').innerText = "0";

    let time = (mon === 'Toán' ? 15 : 10) * 60;
    clearInterval(AppState.timerInterval);
    AppState.timerInterval = setInterval(() => {
        time--;
        document.getElementById('timer-display').innerText = Math.floor(time/60) + ":" + (time%60).toString().padStart(2,'0');
        if (time <= 0) { clearInterval(AppState.timerInterval); alert("Hết giờ làm bài!"); window.submitQuiz(); }
    }, 1000);
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
};

window.submitQuiz = function() {
    clearInterval(AppState.timerInterval);
    const total = AppState.correctCount + AppState.wrongCount;
    const score = total > 0 ? Math.round((AppState.correctCount / total) * 100) : 0;
    
    alert(`Hoàn thành bài làm!\nĐiểm số của bạn: ${score}%\nĐúng: ${AppState.correctCount} câu.\nSai: ${AppState.wrongCount} câu.`);
    
    // Thay vì reload, ta hiển thị nút "Làm lại" hoặc ẩn bài quiz
    if(confirm("Bạn có muốn làm lại bài mới không?")) {
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
});
