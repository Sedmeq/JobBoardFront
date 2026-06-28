/**
 * Admin — Contact Messages.
 * Backend:
 *   GET   /api/contact/messages?page=&pageSize=&filter=
 *   PATCH /api/contact/messages/{id}/read
 *   POST  /api/contact/messages/{id}/reply  { message }
 */
$(document).ready(function ()
{
    var body = $('#adminMsgBody');
    if (!body.length) return;

    var pagination = $('#adminMsgPagination');
    var currentPage = 1;
    var pageSize = 10;
    var messages = [];
    var activeMessage = null;
    var modalEl = document.getElementById('msgModal');
    // Modalı birbaşa <body>-yə köçürürük ki, ana elementlərin stacking-context-i
    // (transform/overflow) backdrop-un modalın üstünə düşməsinə səbəb olmasın.
    if (modalEl && modalEl.parentNode !== document.body)
    {
        document.body.appendChild(modalEl);
    }
    var modal = modalEl ? new bootstrap.Modal(modalEl) : null;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '-';
        return new Date(d).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function statusBadge(m)
    {
        if (m.isReplied)
            return '<span class="text-success" style="font-weight:600;">Replied</span>';
        if (!m.isRead)
            return '<span class="text-danger" style="font-weight:600;">New</span>';
        return '<span class="text-warning" style="font-weight:600;">Pending</span>';
    }

    function fetchMessages(page)
    {
        currentPage = page || 1;
        var filter = $('#adminMsgFilter').val();

        body.html('<tr><td colspan="5" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (filter) q.push('filter=' + encodeURIComponent(filter));

        apiFetch('/contact/messages?' + q.join('&'))
            .then(function (result)
            {
                body.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    body.html('<tr><td colspan="5" class="text-center p-a30"><h5>No messages found</h5></td></tr>');
                    return;
                }
                messages = result.data.items;
                messages.forEach(function (m)
                {
                    var rowStyle = m.isRead ? '' : ' style="font-weight:600;"';
                    body.append(
                        '<tr' + rowStyle + '>' +
                        '<td>' + escapeHtml(m.name) + '<br><small class="text-muted">' + escapeHtml(m.email) + '</small></td>' +
                        '<td>' + escapeHtml(m.subject) + '</td>' +
                        '<td>' + formatDate(m.createdAt) + '</td>' +
                        '<td>' + statusBadge(m) + '</td>' +
                        '<td><a href="javascript:void(0);" class="site-button-link view-msg" data-id="' + m.id + '">' +
                        '<i class="fa fa-eye"></i> View</a></td>' +
                        '</tr>'
                    );
                });
                body.find('.view-msg').on('click', function ()
                {
                    openMessage(parseInt($(this).attr('data-id')));
                });
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Admin messages error:', err);
                body.html('<tr><td colspan="5" class="text-center p-a30"><p class="text-danger">Failed to load messages.</p></td></tr>');
            });
    }

    function openMessage(id)
    {
        activeMessage = messages.filter(function (m) { return m.id === id; })[0];
        if (!activeMessage) return;

        $('#msgModalTitle').text(activeMessage.subject);
        $('#msgFromName').text(activeMessage.name);
        $('#msgFromEmail').text(activeMessage.email);
        $('#msgFromPhone').text(activeMessage.phone || '-');
        $('#msgSubject').text(activeMessage.subject);
        $('#msgBody').text(activeMessage.message);
        $('#msgReplyAlert').hide().empty();
        $('#msgReplyText').val('');

        if (activeMessage.isReplied && activeMessage.replyMessage)
        {
            $('#msgPreviousReplyText').text(activeMessage.replyMessage);
            $('#msgPreviousReply').show();
        } else
        {
            $('#msgPreviousReply').hide();
        }

        if (modal) modal.show();

        // Oxunmamışsa oxundu işarələ
        if (!activeMessage.isRead)
        {
            apiFetch('/contact/messages/' + id + '/read', { method: 'PATCH' })
                .then(function () { activeMessage.isRead = true; })
                .catch(function () { });
        }
    }

    function showReplyAlert(msg, type)
    {
        $('#msgReplyAlert').removeClass('alert-success alert-danger')
            .addClass('alert alert-' + type).html(msg).show();
    }

    $('#msgReplyBtn').on('click', function ()
    {
        if (!activeMessage) return;
        var text = $('#msgReplyText').val().trim();
        if (!text)
        {
            showReplyAlert('Cavab mesajı boş ola bilməz.', 'danger');
            return;
        }

        var btn = $(this);
        var original = btn.html();
        btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Göndərilir...');

        apiFetch('/contact/messages/' + activeMessage.id + '/reply', {
            method: 'POST',
            body: JSON.stringify({ message: text })
        })
            .then(function ()
            {
                btn.prop('disabled', false).html(original);
                showReplyAlert('Cavab uğurla göndərildi.', 'success');
                activeMessage.isReplied = true;
                activeMessage.replyMessage = text;
                setTimeout(function ()
                {
                    if (modal) modal.hide();
                    fetchMessages(currentPage);
                }, 1200);
            })
            .catch(function (err)
            {
                btn.prop('disabled', false).html(original);
                var m = (err && err.data && err.data.error && err.data.error.message) || 'Cavab göndərilə bilmədi.';
                showReplyAlert(m, 'danger');
            });
    });

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (pageCount <= 1) return;
        pagination.append('<li class="previous ' + (currentPage === 1 ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage - 1) + '"><i class="ti-arrow-left"></i> Prev</a></li>');
        for (var i = 1; i <= pageCount; i++)
        {
            pagination.append('<li class="' + (i === currentPage ? 'active' : '') + '"><a href="javascript:void(0);" data-page="' + i + '">' + i + '</a></li>');
        }
        pagination.append('<li class="next ' + (!hasNextPage ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage + 1) + '">Next <i class="ti-arrow-right"></i></a></li>');
        pagination.find('a').off('click').on('click', function (e)
        {
            e.preventDefault();
            var p = parseInt($(this).attr('data-page'));
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchMessages(p);
        });
    }

    $('#adminMsgFilter').on('change', function () { fetchMessages(1); });

    fetchMessages(1);
});
