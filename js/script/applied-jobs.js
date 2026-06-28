/**
 * Applied Jobs integration (Candidate).
 * Dokumentasiya:
 *   GET   /api/applications/my?status=&page=&pageSize=
 *   PATCH /api/applications/{id}/withdraw
 */
$(document).ready(function ()
{
    var container = $('#appliedJobsContainer');
    if (!container.length) return;

    // Giriş tələb olunur
    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var pagination = $('#appliedPagination');
    var foundLabel = $('#appliedFoundLabel');
    var currentPage = 1;
    var pageSize = 8;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function timeAgo(d)
    {
        if (!d) return '';
        var s = Math.floor((new Date() - new Date(d)) / 1000);
        if (s < 60) return 'Just now';
        var m = Math.floor(s / 60); if (m < 60) return m + ' min ago';
        var h = Math.floor(m / 60); if (h < 24) return h + ' h ago';
        var days = Math.floor(h / 24); return days === 1 ? 'Yesterday' : days + ' days ago';
    }

    function statusBadge(status)
    {
        var map = {
            pending: 'text-primary', reviewing: 'text-info', shortlisted: 'text-warning',
            interview: 'text-warning', offered: 'text-success', rejected: 'text-danger',
            withdrawn: 'text-muted'
        };
        var cls = map[status] || 'text-primary';
        return '<span class="' + cls + '" style="text-transform:capitalize;font-weight:600;">' + escapeHtml(status) + '</span>';
    }

    function fetchApplications(page)
    {
        currentPage = page || 1;
        var status = $('#appliedStatusFilter').val();

        container.html('<li class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading your applications...</p></li>');
        pagination.empty();
        foundLabel.text('Loading...');

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (status) q.push('status=' + encodeURIComponent(status));

        apiFetch('/applications/my?' + q.join('&'))
            .then(function (result)
            {
                container.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    foundLabel.text('0 Applications');
                    container.html('<li class="text-center p-a30"><h4>No applications yet</h4><p class="text-muted">Browse jobs and apply to see them here.</p><a href="browse-job-list.html" class="site-button">Browse Jobs</a></li>');
                    return;
                }
                var data = result.data;
                foundLabel.text(data.totalCount + ' Applications');

                data.items.forEach(function (app)
                {
                    var job = app.job || {};
                    var company = job.companyName || 'Company';
                    var canWithdraw = app.status === 'pending' || app.status === 'reviewing';
                    container.append(
                        '<li>' +
                        '<div class="post-bx">' +
                        '<div class="job-post-info m-a0">' +
                        '<h4><a href="job-detail.html?id=' + job.id + '">' + escapeHtml(job.title || 'Job') + '</a></h4>' +
                        '<ul>' +
                        '<li><a href="javascript:void(0);">' + escapeHtml(company) + '</a></li>' +
                        (job.location ? '<li><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(job.location) + '</li>' : '') +
                        '<li><i class="far fa-clock"></i> Applied ' + timeAgo(app.appliedAt) + '</li>' +
                        '<li>Status: ' + statusBadge(app.status) + '</li>' +
                        '</ul>' +
                        '<div class="posted-info clearfix m-t10">' +
                        (canWithdraw
                            ? '<a href="javascript:void(0);" class="site-button button-sm float-end" style="background-color:#dc3545;border-color:#dc3545;" data-withdraw-id="' + app.id + '">Withdraw</a>'
                            : '') +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</li>'
                    );
                });

                setupWithdraw();
                renderPagination(data.pageCount, data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Applications fetch error:', err);
                foundLabel.text('Error');
                container.html('<li class="text-center p-a30"><p class="text-danger">Failed to load applications. Please try again.</p></li>');
            });
    }

    function setupWithdraw()
    {
        $('[data-withdraw-id]').off('click').on('click', function ()
        {
            var id = $(this).attr('data-withdraw-id');
            if (!confirm('Are you sure you want to withdraw this application?')) return;
            var btn = $(this);
            btn.html('<i class="fa fa-spinner fa-spin"></i>').css('pointer-events', 'none');
            apiFetch('/applications/' + id + '/withdraw', { method: 'PATCH' })
                .then(function () { fetchApplications(currentPage); })
                .catch(function (err)
                {
                    console.error('Withdraw error:', err);
                    alert('Could not withdraw the application. Please try again.');
                    btn.html('Withdraw').css('pointer-events', 'auto');
                });
        });
    }

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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchApplications(p);
        });
    }

    $('#appliedStatusFilter').on('change', function () { fetchApplications(1); });

    fetchApplications(1);
});
