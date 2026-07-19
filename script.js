// --- Quản lý trạng thái ---
const AppState = {
    allQuizData: [], userPermissions: [], rankings: [],
    currentQuizData: [], timerInterval: null,
    correctCount: 0, wrongCount: 0
};

// --- CÀI ĐẶT GIAO DIỆN CHUYÊN NGHIỆP (CSS) ---
(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .leaderboard-container { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; animation: popIn 0.5s ease-out; }
        .leaderboard-item:last-child { border-bottom: none; }
        @keyframes popIn { 
            0% { transform: scale(0.9); opacity: 0; } 
            100% { transform: scale(1); opacity: 1; } 
        }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 2px 8px; border-radius: 10px; font-weight: bold; color: #333; }
        .time-text { font-size: 0.85em; color: #888; display: block; }
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// --- Logic xử lý ---
window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    
    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    script.onerror = () => { alert("Lỗi tải dữ liệu!"); script.remove(); };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (data.error) return alert("Lỗi: " + data.error);
    AppState.allQuizData = data.questions || [];
    AppState.userPermissions = data.permissions || [];
    AppState.rankings = data.rankings || [];
    
    window.renderLeaderboard();
    window.updateTopicList();
    alert("Tải dữ liệu thành công!");
};

// --- Bảng xếp hạng mới (có hiệu ứng & ngày tháng) ---
window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;

    // Áp dụng container styling
    list.className = "leaderboard-container";

    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => item.subject === subjectFilter);
    }

    if (data.length === 0) {
        list.innerHTML = "Chưa có dữ liệu cho môn này.";
        return;
    }

    const top3 = data.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        let dateDisplay = item.date ? `<span class="time-text">Ngày: ${item.date}</span>` : "";
        return `
            <div class="leaderboard-item">
                <div>
                    <span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b>
                    ${dateDisplay}
                </div>
                <span class="score-badge">${item.score} đ</span>
            </div>`;
    }).join('');
};

// ... Các hàm còn lại (startTimer, startQuiz, submitQuiz,...) bạn giữ nguyên như cũ ...

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-data-btn').onclick = window.loadData;
    document.getElementById('start-btn').onclick = window.startQuiz;
    document.getElementById('subject-select').addEventListener('change', function() {
        window.renderLeaderboard(this.value);
    });
});
