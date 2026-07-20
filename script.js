const AppState = {
    allQuizData: [],
    userPermissions: [],
    rankings: [],
    currentQuizData: [],
    timerInterval: null,
    correctCount: 0,
    wrongCount: 0,
    wrongQuestions: [],
    isReadingComp: false
};

(function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .container { background: #bbe9f0; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 20px auto; }
        .quiz-card { background: #ffffff; border: 2px solid #540606; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .option-box { background: #f8f9fa; border: 1px solid #540606; border-radius: 8px; padding: 12px 15px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-box:hover { background: #e9ecef; border-color: #adb5bd; }
        .explanation-box { margin-top: 15px; padding: 12px; background: #fff3cd; border-left: 5px solid #ffc107; border-radius: 4px; display: none; color: #856404; font-size: 0.95em; line-height: 1.4; }
        .leaderboard-container { background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee; }
        .leaderboard-item { padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .medal { font-size: 1.2em; margin-right: 10px; }
        .score-badge { background: #eef2f3; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: #4f46e5; }
        .time-text { font-size: 0.8em; color: #888; display: block; }
        .speaker-btn { background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-bottom: 10px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; }
        .speaker-btn:hover { background: #5a6268; }
        #retry-wrong-btn { background: #d9534f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; width: 100%; font-weight: bold; }
        
        .passage-box { 
            background: #ffffff; 
            border: 2px solid #540606; 
            border-radius: 12px; 
            padding: 20px; 
            margin-bottom: 20px; 
            font-size: 1.05em; 
            line-height: 1.6; 
            color: #333; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
        }

        .passage-tag {
            display: inline-block;
            background: #e9ecef;
            border: 1px solid #ced4da;
            padding: 5px 15px;
            font-weight: bold;
            border-radius: 6px;
            margin-bottom: 12px;
            color: #333;
            font-size: 1em;
        }

        input[type="text"], select {
            width: 100%;
            padding: 12px 15px;
            margin: 8px 0 15px 0;
            border: 1px solid #540606;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 1em;
            background: #ffffff;
        }

        #topic-container {
            width: 100%;
            background: #ffffff;
            border: 1px solid #540606;
            border-radius: 8px;
            padding: 12px 15px;
            margin: 8px 0 15px 0;
            box-sizing: border-box;
            min-height: 50px;
            max-height: 200px;
            overflow-y: auto;
        }

        select option:disabled { color: #aaa; background: #f1f1f1; }
    `;
    document.head.appendChild(style);
})();

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

function removeDiacritics(str) {
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function cleanKey(str) {
    return removeDiacritics(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeItem(item) {
    if (!item) return null;
    
    if (!Array.isArray(item) && typeof item === 'object') {
        const findKey = (possibleNames) => {
            for (let name of possibleNames) {
                const cleanN = cleanKey(name);
                for (let realKey of Object.keys(item)) {
                    if (cleanKey(realKey) === cleanN) {
                        const val = item[realKey];
                        if (val !== undefined && val !== null && String(val).trim() !== '') {
                            return String(val).trim();
                        }
                    }
                }
            }
            return '';
        };

        return {
            mon: findKey(['mon', 'môn', 'subject']),
            chuDe: findKey(['chude', 'chủ đề', 'chu de', 'topic']),
            question: findKey(['question', 'noidungcauhoi', 'noi_dung_cau_hoi', 'noi_dung', 'noidung', 'cauhoi', 'cau_hoi', 'cau', 'de_bai', 'de', 'nd', 'content', 'text', 'câu hỏi', 'nội dung câu hỏi', 'đề bài', 'đề']),
            a: findKey(['a', 'dapan_a', 'dap an a', 'đáp án a', 'option_a']),
            b: findKey(['b', 'dapan_b', 'dap an b', 'đáp án b', 'option_b']),
            c: findKey(['c', 'dapan_c', 'dap an c', 'đáp án c', 'option_c']),
            d: findKey(['d', 'dapan_d', 'dap an d', 'đáp án d', 'option_d']),
            correct: findKey(['correct', 'dapan_dung', 'dap an dung', 'đáp án đúng', 'dapandung', 'đáp_án_đúng', 'answer']),
            explanation: findKey(['explanation', 'giaithich', 'giai_thich', 'diễn giải', 'dien giai', 'giải thích', 'giai thich']),
            loai: findKey(['loai', 'loại', 'type']),
            level: findKey(['level', 'cấp độ', 'cap do', 'muc do']),
            passage: findKey(['passage', 'doanvan', 'đoạn văn', 'doan_van', 'đoạn_văn', 'noidungdoanvan', 'noidung', 'reading', 'content'])
        };
    }
    
    let values = Array.isArray(item) ? item : [];
    if (values.length === 0) return null;

    let v0 = String(values[0] || '').trim().toLowerCase();
    if (v0 === 'id' || v0 === 'môn' || v0 === 'mon') {
        return null;
    }

    let hasStt = /^\d+$/.test(String(values[0]).trim());

    const getVal = (indexWithoutId) => {
        let idx = hasStt ? indexWithoutId + 1 : indexWithoutId;
        if (idx < values.length && values[idx] !== undefined && values[idx] !== null) {
            return String(values[idx]).trim();
        }
        return '';
    };

    return {
        mon: getVal(0),
        chuDe: getVal(1),
        question: getVal(2),
        a: getVal(3),
        b: getVal(4),
        c: getVal(5),
        d: getVal(6),
        correct: getVal(7),
        explanation: getVal(8),
        loai: getVal(9),
        level: getVal(10),
        passage: getVal(11)
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const savedMa = localStorage.getItem('saved_maHS') || 'Huy';
    const input = document.getElementById('student-code');
    if (input) input.value = savedMa;
    
    window.loadData();
});

window.handleSubjectChange = function() {
    const mon = document.getElementById('subject-select').value;
    const levelContainer = document.getElementById('level-container');
    if (levelContainer) {
        levelContainer.style.display = (mon === 'Tiếng Anh') ? 'block' : 'none';
    }
    window.updateTopicList();
    window.updateLevelOptions();
    window.renderLeaderboard(mon);
};

window.updateLevelOptions = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelect = document.getElementById('level-select');
    if (!levelSelect) return;
    if (mon !== 'Tiếng Anh') return;

    const rankings = AppState.rankings || [];

    const passedLevel1 = rankings.some(r => {
        const rMon = cleanKey(r.subject || r.mon || '');
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === cleanKey('Tiếng Anh') && rLvl.includes('1') && rScore >= 8;
    });

    const passedLevel2 = rankings.some(r => {
        const rMon = cleanKey(r.subject || r.mon || '');
        const rLvl = String(r.level || '').trim();
        const rScore = parseFloat(r.score || 0);
        return rMon === cleanKey('Tiếng Anh') && rLvl.includes('2') && rScore >= 8;
    });

    for (let option of levelSelect.options) {
        const val = option.value.trim();
        if (val.includes('1') || val === '1') {
            option.disabled = false;
            option.style.opacity = '1';
        } else if (val.includes('2') || val === '2') {
            option.disabled = !passedLevel1;
            option.style.opacity = passedLevel1 ? '1' : '0.4';
        } else if (val.includes('3') || val === '3') {
            option.disabled = !passedLevel2;
            option.style.opacity = passedLevel2 ? '1' : '0.4';
        }
    }

    if (levelSelect.selectedOptions[0] && levelSelect.selectedOptions[0].disabled) {
        levelSelect.value = levelSelect.options[0].value;
    }
};

window.updateTopicList = function() {
    const monSelect = document.getElementById('subject-select').value.trim();
    const maHS = document.getElementById('student-code').value.trim();
    const container = document.getElementById('topic-container');
    if (!container || !monSelect) return;

    const cleanMonSelect = cleanKey(monSelect);

    const allowed = AppState.userPermissions
        .filter(p => String(p.maHS).trim() === maHS && cleanKey(p.mon) === cleanMonSelect)
        .map(p => String(p.chuDe).trim());

    const topics = [...new Set(AppState.allQuizData
        .filter(i => cleanKey(i.mon) === cleanMonSelect && i.question !== '')
        .map(i => i.chuDe))].filter(topic => topic !== "");

    if (topics.length === 0) {
        container.innerHTML = "Không tìm thấy chủ đề cho môn này.";
        return;
    }

    const hasSpecificPermissions = allowed.length > 0;

    container.innerHTML = topics.map(topic => {
        const isAllowed = !hasSpecificPermissions || allowed.includes(topic);
        return `<label style="display:block; margin:5px 0; opacity:${isAllowed ? '1' : '0.5'}">
            <input type="checkbox" name="topic" value="${escapeHTML(topic)}" ${isAllowed ? 'checked' : ''}> ${escapeHTML(topic)}
        </label>`;
    }).join('');
};

window.loadData = function() {
    const maHS = document.getElementById('student-code').value.trim();
    if (!maHS) return alert("Vui lòng nhập mã học sinh!");
    localStorage.setItem('saved_maHS', maHS);
    localStorage.removeItem('cache_quiz_data_' + maHS);

    const container = document.getElementById('topic-container');
    if (container) container.innerHTML = "Đang tải dữ liệu chủ đề...";

    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?ma=${encodeURIComponent(maHS)}&callback=handleQuizData`;
    script.onerror = () => { 
        script.remove(); 
        if (container) container.innerHTML = "Lỗi kết nối tải dữ liệu.";
    };
    document.body.appendChild(script);
    script.onload = () => script.remove();
};

window.handleQuizData = function(data) {
    if (!data || data.error) {
        const container = document.getElementById('topic-container');
        if (container) container.innerHTML = "Không thể tải dữ liệu từ máy chủ.";
        return;
    }
    
    let lastMon = '';
    let lastChuDe = '';
    let lastLevel = '';
    let lastLoai = '';
    let lastPassage = '';

    AppState.allQuizData = (data.questions || [])
        .map(rawItem => {
            let item = normalizeItem(rawItem);
            if (!item) return null;

            if (item.mon) lastMon = item.mon;
            else item.mon = lastMon;

            if (item.chuDe) lastChuDe = item.chuDe;
            else item.chuDe = lastChuDe;

            if (item.level) lastLevel = item.level;
            else if (lastLevel) item.level = lastLevel;

            if (item.loai) lastLoai = item.loai;
            else if (lastLoai) item.loai = lastLoai;

            // QUAN TRỌNG: Chỉ lưu và nhớ passage nếu thực sự thuộc môn Tiếng Anh và đúng dòng đọc hiểu
            if (item.passage) {
                lastPassage = item.passage;
            } else if (cleanKey(item.mon) !== cleanKey('Tiếng Anh') || !String(item.chuDe || '').toUpperCase().startsWith('DH')) {
                lastPassage = ''; // Xóa sạch passage nếu chuyển sang môn khác hoặc chủ đề khác không phải đọc hiểu
            } else if (lastPassage) {
                item.passage = lastPassage;
            }

            // Chặn tuyệt đối passage lọt sang môn Toán
            if (cleanKey(item.mon) !== cleanKey('Tiếng Anh')) {
                item.passage = '';
            }

            return item;
        })
        .filter(item => item && item.question !== '' && item.mon !== '');
        
    let lastMaHS = '';
    let lastPermMon = '';
    AppState.userPermissions = (data.permissions || []).map(p => {
        let maHS = String(p.maHS || p[0] || '').trim();
        let mon = String(p.mon || p[1] || '').trim();
        let chuDe = String(p.chuDe || p[2] || '').trim();
        
        if (maHS !== '') lastMaHS = maHS;
        else maHS = lastMaHS;
        
        if (mon !== '') lastPermMon = mon;
        else mon = lastPermMon;
        
        return { maHS, mon, chuDe };
    }).filter(p => p.chuDe !== '');

    AppState.rankings = data.rankings || [];

    const maHS = document.getElementById('student-code').value.trim();
    localStorage.setItem('cache_quiz_data_' + maHS, JSON.stringify(data));

    window.renderLeaderboard();
    window.updateTopicList();
    window.updateLevelOptions();
};

window.renderLeaderboard = function(subjectFilter = null) {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.className = "leaderboard-container";
    let data = AppState.rankings;
    if (subjectFilter && subjectFilter !== "-- Chọn môn --") {
        data = data.filter(item => cleanKey(item.subject || item.mon || '') === cleanKey(subjectFilter));
    }
    const qualifiedData = data.filter(item => item.score >= 8);
    if (qualifiedData.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 15px; color: #888;">Chưa có dữ liệu xếp hạng (>= 8).</div>`;
        return;
    }
    const top3 = qualifiedData.sort((a, b) => b.score - a.score).slice(0, 3);
    list.innerHTML = top3.map((item, index) => {
        let medal = index === 0 ? "🥇" : (index === 1 ? "🥈" : "🥉");
        let dateDisplay = item.date ? `<span class="time-text">Ngày: ${escapeHTML(item.date)}</span>` : "";
        let levelDisplay = item.level ? ` - <span style="font-size:0.85em; color:#555;">${escapeHTML(item.level)}</span>` : "";
        return `<div class="leaderboard-item"><div><span class="medal">${medal}</span> <b>${escapeHTML(item.name)}</b>${levelDisplay}${dateDisplay}</div><span class="score-badge">${item.score} đ</span></div>`;
    }).join('');
};

function getOriginalCorrectKey(item) {
    const raw = String(item.correct || '').trim();
    if (!raw) return '';
    const upper = raw.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) {
        return upper.toLowerCase();
    }
    for (let key of ['a', 'b', 'c', 'd']) {
        if (item[key] && String(item[key]).trim().toLowerCase() === raw.toLowerCase()) {
            return key;
        }
    }
    return raw; 
}

window.startQuiz = function() {
    const mon = document.getElementById('subject-select').value;
    const levelSelected = document.getElementById('level-select').value;
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(cb => cb.value);
    if (!selectedTopics.length) return alert("Vui lòng chọn chủ đề!");
    
    let readingTopics = selectedTopics.filter(t => t.toUpperCase().startsWith('DH'));
    let normalTopics = selectedTopics.filter(t => !t.toUpperCase().startsWith('DH'));

    let readingQuestions = AppState.allQuizData.filter(i => {
        const isSameSubject = (cleanKey(i.mon) === cleanKey(mon));
        const isTopicMatch = readingTopics.includes(i.chuDe);
        return isSameSubject && isTopicMatch && i.question !== '';
    });

    let normalQuestions = [];
    if (normalTopics.length > 0) {
        let filteredNormal = AppState.allQuizData.filter(i => {
            const isSameSubject = (cleanKey(i.mon) === cleanKey(mon));
            const isTopicMatch = normalTopics.includes(i.chuDe);
            const isLevelMatch = (cleanKey(mon) !== cleanKey('Tiếng Anh')) || (String(i.level).trim() === String(levelSelected).trim());
            return isSameSubject && isTopicMatch && isLevelMatch && i.question !== '';
        });
        normalQuestions = filteredNormal.sort(() => 0.5 - Math.random()).slice(0, 20);
    }

    let rawSelectedQuestions = [...readingQuestions, ...normalQuestions];
    if (rawSelectedQuestions.length === 0) return alert("Không tìm thấy câu hỏi phù hợp cho lựa chọn này!");

    let isReadingComp = readingTopics.length > 0;
    
    AppState.currentQuizData = rawSelectedQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        let isDH = item.chuDe && item.chuDe.toUpperCase().startsWith('DH');
        let shuffledKeys = isDH ? validKeys : [...validKeys].sort(() => 0.5 - Math.random());

        return {
            ...item,
            _shuffledKeys: shuffledKeys,
            _correctKey: originalCorrectKey
        };
    });

    AppState.isReadingComp = isReadingComp;
    AppState.correctCount = 0; 
    AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    window.renderQuiz();
    
    let totalSeconds = 10 * 60;
    if (isReadingComp) {
        totalSeconds = 22 * 60; 
    } else if (cleanKey(mon) === cleanKey('Toán')) {
        totalSeconds = 15 * 60;
    }
    window.startTimerTotal(totalSeconds);
};

window.renderQuiz = function() {
    const container = document.getElementById('quiz');
    if (!container) return;

    let passageHtml = '';
    // Lọc chỉ lấy passage thực sự có nội dung và bắt buộc phải là môn Tiếng Anh
    let passageItems = AppState.currentQuizData.filter(i => cleanKey(i.mon) === cleanKey('Tiếng Anh') && i.passage && i.passage.trim() !== '');
    if (passageItems.length > 0) {
        let uniquePassages = {};
        passageItems.forEach(item => {
            if (!uniquePassages[item.chuDe]) {
                uniquePassages[item.chuDe] = item.passage;
            }
        });

        for (let code in uniquePassages) {
            passageHtml += `
                <div class="passage-box">
                    <div class="passage-tag">${escapeHTML(code)}</div>
                    <div>
                        <button class="speaker-btn" data-question="${escapeHTML(uniquePassages[code])}" onclick="window.handleSpeak(this)">🔊 Nghe đoạn văn</button>
                    </div>
                    <div style="white-space: pre-line; margin-top: 10px;">${escapeHTML(uniquePassages[code])}</div>
                </div>
            `;
        }
    }

    let questionsHtml = AppState.currentQuizData.map((item, index) => {
        let loaiVal = (item.loai || '').toLowerCase();
        let hasNoOptions = (!item.a || item.a.trim() === '') &&
                           (!item.b || item.b.trim() === '') &&
                           (!item.c || item.c.trim() === '') &&
                           (!item.d || item.d.trim() === '');
        let isVoca = loaiVal.includes('voca') || loaiVal.includes('dien') || loaiVal.includes('từ') || hasNoOptions;
        
        let questionText = item.question;
        let explanationText = item.explanation || 'Không có giải thích.';

        let speakerBtn = '';
        let bodyHtml = '';

        if (cleanKey(item.mon) === cleanKey('Tiếng Anh')) {
            let chuDeLower = String(item.chuDe || '').toLowerCase();
            let loaiLower = String(item.loai || '').toLowerCase();
            
            if (isVoca) {
                const hasVietnameseChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(questionText);
                const isVietAnh = chuDeLower.includes('việt anh') || chuDeLower.includes('viet anh') || 
                                  loaiLower.includes('việt anh') || loaiLower.includes('viet anh') || 
                                  hasVietnameseChars;
                const isAnhViet = chuDeLower.includes('anh việt') || chuDeLower.includes('anh viet') || 
                                  loaiLower.includes('anh việt') || loaiLower.includes('anh viet') || 
                                  (!hasVietnameseChars && !isVietAnh);

                let placeholderText = "Nhập đáp án tiếng Anh...";
                let speakTextContent = questionText;
                let speakerLabel = '🔊 Nghe từ tiếng Anh';

                if (isVietAnh) {
                    placeholderText = "Nhập đáp án tiếng Anh...";
                    speakerLabel = '🔊 Nghe từ tiếng Anh';
                    speakTextContent = item._correctKey || questionText;
                } else if (isAnhViet) {
                    placeholderText = "Nhập đáp án tiếng Việt...";
                    speakerLabel = '🔊 Nghe từ tiếng Anh';
                    speakTextContent = questionText;
                }

                speakerBtn = `<button class="speaker-btn" data-question="${escapeHTML(speakTextContent)}" onclick="window.handleSpeak(this)">${speakerLabel}</button>`;

                bodyHtml = `
                    <div style="margin-top: 10px;">
                        <input type="text" id="voca-input-${index}" placeholder="${placeholderText}">
                        <button type="button" onclick="window.checkVocaAnswer(${index})" style="margin-top: 8px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Kiểm tra</button>
                    </div>
                `;
            } else {
                speakerBtn = `<button class="speaker-btn" data-question="${escapeHTML(questionText)}" onclick="window.handleSpeak(this)">🔊 Nghe câu hỏi</button>`;
                let keysToRender = item._shuffledKeys.length > 0 ? item._shuffledKeys : ['a', 'b', 'c', 'd'].filter(k => item[k]);
                bodyHtml = keysToRender.map((optKey, displayIndex) => {
                    if (!item[optKey]) return '';
                    let displayLetter = String.fromCharCode(65 + displayIndex);
                    return `<div class="option-box" data-orig-key="${optKey}" onclick="window.checkAnswer(this, '${optKey}', ${index})">
                        <b>${displayLetter}.</b> ${escapeHTML(item[optKey])}
                    </div>`;
                }).join('');
            }
        } else {
            let keysToRender = item._shuffledKeys.length > 0 ? item._shuffledKeys : ['a', 'b', 'c', 'd'].filter(k => item[k]);
            bodyHtml = keysToRender.map((optKey, displayIndex) => {
                if (!item[optKey]) return '';
                let displayLetter = String.fromCharCode(65 + displayIndex);
                return `<div class="option-box" data-orig-key="${optKey}" onclick="window.checkAnswer(this, '${optKey}', ${index})">
                    <b>${displayLetter}.</b> ${escapeHTML(item[optKey])}
                </div>`;
            }).join('');
        }

        return `<div class="quiz-card" id="q-card-${index}">
            <p><b>Câu ${index + 1}:</b> ${escapeHTML(questionText)}</p>
            ${speakerBtn}
            ${bodyHtml}
            <div class="explanation-box" id="exp-${index}"><b>Giải thích:</b> ${escapeHTML(explanationText)}</div>
        </div>`;
    }).join('');

    container.innerHTML = passageHtml + questionsHtml;
};

window.handleSpeak = function(btn) {
    const text = btn.getAttribute('data-question');
    window.speakText(text);
};

window.checkAnswer = function(element, chosenKey, index) {
    const card = document.getElementById(`q-card-${index}`);
    if (card.getAttribute('data-answered') === 'true') return;
    card.setAttribute('data-answered', 'true');

    const item = AppState.currentQuizData[index];
    const correctKey = item._correctKey;
    
    const options = card.querySelectorAll('.option-box');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        const optOrigKey = opt.getAttribute('data-orig-key');
        if (optOrigKey === correctKey) {
            opt.style.backgroundColor = '#d4edda';
            opt.style.borderColor = '#28a745';
        }
    });

    if (chosenKey === correctKey) {
        AppState.correctCount++;
        element.style.backgroundColor = '#d4edda';
        element.style.borderColor = '#28a745';
    } else {
        AppState.wrongCount++;
        element.style.backgroundColor = '#f8d7da';
        element.style.borderColor = '#dc3545';
        AppState.wrongQuestions.push(item);
    }

    document.getElementById('count-correct').textContent = AppState.correctCount;
    document.getElementById('count-wrong').textContent = AppState.wrongCount;

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';

    if (AppState.correctCount + AppState.wrongCount === AppState.currentQuizData.length) {
        clearInterval(AppState.timerInterval);
    }
};

window.checkVocaAnswer = function(index) {
    const card = document.getElementById(`q-card-${index}`);
    if (card.getAttribute('data-answered') === 'true') return;
    
    const inputElem = document.getElementById(`voca-input-${index}`);
    if (!inputElem) return;
    
    const userVal = inputElem.value.trim().toLowerCase();
    if (!userVal) return alert("Vui lòng nhập đáp án!");
    
    card.setAttribute('data-answered', 'true');
    inputElem.disabled = true;

    const item = AppState.currentQuizData[index];
    const correctVal = String(item._correctKey || '').trim().toLowerCase();

    const expBox = document.getElementById(`exp-${index}`);
    if (expBox) expBox.style.display = 'block';

    if (userVal === correctVal) {
        AppState.correctCount++;
        inputElem.style.backgroundColor = '#d4edda';
        inputElem.style.borderColor = '#28a745';
    } else {
        AppState.wrongCount++;
        inputElem.style.backgroundColor = '#f8d7da';
        inputElem.style.borderColor = '#dc3545';
        if (expBox) {
            expBox.innerHTML = `<b>Đáp án đúng:</b> <span style="color: green; font-weight: bold;">${escapeHTML(item._correctKey)}</span><br>` + expBox.innerHTML;
        }
        AppState.wrongQuestions.push(item);
    }

    document.getElementById('count-correct').textContent = AppState.correctCount;
    document.getElementById('count-wrong').textContent = AppState.wrongCount;

    if (AppState.correctCount + AppState.wrongCount === AppState.currentQuizData.length) {
        clearInterval(AppState.timerInterval);
    }
};

window.submitQuiz = function() {
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    
    let total = AppState.currentQuizData.length;
    let score = Math.round((AppState.correctCount / total) * 10 * 10) / 10;
    let maHS = document.getElementById('student-code').value.trim();
    let mon = document.getElementById('subject-select').value;
    let levelSelected = document.getElementById('level-select') ? document.getElementById('level-select').value : 'Level 1';

    alert(`Bài làm kết thúc!\nĐúng: ${AppState.correctCount}/${total}\nĐiểm của bạn: ${score} điểm`);

    const API_URL = "https://script.google.com/macros/s/AKfycbwClcRQ_6XkCq-psx7vOYArfCloZuQ_hBygTWmx_shheM27EaSYlyYUqk-2N97lXqCFew/exec";
    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maHS: maHS, score: score, total: total, mon: mon, level: levelSelected })
    }).catch(err => console.error("Lỗi gửi kết quả:", err));

    let retryBtnHtml = AppState.wrongQuestions.length > 0 ? `<button id="retry-wrong-btn" onclick="window.retryWrongAnswers()">Làm lại các câu sai (${AppState.wrongQuestions.length})</button>` : '';

    document.getElementById('quiz-screen').innerHTML = `
        <div class="container" style="text-align:center;">
            <h2>Kết Quả Bài Thi</h2>
            <p>Số câu đúng: <b>${AppState.correctCount}/${total}</b></p>
            <p>Điểm số: <b style="color:blue; font-size: 1.5em;">${score} đ</b></p>
            ${retryBtnHtml}
            <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; width:100%;">Làm bài mới / Về trang chủ</button>
        </div>
    `;
};

