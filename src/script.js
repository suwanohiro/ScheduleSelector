/**
 * 各曜日ごとのシフト時間帯
 */
const shiftTimes = {
    'Tue': ['17:15', '19:15'],
    'Wed': ['17:15', '19:15'],
    'Thu': ['17:15', '19:15'],
    'Fri': ['17:15', '19:15'],
    'Sat': ['10:00', '13:00', '15:00', '17:00']
};

/** 日本語の曜日名 */
const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
/** 英語の曜日キー */
const weekKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 現在の日付 */
let currentDate = new Date();
/** 選択されたシフト情報 */
let selectedShifts = {};
/** 過去日選択可否フラグ */
let allowPast = false; // デフォルトで過去も選択可

/**
 * 数値を2桁ゼロ埋め文字列に変換
 * @param {number} num
 * @returns {string}
 */
function pad(num) {
    return num.toString().padStart(2, '0');
}

/**
 * 指定日が昨日以前かどうか判定
 * @param {number} year
 * @param {number} month 0始まり
 * @param {number} date
 * @returns {boolean}
 */
function isBeforeOrYesterday(year, month, date) {
    const target = new Date(year, month, date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    // 昨日以前ならtrue
    return target <= yesterday;
}

/**
 * 指定した日付のカレンダーセルを生成する
 * @param {Date} day 日付オブジェクト
 * @param {number} year 年
 * @param {number} month 月（0始まり）
 * @param {number} date 日
 * @returns {HTMLDivElement} 生成されたセル要素
 */
function createDayCell(day, year, month, date) {
    const dayKey = weekKeys[day.getDay()];
    const ymd = `${year}/${pad(month + 1)}/${pad(date)}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-day';

    // 今日の日付にハイライト
    const today = new Date();
    if (
        day.getFullYear() === today.getFullYear() &&
        day.getMonth() === today.getMonth() &&
        day.getDate() === today.getDate()
    ) {
        cell.classList.add('today');
    }

    // 日付ラベル
    const label = document.createElement('div');
    label.className = 'date-label';
    label.textContent = date;

    if (day.getDay() === 0) label.classList.add('sun'); // 日曜
    if (day.getDay() === 6) label.classList.add('sat'); // 土曜

    cell.appendChild(label);

    // シフトがない曜日は早期リターン
    if (!shiftTimes[dayKey]) {
        cell.classList.add('no-shift');
        return cell;
    }

    const options = document.createElement('div');
    options.className = 'shift-options';
    const isPast = isBeforeOrYesterday(year, month, date);
    if (isPast && !allowPast) cell.classList.add('disabled');

    shiftTimes[dayKey].forEach(time => {
        const id = `${ymd}_${time}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'shift-checkbox';
        checkbox.id = id;
        checkbox.dataset.date = ymd;
        checkbox.dataset.time = time;

        // 選択状態の復元
        if (selectedShifts[ymd]?.includes(time)) checkbox.checked = true;

        // 過去日なら無効化
        if (isPast && !allowPast) checkbox.disabled = true;

        // チェックボックスの変更イベント
        checkbox.addEventListener('change', (e) => {
            if (!selectedShifts[ymd]) selectedShifts[ymd] = [];
            if (e.target.checked) {
                selectedShifts[ymd].push(time);
            } else {
                selectedShifts[ymd] = selectedShifts[ymd].filter(t => t !== time);
                if (selectedShifts[ymd].length === 0) delete selectedShifts[ymd];
            }
            renderSelectedShifts();
        });

        const label = document.createElement('label');
        label.htmlFor = id;
        label.style.cursor = 'pointer';
        label.appendChild(checkbox);
        label.append(`${time}`);

        options.appendChild(label);
    });
    cell.appendChild(options);

    return cell;
}

/**
 * カレンダーを描画する
 * @param {number} year
 * @param {number} month 0始まり
 */
function renderCalendar(year, month) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 曜日ヘッダーを作成
    weekDays.forEach(day => {
        const header = document.createElement('div');
        header.textContent = day;
        header.style.fontWeight = 'bold';
        header.style.textAlign = 'center';
        if (day === '土') header.classList.add('sat');
        if (day === '日') header.classList.add('sun');
        calendar.appendChild(header);
    });

    // 1日目までの空白セル
    for (let i = 0; i < firstDay.getDay(); i++) {
        const empty = document.createElement('div');
        calendar.appendChild(empty);
    }

    // 日付セルを作成（createDayCellで分離）
    for (let date = 1; date <= lastDay.getDate(); date++) {
        const day = new Date(year, month, date);
        const cell = createDayCell(day, year, month, date);
        calendar.appendChild(cell);
    }
}

/**
 * 日付表示形式
 */
