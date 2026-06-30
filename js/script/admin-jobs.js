/**
 * Admin — Manage Jobs (bütün paylaşılan işlər).
 * Backend:
 *   GET    /api/admin/jobs?keyword=&status=&page=&pageSize=
 *   DELETE /api/admin/jobs/{id}
 */
$(document).ready(function ()
{
    var body = $('#adminJobsBody');
    if (!body.length) return;

    var pagination = $('#adminJobsPagination');
    var title = $('#adminJobsTitle');
    var alertEl = $('#adminJobsAlert');
    var currentPage = 1;
    var pageSize = 10;

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info').addClass('alert alert-' + (type || 'info'))
            .html(msg).slideDown(200);
        setTimeout(function () { alertEl.slideUp(200); }, 5000);
    }

    function fmtDate(d)
    {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function statusBadge(status)
    {
        var s = (status || '').toLowerCase();
        var color = s === 'active' ? '#1c8a55' : (s === 'draft' ? '#b8860b' : '#9aa1ad');
        var label = s === 'active' ? 'Active' : (s === 'draft' ? 'Draft' : 'Inactive');
        return '<span style="color:' + color + ';font-weight:600;text-transform:capitalize;">' + label + '</span>';
    }

    function fetchJobs(page)
    {
        currentPage = page || 1;
        var keyword = ($('#adminJobsSearch').val() || '').trim();
        var status = $('#adminJobsStatus').val();

        body.html('<tr><td colspan="6" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (keyword) q.push('keyword=' + encodeURIComponent(keyword));
        if (status) q.push('status=' + encodeURIComponent(status));

        apiFetch('/admin/jobs?' + q.join('&'))
            .then(function (result)
            {
                body.empty();
                var data = (result && result.data) || {};
                if (!data.items || !data.items.length)
                {
                    title.text('Manage Jobs');
                    body.html('<tr><td colspan="6" class="text-center p-a30"><h5>No jobs found</h5></td></tr>');
                    return;
                }
                title.text('Manage Jobs (' + data.totalCount + ')');
                data.items.forEach(function (j)
                {
                    body.append(
                        '<tr data-id="' + j.id + '">' +
                        '<td class="text-primary">#' + j.id + '</td>' +
                        '<td><a href="job-detail.html?id=' + j.id + '" target="_blank">' + esc(j.title) + '</a>' +
                        '<br><small class="text-muted">' + esc(j.categoryName || '') + (j.location ? ' · ' + esc(j.location) : '') + '</small></td>' +
                        '<td>' + esc(j.companyName || '-') + '</td>' +
                        '<td>' + (j.applicationCount || 0) + '</td>' +
                        '<td>' + statusBadge(j.status) + '</td>' +
                        '<td>' +
                        '<a href="job-detail.html?id=' + j.id + '" target="_blank" class="site-button button-sm" style="margin-right:6px;">View</a>' +
                        '<button type="button" class="site-button button-sm j-delete" data-id="' + j.id + '" style="background:#e62e2e;border-color:#e62e2e;">Delete</button>' +
                        '</td>' +
                        '</tr>'
                    );
                });
                renderPagination(data.pageCount, data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Admin jobs error:', err);
                body.html('<tr><td colspan="6" class="text-center p-a30"><p class="text-danger">Failed to load jobs.</p></td></tr>');
            });
    }

    body.on('click', '.j-delete', function ()
    {
        var id = $(this).attr('data-id');
        if (!confirm('Bu iş elanını silmək istəyirsiniz? (Uyğunsuz məzmun) Bu əməliyyat geri qaytarıla bilməz.')) return;
        var row = $('tr[data-id="' + id + '"]');
        row.css('opacity', '0.5');
        apiFetch('/admin/jobs/' + id, { method: 'DELETE' })
            .then(function ()
            {
                row.fadeOut(300, function () { row.remove(); });
                showAlert('İş elanı silindi.', 'success');
            })
            .catch(function (err)
            {
                row.css('opacity', '1');
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Silinə bilmədi.';
                showAlert(msg, 'danger');
            });
    });

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (!pageCount || pageCount <= 1) return;
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchJobs(p);
        });
    }

    var searchTimer;
    $('#adminJobsSearch').on('input', function ()
    {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { fetchJobs(1); }, 400);
    });
    $('#adminJobsStatus').on('change', function () { fetchJobs(1); });

    fetchJobs(1);
});