window.retryWrongAnswers = function() {
    if (AppState.wrongQuestions.length === 0) return;
    
    AppState.currentQuizData = AppState.wrongQuestions.map(item => {
        let originalCorrectKey = getOriginalCorrectKey(item);
        let validKeys = ['a', 'b', 'c', 'd'].filter(k => item[k] !== '');
        let isDH = item.chuDe && item.chuDe.toUpperCase().startsWith('DH');
        let shuffledKeys = isDH ? validKeys : [...validKeys].sort(() => 0.5 - Math.random());
        return {
            ...item,
            _shuffledKeys: shuffledKeys,
            _correctKey: originalCorrectKey
        };
    });

    AppState.correctCount = 0;
    AppState.wrongCount = 0;
    AppState.wrongQuestions = [];
    
    document.getElementById('quiz-screen').innerHTML = `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px;">
            <div>Thời gian: <span id="timer-display" style="color: red;">--:--</span></div>
            <div>Đúng: <span id="count-correct" style="color: green;">0</span> | Sai: <span id="count-wrong" style="color: red;">0</span></div>
        </div>
        <div id="quiz"></div>
        <button type="button" id="submit-btn" onclick="window.submitQuiz()" style="width: 100%; padding: 15px; background: #28a745; color: white; border: none; cursor: pointer; margin-top: 15px;">Nộp bài</button>
    `;
    window.renderQuiz();
    window.startTimerTotal(AppState.currentQuizData.length * 30);
};

window.startTimerTotal = function(totalSeconds) {
    const display = document.getElementById('timer-display');
    if (!display) return;
    
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    
    AppState.timerInterval = setInterval(() => {
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (totalSeconds <= 0) {
            clearInterval(AppState.timerInterval);
            alert("Hết thời gian làm bài!");
            window.submitQuiz();
        }
        totalSeconds--;
    }, 1000);
};

window.speakText = function(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let processedText = text.replace(/[_]+/g, ', ');
        let utterance = new SpeechSynthesisUtterance(processedText);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt không hỗ trợ đọc văn bản!");
    }
};
