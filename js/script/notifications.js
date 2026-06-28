/**
 * Navbar bildiriş zəngi + real-time (SignalR).
 * Bu script header.html ilə hər səhifədə yüklənir.
 *
 * Backend:
 *   GET   /api/notifications            → bildiriş siyahısı
 *   PATCH /api/notifications/{id}/read  → birini oxu
 *   PATCH /api/notifications/read-all   → hamısını oxu
 *   Hub:  /hubs/notifications  (ReceiveNotification, UnreadCount)
 */
(function ()
{
    if (window.__jbNotifInit) return;
    window.__jbNotifInit = true;

    var API_ROOT = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'https://localhost:7135/api';
    var HUB_URL = API_ROOT.replace(/\/api\/?$/, '') + '/hubs/notifications';

    function token() { return localStorage.getItem('accessToken'); }

    function authFetch(path, options)
    {
        // api-client.js mövcuddursa ondan istifadə et (token refresh dəstəyi var)
        if (typeof apiFetch === 'function') return apiFetch(path, options);

        options = options || {};
        options.headers = options.headers || {};
        options.headers['Content-Type'] = 'application/json';
        var t = token();
        if (t) options.headers['Authorization'] = 'Bearer ' + t;
        return fetch(API_ROOT + path, options).then(function (r)
        {
            if (r.status === 204) return { success: true };
            return r.json();
        });
    }

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function timeAgo(dateStr)
    {
        var d = new Date(dateStr);
        var diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (isNaN(diff)) return '';
        if (diff < 60) return 'indi';
        if (diff < 3600) return Math.floor(diff / 60) + ' dəq əvvəl';
        if (diff < 86400) return Math.floor(diff / 3600) + ' saat əvvəl';
        if (diff < 604800) return Math.floor(diff / 86400) + ' gün əvvəl';
        return d.toLocaleDateString();
    }

    var $wrap, $btn, $panel, $badge, $list, $markAll;
    var unreadCount = 0;

    function updateBadge(count)
    {
        unreadCount = Math.max(0, count || 0);
        if (unreadCount > 0)
        {
            $badge.text(unreadCount > 99 ? '99+' : unreadCount).show();
        } else
        {
            $badge.hide();
        }
    }

    function renderList(items)
    {
        $list.empty();
        if (!items || !items.length)
        {
            $list.html('<div class="jb-notif-empty">Bildiriş yoxdur</div>');
            return;
        }
        items.forEach(function (n)
        {
            var cls = 'jb-notif-item' + (n.isRead ? '' : ' unread');
            var $item = $(
                '<a href="javascript:void(0);" class="' + cls + '" data-id="' + n.id + '"' +
                (n.actionUrl ? ' data-url="' + escapeHtml(n.actionUrl) + '"' : '') + '>' +
                '<p class="jb-notif-title">' + escapeHtml(n.title) + '</p>' +
                '<p class="jb-notif-msg">' + escapeHtml(n.message) + '</p>' +
                '<span class="jb-notif-time">' + timeAgo(n.createdAt) + '</span>' +
                '</a>'
            );
            $list.append($item);
        });

        $list.find('.jb-notif-item').off('click').on('click', function ()
        {
            var $el = $(this);
            var id = $el.attr('data-id');
            var url = $el.attr('data-url');
            if ($el.hasClass('unread'))
            {
                $el.removeClass('unread');
                updateBadge(unreadCount - 1);
                authFetch('/notifications/' + id + '/read', { method: 'PATCH' }).catch(function () { });
            }
            if (url) window.location.href = url;
        });
    }

    function loadNotifications()
    {
        authFetch('/notifications', { method: 'GET' })
            .then(function (res)
            {
                var items = (res && res.data) || [];
                renderList(items);
                var unread = items.filter(function (n) { return !n.isRead; }).length;
                updateBadge(unread);
            })
            .catch(function (err) { console.error('Bildirişlər yüklənmədi:', err); });
    }

    function prependNotification(n)
    {
        // "Bildiriş yoxdur" mesajını təmizlə
        if ($list.find('.jb-notif-empty').length) $list.empty();
        var $item = $(
            '<a href="javascript:void(0);" class="jb-notif-item unread" data-id="' + n.id + '"' +
            (n.actionUrl ? ' data-url="' + escapeHtml(n.actionUrl) + '"' : '') + '>' +
            '<p class="jb-notif-title">' + escapeHtml(n.title) + '</p>' +
            '<p class="jb-notif-msg">' + escapeHtml(n.message) + '</p>' +
            '<span class="jb-notif-time">indi</span>' +
            '</a>'
        );
        $item.on('click', function ()
        {
            var $el = $(this);
            var id = $el.attr('data-id');
            var url = $el.attr('data-url');
            if ($el.hasClass('unread'))
            {
                $el.removeClass('unread');
                updateBadge(unreadCount - 1);
                authFetch('/notifications/' + id + '/read', { method: 'PATCH' }).catch(function () { });
            }
            if (url) window.location.href = url;
        });
        $list.prepend($item);
        updateBadge(unreadCount + 1);
    }

    function connectSignalR()
    {
        if (typeof signalR === 'undefined')
        {
            // Kitabxana hələ yüklənməyibsə bir az gözlə
            return setTimeout(connectSignalR, 1000);
        }

        var connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, { accessTokenFactory: function () { return token(); } })
            .withAutomaticReconnect()
            .build();

        connection.on('ReceiveNotification', function (n)
        {
            prependNotification(n);
        });

        connection.on('UnreadCount', function (count)
        {
            updateBadge(count);
        });

        connection.start().catch(function (err)
        {
            console.warn('SignalR qoşulması alınmadı (polling-ə keçilir):', err);
        });
    }

    function init()
    {
        $wrap = $('#jbNotifWrap');
        if (!$wrap.length) return setTimeout(init, 300); // header hələ yüklənməyib

        if (!token()) { $wrap.hide(); return; }

        $btn = $('#jbNotifBtn');
        $panel = $('#jbNotifPanel');
        $badge = $('#jbNotifBadge');
        $list = $('#jbNotifList');
        $markAll = $('#jbNotifMarkAll');

        $wrap.show();

        $btn.off('click').on('click', function (e)
        {
            e.stopPropagation();
            $panel.toggleClass('open');
        });

        $(document).on('click', function (e)
        {
            if (!$(e.target).closest('#jbNotifWrap').length) $panel.removeClass('open');
        });

        $markAll.off('click').on('click', function ()
        {
            authFetch('/notifications/read-all', { method: 'PATCH' })
                .then(function ()
                {
                    $list.find('.jb-notif-item').removeClass('unread');
                    updateBadge(0);
                })
                .catch(function () { });
        });

        loadNotifications();
        connectSignalR();
    }

    $(document).ready(init);
})();
