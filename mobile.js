(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        initOrderActions();
        initHoldSheet();
        initTabs();
    });

    // ---------- 토스트 ----------
    function showToast(text, ms) {
        var t = document.getElementById('toast');
        if (!t) return;
        t.innerText = text;
        t.classList.add('is-show');
        clearTimeout(t._tid);
        t._tid = setTimeout(function () { t.classList.remove('is-show'); }, ms || 1800);
    }

    // 카드 셀렉터: 신규 추천 카드(.m-rec-card) + 기존 카드(.m-card) 모두 호환
    function findCardFromBtn(btn) {
        return btn.closest('.m-rec-card') || btn.closest('.m-card');
    }

    // ---------- 카드 행 액션 (신청 / 보류) ----------
    function initOrderActions() {
        var list = document.getElementById('orderList');
        if (!list) return;

        list.addEventListener('click', function (e) {
            var btn = e.target.closest('.m-rec-btn, .m-card-btn');
            if (!btn) return;
            var card = findCardFromBtn(btn);
            if (!card) return;

            var action = btn.getAttribute('data-action');
            if (action === 'apply') {
                applyCard(card, btn);
            } else if (action === 'hold') {
                openHoldSheet([card]);
            }
        });
    }

    function isRecCard(card) {
        return card.classList.contains('m-rec-card');
    }

    function applyCard(card, btn) {
        if (card.classList.contains('is-applied')) return;
        card.classList.remove('is-recommend-p0', 'is-recommend-p1', 'is-recommend-p2', 'is-p0', 'is-p1', 'is-p2', 'is-held');
        card.classList.add('is-applied');

        if (isRecCard(card)) {
            // 새 추천 카드: 메타 행의 우선순위/AI 태그 → 신청 완료 뱃지
            var meta = card.querySelector('.m-rec-meta');
            if (meta) {
                var prio = meta.querySelector('.m-prio-badge');
                if (prio) prio.remove();
                var ai = meta.querySelector('.m-ai-tag');
                if (ai) ai.remove();
                var done = document.createElement('span');
                done.className = 'm-prio-badge is-done-blue';
                done.innerText = '신청 완료';
                meta.insertBefore(done, meta.firstChild);
            }
            // 진행상태 셀(3번째 컬럼 마지막 row) 갱신
            var stateCell = card.querySelector('.m-order-card-rec .m-order-cell:nth-child(3) .state-red, .m-order-card-rec .m-order-cell:nth-child(3) .state-orange, .m-order-card-rec .m-order-cell:nth-child(3) .state-blue');
            if (stateCell) {
                stateCell.className = 'state-red';
                stateCell.style.color = '#16A34A';
                stateCell.innerText = '신청완료';
            }
            // 액션 셀: 신청 비활성, 보류는 그대로
            var applyBtn = card.querySelector('.m-rec-btn.is-apply');
            if (applyBtn) {
                applyBtn.disabled = true;
                applyBtn.innerText = '완료';
            }
        } else {
            // 기존 카드 호환
            var head = card.querySelector('.m-card-head');
            if (head) {
                var prio2 = head.querySelector('.m-prio-badge');
                if (prio2) prio2.remove();
                var ai2 = head.querySelector('.m-ai-tag');
                if (ai2) ai2.remove();
                var done2 = document.createElement('span');
                done2.className = 'm-prio-badge is-done-blue';
                done2.innerText = '신청 완료';
                head.insertBefore(done2, head.firstChild);
            }
            var actions = card.querySelector('.m-card-actions');
            if (actions) {
                actions.innerHTML = '<button class="m-card-btn is-secondary" disabled>신청 완료</button>';
            }
        }

        showToast('주문이 신청되었습니다');
    }

    function holdCard(card, reasonText, days) {
        card.classList.remove('is-recommend-p0', 'is-recommend-p1', 'is-recommend-p2', 'is-p0', 'is-p1', 'is-p2', 'is-applied');
        card.classList.add('is-held');

        if (isRecCard(card)) {
            var meta = card.querySelector('.m-rec-meta');
            if (meta) {
                var prio = meta.querySelector('.m-prio-badge');
                if (prio) prio.remove();
                var ai = meta.querySelector('.m-ai-tag');
                if (ai) ai.remove();
                var hold = document.createElement('span');
                hold.className = 'm-prio-badge is-hold';
                hold.innerText = '보류';
                meta.insertBefore(hold, meta.firstChild);
            }
            var msgEl = card.querySelector('.m-rec-msg');
            if (msgEl) {
                msgEl.innerHTML = '<span class="material-symbols-outlined">pause_circle</span>' +
                    (days ? reasonText + ' (' + days + '일 후 재추천)' : reasonText);
            }
            // 진행상태 셀 갱신
            var stateCell = card.querySelector('.m-order-card-rec .m-order-cell:nth-child(3) span:last-child');
            if (stateCell) {
                stateCell.className = 'state-gray';
                stateCell.innerText = '보류';
            }
            var applyBtn = card.querySelector('.m-rec-btn.is-apply');
            if (applyBtn) { applyBtn.disabled = true; applyBtn.innerText = '신청'; }
            var holdBtn = card.querySelector('.m-rec-btn.is-hold');
            if (holdBtn) { holdBtn.disabled = true; holdBtn.innerText = '처리됨'; }
        } else {
            // 기존 카드 호환
            var head = card.querySelector('.m-card-head');
            if (head) {
                var prio2 = head.querySelector('.m-prio-badge');
                if (prio2) prio2.remove();
                var ai2 = head.querySelector('.m-ai-tag');
                if (ai2) ai2.remove();
                var hold2 = document.createElement('span');
                hold2.className = 'm-prio-badge is-hold';
                hold2.innerText = '보류';
                head.insertBefore(hold2, head.firstChild);
            }
            var msg = card.querySelector('.m-card-msg');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'm-card-msg';
                var actions = card.querySelector('.m-card-actions');
                if (actions) card.insertBefore(msg, actions);
                else card.appendChild(msg);
            }
            msg.innerHTML = '<span class="material-symbols-outlined">pause_circle</span>' +
                (days ? reasonText + ' (' + days + '일 후 재추천)' : reasonText);
            var actions2 = card.querySelector('.m-card-actions');
            if (actions2) {
                actions2.innerHTML = '<button class="m-card-btn is-secondary" disabled>보류 처리됨</button>';
            }
        }
    }

    // ---------- 보류 바텀시트 ----------
    var holdContext = { cards: [] };

    function initHoldSheet() {
        var sheet = document.getElementById('holdSheet');
        if (!sheet) return;

        sheet.addEventListener('click', function (e) {
            if (e.target === sheet || e.target.closest('[data-sheet-close]')) {
                closeHoldSheet();
            }
        });

        var period = document.getElementById('sheetPeriod');
        if (period) {
            period.addEventListener('input', updateNextDate);
        }

        var confirm = document.getElementById('sheetConfirm');
        if (confirm) {
            confirm.addEventListener('click', function () {
                var reasonInput = document.querySelector('input[name="m-reason"]:checked');
                var reason = reasonInput ? reasonInput.value : 'defer';
                var days = period ? parseInt(period.value, 10) || 0 : 0;
                var labelMap = {
                    defer: '다시 알림',
                    suspend: '거래 중단',
                    inactive: '비활성',
                    dataerror: '누락 / Data 오류',
                    manual: '수기 접수',
                    end: '거래 종료'
                };
                var text = labelMap[reason] || '보류';
                holdContext.cards.forEach(function (c) {
                    holdCard(c, text, reason === 'defer' ? days : 0);
                });
                closeHoldSheet();
                showToast(holdContext.cards.length + '건 보류 처리 완료');
            });
        }
    }

    function openHoldSheet(cards) {
        if (!cards || !cards.length) return;
        var sheet = document.getElementById('holdSheet');
        if (!sheet) return;
        holdContext.cards = cards;

        var nameEl = document.getElementById('sheetTargetName');
        var metaEl = document.getElementById('sheetTargetMeta');
        if (cards.length === 1) {
            var c = cards[0];
            if (nameEl) nameEl.innerText = c.dataset.customer || '-';
            if (metaEl) metaEl.innerText = '코드 ' + (c.dataset.code || '-') + ' · 주문량 ' + (c.dataset.amount || '-') + ' kg';
        } else {
            if (nameEl) nameEl.innerText = cards.length + '건 일괄 보류';
            var sum = cards.reduce(function (s, c) {
                return s + (parseInt((c.dataset.amount || '0').replace(/,/g, ''), 10) || 0);
            }, 0);
            if (metaEl) metaEl.innerText = '합계 주문량 ' + sum.toLocaleString() + ' kg';
        }

        updateNextDate();
        sheet.classList.add('is-open');
    }

    function closeHoldSheet() {
        var sheet = document.getElementById('holdSheet');
        if (sheet) sheet.classList.remove('is-open');
    }

    function updateNextDate() {
        var period = document.getElementById('sheetPeriod');
        var next = document.getElementById('sheetNext');
        if (!period || !next) return;
        var d = new Date();
        d.setDate(d.getDate() + (parseInt(period.value, 10) || 0));
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        next.innerText = y + '-' + m + '-' + day;
    }

    // ---------- 탭 ----------
    function initTabs() {
        var tabs = document.querySelectorAll('.m-tab');
        if (!tabs.length) return;
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('is-active'); });
                tab.classList.add('is-active');
                var filter = tab.getAttribute('data-filter');
                if (!filter) return;
                applyFilter(filter);
            });
        });
    }

    function applyFilter(filter) {
        var cards = document.querySelectorAll('#orderList .m-rec-card, #orderList .m-card');
        cards.forEach(function (c) {
            var prio = c.dataset.prio || '';
            var show = true;
            if (filter === 'all') {
                show = true;
            } else if (filter === 'recommend-p0') {
                show = prio === 'p0' || c.classList.contains('is-p0') || c.classList.contains('is-recommend-p0');
            } else if (filter === 'recommend-p1') {
                show = prio === 'p1' || c.classList.contains('is-p1') || c.classList.contains('is-recommend-p1');
            } else if (filter === 'recommend-p2') {
                show = prio === 'p2' || c.classList.contains('is-p2') || c.classList.contains('is-recommend-p2');
            } else if (filter === 'held') {
                show = c.classList.contains('is-held');
            }
            c.style.display = show ? '' : 'none';
        });
    }

})();
