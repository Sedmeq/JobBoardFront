/**
 * Admin — Manage Users.
 * Dokumentasiya:
 *   GET   /api/admin/users?role=&isActive=&isBanned=&page=&pageSize=
 *   PATCH /api/admin/users/{id}/ban  { isBanned, reason }
 */
$(document).ready(function ()
{
    var body = $('#adminUsersBody');
    if (!body.length) return;

    var pagination = $('#adminUsersPagination');
    var currentPage = 1;
    var pageSize = 10;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function showToast(msg, type)
    {
        var cls = type === 'danger' ? 'alert-danger' : 'alert-success';
        var el = $('<div class="alert ' + cls + '" style="position:fixed;top:20px;right:20px;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,.15);">' + escapeHtml(msg) + '</div>');
        $('body').append(el);
        setTimeout(function () { el.fadeOut(300, function () { el.remove(); }); }, 3000);
    }

    function fetchUsers(page)
    {
        currentPage = page || 1;
        var role = $('#adminUserRole').val();
        var active = $('#adminUserActive').val();
        var banned = $('#adminUserBanned').val();

        body.html('<tr><td colspan="7" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (role) q.push('role=' + encodeURIComponent(role));
        if (active) q.push('isActive=' + encodeURIComponent(active));
        if (banned) q.push('isBanned=' + encodeURIComponent(banned));

        apiFetch('/admin/users?' + q.join('&'))
            .then(function (result)
            {
                body.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    body.html('<tr><td colspan="7" class="text-center p-a30"><h5>No users found</h5></td></tr>');
                    return;
                }
                result.data.items.forEach(function (u)
                {
                    var statusBadge;
                    if (u.isBanned)
                    {
                        var reason = u.banReason ? ' title="' + escapeHtml(u.banReason) + '"' : '';
                        statusBadge = '<span class="text-danger" style="font-weight:600;"' + reason + '><i class="fa fa-ban"></i> Banned</span>';
                    }
                    else if (u.isActive)
                    {
                        statusBadge = '<span class="text-success" style="font-weight:600;">Active</span>';
                    }
                    else
                    {
                        statusBadge = '<span class="text-muted" style="font-weight:600;">Inactive</span>';
                    }

                    var actions;
                    if (u.role === 'admin')
                    {
                        actions = '<span class="text-muted">—</span>';
                    }
                    else if (u.isBanned)
                    {
                        actions = '<button type="button" class="site-button-link green" data-unban="' + u.id + '" style="border:none;background:none;cursor:pointer;font-weight:600;"><i class="fa fa-undo"></i> Unban</button>';
                    }
                    else
                    {
                        actions = '<button type="button" class="site-button-link red" data-ban="' + u.id + '" data-name="' + escapeHtml(u.fullName || '') + '" style="border:none;background:none;cursor:pointer;font-weight:600;color:#e62e2e;"><i class="fa fa-ban"></i> Ban</button>';
                    }

                    body.append(
                        '<tr>' +
                        '<td class="text-primary">#' + u.id + '</td>' +
                        '<td>' + escapeHtml(u.fullName || '-') + '</td>' +
                        '<td>' + escapeHtml(u.email || '-') + '</td>' +
                        '<td style="text-transform:capitalize;">' + escapeHtml(u.role || '-') + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                        '<td>' + formatDate(u.createdAt) + '</td>' +
                        '<td>' + actions + '</td>' +
                        '</tr>'
                    );
                });
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Admin users error:', err);
                body.html('<tr><td colspan="7" class="text-center p-a30"><p class="text-danger">Failed to load users. Please try again.</p></td></tr>');
            });
    }

    function setBanStatus(id, isBanned, reason)
    {
        return apiFetch('/admin/users/' + id + '/ban', {
            method: 'PATCH',
            body: JSON.stringify({ isBanned: isBanned, reason: reason || null })
        });
    }

    body.on('click', '[data-ban]', function ()
    {
        var id = $(this).attr('data-ban');
        var name = $(this).attr('data-name') || 'this user';
        var reason = window.prompt('Ban "' + name + '"?\nReason (optional):', '');
        // Cancel basıldıqda null qaytarır — heç nə etmə
        if (reason === null) return;

        setBanStatus(id, true, reason)
            .then(function (res)
            {
                showToast((res && res.message) || 'User banned.', 'success');
                fetchUsers(currentPage);
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.message) || 'Failed to ban user.';
                showToast(msg, 'danger');
            });
    });

    body.on('click', '[data-unban]', function ()
    {
        var id = $(this).attr('data-unban');
        if (!window.confirm('Remove the ban from this user?')) return;

        setBanStatus(id, false, null)
            .then(function (res)
            {
                showToast((res && res.message) || 'Ban removed.', 'success');
                fetchUsers(currentPage);
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.message) || 'Failed to remove ban.';
                showToast(msg, 'danger');
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchUsers(p);
        });
    }

    $('#adminUserRole, #adminUserActive, #adminUserBanned').on('change', function () { fetchUsers(1); });

    fetchUsers(1);
});
