/**
 * Job Applicants (Employer) — bir ilana edilmiş müraciətləri göstərir.
 * İşəgötürən hər namizədin ümumi məlumatına baxa, CV-sini açıb PDF endirə,
 * yüklənmiş CV faylını yükləyə və müraciət statusunu yeniləyə bilər.
 *
 * Dokumentasiya:
 *   GET   /api/jobs/{jobId}/applications?status=&page=&pageSize=
 *   PATCH /api/applications/{id}/status   { status }
 */
$(document).ready(function ()
{
    var list = $('#applicantsList');
    if (!list.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var params = new URLSearchParams(window.location.search);
    var jobId = params.get('id') || params.get('jobId');
    var jobTitle = params.get('title');

    if (!jobId)
    {
        list.html('<div class="alert alert-warning">No job specified. <a href="company-manage-job.html">Back to jobs</a></div>');
        return;
    }

    if (jobTitle) $('#applicantsJobTitle').text('— ' + jobTitle);

    var pagination = $('#applicantsPagination');
    var currentPage = 1;
    var pageSize = 10;

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function fmtDate(d)
    {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function statusBadge(status)
    {
        var s = (status || 'pending').toLowerCase();
        return '<span class="applicant-status st-' + esc(s) + '">' + esc(s) + '</span>';
    }

    var STATUS_OPTIONS = ['reviewing', 'shortlisted', 'interview', 'offered', 'rejected'];

    function statusSelect(appId, current)
    {
        var opts = '<option value="">Update status…</option>';
        STATUS_OPTIONS.forEach(function (s)
        {
            opts += '<option value="' + s + '"' + (s === current ? ' selected' : '') + '>' +
                s.charAt(0).toUpperCase() + s.slice(1) + '</option>';
        });
        return '<select class="form-control" data-status-app="' + appId + '">' + opts + '</select>';
    }

    function fetchApplicants(page)
    {
        currentPage = page || 1;
        var status = $('#applicantStatusFilter').val();

        list.html('<div class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></div>');
        pagination.empty();

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (status) q.push('status=' + encodeURIComponent(status));

        apiFetch('/jobs/' + encodeURIComponent(jobId) + '/applicants?' + q.join('&'))
            .then(function (result)
            {
                list.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    list.html('<div class="text-center p-a30"><h5>No applicants yet</h5><p class="text-muted">Bu ilana hələ müraciət edən yoxdur.</p></div>');
                    return;
                }

                result.data.items.forEach(function (app)
                {
                    var c = app.candidate || {};
                    var avatar = c.avatarUrl ? esc(c.avatarUrl) : 'images/team/pic1.jpg';

                    var meta = [];
                    if (c.headline) meta.push('<span>' + esc(c.headline) + '</span>');
                    if (c.location) meta.push('<span><i class="fas fa-map-marker-alt"></i> ' + esc(c.location) + '</span>');
                    if (c.experienceYears != null) meta.push('<span><i class="far fa-clock"></i> ' + esc(c.experienceYears) + ' yrs</span>');
                    if (c.email) meta.push('<span><i class="far fa-envelope"></i> ' + esc(c.email) + '</span>');

                    var actions = '';
                    // Ümumi məlumat + vahid CV (PDF kimi endirilə bilər)
                    if (c.id != null)
                    {
                        actions += '<a href="cv-view.html?id=' + encodeURIComponent(c.id) + '" target="_blank" class="site-button button-sm">' +
                            '<i class="far fa-id-card"></i> View CV</a>';
                    }
                    // Namizədin yüklədiyi CV faylı (varsa)
                    if (c.resumeUrl)
                    {
                        actions += '<a href="' + esc(c.resumeUrl) + '" target="_blank" download class="site-button button-sm" style="background:#3a4150;">' +
                            '<i class="fa fa-download"></i> Resume File</a>';
                    }
                    // Namizədə cavab ver (söhbət aç)
                    actions += '<a href="javascript:void(0);" class="site-button button-sm" data-chat-app="' + app.id + '" style="background:#1c8a55;border-color:#1c8a55;">' +
                        '<i class="fa fa-comments"></i> Respond</a>';
                    actions += statusSelect(app.id, app.status);

                    var coverHtml = app.coverLetter
                        ? '<div class="applicant-cover"><strong>Cover Letter:</strong><br>' + esc(app.coverLetter).replace(/\n/g, '<br>') + '</div>'
                        : '';

                    list.append(
                        '<div class="applicant-card" data-app="' + app.id + '">' +
                        '<div class="applicant-top">' +
                        '<img class="applicant-avatar" src="' + avatar + '" onerror="this.src=\'images/team/pic1.jpg\'" alt="">' +
                        '<div style="flex:1;">' +
                        '<p class="applicant-name">' + esc(c.fullName || 'Candidate') + '</p>' +
                        '<p class="applicant-meta">' + meta.join('') + '</p>' +
                        '</div>' +
                        '<div style="text-align:right;">' + statusBadge(app.status) +
                        '<div style="font-size:12px;color:#9aa1ad;margin-top:6px;">Applied ' + fmtDate(app.appliedAt) + '</div>' +
                        '</div>' +
                        '</div>' +
                        coverHtml +
                        '<div class="applicant-actions">' + actions + '</div>' +
                        '</div>'
                    );
                });

                setupStatusHandlers();
                setupChatHandlers();
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Applicants fetch error:', err);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Could not load applicants. Please try again.';
                list.html('<div class="alert alert-danger">' + esc(msg) + '</div>');
            });
    }

    function setupChatHandlers()
    {
        $('[data-chat-app]').off('click').on('click', function ()
        {
            var appId = $(this).attr('data-chat-app');
            var btn = $(this);
            btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i>');
            apiFetch('/chats', { method: 'POST', body: JSON.stringify({ applicationId: parseInt(appId) }) })
                .then(function (res)
                {
                    var id = res && res.data && res.data.id;
                    window.location.href = 'chat.html?conversation=' + id;
                })
                .catch(function (err)
                {
                    btn.prop('disabled', false).html('<i class="fa fa-comments"></i> Respond');
                    var msg = (err && err.data && err.data.error && err.data.error.message) || 'Söhbət açıla bilmədi.';
                    alert(msg);
                });
        });
    }

    function setupStatusHandlers()
    {
        $('[data-status-app]').off('change').on('change', function ()
        {
            var appId = $(this).attr('data-status-app');
            var status = $(this).val();
            if (!status) return;
            var sel = $(this);
            sel.prop('disabled', true);

            apiFetch('/applications/' + appId + '/status', {
                method: 'PATCH',
                body: JSON.stringify({ status: status })
            })
                .then(function ()
                {
                    sel.prop('disabled', false);
                    var card = $('.applicant-card[data-app="' + appId + '"]');
                    card.find('.applicant-status')
                        .attr('class', 'applicant-status st-' + status)
                        .text(status);
                })
                .catch(function (err)
                {
                    sel.prop('disabled', false);
                    console.error('Status update error:', err);
                    alert('Could not update status. Please try again.');
                });
        });
    }

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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchApplicants(p);
        });
    }

    $('#applicantStatusFilter').on('change', function () { fetchApplicants(1); });

    fetchApplicants(1);
});
