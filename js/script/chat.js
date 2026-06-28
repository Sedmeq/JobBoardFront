/**
 * Chat (Employer ↔ Candidate) — SignalR ilə real-time yazışma.
 * Backend:
 *   GET   /api/chats                 → söhbət siyahısı
 *   GET   /api/chats/{id}            → söhbət + mesajlar
 *   POST  /api/chats/{id}/messages   → mesaj göndər
 *   PATCH /api/chats/{id}/close      → (employer) söhbəti bağla
 *   Hub:  /hubs/notifications  (ReceiveChatMessage, ChatClosed)
 */
$(document).ready(function ()
{
    if (!$('#chatList').length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var params = new URLSearchParams(window.location.search);
    var openId = parseInt(params.get('conversation')) || null;

    var current = null;          // cari söhbət detalı
    var appended = {};           // mesaj id təkrarının qarşısını al
    var conversations = [];

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function fmtTime(d)
    {
        if (!d) return '';
        var dt = new Date(d);
        return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // ─── Söhbət siyahısı ─────────────────────────────────────
    function loadConversations(selectId)
    {
        apiFetch('/chats')
            .then(function (res)
            {
                conversations = (res && res.data) || [];
                renderList();
                var toOpen = selectId || openId || (conversations[0] && conversations[0].id);
                if (toOpen) openConversation(toOpen);
            })
            .catch(function (err)
            {
                console.error('Conversations load error:', err);
                $('#chatList').html('<div class="text-center p-a20 text-danger">Söhbətlər yüklənmədi.</div>');
            });
    }

    function renderList()
    {
        var box = $('#chatList');
        box.empty();
        if (!conversations.length)
        {
            box.html('<div class="text-center p-a20 text-muted">Hələ söhbət yoxdur.</div>');
            return;
        }
        conversations.forEach(function (c)
        {
            var avatar = c.otherPartyAvatar ? esc(c.otherPartyAvatar) : 'images/team/pic1.jpg';
            var active = (current && current.id === c.id) ? ' active' : '';
            var badge = c.unreadCount > 0 ? '<span class="chat-badge">' + c.unreadCount + '</span>' : '';
            box.append(
                '<div class="chat-list-item' + active + '" data-id="' + c.id + '">' +
                '<img src="' + avatar + '" onerror="this.src=\'images/team/pic1.jpg\'" alt="">' +
                '<div style="flex:1;min-width:0;">' +
                '<p class="ci-name">' + esc(c.otherPartyName) + '</p>' +
                '<p class="ci-job">' + esc(c.jobTitle) + '</p>' +
                '<p class="ci-last">' + esc(c.lastMessage || 'No messages yet') + '</p>' +
                '</div>' + badge +
                '</div>'
            );
        });
        box.find('.chat-list-item').off('click').on('click', function ()
        {
            openConversation(parseInt($(this).attr('data-id')));
        });
    }

    // ─── Söhbəti aç ──────────────────────────────────────────
    function openConversation(id)
    {
        apiFetch('/chats/' + id)
            .then(function (res)
            {
                current = res && res.data;
                if (!current) return;
                appended = {};

                $('#chatPlaceholder').hide();
                $('#chatPanel').css('display', 'flex');

                $('#chatHeadName').text(current.otherPartyName);
                $('#chatHeadJob').text(current.jobTitle);
                $('#chatHeadAvatar').attr('src', current.otherPartyAvatar || 'images/team/pic1.jpg')
                    .attr('onerror', "this.src='images/team/pic1.jpg'");

                renderMessages(current.messages);
                applyStatus(current.status);

                // Employer üçün "End Chat" düyməsi
                if (current.isEmployer && current.status === 'open')
                    $('#chatEndBtn').show();
                else
                    $('#chatEndBtn').hide();

                // siyahıda unread sıfırlanır
                var item = conversations.filter(function (x) { return x.id === id; })[0];
                if (item) item.unreadCount = 0;
                renderList();
            })
            .catch(function (err)
            {
                console.error('Open conversation error:', err);
            });
    }

    function applyStatus(status)
    {
        var pill = $('#chatStatusPill').text(status);
        if (status === 'closed')
        {
            pill.attr('class', 'chat-status-pill cs-closed');
            $('#chatInput').prop('disabled', true);
            $('#chatSendBtn').prop('disabled', true);
            $('#chatClosedNote').show();
            $('#chatEndBtn').hide();
        }
        else
        {
            pill.attr('class', 'chat-status-pill cs-open');
            $('#chatInput').prop('disabled', false);
            $('#chatSendBtn').prop('disabled', false);
            $('#chatClosedNote').hide();
        }
    }

    function renderMessages(messages)
    {
        var body = $('#chatBody');
        body.empty();
        (messages || []).forEach(appendMessage);
        scrollDown();
    }

    function appendMessage(m)
    {
        if (appended[m.id]) return;
        appended[m.id] = true;
        // "mənim" mesajım: göndərən qarşı tərəf deyilsə
        var mine = (m.senderUserId !== current.otherPartyUserId);
        $('#chatBody').append(
            '<div class="chat-msg' + (mine ? ' mine' : '') + '">' +
            '<div>' +
            '<div class="bubble">' + esc(m.content).replace(/\n/g, '<br>') + '</div>' +
            '<div class="meta">' + esc(mine ? 'You' : m.senderName) + ' · ' + fmtTime(m.sentAt) + '</div>' +
            '</div>' +
            '</div>'
        );
    }

    function scrollDown()
    {
        var b = document.getElementById('chatBody');
        if (b) b.scrollTop = b.scrollHeight;
    }

    // ─── Mesaj göndər ────────────────────────────────────────
    $('#chatForm').on('submit', function (e)
    {
        e.preventDefault();
        if (!current || current.status === 'closed') return;
        var content = $('#chatInput').val().trim();
        if (!content) return;
        $('#chatSendBtn').prop('disabled', true);

        apiFetch('/chats/' + current.id + '/messages', {
            method: 'POST',
            body: JSON.stringify({ content: content })
        })
            .then(function (res)
            {
                $('#chatSendBtn').prop('disabled', false);
                $('#chatInput').val('').focus();
                if (res && res.data) { appendMessage(res.data); scrollDown(); }
                // siyahıda son mesajı yenilə
                var item = conversations.filter(function (x) { return x.id === current.id; })[0];
                if (item) { item.lastMessage = content; renderList(); }
            })
            .catch(function (err)
            {
                $('#chatSendBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Mesaj göndərilmədi.';
                alert(msg);
            });
    });

    // ─── End Chat (employer) ─────────────────────────────────
    $('#chatEndBtn').on('click', function ()
    {
        if (!current || !current.isEmployer) return;
        if (!confirm('Söhbəti sona çatdırmaq istəyirsiniz?')) return;
        apiFetch('/chats/' + current.id + '/close', { method: 'PATCH' })
            .then(function ()
            {
                current.status = 'closed';
                applyStatus('closed');
            })
            .catch(function () { alert('Söhbət bağlana bilmədi.'); });
    });

    // ─── SignalR real-time ───────────────────────────────────
    function connectSignalR()
    {
        if (typeof signalR === 'undefined') return setTimeout(connectSignalR, 800);

        var apiRoot = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'https://localhost:7135/api';
        var hubUrl = apiRoot.replace(/\/api\/?$/, '') + '/hubs/notifications';

        var conn = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: function () { return localStorage.getItem('accessToken'); } })
            .withAutomaticReconnect()
            .build();

        conn.on('ReceiveChatMessage', function (m)
        {
            if (current && m.conversationId === current.id)
            {
                appendMessage(m);
                scrollDown();
            }
            // siyahını yenilə (son mesaj / unread)
            var item = conversations.filter(function (x) { return x.id === m.conversationId; })[0];
            if (item)
            {
                item.lastMessage = m.content;
                if (!current || current.id !== m.conversationId)
                {
                    // gələn mesaj qarşı tərəfdəndirsə unread artır
                    item.unreadCount = (item.unreadCount || 0) + 1;
                }
                renderList();
            }
            else
            {
                // yeni söhbətdirsə siyahını yenilə
                loadConversations(current ? current.id : null);
            }
        });

        conn.on('ChatClosed', function (convId)
        {
            if (current && current.id === convId) { current.status = 'closed'; applyStatus('closed'); }
        });

        conn.start().catch(function (err) { console.warn('Chat SignalR error:', err); });
    }

    loadConversations();
    connectSignalR();
});
