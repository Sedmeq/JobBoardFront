/**
 * Manage Jobs integration (Employer).
 * Dokumentasiya:
 *   GET    /api/jobs/my?status=&page=&pageSize=
 *   PATCH  /api/jobs/{id}/status   { status }
 *   DELETE /api/jobs/{id}
 */
$(document).ready(function ()
{
    var body = $('#manageJobsBody');
    if (!body.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var pagination = $('#manageJobsPagination');
    var currentPage = 1;
    var pageSize = 10;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function statusCell(job)
    {
        var isActive = job.status === 'active';
        var label = isActive ? 'Active' : 'Inactive';
        var color = isActive ? '#1c8a55' : '#9aa1ad';
        return '<td><button type="button" class="site-button button-sm jb-status-btn" ' +
            'data-status-job="' + job.id + '" data-active="' + (isActive ? '1' : '0') + '" ' +
            'title="Click to toggle" ' +
            'style="background-color:' + color + ';border-color:' + color + ';min-width:100px;">' +
            label + '</button></td>';
    }

    function fetchJobs(page)
    {
        currentPage = page || 1;
        var status = $('#manageStatusFilter').val();

        body.html('<tr><td colspan="5" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (status) q.push('status=' + encodeURIComponent(status));

        apiFetch('/jobs/my?' + q.join('&'))
            .then(function (result)
            {
                body.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    body.html('<tr><td colspan="5" class="text-center p-a30"><h5>No jobs posted yet</h5><a href="company-post-jobs.html" class="site-button m-t10">Post Your First Job</a></td></tr>');
                    return;
                }
                result.data.items.forEach(function (job)
                {
                    body.append(
                        '<tr data-job-row="' + job.id + '">' +
                        '<td class="feature"><div class="form-check"><input type="checkbox" class="form-check-input"><label class="form-check-label"></label></div></td>' +
                        '<td class="job-name">' +
                        '<a href="job-detail.html?id=' + job.id + '">' + escapeHtml(job.title) + '</a>' +
                        '<ul class="job-post-info">' +
                        '<li><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(job.location || 'Remote') + '</li>' +
                        '<li><i class="far fa-bookmark"></i> ' + escapeHtml(job.jobType || 'Full Time') + '</li>' +
                        '<li><i class="fa fa-filter"></i> ' + escapeHtml((job.category && job.category.name) || 'General') + '</li>' +
                        '</ul>' +
                        '</td>' +
                        '<td class="application text-primary"><a href="company-applicants.html?jobId=' + job.id + '&title=' + encodeURIComponent(job.title) + '">(' + (job.applicationCount != null ? job.applicationCount : 0) + ') Applications</a></td>' +
                        '<td>' + formatDate(job.createdAt) + '</td>' +
                        statusCell(job) +
                        '<td class="job-links">' +
                        '<a href="company-post-jobs.html?id=' + job.id + '" title="Edit"><i class="fa fa-pencil"></i></a> ' +
                        '<a href="javascript:void(0);" data-delete-job="' + job.id + '" title="Delete"><i class="ti-trash"></i></a>' +
                        '</td>' +
                        '</tr>'
                    );
                });
                setupActions();
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('My jobs fetch error:', err);
                body.html('<tr><td colspan="5" class="text-center p-a30"><p class="text-danger">Failed to load your jobs. Please try again.</p></td></tr>');
            });
    }

    function setupActions()
    {
        $('.jb-status-btn').off('click').on('click', function ()
        {
            var btn = $(this);
            var id = btn.attr('data-status-job');
            var isActive = btn.attr('data-active') === '1';
            var newStatus = isActive ? 'closed' : 'active';
            btn.prop('disabled', true);
            apiFetch('/jobs/' + id + '/status', {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            })
                .then(function ()
                {
                    btn.prop('disabled', false);
                    var nowActive = !isActive;
                    var color = nowActive ? '#1c8a55' : '#9aa1ad';
                    btn.attr('data-active', nowActive ? '1' : '0')
                        .text(nowActive ? 'Active' : 'Inactive')
                        .css({ 'background-color': color, 'border-color': color });
                })
                .catch(function (err)
                {
                    btn.prop('disabled', false);
                    console.error('Status update error:', err);
                    alert('Status dəyişdirilə bilmədi. Yenidən cəhd edin.');
                });
        });

        $('[data-delete-job]').off('click').on('click', function ()
        {
            var id = $(this).attr('data-delete-job');
            if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) return;
            var row = $('tr[data-job-row="' + id + '"]');
            row.css('opacity', '0.5');
            apiFetch('/jobs/' + id, { method: 'DELETE' })
                .then(function () { row.fadeOut(300, function () { row.remove(); }); })
                .catch(function (err)
                {
                    console.error('Delete job error:', err);
                    alert('Could not delete the job. Please try again.');
                    row.css('opacity', '1');
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchJobs(p);
        });
    }

    $('#manageStatusFilter').on('change', function () { fetchJobs(1); });

    fetchJobs(1);
});