const dateFormats = [
    { key: 'yyyy/mm/dd', label: 'yyyy/MM/dd', format: (y, m, d) => `${y}/${pad(m)}/${pad(d)}` },
    { key: 'yy/mm/dd', label: 'yy/MM/dd', format: (y, m, d) => `${String(y).slice(-2)}/${pad(m)}/${pad(d)}` },
    { key: 'mm/dd', label: 'MM/dd', format: (y, m, d) => `${pad(m)}/${pad(d)}` }
];
let selectedDateFormat = 'mm/dd'; // デフォルト

/**
 * 選択されたシフト一覧を表示する
 */
function renderSelectedShifts() {
    const out = document.getElementById('selectedShifts');
    let lines = [];
    const fmtObj = dateFormats.find(f => f.key === selectedDateFormat) || dateFormats[2];
    Object.keys(selectedShifts)
        .sort()
        .forEach(date => {
            // date: yyyy/mm/dd
            const [y, m, d] = date.split('/').map(Number);
            const dObj = new Date(y, m - 1, d);
            const wd = weekDays[dObj.getDay()];
            const dateStr = fmtObj.format(y, m, d);
            selectedShifts[date]
                .sort()
                .forEach(time => {
                    lines.push(`・${dateStr} (${wd}) ${time} コマ`);
                });
        });
    out.textContent = lines.join('\n');
}

/**
 * コピー機能のセットアップ
 */
function setupCopyButton() {
    const btn = document.getElementById('copyShifts');
    btn.onclick = function () {
        const text = document.getElementById('selectedShifts').innerText;
        if (!text) return;

        // クリップボードAPIが使える場合
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = "コピーしました！";
                setTimeout(() => { btn.textContent = "コピー"; }, 1200);
            }).catch(() => {
                fallbackCopyText(text, btn);
            });
        } else {
            // フォールバック
            fallbackCopyText(text, btn);
        }
    };
}

function fallbackCopyText(text, btn) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        const successful = document.execCommand('copy');
        btn.textContent = successful ? "コピーしました！" : "コピー失敗";
    } catch (err) {
        btn.textContent = "コピー非対応";
    }
    setTimeout(() => { btn.textContent = "コピー"; }, 1200);
    document.body.removeChild(textarea);
}

/**
 * クリア機能のセットアップ
 */
function setupClearButton() {
    const btn = document.getElementById('clearShifts');
    btn.onclick = function () {
        selectedShifts = {};
        renderSelectedShifts();
        // 全てのチェックボックスを外す
        document.querySelectorAll('.shift-checkbox').forEach(cb => cb.checked = false);
    };
}

/**
 * 月ラベルを更新する
 * @param {number} year
 * @param {number} month 0始まり
 */
function updateMonthLabel(year, month) {
    const label = document.getElementById('currentMonth');
    label.textContent = `${year}年${month + 1}月`;
}

/**
 * カレンダーの初期化と月送りボタンのセットアップ
 */
function setupCalendar() {
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();

    /**
     * カレンダーと月ラベルを再描画
     */
    function refresh() {
        renderCalendar(year, month);
        updateMonthLabel(year, month);
    }

    document.getElementById('prevMonth').onclick = () => {
        month--;
        if (month < 0) {
            month = 11;
            year--;
        }
        refresh();
    };
    document.getElementById('nextMonth').onclick = () => {
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        refresh();
    };
    // 今月に戻るボタン
    document.getElementById('resetMonth').onclick = () => {
        year = new Date().getFullYear();
        month = new Date().getMonth();
        refresh();
    };

    refresh();
}

/**
 * 「過去も選択可」チェックボックスのセットアップ
 */
function setupAllowPastControl() {
    const cb = document.getElementById('allowPast');
    allowPast = cb.checked;
    cb.addEventListener('change', function () {
        allowPast = this.checked;
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });
}

/**
 * バージョン情報をres/version.txtから取得して表示
 */
function fetchAndShowVersion() {
    fetch('./public/version.txt')
        .then(res => res.text())
        .then(text => {
            const versionElem = document.getElementById('appVersion');
            if (versionElem) {
                versionElem.textContent = text.trim();
            }
        })
        .catch(() => {
            // 失敗時は何もしない（またはデフォルト値のまま）
            console.warn('バージョン情報の取得に失敗しました');
        });
}

window.onload = function () {
    setupCalendar();
    renderSelectedShifts();
    setupCopyButton();
    setupClearButton();
    setupAllowPastControl();

    // ▼ select要素のイベントで切り替え
    const select = document.getElementById('dateFormatSelect');
    if (select) {
        selectedDateFormat = select.value;
        select.addEventListener('change', function () {
            selectedDateFormat = this.value;
            renderSelectedShifts();
        });
    }

    fetchAndShowVersion(); // res/version.txtから取得
};