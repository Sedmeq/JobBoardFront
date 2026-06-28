/**
 * Saved Jobs integration (Candidate).
 * Dokumentasiya:
 *   GET    /api/saved-jobs?page=&pageSize=
 *   DELETE /api/saved-jobs/{jobId}
 */
$(document).ready(function ()
{
    var tbody = $('#savedJobsBody');
    if (!tbody.length) return;

    // Giriş tələb olunur
    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var titleLabel = $('#savedJobsTitle');
    var pagination = $('#savedJobsPagination');
    var currentPage = 1;
    var pageSize = 10;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '';
        var dt = new Date(d);
        var months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[dt.getMonth()] + ' ' + dt.getDate() + ',' + dt.getFullYear();
    }

    function fetchSavedJobs(page)
    {
        currentPage = page || 1;
        tbody.html('<tr><td colspan="5" class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();
        titleLabel.text('Loading...');

        apiFetch('/saved-jobs?page=' + currentPage + '&pageSize=' + pageSize)
            .then(function (result)
            {
                tbody.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    titleLabel.text('0 Saved Jobs');
                    tbody.html('<tr><td colspan="5" class="text-center p-a30"><h5>Hələ saxlanılmış iş elanı yoxdur.</h5><a href="browse-job-list.html" class="site-button m-t10">İş elanlarına bax</a></td></tr>');
                    return;
                }

                var data = result.data;
                titleLabel.text(data.totalCount + ' Saved Jobs');

                data.items.forEach(function (item)
                {
                    var job = item.job || {};
                    var company = job.company || {};
                    var logo = company.logoUrl || 'images/logo/icon2.png';
                    tbody.append(
                        '<tr data-row-job="' + item.jobId + '">' +
                        '<td class="job-post-company">' +
                        '<a href="job-detail.html?id=' + item.jobId + '"><span>' +
                        '<img alt="" src="' + escapeHtml(logo) + '" onerror="this.src=\'images/logo/icon2.png\'" />' +
                        '</span></a></td>' +
                        '<td class="job-name"><a href="job-detail.html?id=' + item.jobId + '">' + escapeHtml(job.title || 'Job') + '</a></td>' +
                        '<td class="criterias text-primary"><a href="company-profile.html?id=' + (company.id || '') + '">' + escapeHtml(company.name || 'Company') + '</a></td>' +
                        '<td class="date">' + formatDate(item.savedAt) + '</td>' +
                        '<td class="job-links">' +
                        '<a href="job-detail.html?id=' + item.jobId + '"><i class="fa fa-eye"></i></a>' +
                        '<a href="javascript:void(0);" data-unsave="' + item.jobId + '" title="Remove"><i class="ti-trash"></i></a>' +
                        '</td>' +
                        '</tr>'
                    );
                });

                setupUnsave();
                renderPagination(data.pageCount || Math.ceil(data.totalCount / pageSize), data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Saved jobs fetch error:', err);
                titleLabel.text('Error');
                tbody.html('<tr><td colspan="5" class="text-center p-a30 text-danger">Saxlanılmış iş elanları yüklənə bilmədi.</td></tr>');
            });
    }

    function setupUnsave()
    {
        $('[data-unsave]').off('click').on('click', function ()
        {
            var jobId = $(this).attr('data-unsave');
            if (!confirm('Bu iş elanını siyahıdan çıxarmaq istəyirsiniz?')) return;
            var row = $('tr[data-row-job="' + jobId + '"]');
            row.css('opacity', '0.5');
            apiFetch('/saved-jobs/' + jobId, { method: 'DELETE' })
                .then(function ()
                {
                    fetchSavedJobs(currentPage);
                })
                .catch(function (err)
                {
                    console.error('Unsave error:', err);
                    row.css('opacity', '1');
                    alert('İş elanı çıxarıla bilmədi. Yenidən cəhd edin.');
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchSavedJobs(p);
        });
    }

    fetchSavedJobs(1);
});
